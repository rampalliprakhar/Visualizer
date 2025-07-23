import { BaseVisualization } from "./BaseVisualization.js";

export class SphereParticles extends BaseVisualization {
  constructor(scene, audioManager) {
    super(scene, audioManager);
    this.sphere = null;
    this.particleSystem = null;
    this.originalPositions = null;
  }

  create() {
    this.createSphere();
    this.createParticles();
  }

  createSphere() {
    const geometry = new THREE.IcosahedronGeometry(10, 3);
    const material = new THREE.MeshLambertMaterial({
      color: 0x00ffff,
      wireframe: false,
    });

    this.sphere = new THREE.Mesh(geometry, material);
    this.addObject(this.sphere);
  }

  createParticles() {
    const particleCount = 1000;
    const geometry = new THREE.BufferGeometry();
    const positions = new Float32Array(particleCount * 3);
    const colors = new Float32Array(particleCount * 3);

    this.originalPositions = new Float32Array(particleCount * 3);

    for (let i = 0; i < particleCount; i++) {
      // Better spherical distribution
      const u = Math.random();
      const v = Math.random();
      const theta = 2 * Math.PI * u;
      const phi = Math.acos(2 * v - 1);
      const radius = 10 + Math.random() * 2;

      const x = radius * Math.sin(phi) * Math.cos(theta);
      const y = radius * Math.sin(phi) * Math.sin(theta);
      const z = radius * Math.cos(phi);

      positions.set([x, y, z], i * 3);
      this.originalPositions.set([x, y, z], i * 3);

      // Dynamic colors
      const hue = (i / particleCount) * 360;
      const color = new THREE.Color().setHSL(hue / 360, 1, 0.5);
      colors.set([color.r, color.g, color.b], i * 3);
    }

    geometry.setAttribute("position", new THREE.BufferAttribute(positions, 3));
    geometry.setAttribute("color", new THREE.BufferAttribute(colors, 3));
    geometry.setAttribute(
      "originalPosition",
      new THREE.BufferAttribute(this.originalPositions, 3)
    );

    const material = new THREE.PointsMaterial({
      size: 1,
      vertexColors: true,
      transparent: true,
      opacity: 0.8,
      blending: THREE.AdditiveBlending,
    });

    this.particleSystem = new THREE.Points(geometry, material);
    this.addObject(this.particleSystem);
  }

  animate() {
    const frequencyData = this.audioManager.getFrequencyData();
    const bands = this.audioManager.getFrequencyBands();

    if (!frequencyData || !this.sphere || !this.particleSystem) return;

    // Animate sphere
    this.animateSphere(bands);

    // Animate particles
    this.animateParticles(frequencyData, bands);
  }

  animateSphere(bands) {
    // Scale based on bass
    const bassScale = 1 + (bands.bass / 255) * 2;
    this.sphere.scale.set(bassScale, bassScale, bassScale);

    // Color based on frequency bands
    const color = new THREE.Color();
    color.setRGB(bands.bass / 255, bands.mid / 255, bands.treble / 255);
    this.sphere.material.color = color;

    // Rotation
    this.sphere.rotation.x += 0.01;
    this.sphere.rotation.y += 0.01;

    // Position oscillation
    this.sphere.position.y =
      Math.sin(Date.now() * 0.001) * (bands.bass / 255) * 10;
  }

  animateParticles(frequencyData, bands) {
    const positions = this.particleSystem.geometry.attributes.position.array;
    const originalPositions = this.originalPositions;
    const particleCount = positions.length / 3;

    // Check if loud
    const isLoud = this.average(frequencyData) > 100;

    if (isLoud) {
      // Disperse particles
      for (let i = 0; i < particleCount; i++) {
        const audioInfluence = frequencyData[i % frequencyData.length] / 255;
        const dispersal = audioInfluence * 20;

        positions[i * 3] += (Math.random() - 0.5) * dispersal;
        positions[i * 3 + 1] += (Math.random() - 0.5) * dispersal;
        positions[i * 3 + 2] += (Math.random() - 0.5) * dispersal;
      }
    } else {
      // Return to original positions
      for (let i = 0; i < particleCount; i++) {
        const lerpFactor = 0.05;
        positions[i * 3] +=
          (originalPositions[i * 3] - positions[i * 3]) * lerpFactor;
        positions[i * 3 + 1] +=
          (originalPositions[i * 3 + 1] - positions[i * 3 + 1]) * lerpFactor;
        positions[i * 3 + 2] +=
          (originalPositions[i * 3 + 2] - positions[i * 3 + 2]) * lerpFactor;
      }
    }

    // Update particle sizes
    const sizes = new Float32Array(particleCount);
    for (let i = 0; i < particleCount; i++) {
      const audioInfluence = frequencyData[i % frequencyData.length] / 255;
      sizes[i] = 1 + audioInfluence * 3;
    }

    this.particleSystem.geometry.setAttribute(
      "size",
      new THREE.BufferAttribute(sizes, 1)
    );
    this.particleSystem.geometry.attributes.position.needsUpdate = true;
  }
}
