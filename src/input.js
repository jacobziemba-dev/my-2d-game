// --- Input Handling ---
import { STATES } from './constants.js';

export class InputHandler {
    constructor(game) {
        this.game = game; // Store game reference if needed, though mostly using internal state
        this.keys = {};
        this.touchActive = false;
        this.joystickVector = { x: 0, y: 0 };
        this.summonPressed = false;

        window.addEventListener('keydown', (e) => {
            this.keys[e.code] = true;
            // Prevent default browser actions for movement keys
            if (e.code === 'Space' || e.code === 'ArrowUp' || e.code === 'ArrowDown' || e.code === 'ArrowLeft' || e.code === 'ArrowRight') {
                e.preventDefault();
            }
        });
        window.addEventListener('keyup', (e) => {
            this.keys[e.code] = false;
            // Handle menu toggles
            if (e.code === 'KeyR') this.game.handleRestart();
            if (e.code === 'KeyH') this.game.handleUpgrade('hp');
            if (e.code === 'KeyM') this.game.handleUpgrade('mana');
            if (e.code === 'Enter') this.game.handleStart();
        });

        // Touch Setup
        const joystick = document.getElementById('joystick');
        const knob = document.getElementById('knob');
        const summonBtn = document.getElementById('summonBtn');
        const mobileControls = document.getElementById('mobileControls');

        // Detect touch device (use cached mobileControls element)
        window.addEventListener('touchstart', function onFirstTouch() {
            if (mobileControls) mobileControls.style.display = 'block';
            const desktopHint = document.getElementById('desktop-hint');
            if (desktopHint) desktopHint.style.display = 'none';
            window.removeEventListener('touchstart', onFirstTouch, false);
        }, false);

        // Joystick Logic - only attach listeners if elements exist
        if (joystick && knob) {
            let joyStartX = 0, joyStartY = 0;

            joystick.addEventListener('touchstart', (e) => {
                e.preventDefault();
                const touch = e.changedTouches[0];
                joyStartX = touch.clientX;
                joyStartY = touch.clientY;
                this.touchActive = true;
            }, {passive: false});

            joystick.addEventListener('touchmove', (e) => {
                e.preventDefault();
                if (!this.touchActive) return;
                const touch = e.changedTouches[0];
                const dx = touch.clientX - joyStartX;
                const dy = touch.clientY - joyStartY;

                const dist = Math.min(50, Math.hypot(dx, dy));
                const angle = Math.atan2(dy, dx);

                const kx = Math.cos(angle) * dist;
                const ky = Math.sin(angle) * dist;

                knob.style.transform = `translate(calc(-50% + ${kx}px), calc(-50% + ${ky}px))`;

                // Normalize output -1 to 1
                this.joystickVector.x = kx / 50;
                this.joystickVector.y = ky / 50;
            }, {passive: false});

            const resetJoystick = (e) => {
                e.preventDefault();
                this.touchActive = false;
                this.joystickVector = { x: 0, y: 0 };
                knob.style.transform = `translate(-50%, -50%)`;
            };

            joystick.addEventListener('touchend', resetJoystick, {passive: false});
            joystick.addEventListener('touchcancel', resetJoystick, {passive: false});
        }

        // Summon Button - only attach listeners if element exists
        if (summonBtn) {
            summonBtn.addEventListener('touchstart', (e) => {
                e.preventDefault();
                this.summonPressed = true;

                // Map tap to interactions in menus
                if(this.game.state === STATES.HUB) this.game.handleStart();
                if(this.game.state === STATES.GAMEOVER || this.game.state === STATES.VICTORY) this.game.handleRestart();
            }, {passive: false});

            summonBtn.addEventListener('touchend', (e) => {
                e.preventDefault();
                this.summonPressed = false;
            }, {passive: false});
        }
    }

    getAxis() {
        let dx = 0, dy = 0;
        if (this.keys['KeyW'] || this.keys['ArrowUp']) dy = -1;
        if (this.keys['KeyS'] || this.keys['ArrowDown']) dy = 1;
        if (this.keys['KeyA'] || this.keys['ArrowLeft']) dx = -1;
        if (this.keys['KeyD'] || this.keys['ArrowRight']) dx = 1;

        // Overlay touch
        if (Math.abs(this.joystickVector.x) > 0.1) dx = this.joystickVector.x;
        if (Math.abs(this.joystickVector.y) > 0.1) dy = this.joystickVector.y;

        return { dx, dy };
    }
}
