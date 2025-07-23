export class SceneManager {
  constructor() {
    this.scene = null;
    this.camera = null;
    this.renderer = null;
    this.container = null;
  }

  init() {
    try {
      this.container = document.getElementById("execute");
      if (!this.container) {
        throw new Error("Container element #execute not found");
      }

      this.createScene();
      this.createCamera();
      this.createRenderer();
      this.createLighting();

      console.log("Scene initialized successfully");
    } catch (error) {
      console.error("Scene initialization error:", error);
      throw error;
    }
  }

  createScene() {
    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(0x000011);
  }

  createCamera() {
    const fov = window.innerWidth < 768 ? 75 : 60; 
    const aspect = window.innerWidth / window.innerHeight;
    const near = 0.1;
    const far = 2000; 

    this.camera = new THREE.PerspectiveCamera(fov, aspect, near, far);

    // Increased camera distance for galaxy view
    const distance = window.innerWidth < 768 ? 300 : 250;
    this.camera.position.set(0, 50, distance);
    this.camera.lookAt(0, 0, 0);

    this.scene.add(this.camera);
  }

  createRenderer() {
    this.renderer = new THREE.WebGLRenderer({
      alpha: true,
      antialias: true,
      powerPreference: "high-performance",
    });

    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    this.renderer.setSize(window.innerWidth, window.innerHeight);
    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;

    this.container.appendChild(this.renderer.domElement);
  }

  createLighting() {
    // Ambient light
    const ambientLight = new THREE.AmbientLight(0x404040, 0.4);
    this.scene.add(ambientLight);

    // Directional light
    const directionalLight = new THREE.DirectionalLight(0xffffff, 0.6);
    directionalLight.position.set(10, 10, 5);
    directionalLight.castShadow = true;
    this.scene.add(directionalLight);

    // Point lights for dynamic effects
    const pointLight1 = new THREE.PointLight(0x00ffff, 0.8, 200);
    pointLight1.position.set(100, 100, 100);
    this.scene.add(pointLight1);

    const pointLight2 = new THREE.PointLight(0xff00ff, 0.8, 200);
    pointLight2.position.set(-100, -100, 100);
    this.scene.add(pointLight2);
  }

  handleResize() {
    if (!this.camera || !this.renderer) return;

    // Update camera
    this.camera.aspect = window.innerWidth / window.innerHeight;
    this.camera.fov = window.innerWidth < 768 ? 75 : 60;

    const distance = window.innerWidth < 768 ? 300 : 250;
    this.camera.position.z = distance;
    this.camera.position.y = 50;

    this.camera.updateProjectionMatrix();

    // Update renderer
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    this.renderer.setSize(window.innerWidth, window.innerHeight);
  }

  render() {
    if (this.renderer && this.scene && this.camera) {
      this.renderer.render(this.scene, this.camera);
    }
  }

  getScene() {
    return this.scene;
  }

  getCamera() {
    return this.camera;
  }

  getRenderer() {
    return this.renderer;
  }

  destroy() {
    if (this.renderer) {
      this.renderer.dispose();
      if (this.container && this.renderer.domElement) {
        this.container.removeChild(this.renderer.domElement);
      }
    }
  }
}
