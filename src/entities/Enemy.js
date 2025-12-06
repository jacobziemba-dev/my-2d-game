import { Entity } from './Entity.js';
import { getDistance } from '../utils.js';
import { COLORS } from '../constants.js';

export class Enemy extends Entity {
    constructor(x, y, type = 'normal') {
        // type: 'normal', 'fast', 'ranged', 'tank', 'boss'
        let w, h, color, hp, speed, damage, xp, gold;

        switch(type) {
            case 'boss':
                w = h = 60;
                color = COLORS.BOSS;
                hp = 500;
                speed = 2.0;
                damage = 15;
                xp = 100;
                gold = 200;
                break;
            case 'fast':
                w = h = 25;
                color = COLORS.ENEMY_FAST;
                hp = 25;
                speed = 4.5;
                damage = 3;
                xp = 15;
                gold = 8;
                break;
            case 'ranged':
                w = h = 30;
                color = COLORS.ENEMY_RANGED;
                hp = 30;
                speed = 2.0;
                damage = 8;
                xp = 25;
                gold = 15;
                break;
            case 'tank':
                w = h = 35;
                color = COLORS.ENEMY_DARK;
                hp = 80;
                speed = 1.5;
                damage = 10;
                xp = 30;
                gold = 20;
                break;
            default: // normal
                w = h = 30;
                color = COLORS.ENEMY;
                hp = 40;
                speed = 2.5;
                damage = 5;
                xp = 20;
                gold = 10;
        }

        super(x, y, w, h, color, hp, speed);

        this.damage = damage;
        this.type = type;
        this.isBoss = type === 'boss';
        this.attackCooldown = 0;
        this.xpValue = xp;
        this.goldValue = gold;
        this.attackRange = type === 'ranged' ? 150 : 40;
    }

    update(game) {
        let targets = [game.player, ...game.minions];
        let closestTarget = null;
        let closestDist = 600;

        for (let t of targets) {
            let dist = getDistance(this, t);
            if (dist < closestDist) {
                closestDist = dist;
                closestTarget = t;
            }
        }

        if (closestTarget) {
            let angle = Math.atan2(closestTarget.rect.centerY - this.rect.centerY, closestTarget.rect.centerX - this.rect.centerX);
            let dx = Math.cos(angle);
            let dy = Math.sin(angle);

            // Ranged enemies keep distance
            if (this.type === 'ranged') {
                if (closestDist > 120) {
                    this.move(dx, dy, game.walls);
                } else if (closestDist < 80) {
                    this.move(-dx, -dy, game.walls); // Retreat
                }
            } else {
                this.move(dx, dy, game.walls);
            }

            if (closestDist < this.attackRange && this.attackCooldown <= 0) {
                // Add damage variance (±20%)
                const variance = 0.8 + Math.random() * 0.4;
                const finalDamage = Math.floor(this.damage * variance);

                // 10% crit chance (double damage)
                const isCrit = Math.random() < 0.1;
                const damage = isCrit ? finalDamage * 2 : finalDamage;

                closestTarget.hp -= damage;
                this.attackCooldown = this.type === 'fast' ? 40 : 60;

                const particleColor = isCrit ? COLORS.GOLD : COLORS.ENEMY;
                game.spawnParticles(closestTarget.rect.x, closestTarget.rect.y, particleColor, isCrit ? 6 : 3);

                // Ranged projectile effect
                if (this.type === 'ranged') {
                    game.spawnParticles(this.rect.x, this.rect.y, COLORS.ENEMY_RANGED, 3);
                }
            }
        }
        if (this.attackCooldown > 0) this.attackCooldown--;
    }
}
