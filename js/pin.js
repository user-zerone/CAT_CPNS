export function togglePinVisibility() {
    const pinInput = document.getElementById('input-pin');
    const toggleBtn = document.getElementById('toggle-pin-visibility');
    if (!pinInput || !toggleBtn) return;

    if (pinInput.type === 'password') {
        pinInput.type = 'text';
        toggleBtn.textContent = '🙈';
    } else {
        pinInput.type = 'password';
        toggleBtn.textContent = '👁️';
    }
}
