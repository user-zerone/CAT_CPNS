//hh
import { state, CONSTANTS } from './state.js';
import { toggleDarkMode, initTheme } from './theme.js';
import { enableAntiCheat } from './utils.js';
import { renderGrid, renderQuestion } from './ui.js';
import { endTest, autoSubmit } from './result.js';

initTheme();

window.toggleDarkMode = toggleDarkMode;
window.startSimulation = startSimulation;
window.endTest = endTest;

// ─── Load CryptoJS dari CDN (kompatibel HTTP + semua browser) ─────────────────
function loadCryptoJS() {
    return new Promise((resolve, reject) => {
        if (window.CryptoJS) { resolve(); return; }
        const script = document.createElement('script');
        script.src = 'https://cdnjs.cloudflare.com/ajax/libs/crypto-js/4.2.0/crypto-js.min.js';
        script.onload  = resolve;
        script.onerror = () => reject(new Error('Gagal memuat CryptoJS'));
        document.head.appendChild(script);
    });
}

// ─── Dekripsi 1 layer (CryptoJS.AES.decrypt) ─────────────────────────────────
function cryptoJsDecrypt(ciphertextBase64, password) {
    try {
        const decrypted = CryptoJS.AES.decrypt(ciphertextBase64, password);
        const result    = decrypted.toString(CryptoJS.enc.Utf8);
        if (!result) return null;
        return result;
    } catch (e) {
        console.error('Dekripsi gagal:', e);
        return null;
    }
}

// ─── Dekripsi 2 layer ─────────────────────────────────────────────────────────
function decryptDoubleLayer(encryptedText, password) {
    const layer1 = cryptoJsDecrypt(encryptedText, password);
    if (!layer1) return null;
    const layer2 = cryptoJsDecrypt(layer1, password);
    return layer2;
}
// ─────────────────────────────────────────────────────────────────────────────

async function startSimulation() {
    const username = document.getElementById('input-username').value.trim();
    const pin      = document.getElementById('input-pin').value.trim();
    const paketVal = document.getElementById('package-selection').value;
    const btnMulai = document.getElementById('btn-mulai');

    hideError();

    if (!username) { showError('Silakan masukkan username!'); return; }
    if (!pin)      { showError('Silakan masukkan PIN!'); return; }
    if (!paketVal) { showError('Silakan pilih paket soal!'); return; }

    btnMulai.disabled    = true;
    btnMulai.textContent = 'Memverifikasi...';

    try {
        // Pastikan CryptoJS sudah ter-load
        await loadCryptoJS();

        const apiUrl =
            `https://script.google.com/macros/s/AKfycbyMVAsUuXHcStvNlS74O6dAanEV8XpYeXzaC0ozNeUYA4LjEsgKQlsKmQ2qew16Qt9X9A/exec` +
            `?user=${encodeURIComponent(username)}&pin=${encodeURIComponent(pin)}&penggeser=${encodeURIComponent(paketVal)}`;

        const res  = await fetch(apiUrl);
        const data = await res.json();

        if (data.status !== 'ok') {
            showError(data.pesan || 'Username / PIN / Paket tidak valid!');
            resetBtn();
            return;
        }

        const decryptKey = data.pesan;

        state.username           = username;
        state.decryptKey         = decryptKey;
        state.currentPackagePath = `data/paket_${paketVal}`;

        document.getElementById('login-screen').style.display = 'none';
        document.getElementById('app-container').style.display = 'flex';
        document.getElementById('display-name').innerText = username;

        await fetchQuestions(state.currentPackagePath, decryptKey);

    } catch (err) {
        console.error(err);
        showError('Gagal terhubung ke server. Cek koneksi internet.');
        resetBtn();
    }
}

function showError(msg) {
    const el = document.getElementById('login-error');
    el.textContent   = msg;
    el.style.display = 'block';
}
function hideError() {
    document.getElementById('login-error').style.display = 'none';
}
function resetBtn() {
    const btn = document.getElementById('btn-mulai');
    btn.disabled    = false;
    btn.textContent = 'Mulai Ujian';
}

async function fetchQuestions(packageFolder, decryptKey) {
    try {
        const currentUrl = window.location.href;
        const files      = ['twk.json', 'tiu.json', 'tkp.json'];

        const fetchPromises = files.map(async file => {
            const filePath = `${packageFolder}/${file}`;
            const url      = new URL(filePath, currentUrl).href;

            const res = await fetch(url);
            if (!res.ok) throw new Error(`Gagal memuat ${filePath}`);

            const text = await res.text();
            const trimmed = text.trim();

            // Jika bukan enkripsi CryptoJS, parse langsung sebagai JSON biasa
            if (!trimmed.startsWith('U2FsdGVkX1')) {
                return JSON.parse(trimmed);
            }

            // === Dekripsi 2 layer (sesuai enkripsi Python) ===
            const layer1 = cryptoJsDecrypt(trimmed, decryptKey);
            if (!layer1) throw new Error(`Dekripsi layer 1 gagal: ${filePath}`);

            const layer2 = cryptoJsDecrypt(layer1, decryptKey);
            if (!layer2) throw new Error(`Dekripsi layer 2 gagal: ${filePath}`);

            return JSON.parse(layer2);
        });

        const results   = await Promise.all(fetchPromises);
        state.questions = [...results[0], ...results[1], ...results[2]];
        state.questions.forEach((q, idx) => { q.info.id = idx + 1; });

        initTest();
    } catch (error) {
        console.error(error);
        alert('Gagal memuat soal: ' + error.message);
        document.getElementById('login-screen').style.display  = 'flex';
        document.getElementById('app-container').style.display = 'none';
        resetBtn();
    }
}

function initTest() {
    enableAntiCheat();
    renderGrid(handleLoadQuestion);
    handleLoadQuestion(0);
    startTimer(CONSTANTS.TEST_DURATION);
}

function startTimer(duration) {
    let timer     = duration;
    const display = document.getElementById('timer');

    state.timerInterval = setInterval(() => {
        let h = Math.floor(timer / 3600);
        let m = Math.floor((timer % 3600) / 60);
        let s = Math.floor(timer % 60);

        display.innerText = `${String(h).padStart(2,'0')}:${String(m).padStart(2,'0')}:${String(s).padStart(2,'0')}`;

        if (--timer < 0) {
            clearInterval(state.timerInterval);
            autoSubmit();
        }
    }, 1000);
}

function handleLoadQuestion(index) {
    state.currentIdx = index;
    renderQuestion(handleSelectOption, handleToggleMark, handleNext, handlePrev);
}

function handleSelectOption(qId, key) {
    state.userAnswers[qId] = key;
    handleLoadQuestion(state.currentIdx);
}

function handleNext() {
    if (state.currentIdx < state.questions.length - 1) handleLoadQuestion(state.currentIdx + 1);
}
function handlePrev() {
    if (state.currentIdx > 0) handleLoadQuestion(state.currentIdx - 1);
}
function handleToggleMark() {
    const qId = state.questions[state.currentIdx].info.id;
    if (state.markedQuestions.has(qId)) state.markedQuestions.delete(qId);
    else state.markedQuestions.add(qId);
    handleLoadQuestion(state.currentIdx);
}
