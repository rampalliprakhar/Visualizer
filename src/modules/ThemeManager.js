export class ThemeManager {
  constructor() {
    this.themes = {
      DEFAULT: "default",
      NEON: "neon",
      FIRE: "fire",
      OCEAN: "ocean",
      SUNSET: "sunset",
      RAINBOW: "rainbow",
    };

    this.currentTheme = this.themes.NEON;
    this.themeConfigs = this.initThemeConfigs();
  }

  init() {
    this.applyTheme(this.currentTheme);
  }

  initThemeConfigs() {
    return {
      [this.themes.DEFAULT]: {
        backgroundColor: "#ffffff",
        particleColor: "#ff0000",
        sceneBackground: 0xffffff,
        cssClass: "theme-default",
      },
      [this.themes.NEON]: {
        backgroundColor: "#000011",
        particleColor: "#00ffff",
        sceneBackground: 0x000011,
        cssClass: "theme-neon",
      },
      [this.themes.FIRE]: {
        backgroundColor: "#330000",
        particleColor: "#ff4400",
        sceneBackground: 0x330000,
        cssClass: "theme-fire",
      },
      [this.themes.OCEAN]: {
        backgroundColor: "#001133",
        particleColor: "#0088ff",
        sceneBackground: 0x001133,
        cssClass: "theme-ocean",
      },
      [this.themes.SUNSET]: {
        backgroundColor: "#332200",
        particleColor: "#ff8800",
        sceneBackground: 0x332200,
        cssClass: "theme-sunset",
      },
      [this.themes.RAINBOW]: {
        backgroundColor: "#000000",
        particleColor: "#ffffff",
        sceneBackground: 0x000000,
        cssClass: "theme-rainbow",
      },
    };
  }

  applyTheme(themeName) {
    const config = this.themeConfigs[themeName];
    if (!config) return;

    // Apply CSS class
    document.body.className = config.cssClass;

    // Dispatch theme change event
    window.dispatchEvent(
      new CustomEvent("themeChanged", {
        detail: {
          theme: themeName,
          config: config,
        },
      })
    );

    this.currentTheme = themeName;
  }

  getCurrentTheme() {
    return this.currentTheme;
  }

  getThemeConfig(themeName = this.currentTheme) {
    return this.themeConfigs[themeName];
  }

  getAllThemes() {
    return this.themes;
  }

  destroy() {
    document.body.className = "";
  }
}
