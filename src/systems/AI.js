export class AI {
    constructor(game) {
        this.game = game;
    }

    updateAll(enemies) {
        // Default AI loop: call each enemy's update method with game context
        enemies.forEach(e => {
            try {
                if (typeof e.update === 'function') e.update(this.game);
            } catch (err) {
                // Don't let a single enemy break the loop
                console.error('AI update error for enemy', e, err);
            }
        });
    }
}

export default AI;