import { Entity } from './Entity.js';
import { Minion } from './Minion.js';
import { COLORS } from '../constants.js';
import { playerStats } from '../state.js';

export class Player extends Entity {
    constructor(x, y) {
        super(x, y, 30, 30, COLORS.PLAYER, playerStats.maxHp, 4);
        this.mana = playerStats.maxMana;
        this.summonCooldown = 0;
    }

    update(game) {
        const { dx, dy } = game.input.getAxis();
        this.move(dx, dy, game.walls);

        // Regen Mana
        if (this.mana < playerStats.maxMana) {
            this.mana += playerStats.manaRegen;
            if (this.mana > playerStats.maxMana) this.mana = playerStats.maxMana;
        }

        // Summon
        if (game.input.keys['Space'] || game.input.summonPressed) {
            this.summon(game);
        }

        if (this.summonCooldown > 0) this.summonCooldown--;
    }

    summon(game) {
        if (this.mana >= playerStats.minionCost && this.summonCooldown <= 0) {
            this.mana -= playerStats.minionCost;
            this.summonCooldown = 20;

            const mx = this.rect.x + (Math.random() * 60 - 30);
            const my = this.rect.y + (Math.random() * 60 - 30);
            const minion = new Minion(mx, my, this);
            game.addMinion(minion);

            game.spawnParticles(this.rect.x, this.rect.y, COLORS.MINION, 5);
        }
    }
}
