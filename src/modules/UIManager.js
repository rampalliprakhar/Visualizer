export class UIManager {
  constructor(
    audioManager,
    visualizationManager,
    themeManager,
    effectsManager
  ) {
    this.audioManager = audioManager;
    this.visualizationManager = visualizationManager;
    this.themeManager = themeManager;
    this.effectsManager = effectsManager;

    this.gui = null;
    this.params = this.initParams();
    // Will be set when needed
    this.sceneManager = null;
  }

  init() {
    this.setupGUI();
    this.setupFrequencyBandsUI();

    // Get scene manager reference
    this.sceneManager = this.visualizationManager.sceneManager;

    // Listen for theme changes
    window.addEventListener("themeChanged", (event) => {
      this.updateThemeUI(event.detail);
    });

    // Load saved preferences
    this.loadPreferences();
  }

  initParams() {
    return {
      // Visualization - changed default to galaxy
      visualMode: this.getStoredVisualizationMode() || "galaxy",
      colorTheme: "neon",
      defaultVisualization: this.getStoredVisualizationMode() || "galaxy",

      // Camera
      cameraDistance: 250,
      cameraHeight: 50,

      // Audio
      beatSensitivity: 1.5,
      bassBoost: 1,
      midBoost: 1,
      trebleBoost: 1,

      // Effects
      trailLength: 50,
      trailOpacity: 0.7,
      particleSize: 1,
      rotationSpeed: 0.01,

      // Functions
      reset: () => this.resetParameters(),
      switchTheme: () => this.switchTheme(),
      savePreferences: () => this.savePreferences(),
    };
  }

  setupGUI() {
    this.gui = new dat.GUI();

    // Visualization folder
    const vizFolder = this.gui.addFolder("Visualization");
    vizFolder
      .add(
        this.params,
        "visualMode",
        Object.values(this.visualizationManager.getAllModes())
      )
      .name("Current Mode")
      .onChange((value) => {
        this.visualizationManager.switchVisualization(value);
      });

    vizFolder
      .add(
        this.params,
        "defaultVisualization",
        Object.values(this.visualizationManager.getAllModes())
      )
      .name("Default Mode")
      .onChange((value) => {
        this.setDefaultVisualization(value);
      });

    vizFolder
      .add(
        this.params,
        "colorTheme",
        Object.values(this.themeManager.getAllThemes())
      )
      .name("Theme")
      .onChange((value) => {
        this.themeManager.applyTheme(value);
      });

    // Camera folder
    const cameraFolder = this.gui.addFolder("Camera");
    cameraFolder
      .add(this.params, "cameraDistance", 100, 500)
      .name("Distance")
      .onChange((value) => {
        this.updateCameraPosition();
      });

    cameraFolder
      .add(this.params, "cameraHeight", -100, 200)
      .name("Height")
      .onChange((value) => {
        this.updateCameraPosition();
      });

    // Audio folder
    const audioFolder = this.gui.addFolder("Audio");
    audioFolder
      .add(this.params, "beatSensitivity", 0.5, 3)
      .name("Beat Sensitivity")
      .onChange((value) => {
        this.audioManager.setBeatSensitivity(value);
      });

    audioFolder.add(this.params, "bassBoost", 0.1, 3).name("Bass Boost");
    audioFolder.add(this.params, "midBoost", 0.1, 3).name("Mid Boost");
    audioFolder.add(this.params, "trebleBoost", 0.1, 3).name("Treble Boost");

    // Effects folder
    const effectsFolder = this.gui.addFolder("Effects");
    effectsFolder.add(this.params, "trailLength", 10, 100).name("Trail Length");
    effectsFolder
      .add(this.params, "trailOpacity", 0.1, 1)
      .name("Trail Opacity");
    effectsFolder
      .add(this.params, "particleSize", 0.1, 5)
      .name("Particle Size");
    effectsFolder
      .add(this.params, "rotationSpeed", 0, 0.1)
      .name("Rotation Speed");

    // Controls
    this.gui.add(this.params, "reset").name("Reset All");
    this.gui.add(this.params, "savePreferences").name("Save Settings");

    // Open folders by default
    vizFolder.open();
    cameraFolder.open();
    audioFolder.open();
  }

  getStoredVisualizationMode() {
    return localStorage.getItem("defaultVisualization");
  }

  setDefaultVisualization(mode) {
    localStorage.setItem("defaultVisualization", mode);
    console.log(`Default visualization set to: ${mode}`);
  }

  loadPreferences() {
    const defaultMode = this.getStoredVisualizationMode();
    if (defaultMode) {
      this.params.visualMode = defaultMode;
      this.params.defaultVisualization = defaultMode;
      this.visualizationManager.switchVisualization(defaultMode);
      this.gui.updateDisplay();
    }
  }

  savePreferences() {
    localStorage.setItem(
      "defaultVisualization",
      this.params.defaultVisualization
    );
    localStorage.setItem("colorTheme", this.params.colorTheme);
    localStorage.setItem("cameraDistance", this.params.cameraDistance);
    localStorage.setItem("cameraHeight", this.params.cameraHeight);
    localStorage.setItem("beatSensitivity", this.params.beatSensitivity);

    console.log("Settings saved successfully!");

    // Show a temporary notification
    this.showNotification("Settings saved!");
  }

  showNotification(message) {
    // Create a simple notification
    const notification = document.createElement("div");
    notification.style.cssText = `
      position: fixed;
      top: 20px;
      right: 20px;
      background: rgba(0, 255, 255, 0.9);
      color: black;
      padding: 10px 20px;
      border-radius: 5px;
      z-index: 10000;
      font-family: Arial, sans-serif;
      font-size: 14px;
    `;
    notification.textContent = message;
    document.body.appendChild(notification);

    // Remove after 2 seconds
    setTimeout(() => {
      if (notification.parentNode) {
        notification.parentNode.removeChild(notification);
      }
    }, 2000);
  }

  updateCameraPosition() {
    if (this.sceneManager && this.sceneManager.camera) {
      const camera = this.sceneManager.camera;
      camera.position.set(
        0,
        this.params.cameraHeight,
        this.params.cameraDistance
      );
      camera.lookAt(0, 0, 0);
    }
  }

  setupFrequencyBandsUI() {
    this.bassFill = document.querySelector(".bass-fill");
    this.midFill = document.querySelector(".mid-fill");
    this.trebleFill = document.querySelector(".treble-fill");
  }

  update() {
    this.updateFrequencyBands();
  }

  updateFrequencyBands() {
    const bands = this.audioManager.getFrequencyBands();

    if (this.bassFill) {
      this.bassFill.style.width = `${(bands.bass / 255) * 100}%`;
    }
    if (this.midFill) {
      this.midFill.style.width = `${(bands.mid / 255) * 100}%`;
    }
    if (this.trebleFill) {
      this.trebleFill.style.width = `${(bands.treble / 255) * 100}%`;
    }
  }

  updateThemeUI(themeData) {
    // Update GUI colors based on theme
    const guiElement = document.querySelector(".dg.main");
    if (guiElement) {
      guiElement.style.background = `rgba(0, 0, 0, 0.8)`;
    }
  }

  resetParameters() {
    // Reset all parameters to defaults
    this.params.beatSensitivity = 1.5;
    this.params.bassBoost = 1;
    this.params.midBoost = 1;
    this.params.trebleBoost = 1;
    this.params.trailLength = 50;
    this.params.trailOpacity = 0.7;
    this.params.particleSize = 1;
    this.params.rotationSpeed = 0.01;
    this.params.cameraDistance = 250;
    this.params.cameraHeight = 50;

    // Update camera position
    this.updateCameraPosition();

    // Update GUI
    this.gui.updateDisplay();

    // Apply changes
    this.audioManager.setBeatSensitivity(this.params.beatSensitivity);
  }

  switchTheme() {
    const themes = Object.values(this.themeManager.getAllThemes());
    const currentIndex = themes.indexOf(this.themeManager.getCurrentTheme());
    const nextIndex = (currentIndex + 1) % themes.length;
    const nextTheme = themes[nextIndex];

    this.themeManager.applyTheme(nextTheme);
    this.params.colorTheme = nextTheme;
    this.gui.updateDisplay();
  }

  destroy() {
    if (this.gui) {
      this.gui.destroy();
    }
  }
}
