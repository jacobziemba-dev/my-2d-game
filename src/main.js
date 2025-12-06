import { Game } from './game.js';
import { setupControlSelection } from './ui/ControlSelection.js';

// Wire up control selection UI and start the game when the user confirms
setupControlSelection((mode) => {
    window.game = new Game(mode);
    console.log(`Game started in ${mode} mode`);
});
