import { Rect } from '../utils.js';
import { TILE_SIZE, COLORS } from '../constants.js';

export class Wall {
  constructor(x, y) {
    this.rect = new Rect(x, y, TILE_SIZE, TILE_SIZE);
  }

  draw(ctx, camera) {
    const screenX = this.rect.x - camera.x;
    const screenY = this.rect.y - camera.y;

    // Simple culling
    if (
      screenX < -100 ||
      screenX > ctx.canvas.width + 100 ||
      screenY < -100 ||
      screenY > ctx.canvas.height + 100
    )
      return;

    // Draw wall
    ctx.fillStyle = COLORS.WALL;
    ctx.fillRect(screenX, screenY, TILE_SIZE, TILE_SIZE);

    // Draw border
    ctx.strokeStyle = COLORS.BORDER;
    ctx.lineWidth = 1;
    ctx.strokeRect(screenX, screenY, TILE_SIZE, TILE_SIZE);
  }
}
