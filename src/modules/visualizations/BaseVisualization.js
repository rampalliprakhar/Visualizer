export class BaseVisualization {
  constructor(scene, audioManager) {
    this.scene = scene;
    this.audioManager = audioManager;
    this.objects = [];
    this.isVisible = false;
    this.isInitialized = false;
  }

  init() {
    this.create();
    this.isInitialized = true;
  }

  create() {
    // Override in subclasses
    throw new Error("create() method must be implemented");
  }

  update() {
    if (!this.isVisible || !this.isInitialized) return;
    this.animate();
  }

  animate() {
    // Override in subclasses
  }

  show() {
    this.isVisible = true;
    this.objects.forEach((obj) => {
      obj.visible = true;
    });
  }

  hide() {
    this.isVisible = false;
    this.objects.forEach((obj) => {
      obj.visible = false;
    });
  }

  addObject(object) {
    this.objects.push(object);
    this.scene.add(object);
    object.visible = this.isVisible;
  }

  removeObject(object) {
    const index = this.objects.indexOf(object);
    if (index > -1) {
      this.objects.splice(index, 1);
      this.scene.remove(object);
    }
  }

  destroy() {
    this.objects.forEach((obj) => {
      this.scene.remove(obj);
      if (obj.geometry) obj.geometry.dispose();
      if (obj.material) {
        if (Array.isArray(obj.material)) {
          obj.material.forEach((mat) => mat.dispose());
        } else {
          obj.material.dispose();
        }
      }
    });
    this.objects = [];
  }

  // Utility methods
  average(array) {
    return array.reduce((sum, value) => sum + value, 0) / array.length;
  }

  mapRange(value, inMin, inMax, outMin, outMax) {
    return ((value - inMin) * (outMax - outMin)) / (inMax - inMin) + outMin;
  }
}
