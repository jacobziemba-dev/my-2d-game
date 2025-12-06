// Rendering helpers
export function toScreen(x, y, camera, canvas) {
    return {
        x: x - camera.x,
        y: y - camera.y
    };
}
