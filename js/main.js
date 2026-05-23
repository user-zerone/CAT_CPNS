import { state, CONSTANTS } from './state.js';
import { toggleDarkMode, initTheme } from './theme.js';
import { enableAntiCheat } from './utils.js';
import { renderGrid, renderQuestion } from './ui.js';
import { endTest, autoSubmit } from './result.js';

initTheme();

window.toggleDarkMode = toggleDarkMode;
window.startSimulation = startSimulation;
window.endTest = endTest;

function startSimulation() {
    const nameInput = document.getElementById('participant-name').value.trim();
    const packageSelect = document.getElementById('package-selection').value;

    if (!nameInput) { alert("Silakan masukkan nama terlebih dahulu!"); return; }
    if (!packageSelect) { alert("Silakan pilih paket soal terlebih dahulu!"); return; }
    
    document.getElementById('login-screen').style.display = 'none';
    document.getElementById('app-container').style.display = 'flex';
    document.getElementById('display-name').innerText = nameInput;

    state.currentPackagePath = packageSelect;
    fetchQuestions(packageSelect);
}

async function fetchQuestions(packageFolder) {
    try {
        const currentUrl = window.location.href;
        const files = ['twk.json', 'tiu.json', 'tkp.json'];
        
        const fetchPromises = files.map(file => {
            const filePath = `${packageFolder}/${file}`;
            const url = new URL(filePath, currentUrl).href;
            
            return fetch(url).then(res => {
                if(!res.ok) throw new Error(`Gagal memuat ${filePath}`);
                return res.json();
            });
        });

        const results = await Promise.all(fetchPromises);
        state.questions = [...results[0], ...results[1], ...results[2]];
        
        state.questions.forEach((q, idx) => { q.info.id = idx + 1; });

        initTest();
    } catch (error) {
        console.error(error);
        alert("Gagal memuat soal. Pastikan folder data dan file JSON berada di path yang benar.");
    }
}

function initTest() {
    enableAntiCheat(); 
    renderGrid(handleLoadQuestion);
    handleLoadQuestion(0);
    startTimer(CONSTANTS.TEST_DURATION);
}

function startTimer(duration) {
    let timer = duration;
    const display = document.getElementById('timer');
    
    state.timerInterval = setInterval(() => {
        let hours = Math.floor(timer / 3600);
        let minutes = Math.floor((timer % 3600) / 60);
        let seconds = Math.floor(timer % 60);

        hours = hours < 10 ? "0" + hours : hours;
        minutes = minutes < 10 ? "0" + minutes : minutes;
        seconds = seconds < 10 ? "0" + seconds : seconds;

        display.innerText = `${hours}:${minutes}:${seconds}`;

        if (--timer < 0) {
            clearInterval(state.timerInterval);
            autoSubmit();
        }
    }, 1000);
}

function handleLoadQuestion(index) {
    state.currentIdx = index;
    renderQuestion(
        handleSelectOption,
        handleToggleMark,
        handleNext,
        handlePrev
    );
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
