import { Entity } from './Entity.js';
import { getDistance } from '../utils.js';
import { COLORS } from '../constants.js';
import { playerStats } from '../state.js';

export class Minion extends Entity {
    constructor(x, y, owner) {
        super(x, y, 20, 20, COLORS.MINION, 30, 3.5);
        this.owner = owner;
        this.target = null;
        this.attackCooldown = 0;
    }

    update(game) {
        // AI: Find closest
        let closestDist = 400;
        this.target = null;

        for (let enemy of game.enemies) {
            let dist = getDistance(this, enemy);
            if (dist < closestDist) {
                closestDist = dist;
                this.target = enemy;
            }
        }

        let dx = 0, dy = 0;

        if (this.target) {
            // Chase
            let angle = Math.atan2(this.target.rect.centerY - this.rect.centerY, this.target.rect.centerX - this.rect.centerX);
            dx = Math.cos(angle);
            dy = Math.sin(angle);

            // Attack
            if (closestDist < 30) {
                if (this.attackCooldown <= 0) {
                    // Use player's minion damage stat with variance
                    const variance = 0.8 + Math.random() * 0.4;
                    const damage = Math.floor(playerStats.minionDamage * variance);
                    this.target.hp -= damage;
                    this.attackCooldown = 40;
                    game.spawnParticles(this.target.rect.x, this.target.rect.y, COLORS.MINION, 3);
                }
            }
        } else {
            // Follow player
            let distToPlayer = getDistance(this, this.owner);
            if (distToPlayer > 80) {
                let angle = Math.atan2(this.owner.rect.centerY - this.rect.centerY, this.owner.rect.centerX - this.rect.centerX);
                dx = Math.cos(angle);
                dy = Math.sin(angle);
            }
        }

        this.move(dx, dy, game.walls);
        if (this.attackCooldown > 0) this.attackCooldown--;
    }
}
