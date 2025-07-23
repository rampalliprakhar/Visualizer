export class AudioManager {
  constructor() {
    this.context = null;
    this.analyser = null;
    this.dataArray = null;
    this.audio = null;
    this.source = null;
    this.isSourceConnected = false;

    this.frequencyBands = {
      bass: 0,
      mid: 0,
      treble: 0,
    };

    this.beatHistory = [];
    this.lastBeatTime = 0;
    this.beatSensitivity = 1.5;
  }

  async init() {
    try {
      this.audio = document.getElementById("audio");
      if (!this.audio) {
        throw new Error("Audio element not found");
      }

      this.context = new (window.AudioContext || window.webkitAudioContext)();
      await this.unlockAudioContext();

      this.analyser = this.context.createAnalyser();
      this.analyser.fftSize = 1024;
      this.analyser.smoothingTimeConstant = 0.8;

      const bufferLength = this.analyser.frequencyBinCount;
      this.dataArray = new Uint8Array(bufferLength);

      // Connect audio source immediately
      this.connectAudioSource();

      console.log("Audio manager initialized successfully");
    } catch (error) {
      console.error("Audio initialization error:", error);
      throw error;
    }
  }

  async unlockAudioContext() {
    if (this.context.state !== "suspended") return;

    const events = ["touchstart", "touchend", "mousedown", "keydown"];
    const unlock = () => {
      this.context.resume().then(() => {
        events.forEach((event) =>
          document.body.removeEventListener(event, unlock)
        );
      });
    };

    events.forEach((event) =>
      document.body.addEventListener(event, unlock, false)
    );
  }

  connectAudioSource() {
    try {
      if (!this.isSourceConnected) {
        this.source = this.context.createMediaElementSource(this.audio);
        this.source.connect(this.analyser);
        this.analyser.connect(this.context.destination);
        this.isSourceConnected = true;
        console.log("Audio source connected successfully");
      }
    } catch (error) {
      console.error("Audio source connection error:", error);
      if (error.name === "InvalidStateError") {
        this.isSourceConnected = true;
        console.log("Audio source was already connected");
      }
    }
  }

  handleFileChange(event) {
    const files = event.target.files;
    if (files.length > 0) {
      try {
        // Pause current audio
        this.audio.pause();

        // Create new URL and set as source
        if (this.audio.src) {
          URL.revokeObjectURL(this.audio.src);
        }

        this.audio.src = URL.createObjectURL(files[0]);
        this.audio.load();

        // Update UI
        const label = document.querySelector("label.file");
        if (label) {
          label.textContent = `Playing: ${files[0].name}`;
        }

        // Play the new audio
        this.audio.play().catch((error) => {
          console.error("Play error:", error);
          // Try to resume context and play again
          this.context.resume().then(() => {
            this.audio.play().catch(console.error);
          });
        });
      } catch (error) {
        console.error("File handling error:", error);
      }
    }
  }

  update() {
    if (!this.analyser || !this.dataArray) return;

    try {
      this.analyser.getByteFrequencyData(this.dataArray);
      this.analyzeFrequencyBands();
      this.detectBeat();
    } catch (error) {
      console.error("Audio update error:", error);
    }
  }

  analyzeFrequencyBands() {
    const bassEnd = Math.floor(this.dataArray.length * 0.1);
    const midEnd = Math.floor(this.dataArray.length * 0.4);

    const bassArray = this.dataArray.slice(0, bassEnd);
    const midArray = this.dataArray.slice(bassEnd, midEnd);
    const trebleArray = this.dataArray.slice(midEnd);

    this.frequencyBands.bass = this.average(bassArray);
    this.frequencyBands.mid = this.average(midArray);
    this.frequencyBands.treble = this.average(trebleArray);
  }

  detectBeat() {
    const currentEnergy = this.average(this.dataArray);
    this.beatHistory.push(currentEnergy);

    if (this.beatHistory.length > 43) {
      this.beatHistory.shift();
    }

    const avgEnergy = this.average(this.beatHistory);
    const isBeat = currentEnergy > avgEnergy * this.beatSensitivity;

    if (isBeat && Date.now() - this.lastBeatTime > 200) {
      this.lastBeatTime = Date.now();
      this.triggerBeatEvent();
      return true;
    }

    return false;
  }

  triggerBeatEvent() {
    window.dispatchEvent(
      new CustomEvent("beatDetected", {
        detail: {
          energy: this.average(this.dataArray),
          bands: this.frequencyBands,
        },
      })
    );
  }

  average(array) {
    if (!array || array.length === 0) return 0;
    return array.reduce((sum, value) => sum + value, 0) / array.length;
  }

  getFrequencyData() {
    return this.dataArray;
  }

  getFrequencyBands() {
    return this.frequencyBands;
  }

  setBeatSensitivity(sensitivity) {
    this.beatSensitivity = sensitivity;
  }

  resume() {
    if (this.context && this.context.state === "suspended") {
      this.context.resume();
    }
  }

  suspend() {
    if (this.context && this.context.state === "running") {
      this.context.suspend();
    }
  }

  destroy() {
    if (this.source) {
      this.source.disconnect();
    }
    if (this.context) {
      this.context.close();
    }
    this.isSourceConnected = false;
  }
}
