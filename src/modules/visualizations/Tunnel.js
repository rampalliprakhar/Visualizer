import { BaseVisualization } from "./BaseVisualization.js";

export class Tunnel extends BaseVisualization {
  constructor(scene, audioManager) {
    super(scene, audioManager);
    this.tunnelRings = [];
    this.ringCount = 20;
    this.particlesPerRing = 50;
  }

  create() {
    for (let ring = 0; ring < this.ringCount; ring++) {
      const ringGeometry = new THREE.BufferGeometry();
      const positions = new Float32Array(this.particlesPerRing * 3);
      const colors = new Float32Array(this.particlesPerRing * 3);

      const z = ring * 10 - 100;
      const radius = 20 + ring * 2;

      for (let i = 0; i < this.particlesPerRing; i++) {
        const angle = (i / this.particlesPerRing) * Math.PI * 2;

        positions[i * 3] = Math.cos(angle) * radius;
        positions[i * 3 + 1] = Math.sin(angle) * radius;
        positions[i * 3 + 2] = z;

        // Color based on ring position
        const hue = ring / this.ringCount;
        const color = new THREE.Color().setHSL(hue, 1, 0.5);
        colors[i * 3] = color.r;
        colors[i * 3 + 1] = color.g;
        colors[i * 3 + 2] = color.b;
      }

      ringGeometry.setAttribute(
        "position",
        new THREE.BufferAttribute(positions, 3)
      );
      ringGeometry.setAttribute("color", new THREE.BufferAttribute(colors, 3));

      const material = new THREE.PointsMaterial({
        size: 2,
        vertexColors: true,
        transparent: true,
        opacity: 0.8,
        blending: THREE.AdditiveBlending,
      });

      const ringSystem = new THREE.Points(ringGeometry, material);
      this.tunnelRings.push(ringSystem);
      this.addObject(ringSystem);
    }
  }

  animate() {
    const frequencyData = this.audioManager.getFrequencyData();
    const bands = this.audioManager.getFrequencyBands();

    if (!frequencyData) return;

    this.tunnelRings.forEach((ring, ringIndex) => {
      const positions = ring.geometry.attributes.position.array;

      // Move tunnel forward
      const speed = 0.5 + (bands.bass / 255) * 2;

      for (let i = 0; i < this.particlesPerRing; i++) {
        positions[i * 3 + 2] += speed;

        // Reset ring when it passes camera
        if (positions[i * 3 + 2] > 50) {
          positions[i * 3 + 2] = -100;
        }

        // Audio-reactive radius
        const audioIndex = (ringIndex + i) % frequencyData.length;
        const audioInfluence = frequencyData[audioIndex] / 255;
        const baseRadius = 20 + ringIndex * 2;
        const newRadius = baseRadius + audioInfluence * 10;

        const angle = (i / this.particlesPerRing) * Math.PI * 2;
        positions[i * 3] = Math.cos(angle) * newRadius;
        positions[i * 3 + 1] = Math.sin(angle) * newRadius;
      }

      ring.geometry.attributes.position.needsUpdate = true;

      // Rotate rings
      ring.rotation.z += 0.01 + (bands.treble / 255) * 0.05;
    });
  }
}
