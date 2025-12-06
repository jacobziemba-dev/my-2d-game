import { STATES } from '../constants.js';
import { playerStats } from '../state.js';

export class HUD {
    constructor(game) {
        this.game = game;
        this.hubControls = document.getElementById('hubControls');
        this.hpBtn = document.getElementById('btn-upgrade-hp');
        this.manaBtn = document.getElementById('btn-upgrade-mana');
        this.lastGold = -1;
        this.lastState = null;

        // Attach click handlers for desktop as a safety
        if (this.hpBtn) this.hpBtn.addEventListener('click', () => this.game.handleUpgrade('hp'));
        if (this.manaBtn) this.manaBtn.addEventListener('click', () => this.game.handleUpgrade('mana'));
    }

    update() {
        const g = this.game;

        if (!this.hubControls) return;

        const isHub = g.state === STATES.HUB && g.controlMode === 'MOBILE';

        // Only toggle display when state changes
        if (g.state !== this.lastState) {
            this.hubControls.style.display = isHub ? 'flex' : 'none';
            this.lastState = g.state;
        }

        // Only update buttons if in Hub and gold changed
        if (isHub && this.lastGold !== playerStats.gold) {
            if (this.hpBtn) {
                 this.hpBtn.innerText = `UPGRADE HP (50g)`;
                 this.hpBtn.style.opacity = playerStats.gold >= 50 ? '1' : '0.5';
            }
            if (this.manaBtn) {
                this.manaBtn.innerText = `UPGRADE MANA (50g)`;
                this.manaBtn.style.opacity = playerStats.gold >= 50 ? '1' : '0.5';
            }
            this.lastGold = playerStats.gold;
        }
    }
}
