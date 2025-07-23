export class EffectsManager {
  constructor() {
    this.scene = null;
    this.trailSystems = [];
    this.beatEffects = [];
    this.particleTrails = [];

    this.params = {
      trailLength: 50,
      trailOpacity: 0.7,
      beatSensitivity: 1.5,
    };
  }

  init(scene) {
    this.scene = scene;
    this.setupBeatEffects();
    this.setupTrailSystems();

    // Listen for beat events
    window.addEventListener("beatDetected", (event) => {
      this.triggerBeatEffects(event.detail);
    });
  }

  setupBeatEffects() {
    // Beat indicator in DOM
    const beatIndicator = document.getElementById("beatIndicator");
    if (beatIndicator) {
      this.beatEffects.push({
        type: "dom",
        element: beatIndicator,
        trigger: () => {
          beatIndicator.classList.add("beat");
          setTimeout(() => {
            beatIndicator.classList.remove("beat");
          }, 200);
        },
      });
    }
  }

  setupTrailSystems() {
    for (let i = 0; i < this.params.trailLength; i++) {
      const trailGeometry = new THREE.BufferGeometry();
      const trailPositions = new Float32Array(1000 * 3);

      trailGeometry.setAttribute(
        "position",
        new THREE.BufferAttribute(trailPositions, 3)
      );

      const trailMaterial = new THREE.PointsMaterial({
        size: 0.5,
        transparent: true,
        opacity: this.params.trailOpacity * (1 - i / this.params.trailLength),
        color: 0xffffff,
      });

      const trail = new THREE.Points(trailGeometry, trailMaterial);
      trail.visible = false;

      this.trailSystems.push(trail);
      this.scene.add(trail);
    }
  }

  triggerBeatEffects(beatData) {
    this.beatEffects.forEach((effect) => {
      if (effect.trigger) {
        effect.trigger(beatData);
      }
    });
  }

  updateTrails(particlePositions) {
    // Update particle trails
    this.trailSystems.forEach((trail, index) => {
      const positions = trail.geometry.attributes.position.array;

      // Copy positions with delay
      for (let i = 0; i < particlePositions.length; i++) {
        positions[i] = particlePositions[i];
      }

      trail.geometry.attributes.position.needsUpdate = true;
    });
  }

  setTrailVisibility(visible) {
    this.trailSystems.forEach((trail) => {
      trail.visible = visible;
    });
  }

  update() {
    // Update any animated effects
    this.trailSystems.forEach((trail) => {
      if (trail.visible) {
        trail.rotation.y += 0.001;
      }
    });
  }

  destroy() {
    this.trailSystems.forEach((trail) => {
      this.scene.remove(trail);
      trail.geometry.dispose();
      trail.material.dispose();
    });
    this.trailSystems = [];
  }
}
