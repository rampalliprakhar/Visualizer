import { BaseVisualization } from "./BaseVisualization.js";

export class SpectrumBars extends BaseVisualization {
  constructor(scene, audioManager) {
    super(scene, audioManager);
    this.bars = [];
    this.barCount = 64;
  }

  create() {
    for (let i = 0; i < this.barCount; i++) {
      const geometry = new THREE.BoxGeometry(2, 1, 2);

      // Color based on frequency
      const hue = i / this.barCount;
      const material = new THREE.MeshLambertMaterial({
        color: new THREE.Color().setHSL(hue, 1, 0.5),
        transparent: true,
        opacity: 0.8,
      });

      const bar = new THREE.Mesh(geometry, material);
      bar.position.x = (i - this.barCount / 2) * 3;
      bar.position.y = -30;
      bar.position.z = 0;

      this.bars.push(bar);
      this.addObject(bar);
    }
  }

  animate() {
    const frequencyData = this.audioManager.getFrequencyData();
    if (!frequencyData) return;

    this.bars.forEach((bar, index) => {
      // Map frequency data to bar height
      const dataIndex = Math.floor(
        this.mapRange(index, 0, this.barCount, 0, frequencyData.length)
      );
      const height = this.mapRange(frequencyData[dataIndex], 0, 255, 1, 50);

      // Animate height
      bar.scale.y = height;
      bar.position.y = -30 + height / 2;

      // Color animation
      const hue = (index / this.barCount + Date.now() * 0.0001) % 1;
      bar.material.color.setHSL(hue, 1, 0.5);

      // Rotation
      bar.rotation.y += 0.01;
    });
  }
}
