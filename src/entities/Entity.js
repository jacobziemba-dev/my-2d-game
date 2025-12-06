import { Rect } from '../utils.js';
import { COLORS } from '../constants.js';

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
