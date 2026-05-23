export function initTheme() {
    const saved = localStorage.getItem('theme');
    if (saved === 'dark') {
        document.body.classList.add('dark');
    }
    document.addEventListener('DOMContentLoaded', function () {
        updateThemeBtn(document.body.classList.contains('dark'));
    });
}

export function toggleDarkMode() {
    const isDark = document.body.classList.toggle('dark');
    localStorage.setItem('theme', isDark ? 'dark' : 'light');
    updateThemeBtn(isDark);
}

function updateThemeBtn(isDark) {
    const btn = document.getElementById('theme-toggle-btn');
    if (btn) btn.innerHTML = isDark ? '☀️ Light' : '🌙 Dark';
}
