import { Entity } from './Entity.js';
import { getDistance } from '../utils.js';
import { COLORS } from '../constants.js';

export class Enemy extends Entity {
  constructor(x, y, type = 'normal') {
    // type: 'normal', 'fast', 'ranged', 'tank', 'boss'
    let w, h, color, hp, speed, damage, xp, gold;

    switch (type) {
      case 'boss':
        w = h = 60;
        color = COLORS.BOSS;
        hp = 500;
        speed = 2.0;
        damage = 15;
        xp = 100;
        gold = 200;
        break;
      case 'fast':
        w = h = 25;
        color = COLORS.ENEMY_FAST;
        hp = 25;
        speed = 4.5;
        damage = 3;
        xp = 15;
        gold = 8;
        break;
      case 'ranged':
        w = h = 30;
        color = COLORS.ENEMY_RANGED;
        hp = 30;
        speed = 2.0;
        damage = 8;
        xp = 25;
        gold = 15;
        break;
      case 'tank':
        w = h = 35;
        color = COLORS.ENEMY_DARK;
        hp = 80;
        speed = 1.5;
        damage = 10;
        xp = 30;
        gold = 20;
        break;
      default: // normal
        w = h = 30;
        color = COLORS.ENEMY;
        hp = 40;
        speed = 2.5;
        damage = 5;
        xp = 20;
        gold = 10;
    }

    super(x, y, w, h, color, hp, speed);

    this.damage = damage;
    this.type = type;
    this.isBoss = type === 'boss';
    this.attackCooldown = 0;
    this.xpValue = xp;
    this.goldValue = gold;
    this.attackRange = type === 'ranged' ? 150 : 40;
  }

  // Enemy update is handled by `src/systems/AI.js` (enemyBehavior)
  update() {
    // kept as a no-op for backward compatibility
  }
}
