import { InputHandler } from './input.js';
import { GameMap } from './map.js';
import { Player, Enemy, Item, Minion, Particle } from './entities.js';
import { playerStats } from './state.js';
import { STATES, COLORS, TILE_SIZE } from './constants.js';
import { Rect } from './utils.js';

export class Game {
    constructor() {
        this.canvas = document.getElementById('gameCanvas');
        this.ctx = this.canvas.getContext('2d');
        this.input = new InputHandler(this);

        this.state = STATES.HUB;
        this.dungeonLevel = 1;
        this.mapWidth = 40;
        this.mapHeight = 40;

        this.entities = [];
        this.walls = [];
        this.minions = [];
        this.enemies = [];
        this.particles = [];
        this.items = [];
        this.player = null;

        this.camera = { x: 0, y: 0, w: window.innerWidth, h: window.innerHeight };

        window.addEventListener('resize', () => this.resize());
        this.resize();

        this.loop = this.loop.bind(this);
        requestAnimationFrame(this.loop);
    }

    resize() {
        this.canvas.width = window.innerWidth;
        this.canvas.height = window.innerHeight;
        this.camera.w = this.canvas.width;
        this.camera.h = this.canvas.height;
    }

    levelUp() {
        playerStats.level++;
        playerStats.xp = 0;
        playerStats.xpToNext = Math.floor(playerStats.xpToNext * 1.5);
        playerStats.maxHp += 20;
        playerStats.maxMana += 15;
        playerStats.manaRegen += 0.05;
        playerStats.minionDamage += 2;

        if (this.player) {
            this.player.hp = playerStats.maxHp;
            this.player.mana = playerStats.maxMana;
            this.spawnParticles(this.player.rect.x, this.player.rect.y, COLORS.GOLD, 20);
        }
    }

    spawnParticles(x, y, color, count) {
        for(let i=0; i<count; i++) {
            this.particles.push(new Particle(x, y, color));
        }
    }

    addMinion(minion) {
        this.minions.push(minion);
        this.entities.push(minion);
    }

    startDungeon() {
        this.state = STATES.DUNGEON;
        this.entities = [];
        this.minions = [];
        this.enemies = [];
        this.particles = [];
        this.items = [];

        const map = new GameMap(this.mapWidth, this.mapHeight);
        map.generate();
        this.walls = map.walls;
        this.grid = map.grid;
        this.rooms = map.rooms;

        // Ensure player spawns in a valid location with clearance
        let spawnX = map.spawnPoint.x;
        let spawnY = map.spawnPoint.y;

        // Verify spawn point has clearance (not just touching walls)
        const SPAWN_BUFFER = 5;  // Minimum 5px clearance from walls
        const playerTestRect = new Rect(spawnX - SPAWN_BUFFER, spawnY - SPAWN_BUFFER,
                                         30 + SPAWN_BUFFER * 2, 30 + SPAWN_BUFFER * 2);
        let validSpawn = true;
        for (let wall of this.walls) {
            if (playerTestRect.colliderect(wall.rect)) {
                validSpawn = false;
                break;
            }
        }

        // If spawn is blocked, use corrected room center calculation
        if (!validSpawn && this.rooms.length > 0) {
            const firstRoom = this.rooms[0];
            const gridCenterX = Math.floor(firstRoom.x + firstRoom.w / 2);
            const gridCenterY = Math.floor(firstRoom.y + firstRoom.h / 2);
            spawnX = gridCenterX * TILE_SIZE - 15;  // Center 30px player
            spawnY = gridCenterY * TILE_SIZE - 15;
            console.log('Spawn was blocked, using fallback position');
        }

        console.log(`Player spawning at: (${spawnX}, ${spawnY}), validSpawn: ${validSpawn}`);
        if (this.rooms.length > 0) {
            console.log(`First room: x=${this.rooms[0].x}, y=${this.rooms[0].y}, w=${this.rooms[0].w}, h=${this.rooms[0].h}`);
        }

        this.player = new Player(spawnX, spawnY);
        this.entities.push(this.player);

        console.log(`Player created at: (${this.player.rect.x}, ${this.player.rect.y}), HP: ${this.player.hp}`);

        // Boss in final room
        const boss = new Enemy(map.bossPoint.x, map.bossPoint.y, 'boss');
        this.enemies.push(boss);
        this.entities.push(boss);

        // Spawn diverse enemies
        const enemyTypes = ['normal', 'fast', 'ranged', 'tank'];
        let numEnemies = 10 + (this.dungeonLevel * 2);
        let spawnAttempts = 0;

        while (numEnemies > 0 && spawnAttempts < 500) {
            let rx = Math.floor(Math.random() * (this.mapWidth - 2)) + 1;
            let ry = Math.floor(Math.random() * (this.mapHeight - 2)) + 1;

            if (this.grid[ry][rx] === 0) {
                const ex = rx * TILE_SIZE;
                const ey = ry * TILE_SIZE;
                const dist = Math.hypot(ex - this.player.rect.x, ey - this.player.rect.y);

                if (dist > 400) {
                    // Random enemy type with weighted distribution
                    const rand = Math.random();
                    let type;
                    if (rand < 0.4) type = 'normal';
                    else if (rand < 0.6) type = 'fast';
                    else if (rand < 0.8) type = 'ranged';
                    else type = 'tank';

                    const enemy = new Enemy(ex, ey, type);
                    this.enemies.push(enemy);
                    this.entities.push(enemy);
                    numEnemies--;
                }
            }
            spawnAttempts++;
        }

        // Spawn items in rooms
        const itemTypes = ['health', 'mana', 'equipment', 'artifact'];
        let numItems = 5 + Math.floor(this.dungeonLevel * 1.5);

        for (let i = 0; i < numItems; i++) {
            // Pick random room
            const room = this.rooms[Math.floor(Math.random() * this.rooms.length)];
            const itemX = (room.x + Math.floor(Math.random() * room.w)) * TILE_SIZE;
            const itemY = (room.y + Math.floor(Math.random() * room.h)) * TILE_SIZE;

            // Weighted item distribution
            const rand = Math.random();
            let type;
            if (rand < 0.35) type = 'health';
            else if (rand < 0.65) type = 'mana';
            else if (rand < 0.90) type = 'equipment';
            else type = 'artifact'; // Rare

            this.items.push(new Item(itemX, itemY, type));
        }
    }

    handleStart() {
        if (this.state === STATES.HUB) {
            this.startDungeon();
        }
    }

    handleRestart() {
        if (this.state === STATES.GAMEOVER || this.state === STATES.VICTORY) {
            // On victory, restore some health and mana
            if (this.state === STATES.VICTORY && this.player) {
                this.player.hp = Math.min(playerStats.maxHp, this.player.hp + 50);
                this.player.mana = playerStats.maxMana;
            }
            this.state = STATES.HUB;
        }
    }

    handleUpgrade(type) {
        if (this.state !== STATES.HUB) return;

        if (type === 'hp' && playerStats.gold >= 50) {
            playerStats.gold -= 50;
            playerStats.maxHp += 20;
        } else if (type === 'mana' && playerStats.gold >= 50) {
            playerStats.gold -= 50;
            playerStats.maxMana += 20;
        }
    }

    update() {
        if (this.state === STATES.DUNGEON) {
            this.player.update(this);

            // Item pickup
            this.items.forEach(item => {
                if (!item.picked && this.player.rect.colliderect(item.rect)) {
                    item.pickup(this.player, this);
                }
            });

            // Clean dead entities
            this.minions = this.minions.filter(m => !m.dead);
            this.enemies = this.enemies.filter(e => !e.dead);
            this.entities = this.entities.filter(e => !e.dead);
            this.items = this.items.filter(i => !i.picked);

            // Update Minions
            this.minions.forEach(m => m.update(this));

            // Update Enemies
            this.enemies.forEach(e => {
                e.update(this);
                if (e.hp <= 0 && !e.dead) {
                    e.dead = true;
                    playerStats.gold += e.goldValue;
                    playerStats.xp += e.xpValue;
                    this.spawnParticles(e.rect.x, e.rect.y, COLORS.GOLD, 8);

                    // Check for level up
                    if (playerStats.xp >= playerStats.xpToNext) {
                        this.levelUp();
                    }

                    // 30% chance to drop item
                    if (Math.random() < 0.3) {
                        const dropTypes = ['health', 'mana', 'equipment'];
                        const dropType = dropTypes[Math.floor(Math.random() * dropTypes.length)];
                        this.items.push(new Item(e.rect.x, e.rect.y, dropType));
                    }

                    if (e.isBoss) {
                        this.state = STATES.VICTORY;
                        this.dungeonLevel++;
                    }
                }
            });

            // Update Particles
            this.particles.forEach(p => p.update());
            this.particles = this.particles.filter(p => p.life > 0);

            // Minion death check
            this.minions.forEach(m => {
                if(m.hp <= 0) m.dead = true;
            });

            // Player Death
            if (this.player.hp <= 0) {
                this.state = STATES.GAMEOVER;
                playerStats.gold = 0; // Penalty
            }

            // Camera Follow (centered on player)
            this.camera.x = this.player.rect.centerX - this.canvas.width / 2;
            this.camera.y = this.player.rect.centerY - this.canvas.height / 2;

            // Clamp camera to map bounds
            const mapPixelWidth = this.mapWidth * TILE_SIZE;
            const mapPixelHeight = this.mapHeight * TILE_SIZE;
            this.camera.x = Math.max(0, Math.min(this.camera.x, mapPixelWidth - this.canvas.width));
            this.camera.y = Math.max(0, Math.min(this.camera.y, mapPixelHeight - this.canvas.height));
        }
    }

    draw() {
        // Clear
        this.ctx.fillStyle = COLORS.BG;
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

        if (this.state === STATES.HUB) {
            this.drawHub();
        } else if (this.state === STATES.DUNGEON) {
            this.drawDungeon();
            this.drawHUD();
        } else if (this.state === STATES.GAMEOVER) {
            this.drawDungeon(); // Show background still
            this.drawOverlay("YOU DIED", COLORS.ENEMY, "Press R or Tap Button to Return");
        } else if (this.state === STATES.VICTORY) {
            this.drawDungeon();
            this.drawOverlay("FLOOR CLEARED!", COLORS.MINION, "Press R or Tap Button to Rest");
        }
    }

    drawDungeon() {
        // Fill Visible Area with Floor
        this.ctx.fillStyle = COLORS.FLOOR;
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

        // Draw Walls
        for (let wall of this.walls) {
            wall.draw(this.ctx, this.camera);
        }

        // Draw Items
        for (let item of this.items) {
            item.draw(this.ctx, this.camera);
        }

        // Sort entities by Y position for proper depth
        const sortedEntities = [...this.entities].sort((a, b) => a.rect.y - b.rect.y);

        // Draw Entities
        for (let ent of sortedEntities) {
            ent.draw(this.ctx, this.camera);
        }

        // Draw Particles
        for (let p of this.particles) {
            p.draw(this.ctx, this.camera);
        }
    }

    drawHub() {
        const cx = this.canvas.width / 2;
        const cy = this.canvas.height / 2;

        this.drawText("THE MANOR", 60, COLORS.GOLD, cx, 100);
        this.drawText(`Level ${playerStats.level} Summoner`, 28, COLORS.PLAYER, cx, 160);
        this.drawText(`Gold: ${playerStats.gold}`, 30, COLORS.GOLD, cx, 200);
        this.drawText(`Floor Record: ${this.dungeonLevel}`, 25, COLORS.WHITE, cx, 240);

        const btnY = cy + 50;
        this.drawText("[ ENTER / TAP ] Start Expedition", 30, COLORS.MINION, cx, btnY);

        const hpColor = playerStats.gold >= 50 ? COLORS.WHITE : COLORS.WALL;
        this.drawText(`[ H ] Upgrade HP (50g) - Current: ${playerStats.maxHp}`, 22, hpColor, cx, btnY + 60);

        const mpColor = playerStats.gold >= 50 ? COLORS.WHITE : COLORS.WALL;
        this.drawText(`[ M ] Upgrade Mana (50g) - Current: ${playerStats.maxMana}`, 22, mpColor, cx, btnY + 100);

        // Stats info
        this.drawText(`Minion Damage: ${playerStats.minionDamage}`, 18, COLORS.MINION_DARK, cx, btnY + 160);
    }

    drawHUD() {
        // HP Bar
        this.ctx.fillStyle = COLORS.WALL;
        this.ctx.fillRect(20, 20, 200, 20);
        const hpPct = Math.max(0, this.player.hp / playerStats.maxHp);
        this.ctx.fillStyle = COLORS.MINION;
        this.ctx.fillRect(20, 20, 200 * hpPct, 20);
        this.drawText(`${Math.floor(this.player.hp)}/${playerStats.maxHp} HP`, 16, COLORS.WHITE, 120, 36);

        // Mana Bar
        this.ctx.fillStyle = COLORS.WALL;
        this.ctx.fillRect(20, 50, 200, 20);
        const mpPct = Math.max(0, this.player.mana / playerStats.maxMana);
        this.ctx.fillStyle = COLORS.PLAYER;
        this.ctx.fillRect(20, 50, 200 * mpPct, 20);
        this.drawText(`${Math.floor(this.player.mana)}/${playerStats.maxMana} MP`, 16, COLORS.WHITE, 120, 66);

        // XP Bar
        this.ctx.fillStyle = COLORS.WALL;
        this.ctx.fillRect(20, 80, 200, 15);
        const xpPct = Math.max(0, playerStats.xp / playerStats.xpToNext);
        this.ctx.fillStyle = COLORS.GOLD;
        this.ctx.fillRect(20, 80, 200 * xpPct, 15);
        this.ctx.textAlign = 'left';
        this.ctx.fillStyle = COLORS.WHITE;
        this.ctx.font = 'bold 12px Arial';
        this.ctx.fillText(`Level ${playerStats.level} - ${playerStats.xp}/${playerStats.xpToNext} XP`, 25, 92);

        // Stats (top right)
        this.ctx.textAlign = 'center';
        this.drawText(`Floor ${this.dungeonLevel}`, 24, COLORS.WHITE, this.canvas.width - 80, 30);
        this.drawText(`Gold: ${playerStats.gold}`, 20, COLORS.GOLD, this.canvas.width - 80, 60);

        // Enemy count
        this.drawText(`Enemies: ${this.enemies.length}`, 18, COLORS.ENEMY, this.canvas.width - 80, 85);
    }

    drawOverlay(title, color, sub) {
        this.ctx.fillStyle = "rgba(0, 0, 0, 0.7)";
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

        const cx = this.canvas.width / 2;
        const cy = this.canvas.height / 2;

        this.drawText(title, 50, color, cx, cy - 40);
        this.drawText(sub, 24, COLORS.WHITE, cx, cy + 40);
    }

    drawText(text, size, color, x, y) {
        this.ctx.fillStyle = color;
        this.ctx.font = `bold ${size}px Arial`;
        this.ctx.textAlign = 'center';
        this.ctx.fillText(text, x, y);
    }

    loop() {
        this.update();
        this.draw();
        requestAnimationFrame(this.loop);
    }
}
