export function renderOptionContent(text) {
    if (!text) return "";
    if (text.match(/\.(jpeg|jpg|gif|png|webp)$/i)) {
        return `<img src="${text}" style="max-height: 100px; max-width: 100%; border-radius: 4px; border: 1px solid #bdc3c7;">`;
    }
    return text;
}

function preventReload(e) {
    e.preventDefault();
    e.returnValue = ''; 
}

export function enableAntiCheat() {
    window.addEventListener('beforeunload', preventReload);
    history.pushState(null, null, location.href);
    window.onpopstate = function () {
        history.go(1); 
    };
}

export function disableAntiCheat() {
    window.removeEventListener('beforeunload', preventReload);
    window.onpopstate = null; 
}
