document.addEventListener('DOMContentLoaded', () => {
    const anchor = document.getElementById('bouncer');

    let x = 100;
    let y = 100;
    let dx = 2;
    let dy = 2;

    const bounce = () => {
        const rect = anchor.getBoundingClientRect();
        const width = window.innerWidth;
        const height = window.innerHeight;

        // Move
        x += dx;
        y += dy;

        // Bounce logic
        if (x + rect.width >= width || x <= 0) {
            dx *= -1;
        }
        if (y + rect.height >= height || y <= 0) {
            dy *= -1;
        }

        anchor.style.left = x + 'px';
        anchor.style.top = y + 'px';

        requestAnimationFrame(bounce);
    };

    function changeColor() {
        const hue = Math.floor(Math.random() * 360);
        anchor.style.backgroundColor = `hsl(${hue}, 90%, 55%)`;
    }

    if (!prefersReducedMotion) {
        bounce();
    }
});