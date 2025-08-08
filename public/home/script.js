function constructBouncer() {
  const anchor = document.createElement("a");
  anchor.ariaHidden = "true";
  anchor.id = "bouncer";
  anchor.className = "bouncer";
  anchor.innerHTML = `
    <img src="/global/assets/imgs/spinning-car-bouncer.gif" alt="Bouncing Car"/>
    `;

  document.body.appendChild(anchor);

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

    anchor.style.left = x + "px";
    anchor.style.top = y + "px";

    requestAnimationFrame(bounce);
  };

  if (!prefersReducedMotion.get()) {
    bounce();
  }
}

document.addEventListener("DOMContentLoaded", () => {
  constructBouncer();
  window.addEventListener("resize", () => {
    const bouncer = document.getElementById("bouncer");
    if (bouncer) {
      bouncer.remove();
      setTimeout(() => {
        constructBouncer();
      }, 3000);
      // I chose a 3 second delay because I figured that would be a reasonable amount of time for someone to rearrange their window size
    }
  });
});
