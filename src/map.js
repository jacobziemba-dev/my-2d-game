import { Rect } from './utils.js';
import { TILE_SIZE, COLORS } from './constants.js';

class BSPNode {
    constructor(x, y, w, h) {
        this.x = x;
        this.y = y;
        this.w = w;
        this.h = h;
        this.left = null;
        this.right = null;
        this.room = null;
    }

    split() {
        if (this.left || this.right) return false;

        const splitH = Math.random() > 0.5;
        const max = (splitH ? this.h : this.w) - 10;

        if (max <= 10) return false;

        const split = Math.floor(Math.random() * (max - 10)) + 10;

        if (splitH) {
            this.left = new BSPNode(this.x, this.y, this.w, split);
            this.right = new BSPNode(this.x, this.y + split, this.w, this.h - split);
        } else {
            this.left = new BSPNode(this.x, this.y, split, this.h);
            this.right = new BSPNode(this.x + split, this.y, this.w - split, this.h);
        }

        return true;
    }

    createRooms() {
        if (this.left || this.right) {
            if (this.left) this.left.createRooms();
            if (this.right) this.right.createRooms();
        } else {
            const roomW = Math.floor(Math.random() * (this.w - 4)) + 4;
            const roomH = Math.floor(Math.random() * (this.h - 4)) + 4;
            const roomX = this.x + Math.floor(Math.random() * (this.w - roomW));
            const roomY = this.y + Math.floor(Math.random() * (this.h - roomH));

            this.room = new Rect(roomX, roomY, roomW, roomH);
        }
    }

    getRoom() {
        if (this.room) return this.room;

        let leftRoom = null;
        let rightRoom = null;

        if (this.left) leftRoom = this.left.getRoom();
        if (this.right) rightRoom = this.right.getRoom();

        if (!leftRoom && !rightRoom) return null;
        if (!rightRoom) return leftRoom;
        if (!leftRoom) return rightRoom;

        return Math.random() > 0.5 ? leftRoom : rightRoom;
    }

    getRooms() {
        if (this.room) return [this.room];

        let rooms = [];
        if (this.left) rooms = rooms.concat(this.left.getRooms());
        if (this.right) rooms = rooms.concat(this.right.getRooms());

        return rooms;
    }
}

export class Wall {
    constructor(x, y) {
        this.rect = new Rect(x, y, TILE_SIZE, TILE_SIZE);
    }

    draw(ctx, camera) {
        const screenX = this.rect.x - camera.x;
        const screenY = this.rect.y - camera.y;

        // Simple culling
        if (screenX < -100 || screenX > ctx.canvas.width + 100 || screenY < -100 || screenY > ctx.canvas.height + 100) return;

        // Draw wall
        ctx.fillStyle = COLORS.WALL;
        ctx.fillRect(screenX, screenY, TILE_SIZE, TILE_SIZE);

        // Draw border
        ctx.strokeStyle = COLORS.BORDER;
        ctx.lineWidth = 1;
        ctx.strokeRect(screenX, screenY, TILE_SIZE, TILE_SIZE);
    }
}

export class GameMap {
    constructor(w, h) {
        this.width = w;
        this.height = h;
        this.grid = [];
        this.walls = [];
        this.rooms = [];
        this.spawnPoint = {x:0, y:0};
        this.bossPoint = {x:0, y:0};
    }

    generate() {
        // Init Grid with Walls (1)
        this.grid = [];
        for(let y=0; y<this.height; y++) {
            let row = [];
            for(let x=0; x<this.width; x++) row.push(1);
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
                x: gridCenterX * TILE_SIZE - 15,  // Center 30px player (30/2 = 15)
                y: gridCenterY * TILE_SIZE - 15
            };

            const lastRoom = this.rooms[this.rooms.length - 1];
            const bossCenterX = Math.floor(lastRoom.x + lastRoom.w / 2);
            const bossCenterY = Math.floor(lastRoom.y + lastRoom.h / 2);
            this.bossPoint = {
                x: bossCenterX * TILE_SIZE - 30,  // Center 60px boss (60/2 = 30)
                y: bossCenterY * TILE_SIZE - 30
            };
        }

        // Build Walls
        this.walls = [];
        for(let y=0; y<this.height; y++) {
            for(let x=0; x<this.width; x++) {
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
