export class Camera {
    constructor(w = 800, h = 600) {
        this.x = 0;
        this.y = 0;
        this.w = w;
        this.h = h;
    }

    setSize(w, h) {
        this.w = w;
        this.h = h;
    }

    update(player, canvasWidth, canvasHeight, mapPixelWidth, mapPixelHeight) {
        if (!player) return;

        this.x = player.rect.centerX - canvasWidth / 2;
        this.y = player.rect.centerY - canvasHeight / 2;

        // Clamp camera to map bounds
        this.x = Math.max(0, Math.min(this.x, mapPixelWidth - canvasWidth));
        this.y = Math.max(0, Math.min(this.y, mapPixelHeight - canvasHeight));
    }
}
