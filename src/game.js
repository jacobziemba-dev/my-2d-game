import { InputHandler } from './input.js';
import { GameMap } from './map.js';
import { Player, Enemy, Item, Minion, Particle } from './entities.js';
import { playerStats } from './state.js';
import { STATES, COLORS, TILE_SIZE } from './constants.js';
import { Rect } from './utils.js';
import { Renderer } from './systems/Renderer.js';
import { Camera } from './systems/Camera.js';

export class Game {
    constructor(controlMode) {
        this.controlMode = controlMode;
        this.canvas = document.getElementById('gameCanvas');
        this.ctx = this.canvas.getContext('2d');
        this.input = new InputHandler(this, controlMode);

        // UI Cache
        this.hubControls = document.getElementById('hubControls');
        this.hpBtn = document.getElementById('btn-upgrade-hp');
        this.manaBtn = document.getElementById('btn-upgrade-mana');
        this.lastGold = -1;
        this.lastState = null;

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

        this.camera = new Camera(window.innerWidth, window.innerHeight);

        window.addEventListener('resize', () => this.resize());
        this.resize();

        // Renderer
        this.renderer = new Renderer(this);

        this.loop = this.loop.bind(this);
        requestAnimationFrame(this.loop);
    }

    resize() {
        this.canvas.width = window.innerWidth;
        this.canvas.height = window.innerHeight;
        if (this.camera && typeof this.camera.setSize === 'function') {
            this.camera.setSize(this.canvas.width, this.canvas.height);
        } else {
            this.camera.w = this.canvas.width;
            this.camera.h = this.canvas.height;
        }
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
        // Toggle mobile hub controls efficiently
        if (this.hubControls) {
            const isHub = this.state === STATES.HUB && this.controlMode === 'MOBILE';

            // Only toggle display when state changes
            if (this.state !== this.lastState) {
                this.hubControls.style.display = isHub ? 'flex' : 'none';
                this.lastState = this.state;
            }

            // Only update buttons if in Hub and gold changed
            if (isHub && this.lastGold !== playerStats.gold) {
                if (this.hpBtn) {
                     this.hpBtn.innerText = `UPGRADE HP (50g)`;
                     this.hpBtn.style.opacity = playerStats.gold >= 50 ? '1' : '0.5';
                }
                if (this.manaBtn) {
                    this.manaBtn.innerText = `UPGRADE MANA (50g)`;
                    this.manaBtn.style.opacity = playerStats.gold >= 50 ? '1' : '0.5';
                }
                this.lastGold = playerStats.gold;
            }
        }

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

            // Camera update (follow + clamp)
            const mapPixelWidth = this.mapWidth * TILE_SIZE;
            const mapPixelHeight = this.mapHeight * TILE_SIZE;
            if (this.camera && typeof this.camera.update === 'function') {
                this.camera.update(this.player, this.canvas.width, this.canvas.height, mapPixelWidth, mapPixelHeight);
            } else {
                this.camera.x = this.player.rect.centerX - this.canvas.width / 2;
                this.camera.y = this.player.rect.centerY - this.canvas.height / 2;
                this.camera.x = Math.max(0, Math.min(this.camera.x, mapPixelWidth - this.canvas.width));
                this.camera.y = Math.max(0, Math.min(this.camera.y, mapPixelHeight - this.canvas.height));
            }
        }
    }
    loop() {
        this.update();
        this.renderer.draw();
        requestAnimationFrame(this.loop);
    }

    // The drawing responsibilities were moved to `src/systems/Renderer.js`.
}
