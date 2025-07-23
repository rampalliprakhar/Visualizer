import { BaseVisualization } from "./BaseVisualization.js";

export class Waveform extends BaseVisualization {
  constructor(scene, audioManager) {
    super(scene, audioManager);
    this.waveformLine = null;
    this.waveformPoints = 512;
  }

  create() {
    const geometry = new THREE.BufferGeometry();
    const positions = new Float32Array(this.waveformPoints * 3);

    // Initialize positions
    for (let i = 0; i < this.waveformPoints; i++) {
      positions[i * 3] = (i - this.waveformPoints / 2) * 0.5;
      positions[i * 3 + 1] = 0;
      positions[i * 3 + 2] = 0;
    }

    geometry.setAttribute("position", new THREE.BufferAttribute(positions, 3));

    const material = new THREE.LineBasicMaterial({
      color: 0x00ff00,
      transparent: true,
      opacity: 0.8,
      linewidth: 2,
    });

    this.waveformLine = new THREE.Line(geometry, material);
    this.addObject(this.waveformLine);
  }

  animate() {
    const frequencyData = this.audioManager.getFrequencyData();
    if (!frequencyData || !this.waveformLine) return;

    const positions = this.waveformLine.geometry.attributes.position.array;

    for (let i = 0; i < this.waveformPoints; i++) {
      const dataIndex = Math.floor(
        this.mapRange(i, 0, this.waveformPoints, 0, frequencyData.length)
      );
      const amplitude = this.mapRange(
        frequencyData[dataIndex],
        0,
        255,
        -20,
        20
      );

      positions[i * 3 + 1] = amplitude;
    }

    this.waveformLine.geometry.attributes.position.needsUpdate = true;

    // Color animation
    const time = Date.now() * 0.001;
    this.waveformLine.material.color.setHSL((time * 0.1) % 1, 1, 0.5);

    // Rotation
    this.waveformLine.rotation.z += 0.005;
  }
}
