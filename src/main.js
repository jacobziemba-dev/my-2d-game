import { Game } from './game.js';

/**
 * Summoner's Estate - Enhanced Roguelike
 * Complete redesign with BSP dungeons, advanced systems, and improved visuals
 */

// UI Elements
const desktopBtn = document.getElementById('btn-desktop');
const mobileBtn = document.getElementById('btn-mobile');
const confirmBtn = document.getElementById('btn-confirm');
const overlay = document.getElementById('control-selection-overlay');

let selectedMode = null;

// Selection Logic
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
    confirmBtn.removeAttribute('disabled');
}

desktopBtn.addEventListener('click', () => selectMode('DESKTOP'));
mobileBtn.addEventListener('click', () => selectMode('MOBILE'));

confirmBtn.addEventListener('click', () => {
    if (!selectedMode) return;

    // Hide overlay
    overlay.style.display = 'none';

    // Start Game with selected mode
    window.game = new Game(selectedMode);
    console.log(`Game started in ${selectedMode} mode`);
});
