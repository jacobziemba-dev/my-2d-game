import { Rect, getDistance } from './utils.js';
import { COLORS } from './constants.js';
import { playerStats } from './state.js';

export class Particle {
    constructor(x, y, color) {
        this.x = x + 15;
        this.y = y + 15;
        this.vx = (Math.random() - 0.5) * 5;
        this.vy = (Math.random() - 0.5) * 5;
        this.life = 1.0;
        this.color = color;
        this.rect = new Rect(x, y, 4, 4);
    }

    update() {
        this.x += this.vx;
        this.y += this.vy;
        this.life -= 0.05;
        this.rect.x = this.x;
        this.rect.y = this.y;
    }

    draw(ctx, camera) {
        if (this.life > 0) {
            ctx.globalAlpha = this.life;
            ctx.fillStyle = this.color;
            ctx.fillRect(this.rect.x - camera.x, this.rect.y - camera.y, this.rect.w, this.rect.h);
            ctx.globalAlpha = 1.0;
        }
    }
}

export class Entity {
    constructor(x, y, width, height, color, hp, speed) {
        this.rect = new Rect(x, y, width, height);
        this.color = color;
        this.hp = hp;
        this.maxHp = hp;
        this.speed = speed;
        this.dead = false;
    }

    move(dx, dy, walls) {
        // Normalize
        if (dx !== 0 && dy !== 0 && Math.abs(dx) === 1 && Math.abs(dy) === 1) {
            dx *= 0.7071;
            dy *= 0.7071;
        }

        // Move X with collision buffer to prevent sticking
        this.rect.x += dx * this.speed;
        for (let wall of walls) {
            if (this.rect.colliderect(wall.rect)) {
                if (dx > 0) this.rect.x = wall.rect.left - this.rect.w - 1;  // Add 1px buffer
                else if (dx < 0) this.rect.x = wall.rect.right + 1;  // Add 1px buffer
            }
        }

        // Move Y with collision buffer to prevent sticking
        this.rect.y += dy * this.speed;
        for (let wall of walls) {
            if (this.rect.colliderect(wall.rect)) {
                if (dy > 0) this.rect.y = wall.rect.top - this.rect.h - 1;  // Add 1px buffer
                else if (dy < 0) this.rect.y = wall.rect.bottom + 1;  // Add 1px buffer
            }
        }
    }

    draw(ctx, camera) {
        const screenX = this.rect.x - camera.x;
        const screenY = this.rect.y - camera.y;
        const centerX = screenX + this.rect.w / 2;
        const centerY = screenY + this.rect.h / 2;
        const radius = this.rect.w / 2;

        // Draw shadow (offset circle)
        ctx.fillStyle = COLORS.SHADOW;
        ctx.beginPath();
        ctx.arc(centerX + 2, centerY + 2, radius, 0, Math.PI * 2);
        ctx.fill();

        // Draw entity body (circle for top-down view)
        ctx.fillStyle = this.color;
        ctx.beginPath();
        ctx.arc(centerX, centerY, radius, 0, Math.PI * 2);
        ctx.fill();

        // Draw border
        ctx.strokeStyle = COLORS.WHITE;
        ctx.lineWidth = 2;
        ctx.stroke();

        this.drawHealth(ctx, camera);
    }

    drawHealth(ctx, camera) {
        if (this.hp < this.maxHp) {
            const barWidth = this.rect.w;
            const barHeight = 5;
            let fill = (this.hp / this.maxHp) * barWidth;
            if (fill < 0) fill = 0;

            const rx = this.rect.x - camera.x;
            const ry = this.rect.y - 10 - camera.y;

            ctx.fillStyle = COLORS.ENEMY; // Back
            ctx.fillRect(rx, ry, barWidth, barHeight);
            ctx.fillStyle = COLORS.MINION; // Fill
            ctx.fillRect(rx, ry, fill, barHeight);
        }
    }
}

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

export class Item {
    constructor(x, y, type) {
        this.rect = new Rect(x, y, 20, 20);
        this.type = type; // 'health', 'mana', 'equipment', 'artifact'
        this.picked = false;

        this.color = type === 'health' ? COLORS.HEALTH_POTION :
                     type === 'mana' ? COLORS.MANA_POTION :
                     type === 'equipment' ? COLORS.EQUIPMENT :
                     COLORS.ARTIFACT;
    }

    draw(ctx, camera) {
        if (this.picked) return;

        const screenX = this.rect.x - camera.x;
        const screenY = this.rect.y - camera.y;

        const size = 10;
        const centerX = screenX + this.rect.w / 2;
        const centerY = screenY + this.rect.h / 2;

        // Draw item as a glowing diamond
        ctx.fillStyle = this.color;
        ctx.beginPath();
        ctx.moveTo(centerX, centerY - size);
        ctx.lineTo(centerX + size, centerY);
        ctx.lineTo(centerX, centerY + size);
        ctx.lineTo(centerX - size, centerY);
        ctx.closePath();
        ctx.fill();

        // Glow effect
        ctx.globalAlpha = 0.3 + Math.sin(Date.now() / 200) * 0.2;
        ctx.strokeStyle = this.color;
        ctx.lineWidth = 2;
        ctx.stroke();
        ctx.globalAlpha = 1.0;
    }

    pickup(player, game) {
        if (this.picked) return;
        this.picked = true;

        if (this.type === 'health') {
            player.hp = Math.min(player.maxHp, player.hp + 30);
            game.spawnParticles(this.rect.x, this.rect.y, COLORS.HEALTH_POTION, 5);
        } else if (this.type === 'mana') {
            player.mana = Math.min(playerStats.maxMana, player.mana + 30);
            game.spawnParticles(this.rect.x, this.rect.y, COLORS.MANA_POTION, 5);
        } else if (this.type === 'equipment') {
            playerStats.gold += 25;
            game.spawnParticles(this.rect.x, this.rect.y, COLORS.GOLD, 8);
        } else if (this.type === 'artifact') {
            playerStats.gold += 100;
            playerStats.maxHp += 10;
            game.spawnParticles(this.rect.x, this.rect.y, COLORS.ARTIFACT, 12);
        }
    }
}
