// Math utilities and simple geometry helpers
export class Rect {
  constructor(x, y, w, h) {
    this.x = x;
    this.y = y;
    this.w = w;
    this.h = h;
  }

  get left() {
    return this.x;
  }
  get right() {
    return this.x + this.w;
  }
  get top() {
    return this.y;
  }
  get bottom() {
    return this.y + this.h;
  }

  get centerX() {
    return this.x + this.w / 2;
  }
  get centerY() {
    return this.y + this.h / 2;
  }

  colliderect(other) {
    return (
      this.x < other.x + other.w &&
      this.x + this.w > other.x &&
      this.y < other.y + other.h &&
      this.y + this.h > other.y
    );
  }
}

export function getDistance(obj1, obj2) {
  const dx = obj1.rect.centerX - obj2.rect.centerX;
  const dy = obj1.rect.centerY - obj2.rect.centerY;
  return Math.hypot(dx, dy);
}
