let isMobile = window.matchMedia("(max-width: 768px)").matches;

let prefersReducedMotion = false;
let prefersHighContrast = false;

window.addEventListener('resize', () =>  {
    isMobile = window.matchMedia("(max-width: 768px)").matches;
});

prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
prefersHighContrast = window.matchMedia("(prefers-contrast: more)").matches;