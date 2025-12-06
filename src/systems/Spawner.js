import { Enemy, Item } from '../entities.js';
import { TILE_SIZE } from '../constants.js';

export function spawnDungeon(game) {
    // Spawn boss in final room
    const boss = new Enemy(game.map.bossPoint.x, game.map.bossPoint.y, 'boss');
    game.enemies.push(boss);
    game.entities.push(boss);

    // Spawn diverse enemies
    const enemyTypes = ['normal', 'fast', 'ranged', 'tank'];
    let numEnemies = 10 + (game.dungeonLevel * 2);
    let spawnAttempts = 0;

    while (numEnemies > 0 && spawnAttempts < 500) {
        let rx = Math.floor(Math.random() * (game.mapWidth - 2)) + 1;
        let ry = Math.floor(Math.random() * (game.mapHeight - 2)) + 1;

        if (game.grid[ry][rx] === 0) {
            const ex = rx * TILE_SIZE;
            const ey = ry * TILE_SIZE;
            const dist = Math.hypot(ex - game.player.rect.x, ey - game.player.rect.y);

            if (dist > 400) {
                const rand = Math.random();
                let type;
                if (rand < 0.4) type = 'normal';
                else if (rand < 0.6) type = 'fast';
                else if (rand < 0.8) type = 'ranged';
                else type = 'tank';

                const enemy = new Enemy(ex, ey, type);
                game.enemies.push(enemy);
                game.entities.push(enemy);
                numEnemies--;
            }
        }
        spawnAttempts++;
    }

    // Spawn items in rooms
    let numItems = 5 + Math.floor(game.dungeonLevel * 1.5);
    for (let i = 0; i < numItems; i++) {
        const room = game.rooms[Math.floor(Math.random() * game.rooms.length)];
        const itemX = (room.x + Math.floor(Math.random() * room.w)) * TILE_SIZE;
        const itemY = (room.y + Math.floor(Math.random() * room.h)) * TILE_SIZE;

        const rand = Math.random();
        let type;
        if (rand < 0.35) type = 'health';
        else if (rand < 0.65) type = 'mana';
        else if (rand < 0.90) type = 'equipment';
        else type = 'artifact';

        game.items.push(new Item(itemX, itemY, type));
    }
}

export default { spawnDungeon };