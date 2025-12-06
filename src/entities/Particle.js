import { Rect } from '../utils.js';

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
