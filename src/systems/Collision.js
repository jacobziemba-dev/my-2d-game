export class Collision {
  constructor(game) {
    this.game = game;
  }

  resolve() {
    const ents = this.game.entities || [];

    for (let i = 0; i < ents.length; i++) {
      const a = ents[i];
      if (!a || !a.rect || a.dead || a.picked === true) continue;

      for (let j = i + 1; j < ents.length; j++) {
        const b = ents[j];
        if (!b || !b.rect || b.dead || b.picked === true) continue;
        if (a === b) continue;

        if (!a.rect.colliderect(b.rect)) continue;

        const ax = a.rect.centerX;
        const ay = a.rect.centerY;
        const bx = b.rect.centerX;
        const by = b.rect.centerY;

        const halfWidthA = a.rect.w / 2;
        const halfHeightA = a.rect.h / 2;
        const halfWidthB = b.rect.w / 2;
        const halfHeightB = b.rect.h / 2;

        const dx = bx - ax;
        const dy = by - ay;

        const overlapX = halfWidthA + halfWidthB - Math.abs(dx);
        const overlapY = halfHeightA + halfHeightB - Math.abs(dy);

        if (overlapX > 0 && overlapY > 0) {
          // Resolve along the smaller penetration axis
          if (overlapX < overlapY) {
            const separation = overlapX || 0.1;
            const sign = dx === 0 ? 1 : Math.sign(dx);
            const moveA = -sign * (separation / 2);
            const moveB = sign * (separation / 2);
            a.rect.x += moveA;
            b.rect.x += moveB;
          } else {
            const separation = overlapY || 0.1;
            const sign = dy === 0 ? 1 : Math.sign(dy);
            const moveA = -sign * (separation / 2);
            const moveB = sign * (separation / 2);
            a.rect.y += moveA;
            b.rect.y += moveB;
          }
        }
      }
    }
  }
}

export default Collision;
