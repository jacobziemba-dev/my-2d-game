export function setupControlSelection(onStart) {
    // UI Elements
    const desktopBtn = document.getElementById('btn-desktop');
    const mobileBtn = document.getElementById('btn-mobile');
    const confirmBtn = document.getElementById('btn-confirm');
    const overlay = document.getElementById('control-selection-overlay');

    let selectedMode = null;

    function selectMode(mode) {
        selectedMode = mode;

        // Update visual state
        if (mode === 'DESKTOP') {
            desktopBtn.classList.add('selected');
            mobileBtn.classList.remove('selected');
        } else if (mode === 'MOBILE') {
            mobileBtn.classList.add('selected');
            desktopBtn.classList.remove('selected');
        }

        // Enable confirm button
        if (confirmBtn) confirmBtn.removeAttribute('disabled');
    }

    if (desktopBtn) desktopBtn.addEventListener('click', () => selectMode('DESKTOP'));
    if (mobileBtn) mobileBtn.addEventListener('click', () => selectMode('MOBILE'));

    if (confirmBtn) confirmBtn.addEventListener('click', () => {
        if (!selectedMode) return;

        // Hide overlay
        if (overlay) overlay.style.display = 'none';

        // Start Game with selected mode
        if (typeof onStart === 'function') onStart(selectedMode);
    });

    return {
        getSelected: () => selectedMode
    };
}
