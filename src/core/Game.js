import { InputHandler } from '../systems/InputHandler.js';
import { GameMap } from '../map.js';
import { Player, Enemy, Item, Minion, Particle } from '../entities.js';
import { playerStats } from '../state.js';
import { STATES, COLORS, TILE_SIZE } from '../constants.js';
import { Rect } from '../utils.js';
import { Renderer } from '../systems/Renderer.js';
import { Camera } from '../systems/Camera.js';
import { spawnDungeon } from '../systems/Spawner.js';
import { AI } from '../systems/AI.js';
import { Collision } from '../systems/Collision.js';
import { HUD } from '../ui/HUD.js';

export class Game {
  constructor(controlMode) {
    this.controlMode = controlMode;
    this.canvas = document.getElementById('gameCanvas');
    this.ctx = this.canvas.getContext('2d');
    this.input = new InputHandler(this, controlMode);

    // UI
    this.ui = new HUD(this);

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
    this.ai = new AI(this);
    this.collision = new Collision(this);

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
      this.spawnParticles(
        this.player.rect.x,
        this.player.rect.y,
        COLORS.GOLD,
        20
      );
    }
  }

  spawnParticles(x, y, color, count) {
    for (let i = 0; i < count; i++) {
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
    const SPAWN_BUFFER = 5; // Minimum 5px clearance from walls
    const playerTestRect = new Rect(
      spawnX - SPAWN_BUFFER,
      spawnY - SPAWN_BUFFER,
      30 + SPAWN_BUFFER * 2,
      30 + SPAWN_BUFFER * 2
    );
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
      spawnX = gridCenterX * TILE_SIZE - 15; // Center 30px player
      spawnY = gridCenterY * TILE_SIZE - 15;
      console.log('Spawn was blocked, using fallback position');
    }

    console.log(
      `Player spawning at: (${spawnX}, ${spawnY}), validSpawn: ${validSpawn}`
    );
    if (this.rooms.length > 0) {
      console.log(
        `First room: x=${this.rooms[0].x}, y=${this.rooms[0].y}, w=${this.rooms[0].w}, h=${this.rooms[0].h}`
      );
    }

    this.player = new Player(spawnX, spawnY);
    this.entities.push(this.player);

    console.log(
      `Player created at: (${this.player.rect.x}, ${this.player.rect.y}), HP: ${this.player.hp}`
    );

    // Delegate spawning of enemies/items to the Spawner system
    try {
      spawnDungeon(this);
    } catch (err) {
      console.error('Spawner error:', err);
    }
  }

  handleStart() {
    if (this.state === STATES.HUB) {
      this.startDungeon();
    }
  }

  handleRestart() {
    if (this.state === STATES.GAMEOVER || this.state === STATES.VICTORY) {
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
    // UI updates (handles mobile hub controls and button states)
    if (this.ui && typeof this.ui.update === 'function') this.ui.update();

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

      // Update Minions and Enemies via AI system
      try {
        if (this.ai && typeof this.ai.updateAll === 'function') {
          // updater functions live on the AI instance; pass them to updateAll
          this.ai.updateAll(this.minions, this.ai.minionBehavior);
          this.ai.updateAll(this.enemies, this.ai.enemyBehavior);
        } else {
          this.minions.forEach(m => { if (typeof m.update === 'function') m.update(this); });
          this.enemies.forEach(e => { if (typeof e.update === 'function') e.update(this); });
        }
      } catch (err) {
        console.error('Error in AI update:', err);
      }

      // Resolve entity-entity collisions (separation)
      try {
        if (this.collision && typeof this.collision.resolve === 'function') {
          this.collision.resolve();
        }
      } catch (err) {
        console.error('Collision resolve error:', err);
      }

      // Post-update death processing
      this.enemies.forEach(e => {
        if (e.hp <= 0 && !e.dead) {
          e.dead = true;
          playerStats.gold += e.goldValue;
          playerStats.xp += e.xpValue;
          this.spawnParticles(e.rect.x, e.rect.y, COLORS.GOLD, 8);

          if (playerStats.xp >= playerStats.xpToNext) {
            this.levelUp();
          }

          if (Math.random() < 0.3) {
            const dropTypes = ['health', 'mana', 'equipment'];
            const dropType =
              dropTypes[Math.floor(Math.random() * dropTypes.length)];
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
        if (m.hp <= 0) m.dead = true;
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
        this.camera.update(
          this.player,
          this.canvas.width,
          this.canvas.height,
          mapPixelWidth,
          mapPixelHeight
        );
      } else {
        this.camera.x = this.player.rect.centerX - this.canvas.width / 2;
        this.camera.y = this.player.rect.centerY - this.canvas.height / 2;
        this.camera.x = Math.max(
          0,
          Math.min(this.camera.x, mapPixelWidth - this.canvas.width)
        );
        this.camera.y = Math.max(
          0,
          Math.min(this.camera.y, mapPixelHeight - this.canvas.height)
        );
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
