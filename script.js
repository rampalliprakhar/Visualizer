// Initialize Simplex Noise function
let noise = new SimplexNoise();

// Main Function for Visualizer
var mainVisual = function() {
    // DOM Elements
    const file = document.getElementById("mainFile");
    const audio = document.getElementById("audio");
    const fileName = document.querySelector("label.file");

    // Audio Context and Analyser
    let context, analyser, dataArray;

    // Three.js Scene
    let scene, camera, renderer, object, particleSystem, particleMaterial;
    let ambientLight, spotLight; // Declare ambientLight and spotLight here

    // GUI Parameters
    const params = {
        sphereScale: 1,
        loudnessThreshold: 200,
        particleSize: 1,
        backgroundColor: '#ffffff',
        particleColor: '#ff0000',
        lightIntensity: 1,
        rotationSpeed: 0.01,
        dispersalSpeed: 5,
        wireframe: false, // Add this line
        reset: resetParameters
    };

    // Initialize the visualizer
    function init() {
        setupAudio();
        setupScene();
        setupGUI();
        file.onchange = fileChangeHandler;
        animate();
    }

    // Audio Context Setup
    function setupAudio() {
        context = new AudioContext();
        const src = context.createMediaElementSource(audio);
        analyser = context.createAnalyser();
        src.connect(analyser);
        analyser.connect(context.destination);
        analyser.fftSize = 512;
        const bufferLength = analyser.frequencyBinCount;
        dataArray = new Uint8Array(bufferLength);
    }

    // Three.js Scene Setup
    function setupScene() {
        // camera
        scene = new THREE.Scene();
        camera = new THREE.PerspectiveCamera(45, window.innerWidth / window.innerHeight, 0.1, 1000);
        camera.position.set(0, 0, 150);
        scene.add(camera);

        // renderer
        renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true });
        renderer.setSize(window.innerWidth, window.innerHeight);
        document.getElementById('execute').appendChild(renderer.domElement);

        // call functions
        createSphere();
        createParticles();
        createLighting();
    }

    // Create Sphere
    function createSphere() {
        const geometry = new THREE.IcosahedronGeometry(10, 3);
        const material = new THREE.MeshLambertMaterial({ color: 0xF3F3F3 });
        object = new THREE.Mesh(geometry, material);
        scene.add(object);
    }

    // Create Particle System
    function createParticles() {
        const particleCount = 1000;
        const particles = new THREE.BufferGeometry();
        const positions = new Float32Array(particleCount * 3);
        const colors = new Float32Array(particleCount * 3);

        for (let i = 0; i < particleCount; i++) {
            // Position particles around the sphere
            const radius = 10; // Same as sphere radius
            const theta = Math.random() * Math.PI * 2; // Random angle
            const phi = Math.acos(Math.random() * 2 - 1); // Random angle for spherical coordinates
            const x = radius * Math.sin(phi) * Math.cos(theta);
            const y = radius * Math.sin(phi) * Math.sin(theta);
            const z = radius * Math.cos(phi);
            positions.set([x, y, z], i * 3);
            colors.set([Math.random(), Math.random(), Math.random()], i * 3);
        }

        particles.setAttribute('position', new THREE.BufferAttribute(positions, 3));
        particles.setAttribute('color', new THREE.BufferAttribute(colors, 3));

        particleMaterial = new THREE.PointsMaterial({
            size: params.particleSize,
            vertexColors: true,
            transparent: true,
            opacity: 0.7,
        });

        particleSystem = new THREE.Points(particles, particleMaterial);
        scene.add(particleSystem);
    }

    // Create Lighting
    function createLighting() {
        ambientLight = new THREE.AmbientLight(0xaaaaaa, 1); // Initialize ambientLight
        scene.add(ambientLight);
        spotLight = new THREE.SpotLight(0xffffff); // Initialize spotLight
        spotLight.position.set(-10, 40, 20);
        scene.add(spotLight);
    }

    // GUI Setup
    function setupGUI() {
        const gui = new dat.GUI();
        gui.add(params, 'sphereScale', 0.1, 5).name('Sphere Scale').onChange(updateSphereScale);
        gui.add(params, 'loudnessThreshold', 0, 255).name('Loudness Threshold');
        gui.add(params, 'particleSize', 0.1, 5).name('Particle Size').onChange(updateParticleSize);
        gui.addColor(params, 'backgroundColor').name('Background Color').onChange(updateBackgroundColor);
        gui.addColor(params, 'particleColor').name('Particle Color').onChange(updateParticleColor);
        gui.add(params, 'lightIntensity', 0, 5).name('Light Intensity').onChange(updateLightIntensity);
        gui.add(params, 'rotationSpeed', 0, 0.1).name('Sphere Rotation Speed');
        gui.add(params, 'dispersalSpeed', 0, 20).name('Dispersal Speed');
        gui.add(params, 'wireframe').name('Wireframe').onChange(function(e) {
            object.material.wireframe = e; // Update the wireframe state
        });
        gui.add(params, 'reset').name('Reset');
    }

    // Handle File Change
    function fileChangeHandler() {
        const files = this.files;
        if (files.length > 0) {
            audio.src = URL.createObjectURL(files[0]);
            audio.load();
            audio.play();
        }
    }

    // Reset Parameters
    function resetParameters() {
        this.sphereScale = 1;
        this.loudnessThreshold = 200;
        this.particleSize = 1;
        this.backgroundColor = '#ffffff';
        this.particleColor = '#ff0000';
        this.lightIntensity = 1;
        this.rotationSpeed = 0.01;
        this.dispersalSpeed = 5;
        updateSphereScale();
        updateParticleSize();
        updateBackgroundColor();
        updateLightIntensity();
    }

    // Update Sphere Scale
    function updateSphereScale() {
        object.scale.set(params.sphereScale, params.sphereScale, params.sphereScale);
    }

    // Update Particle Size
    function updateParticleSize() {
        particleMaterial.size = params.particleSize;
    }

    // Update Background Color
    function updateBackgroundColor() {
        scene.background = new THREE.Color(params.backgroundColor);
    }

    // Update Particle Color
    function updateParticleColor() {
        particleMaterial.color = new THREE.Color(params.particleColor);
    }

    // Update Light Intensity
    function updateLightIntensity() {
        ambientLight.intensity = params.lightIntensity;
        spotLight.intensity = params.lightIntensity;
    }

    // Animation Loop
    function animate() {
        analyser.getByteFrequencyData(dataArray);
        const isLoud = dataArray.some(value => value > params.loudnessThreshold);
        updateParticles(isLoud);
        updateSphere(isLoud);
        renderer.render(scene, camera);
        requestAnimationFrame(animate);
    }

    // Update Particles
    function updateParticles(isLoud) {
        const positions = particleSystem.geometry.attributes.position.array;
        for (let i = 0; i < positions.length / 3; i++) {
            const audioInfluence = dataArray[i % dataArray.length] / 255;
            positions[i * 3 + 1] += (Math.random() - 0.5) * audioInfluence;
            positions[i * 3] += (Math.random() - 0.5) * audioInfluence;
        }

        const sizes = new Float32Array(positions.length / 3);
        for (let i = 0; i < sizes.length; i++) {
            sizes[i] = params.particleSize + (dataArray[i % dataArray.length] / 255) * 5;
        }
        particleSystem.geometry.setAttribute('size', new THREE.BufferAttribute(sizes, 1));
        particleSystem.geometry.attributes.position.needsUpdate = true;

        if (isLoud) {
            for (let i = 0; i < positions.length / 3; i++) {
                positions[i * 3] += (Math.random() - 0.5) * params.dispersalSpeed;
                positions[i * 3 + 1] += (Math.random() - 0.5) * params.dispersalSpeed;
                positions[i * 3 + 2] += (Math.random() - 0.5) * params.dispersalSpeed;
            }
        } else {
            for (let i = 0; i < positions.length / 3; i++) {
                positions[i * 3] = object.geometry.attributes.position.array[i * 3];
                positions[i * 3 + 1] = object.geometry.attributes.position.array[i * 3 + 1];
                positions[i * 3 + 2] = object.geometry.attributes.position.array[i * 3 + 2];
            }
        }
    }

    // Update Sphere
    function updateSphere(isLoud) {
        const sphereInfluence = dataArray[0] / 255;
        object.position.y = Math.sin(Date.now() * 0.001) * sphereInfluence * 10;
        const scaleInfluence = params.sphereScale + (sphereInfluence * 2);
        object.scale.set(scaleInfluence, scaleInfluence, scaleInfluence);
        const colorInfluence = new THREE.Color(dataArray[0] / 255, dataArray[1] / 255, dataArray[2] / 255);
        object.material.color = colorInfluence;
        object.rotation.x += params.rotationSpeed;
        object.rotation.y += params.rotationSpeed;
        updateParticles(isLoud);
    }

    // Start the visualizer
    init();
}

// Load the main function
window.onload = mainVisual();

// Main Utility Functions
const average = (arr) => arr.reduce((sum, b) => sum + b) / arr.length;
const maximum = (arr) => arr.reduce((a, b) => Math.max(a, b));
const fractional = (val, minVal, maxVal) => (val - minVal) / (maxVal - minVal);
const modulation = (val, minVal, maxVal, outerMin, outerMax) => {
    const fr = fractional(val, minVal, maxVal);
    return outerMin + fr * (outerMax - outerMin);
};