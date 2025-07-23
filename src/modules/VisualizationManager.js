import { SphereParticles } from "./visualizations/SphereParticles.js";
import { SpectrumBars } from "./visualizations/SpectrumBars.js";
import { Waveform } from "./visualizations/Waveform.js";
import { Galaxy } from "./visualizations/Galaxy.js";
import { Tunnel } from "./visualizations/Tunnel.js";

export class VisualizationManager {
  constructor(sceneManager, audioManager, effectsManager) {
    this.sceneManager = sceneManager;
    this.audioManager = audioManager;
    this.effectsManager = effectsManager;

    this.visualizations = new Map();
    this.currentVisualization = "galaxy";


    this.modes = {
      GALAXY: "galaxy",
      SPECTRUM_BARS: "spectrum_bars",
      TUNNEL: "tunnel",
      WAVEFORM: "waveform",
      SPHERE_PARTICLES: "sphere_particles",
    };
  }

  init() {
    const scene = this.sceneManager.getScene();

    // Initialize all visualizations
    this.visualizations.set(
      this.modes.GALAXY,
      new Galaxy(scene, this.audioManager)
    );
    this.visualizations.set(
      this.modes.SPECTRUM_BARS,
      new SpectrumBars(scene, this.audioManager)
    );
    this.visualizations.set(
      this.modes.TUNNEL,
      new Tunnel(scene, this.audioManager)
    );
    this.visualizations.set(
      this.modes.WAVEFORM,
      new Waveform(scene, this.audioManager)
    );
    this.visualizations.set(
      this.modes.SPHERE_PARTICLES,
      new SphereParticles(scene, this.audioManager)
    );

    // Initialize all visualizations
    this.visualizations.forEach((viz) => viz.init());

    // Set initial visualization to Galaxy
    this.switchVisualization(this.currentVisualization);
  }

  switchVisualization(mode) {
    // Hide all visualizations
    this.visualizations.forEach((viz) => viz.hide());

    // Show selected visualization
    const visualization = this.visualizations.get(mode);
    if (visualization) {
      visualization.show();
      this.currentVisualization = mode;
      console.log(`Switched to visualization: ${mode}`);
    }
  }

  update() {
    // Update current visualization
    const currentViz = this.visualizations.get(this.currentVisualization);
    if (currentViz) {
      currentViz.update();
    }
  }

  getCurrentVisualization() {
    return this.visualizations.get(this.currentVisualization);
  }

  getAllModes() {
    return this.modes;
  }

  destroy() {
    this.visualizations.forEach((viz) => viz.destroy());
    this.visualizations.clear();
  }
}
