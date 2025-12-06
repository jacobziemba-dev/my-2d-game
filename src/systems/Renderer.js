import { STATES, COLORS } from '../constants.js';
import { playerStats } from '../state.js';

export class Renderer {
    constructor(game) {
        this.game = game;
        this.ctx = game.ctx;
        this.canvas = game.canvas;
    }

    draw() {
        const g = this.game;
        const ctx = this.ctx;

        // Clear
        ctx.fillStyle = COLORS.BG;
        ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

        if (g.state === STATES.HUB) {
            this.drawHub();
        } else if (g.state === STATES.DUNGEON) {
            this.drawDungeon();
            this.drawHUD();
        } else if (g.state === STATES.GAMEOVER) {
            this.drawDungeon(); // Show background still
            this.drawOverlay("YOU DIED", COLORS.ENEMY, "Press R or Tap Button to Return");
        } else if (g.state === STATES.VICTORY) {
            this.drawDungeon();
            this.drawOverlay("FLOOR CLEARED!", COLORS.MINION, "Press R or Tap Button to Rest");
        }
    }

    drawDungeon() {
        const g = this.game;
        const ctx = this.ctx;

        // Fill Visible Area with Floor
        ctx.fillStyle = COLORS.FLOOR;
        ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

        // Draw Walls
        for (let wall of g.walls) {
            wall.draw(ctx, g.camera);
        }

        // Draw Items
        for (let item of g.items) {
            item.draw(ctx, g.camera);
        }

        // Sort entities by Y position for proper depth
        const sortedEntities = [...g.entities].sort((a, b) => a.rect.y - b.rect.y);

        // Draw Entities
        for (let ent of sortedEntities) {
            ent.draw(ctx, g.camera);
        }

        // Draw Particles
        for (let p of g.particles) {
            p.draw(ctx, g.camera);
        }
    }

    drawHub() {
        const g = this.game;
        const ctx = this.ctx;
        const cx = this.canvas.width / 2;
        const cy = this.canvas.height / 2;

        if (g.controlMode === 'MOBILE') {
            // Condensed Layout for Mobile
            this.drawText("THE MANOR", 40, COLORS.GOLD, cx, 60);
            this.drawText(`Lvl ${playerStats.level} Summoner | Floor ${g.dungeonLevel}`, 20, COLORS.PLAYER, cx, 100);
            this.drawText(`Gold: ${playerStats.gold}`, 24, COLORS.GOLD, cx, 130);

            // Start instruction higher up
            this.drawText("[ TAP ] Start Expedition", 24, COLORS.MINION, cx, cy - 80);

            // Stats info
            this.drawText(`HP: ${playerStats.maxHp} | Mana: ${playerStats.maxMana}`, 20, COLORS.WHITE, cx, cy - 40);
            this.drawText(`Minion Dmg: ${playerStats.minionDamage}`, 18, COLORS.MINION_DARK, cx, cy - 10);

        } else {
            // Desktop Standard Layout
            this.drawText("THE MANOR", 60, COLORS.GOLD, cx, 100);
            this.drawText(`Level ${playerStats.level} Summoner`, 28, COLORS.PLAYER, cx, 160);
            this.drawText(`Gold: ${playerStats.gold}`, 30, COLORS.GOLD, cx, 200);
            this.drawText(`Floor Record: ${g.dungeonLevel}`, 25, COLORS.WHITE, cx, 240);

            const btnY = cy + 50;
            this.drawText("[ ENTER / TAP ] Start Expedition", 30, COLORS.MINION, cx, btnY);

            const hpColor = playerStats.gold >= 50 ? COLORS.WHITE : COLORS.WALL;
            this.drawText(`[ H ] Upgrade HP (50g) - Current: ${playerStats.maxHp}`, 22, hpColor, cx, btnY + 60);

            const mpColor = playerStats.gold >= 50 ? COLORS.WHITE : COLORS.WALL;
            this.drawText(`[ M ] Upgrade Mana (50g) - Current: ${playerStats.maxMana}`, 22, mpColor, cx, btnY + 100);

            // Stats info
            this.drawText(`Minion Damage: ${playerStats.minionDamage}`, 18, COLORS.MINION_DARK, cx, btnY + 160);
        }
    }

    drawHUD() {
        const g = this.game;
        const ctx = this.ctx;

        // HP Bar
        ctx.fillStyle = COLORS.WALL;
        ctx.fillRect(20, 20, 200, 20);
        const hpPct = Math.max(0, g.player.hp / playerStats.maxHp);
        ctx.fillStyle = COLORS.MINION;
        ctx.fillRect(20, 20, 200 * hpPct, 20);
        this.drawText(`${Math.floor(g.player.hp)}/${playerStats.maxHp} HP`, 16, COLORS.WHITE, 120, 36);

        // Mana Bar
        ctx.fillStyle = COLORS.WALL;
        ctx.fillRect(20, 50, 200, 20);
        const mpPct = Math.max(0, g.player.mana / playerStats.maxMana);
        ctx.fillStyle = COLORS.PLAYER;
        ctx.fillRect(20, 50, 200 * mpPct, 20);
        this.drawText(`${Math.floor(g.player.mana)}/${playerStats.maxMana} MP`, 16, COLORS.WHITE, 120, 66);

        // XP Bar
        ctx.fillStyle = COLORS.WALL;
        ctx.fillRect(20, 80, 200, 15);
        const xpPct = Math.max(0, playerStats.xp / playerStats.xpToNext);
        ctx.fillStyle = COLORS.GOLD;
        ctx.fillRect(20, 80, 200 * xpPct, 15);
        ctx.textAlign = 'left';
        ctx.fillStyle = COLORS.WHITE;
        ctx.font = 'bold 12px Arial';
        ctx.fillText(`Level ${playerStats.level} - ${playerStats.xp}/${playerStats.xpToNext} XP`, 25, 92);

        // Stats (top right)
        ctx.textAlign = 'center';
        this.drawText(`Floor ${g.dungeonLevel}`, 24, COLORS.WHITE, this.canvas.width - 80, 30);
        this.drawText(`Gold: ${playerStats.gold}`, 20, COLORS.GOLD, this.canvas.width - 80, 60);

        // Enemy count
        this.drawText(`Enemies: ${g.enemies.length}`, 18, COLORS.ENEMY, this.canvas.width - 80, 85);
    }

    drawOverlay(title, color, sub) {
        const ctx = this.ctx;
        ctx.fillStyle = "rgba(0, 0, 0, 0.7)";
        ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

        const cx = this.canvas.width / 2;
        const cy = this.canvas.height / 2;

        this.drawText(title, 50, color, cx, cy - 40);
        this.drawText(sub, 24, COLORS.WHITE, cx, cy + 40);
    }

    drawText(text, size, color, x, y) {
        const ctx = this.ctx;
        ctx.fillStyle = color;
        ctx.font = `bold ${size}px Arial`;
        ctx.textAlign = 'center';
        ctx.fillText(text, x, y);
    }
}
