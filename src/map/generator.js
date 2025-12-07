import { BSPNode } from './bsp.js';
import { Wall } from './tiles.js';
import { Rect } from '../utils.js';
import { TILE_SIZE } from '../constants.js';

export class GameMap {
  constructor(w, h) {
    this.width = w;
    this.height = h;
    this.grid = [];
    this.walls = [];
    this.rooms = [];
    this.spawnPoint = { x: 0, y: 0 };
    this.bossPoint = { x: 0, y: 0 };
  }

  generate() {
    // Init Grid with Walls (1)
    this.grid = [];
    for (let y = 0; y < this.height; y++) {
      let row = [];
      for (let x = 0; x < this.width; x++) row.push(1);
      this.grid.push(row);
    }

    // BSP Generation
    const root = new BSPNode(1, 1, this.width - 2, this.height - 2);

    // Split recursively
    const containers = [root];
    let iterations = 0;

    while (containers.length > 0 && iterations < 100) {
      const container = containers.shift();
      if (container.split()) {
        containers.push(container.left);
        containers.push(container.right);
      }
      iterations++;
    }

    // Create rooms
    root.createRooms();
    this.rooms = root.getRooms();

    // Carve out rooms
    for (let room of this.rooms) {
      for (let y = room.y; y < room.y + room.h; y++) {
        for (let x = room.x; x < room.x + room.w; x++) {
          if (y >= 0 && y < this.height && x >= 0 && x < this.width) {
            this.grid[y][x] = 0;
          }
        }
      }
    }

    // Create corridors between rooms
    for (let i = 0; i < this.rooms.length - 1; i++) {
      const roomA = this.rooms[i];
      const roomB = this.rooms[i + 1];

      const startX = Math.floor(roomA.centerX);
      const startY = Math.floor(roomA.centerY);
      const endX = Math.floor(roomB.centerX);
      const endY = Math.floor(roomB.centerY);

      // L-shaped corridor
      if (Math.random() > 0.5) {
        this.createHCorridor(startX, endX, startY);
        this.createVCorridor(startY, endY, endX);
      } else {
        this.createVCorridor(startY, endY, startX);
        this.createHCorridor(startX, endX, endY);
      }
    }

    // Set spawn and boss points (center of rooms, properly calculated)
    if (this.rooms.length > 0) {
      const firstRoom = this.rooms[0];
      // Calculate grid center first (integer-aligned), then convert to pixels, then center the 30x30 player
      const gridCenterX = Math.floor(firstRoom.x + firstRoom.w / 2);
      const gridCenterY = Math.floor(firstRoom.y + firstRoom.h / 2);
      this.spawnPoint = {
        x: gridCenterX * TILE_SIZE - 15, // Center 30px player (30/2 = 15)
        y: gridCenterY * TILE_SIZE - 15,
      };

      const lastRoom = this.rooms[this.rooms.length - 1];
      const bossCenterX = Math.floor(lastRoom.x + lastRoom.w / 2);
      const bossCenterY = Math.floor(lastRoom.y + lastRoom.h / 2);
      this.bossPoint = {
        x: bossCenterX * TILE_SIZE - 30, // Center 60px boss (60/2 = 30)
        y: bossCenterY * TILE_SIZE - 30,
      };
    }

    // Build Walls
    this.walls = [];
    for (let y = 0; y < this.height; y++) {
      for (let x = 0; x < this.width; x++) {
        if (this.grid[y][x] === 1) {
          this.walls.push(new Wall(x * TILE_SIZE, y * TILE_SIZE));
        }
      }
    }
  }

  createHCorridor(x1, x2, y) {
    const minX = Math.min(x1, x2);
    const maxX = Math.max(x1, x2);

    for (let x = minX; x <= maxX; x++) {
      if (y >= 0 && y < this.height && x >= 0 && x < this.width) {
        this.grid[y][x] = 0;
        // Make corridors 2 tiles wide
        if (y + 1 < this.height) this.grid[y + 1][x] = 0;
      }
    }
  }

  createVCorridor(y1, y2, x) {
    const minY = Math.min(y1, y2);
    const maxY = Math.max(y1, y2);

    for (let y = minY; y <= maxY; y++) {
      if (y >= 0 && y < this.height && x >= 0 && x < this.width) {
        this.grid[y][x] = 0;
        // Make corridors 2 tiles wide
        if (x + 1 < this.width) this.grid[y][x + 1] = 0;
      }
    }
  }
}
