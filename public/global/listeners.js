class StateVar {
  constructor(initialValue) {
    this.value = initialValue;
    this.callbacks = [];
  }
  
  get() {
    return this.value;
  }
  
  set(newValue) {
    if (this.value !== newValue) {
      this.value = newValue;
      this.callbacks.forEach(fn => fn());
    }
  }
  
  onChange(fn) {
    this.callbacks.push(fn);
  }
}

const isMobile = new StateVar(window.matchMedia("(max-width: 768px)").matches);
const prefersReducedMotion = new StateVar(window.matchMedia("(prefers-reduced-motion: reduce)").matches);
const prefersHighContrast = new StateVar(window.matchMedia("(prefers-contrast: more)").matches);

window.addEventListener('resize', () => {
  isMobile.set(window.matchMedia("(max-width: 768px)").matches);
});