// Get the canvas and context
const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

// Game state
const game = {
    running: true,
    score: 0
};

// Player object
const player = {
    x: 100,
    y: canvas.height - 100,
    width: 40,
    height: 40,
    color: '#ff6b6b',
    velocityX: 0,
    velocityY: 0,
    speed: 5,
    jumpPower: 12,
    gravity: 0.5,
    isJumping: false,

    draw() {
        ctx.fillStyle = this.color;
        ctx.fillRect(this.x, this.y, this.width, this.height);

        // Draw a simple face
        ctx.fillStyle = '#fff';
        ctx.fillRect(this.x + 10, this.y + 10, 8, 8); // Left eye
        ctx.fillRect(this.x + 22, this.y + 10, 8, 8); // Right eye
        ctx.fillStyle = '#000';
        ctx.fillRect(this.x + 12, this.y + 25, 16, 4); // Mouth
    },

    update() {
        // Apply gravity
        this.velocityY += this.gravity;

        // Update position
        this.x += this.velocityX;
        this.y += this.velocityY;

        // Ground collision
        const groundLevel = canvas.height - this.height - 50;
        if (this.y >= groundLevel) {
            this.y = groundLevel;
            this.velocityY = 0;
            this.isJumping = false;
        }

        // Wall collision
        if (this.x < 0) this.x = 0;
        if (this.x + this.width > canvas.width) {
            this.x = canvas.width - this.width;
        }

        // Ceiling collision
        if (this.y < 0) {
            this.y = 0;
            this.velocityY = 0;
        }
    }
};

// Platform object
const platform = {
    x: 0,
    y: canvas.height - 50,
    width: canvas.width,
    height: 50,
    color: '#4ecdc4',

    draw() {
        ctx.fillStyle = this.color;
        ctx.fillRect(this.x, this.y, this.width, this.height);

        // Add grass texture
        ctx.fillStyle = '#45b7aa';
        for (let i = 0; i < this.width; i += 20) {
            ctx.fillRect(i, this.y, 10, 5);
        }
    }
};

// Keyboard input
const keys = {};

window.addEventListener('keydown', (e) => {
    keys[e.key.toLowerCase()] = true;

    // Jump
    if ((e.key === ' ' || e.key.toLowerCase() === 'w' || e.key === 'ArrowUp') && !player.isJumping) {
        player.velocityY = -player.jumpPower;
        player.isJumping = true;
    }
});

window.addEventListener('keyup', (e) => {
    keys[e.key.toLowerCase()] = false;
});

// Handle movement based on keys pressed
function handleInput() {
    player.velocityX = 0;

    if (keys['arrowleft'] || keys['a']) {
        player.velocityX = -player.speed;
    }
    if (keys['arrowright'] || keys['d']) {
        player.velocityX = player.speed;
    }
}

// Draw background
function drawBackground() {
    // Sky
    ctx.fillStyle = '#87ceeb';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Clouds
    ctx.fillStyle = 'rgba(255, 255, 255, 0.7)';
    ctx.beginPath();
    ctx.arc(150, 80, 30, 0, Math.PI * 2);
    ctx.arc(180, 80, 40, 0, Math.PI * 2);
    ctx.arc(210, 80, 30, 0, Math.PI * 2);
    ctx.fill();

    ctx.beginPath();
    ctx.arc(500, 120, 35, 0, Math.PI * 2);
    ctx.arc(535, 120, 45, 0, Math.PI * 2);
    ctx.arc(575, 120, 35, 0, Math.PI * 2);
    ctx.fill();
}

// Draw score
function drawScore() {
    ctx.fillStyle = '#fff';
    ctx.font = 'bold 24px Arial';
    ctx.textAlign = 'left';
    ctx.fillText(`Score: ${game.score}`, 20, 40);
}

// Main game loop
function gameLoop() {
    if (!game.running) return;

    // Clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Draw everything
    drawBackground();
    platform.draw();
    player.draw();
    drawScore();

    // Update
    handleInput();
    player.update();

    // Increment score
    game.score++;

    // Request next frame
    requestAnimationFrame(gameLoop);
}

// Start the game
console.log('Game starting...');
gameLoop();
