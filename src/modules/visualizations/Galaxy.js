import { BaseVisualization } from "./BaseVisualization.js";

export class Galaxy extends BaseVisualization {
  constructor(scene, audioManager) {
    super(scene, audioManager);
    this.galaxySystem = null;
    this.starCount = 2500;
    this.centerSphere = null;
    this.originalPositions = null;
  }

  create() {
    this.createCenterSphere();
    this.createGalaxyStars();
  }

  createCenterSphere() {
    // Create a glowing center sphere - smaller size
    const geometry = new THREE.SphereGeometry(2, 32, 32);
    const material = new THREE.MeshBasicMaterial({
      color: 0xffaa00,
      transparent: true,
      opacity: 0.9,
    });

    this.centerSphere = new THREE.Mesh(geometry, material);
    this.addObject(this.centerSphere);
  }

  createGalaxyStars() {
    const geometry = new THREE.BufferGeometry();
    const positions = new Float32Array(this.starCount * 3);
    const colors = new Float32Array(this.starCount * 3);
    const sizes = new Float32Array(this.starCount);

    // Store original positions for animation
    this.originalPositions = new Float32Array(this.starCount * 3);

    for (let i = 0; i < this.starCount; i++) {
      // Create spiral galaxy distribution - adjusted scale
      // 4 spiral arms
      const armIndex = i % 4; 
      const armAngle =
        armIndex * Math.PI * 0.5 + (i / this.starCount) * Math.PI * 6;
      // Reduced radius
      const radius = (i / this.starCount) * 80 + Math.random() * 15; 
      // Reduced height
      const height = (Math.random() - 0.5) * 8; 

      // Add some randomness for more natural look
      const randomOffset = (Math.random() - 0.5) * 6;

      const x = Math.cos(armAngle) * (radius + randomOffset);
      const y = height;
      const z = Math.sin(armAngle) * (radius + randomOffset);

      positions[i * 3] = x;
      positions[i * 3 + 1] = y;
      positions[i * 3 + 2] = z;

      // Store original positions
      this.originalPositions[i * 3] = x;
      this.originalPositions[i * 3 + 1] = y;
      this.originalPositions[i * 3 + 2] = z;

      // Color based on distance from center and arm
      const distanceFromCenter = radius / 80;
      const color = new THREE.Color();

      // Different colors for different arms
      if (armIndex === 0) {
        color.setHSL(
          0.6 - distanceFromCenter * 0.2,
          1,
          0.5 + distanceFromCenter * 0.5
        ); // Blue to cyan
      } else if (armIndex === 1) {
        color.setHSL(
          0.8 - distanceFromCenter * 0.2,
          1,
          0.5 + distanceFromCenter * 0.5
        ); // Purple to magenta
      } else if (armIndex === 2) {
        color.setHSL(
          0.1 + distanceFromCenter * 0.2,
          1,
          0.5 + distanceFromCenter * 0.5
        ); // Orange to yellow
      } else {
        color.setHSL(
          0.3 - distanceFromCenter * 0.2,
          1,
          0.5 + distanceFromCenter * 0.5
        ); // Green to cyan
      }

      colors[i * 3] = color.r;
      colors[i * 3 + 1] = color.g;
      colors[i * 3 + 2] = color.b;

      sizes[i] = Math.random() * 2 + 0.3;
    }

    geometry.setAttribute("position", new THREE.BufferAttribute(positions, 3));
    geometry.setAttribute("color", new THREE.BufferAttribute(colors, 3));
    geometry.setAttribute("size", new THREE.BufferAttribute(sizes, 1));

    const material = new THREE.PointsMaterial({
      size: 1.5, // Reduced size
      vertexColors: true,
      transparent: true,
      opacity: 0.8,
      blending: THREE.AdditiveBlending,
      sizeAttenuation: true,
    });

    this.galaxySystem = new THREE.Points(geometry, material);
    this.addObject(this.galaxySystem);
  }

  animate() {
    const frequencyData = this.audioManager.getFrequencyData();
    const bands = this.audioManager.getFrequencyBands();

    if (!frequencyData || !this.galaxySystem) return;

    // Rotate galaxy based on audio - slower rotation
    const rotationSpeed = 0.001 + (bands.bass / 255) * 0.008;
    this.galaxySystem.rotation.y += rotationSpeed;

    // Counter-rotate center sphere
    if (this.centerSphere) {
      this.centerSphere.rotation.y -= rotationSpeed * 1.5;

      // Scale center sphere with bass - reduced scaling
      const scale = 1 + (bands.bass / 255) * 1.5;
      this.centerSphere.scale.set(scale, scale, scale);

      // Change center color based on audio
      const color = new THREE.Color();
      color.setRGB(
        0.8 + (bands.treble / 255) * 0.2,
        0.4 + (bands.mid / 255) * 0.6,
        0.1 + (bands.bass / 255) * 0.4
      );
      this.centerSphere.material.color = color;
    }

    // Update star sizes and positions based on frequency
    const positions = this.galaxySystem.geometry.attributes.position.array;
    const sizes = this.galaxySystem.geometry.attributes.size.array;

    for (let i = 0; i < this.starCount; i++) {
      const audioIndex = i % frequencyData.length;
      const audioInfluence = frequencyData[audioIndex] / 255;

      // Pulsate stars based on audio - reduced pulsation
      sizes[i] = 0.3 + audioInfluence * 2.5;

      // Add slight movement based on audio - reduced movement
      const time = Date.now() * 0.0008;
      const movement = audioInfluence * 1.2;

      positions[i * 3] =
        this.originalPositions[i * 3] + Math.sin(time + i * 0.008) * movement;
      positions[i * 3 + 1] =
        this.originalPositions[i * 3 + 1] +
        Math.cos(time + i * 0.008) * movement;
      positions[i * 3 + 2] =
        this.originalPositions[i * 3 + 2] +
        Math.sin(time * 0.4 + i * 0.008) * movement;
    }

    this.galaxySystem.geometry.attributes.size.needsUpdate = true;
    this.galaxySystem.geometry.attributes.position.needsUpdate = true;
  }
}
