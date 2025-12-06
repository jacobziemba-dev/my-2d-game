import { Rect, getDistance } from './utils.js';
import { COLORS } from './constants.js';
import { playerStats } from './state.js';

const TILE_SIZE = 48; // Sprite size

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

        // Animation State
        this.frame = 0;
        this.frameTimer = 0;
        this.facingLeft = false;
        this.direction = 0; // 0: Down, 1: Side, 2: Up
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

    drawSprite(ctx, image, sx, sy, dx, dy, width, height, flip = false) {
        if (!image) return;

        ctx.save();
        if (flip) {
            ctx.scale(-1, 1);
            ctx.drawImage(image, sx, sy, TILE_SIZE, TILE_SIZE, -dx - width, dy, width, height);
        } else {
            ctx.drawImage(image, sx, sy, TILE_SIZE, TILE_SIZE, dx, dy, width, height);
        }
        ctx.restore();
    }

    draw(ctx, camera) {
        // Fallback for entities without specific draw (particles etc)
        const screenX = this.rect.x - camera.x;
        const screenY = this.rect.y - camera.y;

        ctx.fillStyle = this.color;
        ctx.fillRect(screenX, screenY, this.rect.w, this.rect.h);
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
        this.isMoving = false;
        this.isAttacking = false;
        this.attackFrame = 0;
    }

    update(game) {
        const { dx, dy } = game.input.getAxis();

        // Update Direction
        this.isMoving = dx !== 0 || dy !== 0;
        if (dx < 0) this.facingLeft = true;
        if (dx > 0) this.facingLeft = false;

        if (dy > 0) this.direction = 0; // Down
        else if (dy < 0) this.direction = 2; // Up
        else if (dx !== 0) this.direction = 1; // Side

        // Update Animation Frame
        if (this.isAttacking) {
            this.frameTimer++;
            if (this.frameTimer > 5) {
                this.frameTimer = 0;
                this.attackFrame++;
                if (this.attackFrame >= 3) {
                    this.isAttacking = false;
                    this.attackFrame = 0;
                }
            }
        } else if (this.isMoving) {
            this.frameTimer++;
            if (this.frameTimer > 8) {
                this.frameTimer = 0;
                this.frame = (this.frame + 1) % 4;
            }
        } else {
            // Idle animation (row 0)
            this.frameTimer++;
            if (this.frameTimer > 15) {
                this.frameTimer = 0;
                this.frame = (this.frame + 1) % 4;
            }
        }

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
            this.isAttacking = true;
            this.attackFrame = 0;

            const mx = this.rect.x + (Math.random() * 60 - 30);
            const my = this.rect.y + (Math.random() * 60 - 30);
            const minion = new Minion(mx, my, this);
            game.addMinion(minion);

            game.spawnParticles(this.rect.x, this.rect.y, COLORS.MINION, 5);
        }
    }

    draw(ctx, camera, game) {
        const img = game?.assets?.characters;
        if (!img) {
            super.draw(ctx, camera);
            return;
        }

        let row = 0; // Idle
        let col = this.frame;

        if (this.isAttacking) {
            row = 4;
            col = this.attackFrame;
        } else if (this.isMoving) {
            if (this.direction === 0) row = 1; // Down
            else if (this.direction === 1) row = 2; // Right
            else if (this.direction === 2) row = 3; // Up
        } else {
            row = 0; // Idle
        }

        const sx = col * TILE_SIZE;
        const sy = row * TILE_SIZE;

        // Center the 48x48 sprite on the 30x30 hitbox
        // Offset: (48 - 30) / 2 = 9
        const dx = this.rect.x - camera.x - 9;
        const dy = this.rect.y - camera.y - 9;

        this.drawSprite(ctx, img, sx, sy, dx, dy, 48, 48, this.facingLeft);
        this.drawHealth(ctx, camera);
    }
}

export class Minion extends Entity {
    constructor(x, y, owner) {
        super(x, y, 20, 20, COLORS.MINION, 30, 3.5);
        this.owner = owner;
        this.target = null;
        this.attackCooldown = 0;
        this.frame = 0;
        this.frameTimer = 0;
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

            this.facingLeft = dx < 0;

            // Attack
            if (closestDist < 30) {
                if (this.attackCooldown <= 0) {
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
                this.facingLeft = dx < 0;
            }
        }

        // Animate
        if (dx !== 0 || dy !== 0) {
            this.frameTimer++;
            if (this.frameTimer > MINION_ANIM_SPEED) {
                this.frame = (this.frame + 1) % MINION_FRAME_COUNT; // Using idle/walk logic
                this.frameTimer = 0;
            }
        }

        this.move(dx, dy, game.walls);
        if (this.attackCooldown > 0) this.attackCooldown--;
    }

    draw(ctx, camera, game) {
        const img = game?.assets?.characters;
        if (!img) {
            super.draw(ctx, camera);
            return;
        }

        // Use Slime Sprite (Row 6, Col 0) tinted Blue
        const sx = 0;
        const sy = 6 * TILE_SIZE;

        // Center 48x48 on 20x20
        // Offset: (48 - 20) / 2 = 14
        const dx = this.rect.x - camera.x - 14;
        const dy = this.rect.y - camera.y - 14;

        // Apply a filter for tinting if supported (ctx.filter)
        ctx.save();
        ctx.filter = "hue-rotate(180deg)"; // Turn Green to Blue-ish
        this.drawSprite(ctx, img, sx, sy, dx, dy, 48, 48, this.facingLeft);
        ctx.restore();

        this.drawHealth(ctx, camera);
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

            this.facingLeft = dx < 0;

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

    draw(ctx, camera, game) {
        const img = game?.assets?.characters;
        if (!img) {
            super.draw(ctx, camera);
            return;
        }

        let col = 0; // Default Slime
        const row = 6;
        let scale = 1.0;
        let filter = "none";

        switch(this.type) {
            case 'normal':
                col = 1; // Goblin
                break;
            case 'fast':
                col = 0; // Slime
                filter = "hue-rotate(45deg)"; // Different Slime
                break;
            case 'tank':
                col = 2; // Skeleton
                break;
            case 'ranged':
                col = 1; // Goblin
                filter = "hue-rotate(90deg)"; // Purple Goblin
                break;
            case 'boss':
                col = 2; // Skeleton
                scale = 2.0; // Big Skeleton
                filter = "sepia(1) saturate(5) hue-rotate(-50deg)"; // Red Skeleton
                break;
        }

        const sx = col * TILE_SIZE;
        const sy = row * TILE_SIZE;

        // Center Logic
        const drawSize = 48 * scale;
        const offset = (drawSize - this.rect.w) / 2;
        const dx = this.rect.x - camera.x - offset;
        const dy = this.rect.y - camera.y - offset;

        ctx.save();
        if (filter !== "none") ctx.filter = filter;

        if (this.facingLeft) {
            ctx.scale(-1, 1);
            ctx.drawImage(img, sx, sy, TILE_SIZE, TILE_SIZE, -dx - drawSize, dy, drawSize, drawSize);
        } else {
            ctx.drawImage(img, sx, sy, TILE_SIZE, TILE_SIZE, dx, dy, drawSize, drawSize);
        }
        ctx.restore();

        this.drawHealth(ctx, camera);
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

    draw(ctx, camera, game) {
        if (this.picked) return;

        const img = game?.assets?.characters;
        if (!img) {
            // Fallback
            const screenX = this.rect.x - camera.x;
            const screenY = this.rect.y - camera.y;
            const size = 10;
            const centerX = screenX + this.rect.w / 2;
            const centerY = screenY + this.rect.h / 2;
            ctx.fillStyle = this.color;
            ctx.beginPath();
            ctx.moveTo(centerX, centerY - size);
            ctx.lineTo(centerX + size, centerY);
            ctx.lineTo(centerX, centerY + size);
            ctx.lineTo(centerX - size, centerY);
            ctx.closePath();
            ctx.fill();
            return;
        }

        const row = 6;
        let col = 3; // Potion
        let filter = "none";

        switch(this.type) {
            case 'health':
                col = 3; // Red Potion
                break;
            case 'mana':
                col = 3; // Potion
                filter = "hue-rotate(240deg)"; // Blue Potion
                break;
            case 'equipment':
                col = 5; // Chest
                break;
            case 'artifact':
                col = 4; // Coin (Gold?) or Chest with filter
                filter = "brightness(1.5)";
                break;
        }

        const sx = col * TILE_SIZE;
        const sy = row * TILE_SIZE;

        const drawSize = 32; // Smaller items
        const offset = (drawSize - this.rect.w) / 2;
        const dx = this.rect.x - camera.x - offset;
        const dy = this.rect.y - camera.y - offset;

        ctx.save();
        if (filter !== "none") ctx.filter = filter;
        ctx.drawImage(img, sx, sy, TILE_SIZE, TILE_SIZE, dx, dy, drawSize, drawSize);
        ctx.restore();
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
