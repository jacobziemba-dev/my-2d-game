export class AI {
  constructor(game) {
    this.game = game;
  }

  // Generic per-entity update runner (safe)
  updateAll(list, updater) {
    list.forEach(item => {
      try {
        updater.call(this, item, this.game);
      } catch (err) {
        console.error('AI update error for entity', item, err);
      }
    });
  }

  // Enemy behavior extracted from previous `Enemy.update` implementation
  enemyBehavior(enemy, game) {
    let targets = [game.player, ...game.minions];
    let closestTarget = null;
    let closestDist = 600;

    for (let t of targets) {
      if (!t) continue;
      let dist = Math.hypot(enemy.rect.centerX - t.rect.centerX, enemy.rect.centerY - t.rect.centerY);
      if (dist < closestDist) {
        closestDist = dist;
        closestTarget = t;
      }
    }

    if (closestTarget) {
      let angle = Math.atan2(
        closestTarget.rect.centerY - enemy.rect.centerY,
        closestTarget.rect.centerX - enemy.rect.centerX
      );
      let dx = Math.cos(angle);
      let dy = Math.sin(angle);

      // Ranged enemies keep distance
      if (enemy.type === 'ranged') {
        if (closestDist > 120) {
          enemy.move(dx, dy, game.walls);
        } else if (closestDist < 80) {
          enemy.move(-dx, -dy, game.walls); // Retreat
        }
      } else {
        enemy.move(dx, dy, game.walls);
      }

      if (closestDist < enemy.attackRange && enemy.attackCooldown <= 0) {
        // Add damage variance (±20%)
        const variance = 0.8 + Math.random() * 0.4;
        const finalDamage = Math.floor(enemy.damage * variance);

        // 10% crit chance (double damage)
        const isCrit = Math.random() < 0.1;
        const damage = isCrit ? finalDamage * 2 : finalDamage;

        closestTarget.hp -= damage;
        enemy.attackCooldown = enemy.type === 'fast' ? 40 : 60;

        const particleColor = isCrit ? game.C || '#FFD700' : '#ff0000';
        game.spawnParticles(
          closestTarget.rect.x,
          closestTarget.rect.y,
          particleColor,
          isCrit ? 6 : 3
        );

        // Ranged projectile effect
        if (enemy.type === 'ranged') {
          game.spawnParticles(enemy.rect.x, enemy.rect.y, '#ff9999', 3);
        }
      }
    }
    if (enemy.attackCooldown > 0) enemy.attackCooldown--;
  }

  // Minion behavior extracted from previous `Minion.update` implementation
  minionBehavior(minion, game) {
    // AI: Find closest enemy
    let closestDist = 400;
    minion.target = null;

    for (let enemy of game.enemies) {
      let dist = Math.hypot(minion.rect.centerX - enemy.rect.centerX, minion.rect.centerY - enemy.rect.centerY);
      if (dist < closestDist) {
        closestDist = dist;
        minion.target = enemy;
      }
    }

    let dx = 0,
      dy = 0;

    if (minion.target) {
      // Chase
      let angle = Math.atan2(
        minion.target.rect.centerY - minion.rect.centerY,
        minion.target.rect.centerX - minion.rect.centerX
      );
      dx = Math.cos(angle);
      dy = Math.sin(angle);

      // Attack
      if (closestDist < 30) {
        if (minion.attackCooldown <= 0) {
          const variance = 0.8 + Math.random() * 0.4;
          const damage = Math.floor(game.playerStats ? game.playerStats.minionDamage * variance : 5 * variance);
          minion.target.hp -= damage;
          minion.attackCooldown = 40;
          game.spawnParticles(minion.target.rect.x, minion.target.rect.y, '#88ff88', 3);
        }
      }
    } else {
      // Follow player
      if (game.player) {
        let distToPlayer = Math.hypot(minion.rect.centerX - game.player.rect.centerX, minion.rect.centerY - game.player.rect.centerY);
        if (distToPlayer > 80) {
          let angle = Math.atan2(
            game.player.rect.centerY - minion.rect.centerY,
            game.player.rect.centerX - minion.rect.centerX
          );
          dx = Math.cos(angle);
          dy = Math.sin(angle);
        }
      }
    }

    minion.move(dx, dy, game.walls);
    if (minion.attackCooldown > 0) minion.attackCooldown--;
  }
}

export default AI;
