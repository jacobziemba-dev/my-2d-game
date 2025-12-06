import { Rect } from '../utils.js';
import { COLORS } from '../constants.js';
import { playerStats } from '../state.js';

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
