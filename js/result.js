import { state, CONSTANTS } from './state.js';
import { disableAntiCheat, renderOptionContent } from './utils.js';

export function endTest() {
    const totalAnswered = Object.keys(state.userAnswers).length;
    if (confirm(`Anda menjawab ${totalAnswered} dari ${state.questions.length} soal.\nYakin akhiri ujian?`)) {
        finishSimulation();
    }
}

export function autoSubmit() {
    alert("Waktu habis! Ujian diakhiri otomatis."); 
    finishSimulation();
}

export function finishSimulation() {
    clearInterval(state.timerInterval);
    disableAntiCheat(); 
    
    let scoreTWK = 0, scoreTIU = 0, scoreTKP = 0;
    let wrongAnswersHTML = ''; 
    let wrongCount = 0;

    state.questions.forEach((q, index) => {
        const userAnswer = state.userAnswers[q.info.id];
        let isCorrect = false;
        let tkpScore = 0;
        let jawabanBenar = q.info.jawaban_benar;

        if (q.info.kategori === 'TKP') {
            const skorOpsi = q.info.skor_opsi || {};
            if (userAnswer && skorOpsi[userAnswer] !== undefined) {
                tkpScore = parseInt(skorOpsi[userAnswer]);
            }
            scoreTKP += tkpScore;
            
            jawabanBenar = Object.keys(skorOpsi).find(key => parseInt(skorOpsi[key]) === 5) || "Tidak diketahui";
            if (tkpScore === 5) isCorrect = true; 

        } else {
            if (userAnswer && userAnswer === jawabanBenar) {
                if (q.info.kategori === 'TWK') scoreTWK += 5;
                if (q.info.kategori === 'TIU') scoreTIU += 5;
                isCorrect = true;
            }
        }

        if (!isCorrect) {
            wrongCount++;
            
            const opsiUserText = (userAnswer && q.opsi && q.opsi[userAnswer]) ? renderOptionContent(q.opsi[userAnswer]) : "";
            let userAnsText = userAnswer ? `<strong>${userAnswer}.</strong> <div style="display:inline-block; vertical-align:middle; margin-left:5px;">${opsiUserText}</div>` : "<span style='color:#7f8c8d;'>Tidak dijawab</span>";
            
            if (q.info.kategori === 'TKP' && userAnswer) {
                userAnsText += ` <strong style="color:#d35400;">(Poin Anda: ${tkpScore})</strong>`;
            }

            const opsiBenarText = (jawabanBenar !== "Tidak diketahui" && q.opsi && q.opsi[jawabanBenar]) ? renderOptionContent(q.opsi[jawabanBenar]) : "";
            const correctAnswerText = `<strong>${jawabanBenar}.</strong> <div style="display:inline-block; vertical-align:middle; margin-left:5px;">${opsiBenarText}</div> ${q.info.kategori === 'TKP' ? '<strong style="color:#27ae60; margin-left: 10px;">(Poin Maksimal: 5)</strong>' : ''}`;
            
            let opsiString = "";
            if (q.opsi) {
                const labels = ['A', 'B', 'C', 'D', 'E'];
                labels.forEach(k => {
                    if(q.opsi[k] && !q.opsi[k].match(/\.(jpeg|jpg|gif|png|webp)$/i)) {
                        opsiString += `${k}. ${q.opsi[k]} `;
                    }
                });
            }
            
            let promptText = "";
            if (q.info.kategori === 'TKP') {
                promptText = `Tolong analisa soal ini dan berikan jawaban serta pembahasannya secara detail, dan berikan poin 1 sampai 5 per opsi: ${q.soal || ''} ${opsiString}`;
            } else {
                promptText = `Tolong analisa soal ini dan berikan jawaban serta pembahasannya secara detail: ${q.soal || ''} ${opsiString}`;
            }
            const searchQuery = encodeURIComponent(promptText);

            const imgReviewHtml = (q.gambar && q.gambar !== "") ? `<img src="${q.gambar}" class="q-img-review" alt="Gambar Review" style="max-height:150px;">` : '';

            wrongAnswersHTML += `
                <details class="wrong-item">
                    <summary>Soal No. ${index + 1} - ${q.info.kategori || 'Umum'}</summary>
                    <div class="wrong-content">
                        <div class="q-meta"><strong>[${q.info.kategori || ''}]</strong> ${q.info.sub_kategori || ''} - ${q.info.topik || ''}</div>
                        ${imgReviewHtml}
                        <div class="q-text">${q.soal || ''}</div>
                        <div class="ans user-ans"><strong>Jawaban Anda:</strong><br> <div style="margin-top:5px;">${userAnsText}</div></div>
                        <div class="ans correct-ans"><strong>Jawaban Terbaik:</strong><br> <div style="margin-top:5px;">${correctAnswerText}</div></div>
                        <div style="margin-top: 15px; text-align: right;">
                            <a href="https://www.google.com/search?q=${searchQuery}" target="_blank" rel="noopener noreferrer" 
                               style="display: inline-block; background: #ebf5fb; color: #2980b9; text-decoration: none; font-weight: bold; padding: 10px 15px; border-radius: 6px; border: 1px solid #3498db; font-size: 0.9rem;">
                                 Cari Pembahasan AI di Google
                            </a>
                        </div>
                    </div>
                </details>
            `;
        }
    });

    const totalScore = scoreTWK + scoreTIU + scoreTKP;
    
    const isTwkPass = scoreTWK >= CONSTANTS.PASS_TWK;
    const isTiuPass = scoreTIU >= CONSTANTS.PASS_TIU;
    const isTkpPass = scoreTKP >= CONSTANTS.PASS_TKP;
    const isAllPass = isTwkPass && isTiuPass && isTkpPass;

    document.getElementById('app-container').innerHTML = `
        <div class="result-screen">
            <h1 style="color:#2c3e50;">Ujian Selesai</h1>
            <p>Terima kasih, <strong>${document.getElementById('display-name').innerText}</strong>.</p>
            
            <div class="score-card">
                <h2>Total Skor: ${totalScore}</h2>
                <div class="status-overall ${isAllPass ? 'status-lulus-all' : 'status-gagal-all'}">
                    ${isAllPass ? '✅ LULUS PASSING GRADE' : '❌ TIDAK MEMENUHI PASSING GRADE'}
                </div>
                <div class="score-breakdown-table">
                    <div class="score-row">
                        <span class="cat-name">TWK (Ambang Batas: ${CONSTANTS.PASS_TWK})</span>
                        <span class="cat-score">${scoreTWK}</span>
                        <span class="cat-status ${isTwkPass ? 'text-green' : 'text-red'}">${isTwkPass ? 'LULUS' : 'GAGAL'}</span>
                    </div>
                    <div class="score-row">
                        <span class="cat-name">TIU (Ambang Batas: ${CONSTANTS.PASS_TIU})</span>
                        <span class="cat-score">${scoreTIU}</span>
                        <span class="cat-status ${isTiuPass ? 'text-green' : 'text-red'}">${isTiuPass ? 'LULUS' : 'GAGAL'}</span>
                    </div>
                    <div class="score-row">
                        <span class="cat-name">TKP (Ambang Batas: ${CONSTANTS.PASS_TKP})</span>
                        <span class="cat-score">${scoreTKP}</span>
                        <span class="cat-status ${isTkpPass ? 'text-green' : 'text-red'}">${isTkpPass ? 'LULUS' : 'GAGAL'}</span>
                    </div>
                </div>
                <p style="margin-top:20px; font-size:0.9rem; color:#7f8c8d;">
                    Jawaban Maksimal: ${state.questions.length - wrongCount} | Kurang Poin / Kosong: ${wrongCount}
                </p>
            </div>
            ${wrongCount > 0 ? `
                <h3 style="margin: 30px 0 10px; color:#c0392b; font-size:1.1rem; text-align:left; width:100%;">
                    Review Jawaban Belum Maksimal:
                </h3>
                <div class="wrong-list-container">
                    ${wrongAnswersHTML}
                </div>
            ` : `<h3 style="margin-top: 30px; color:#27ae60;">Luar Biasa! Jawaban Anda sempurna.</h3>`}
            <button class="btn-nav" onclick="location.reload()" style="margin-top:30px; width:100%; padding:15px; font-size:1.1rem; border:none; border-radius:8px; cursor:pointer;">
                Selesai / Kembali ke Awal
            </button>
        </div>
    `;
}
