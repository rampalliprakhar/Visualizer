import { AudioManager } from "./modules/AudioManager.js";
import { SceneManager } from "./modules/SceneManager.js";
import { VisualizationManager } from "./modules/VisualizationManager.js";
import { UIManager } from "./modules/UIManager.js";
import { ThemeManager } from "./modules/ThemeManager.js";
import { EffectsManager } from "./modules/EffectsManager.js";

class AdvancedVisualizer {
  constructor() {
    this.audioManager = null;
    this.sceneManager = null;
    this.visualizationManager = null;
    this.uiManager = null;
    this.themeManager = null;
    this.effectsManager = null;

    this.isInitialized = false;
    this.animationId = null;
  }

  async init() {
    try {
      console.log("Starting visualizer initialization...");

      // Initialize core managers
      this.audioManager = new AudioManager();
      this.sceneManager = new SceneManager();
      this.themeManager = new ThemeManager();
      this.effectsManager = new EffectsManager();

      console.log("Managers created, initializing...");

      // Initialize managers that do not depend on others
      await this.audioManager.init();
      console.log("Audio manager initialized");

      this.sceneManager.init();
      console.log("Scene manager initialized");

      this.themeManager.init();
      console.log("Theme manager initialized");

      // Initialize managers that depend on others
      this.visualizationManager = new VisualizationManager(
        this.sceneManager,
        this.audioManager,
        this.effectsManager
      );
      this.visualizationManager.init();
      console.log("Visualization manager initialized");

      this.effectsManager.init(this.sceneManager.getScene());
      console.log("Effects manager initialized");

      this.uiManager = new UIManager(
        this.audioManager,
        this.visualizationManager,
        this.themeManager,
        this.effectsManager
      );
      this.uiManager.init();
      console.log("UI manager initialized");

      // Setup event listeners
      this.setupEventListeners();

      this.isInitialized = true;
      this.startAnimation();

      // Hide loading screen
      this.hideLoading();

      console.log("Advanced Visualizer initialized successfully");
    } catch (error) {
      console.error("Failed to initialize visualizer:", error);
      this.hideLoading();
      this.showError(error.message);
    }
  }

  setupEventListeners() {
    // Window resize
    window.addEventListener("resize", () => {
      if (this.sceneManager) {
        this.sceneManager.handleResize();
      }
    });

    // File input - only set up once
    const fileInput = document.getElementById("mainFile");
    if (fileInput) {
      fileInput.addEventListener("change", (event) => {
        this.handleFileChange(event);
      });
    }

    // Audio element events
    const audio = document.getElementById("audio");
    if (audio) {
      audio.addEventListener("play", () => {
        if (this.audioManager) {
          this.audioManager.resume();
        }
      });

      audio.addEventListener("pause", () => {
        if (this.audioManager) {
          this.audioManager.suspend();
        }
      });
    }
  }

  handleFileChange(event) {
    if (this.audioManager) {
      this.audioManager.handleFileChange(event);
    }
  }

  startAnimation() {
    if (!this.isInitialized) return;

    const animate = () => {
      this.animationId = requestAnimationFrame(animate);

      try {
        // Update all systems
        if (this.audioManager) this.audioManager.update();
        if (this.effectsManager) this.effectsManager.update();
        if (this.visualizationManager) this.visualizationManager.update();
        if (this.uiManager) this.uiManager.update();

        // Render scene
        if (this.sceneManager) this.sceneManager.render();
      } catch (error) {
        console.error("Animation loop error:", error);
      }
    };

    animate();
  }

  hideLoading() {
    const loading = document.getElementById("loading");
    if (loading) {
      loading.style.display = "none";
    }
  }

  showError(message) {
    const loading = document.getElementById("loading");
    if (loading) {
      loading.innerHTML = `
                <div style="color: red; text-align: center;">
                    <h2>Error</h2>
                    <p>${message}</p>
                    <button onclick="location.reload()" style="padding: 10px 20px; margin-top: 10px;">Reload</button>
                </div>
            `;
    }
  }

  stop() {
    if (this.animationId) {
      cancelAnimationFrame(this.animationId);
      this.animationId = null;
    }
  }

  destroy() {
    this.stop();

    // Cleanup all managers
    if (this.audioManager) this.audioManager.destroy();
    if (this.sceneManager) this.sceneManager.destroy();
    if (this.visualizationManager) this.visualizationManager.destroy();
    if (this.uiManager) this.uiManager.destroy();
    if (this.themeManager) this.themeManager.destroy();
    if (this.effectsManager) this.effectsManager.destroy();
  }
}

// Initialize when page loads
window.addEventListener("load", async () => {
  console.log("Page loaded, initializing visualizer...");
  const visualizer = new AdvancedVisualizer();
  await visualizer.init();

  // Make it globally accessible for debugging
  window.visualizer = visualizer;
});
