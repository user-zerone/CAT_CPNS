import { state } from './state.js';
import { renderOptionContent } from './utils.js';

export function renderGrid(onSelectQuestion) {
    const gridContainer = document.getElementById('number-grid');
    gridContainer.innerHTML = '';
    state.questions.forEach((q, index) => {
        const btn = document.createElement('button');
        btn.className = 'grid-btn';
        btn.id = `grid-btn-${q.info.id}`;
        btn.innerText = index + 1;
        btn.onclick = () => onSelectQuestion(index);
        gridContainer.appendChild(btn);
    });
}

export function updateGridUI() {
    state.questions.forEach((q, index) => {
        const btn = document.getElementById(`grid-btn-${q.info.id}`);
        if (!btn) return;
        btn.className = 'grid-btn';
        if (index === state.currentIdx) btn.classList.add('current');
        if (state.userAnswers[q.info.id]) btn.classList.add('answered');
        if (state.markedQuestions.has(q.info.id)) btn.classList.add('marked'); 
    });
}

export function renderQuestion(onSelectOption, onToggleMark, onNext, onPrev) {
    if (state.currentIdx < 0 || state.currentIdx >= state.questions.length) return;
    const q = state.questions[state.currentIdx];

    document.getElementById('current-question-num').innerText = state.currentIdx + 1;
    
    const metaContainer = document.getElementById('question-meta');
    if (q.info) {
        metaContainer.style.display = 'flex';
        let badgeClass = 'meta-badge';
        if(q.info.kategori === 'TIU') badgeClass += ' tiu';
        if(q.info.kategori === 'TKP') badgeClass += ' tkp';

        metaContainer.innerHTML = `
            <span class="${badgeClass}">${q.info.kategori}</span>
            <div class="meta-text">
                <strong>Sub-Kategori:</strong> ${q.info.sub_kategori || '-'} <br>
                <strong>Topik:</strong> ${q.info.topik || '-'}
            </div>
        `;
    } else {
        metaContainer.style.display = 'none';
    }

    const imgElement = document.getElementById('question-image');
    if (q.gambar && q.gambar !== "") {
        imgElement.src = q.gambar; 
        imgElement.style.display = 'block';
    } else {
        imgElement.src = "";
        imgElement.style.display = 'none';
    }

    document.getElementById('question-text').innerHTML = q.soal;

    const optionsContainer = document.getElementById('options-container');
    optionsContainer.innerHTML = '';
    
    if (q.opsi) {
        const labels = ['A', 'B', 'C', 'D', 'E'];
        labels.forEach(key => {
            if(q.opsi[key]) {
                const isSelected = state.userAnswers[q.info.id] === key;
                const div = document.createElement('div');
                div.className = `option-label ${isSelected ? 'selected' : ''}`;
                div.onclick = () => onSelectOption(q.info.id, key);
                
                div.innerHTML = `
                    <input type="radio" name="opt_${q.info.id}" value="${key}" ${isSelected ? 'checked' : ''}>
                    <span style="display: flex; align-items: center; gap: 10px;">
                        <strong>${key}.</strong> 
                        ${renderOptionContent(q.opsi[key])}
                    </span>
                `;
                optionsContainer.appendChild(div);
            }
        });
    }

    document.getElementById('btn-prev').disabled = state.currentIdx === 0;
    document.getElementById('btn-next').disabled = state.currentIdx === state.questions.length - 1;
    document.getElementById('mark-checkbox').checked = state.markedQuestions.has(q.info.id);

    document.getElementById('btn-prev').onclick = onPrev;
    document.getElementById('btn-next').onclick = onNext;
    document.getElementById('btn-mark').onclick = onToggleMark;

    updateGridUI();
}
