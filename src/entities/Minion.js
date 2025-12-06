import { Entity } from './Entity.js';
import { getDistance } from '../utils.js';
import { COLORS } from '../constants.js';
import { playerStats } from '../state.js';

export class Minion extends Entity {
  constructor(x, y, owner) {
    super(x, y, 20, 20, COLORS.MINION, 30, 3.5);
    this.owner = owner;
    this.target = null;
    this.attackCooldown = 0;
  }

  // Minion update is handled by `src/systems/AI.js` (minionBehavior)
  update() {
    // kept as a no-op for backward compatibility
  }
}
