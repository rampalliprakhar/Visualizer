// Initialize Simplex Noise function
let noise = new SimplexNoise();

// Main Function for Visualizer
var mainVisual = function() {
    // DOM Elements
    let file = document.getElementById("mainFile");
    let audio = document.getElementById("audio");
    let fileName = document.querySelector("label.file");

    file.onchange = function() { // Change the music
        fileName.classList.add('fixed'); // add tokens to the fileName of the list
        audio.classList.add('working'); // add tokens to the audio of the list
        let files = this.files;
        audio.src = URL.createObjectURL(files[0]); // Creates URL of the fileList object
        audio.load(); // load the audio                         
        audio.play(); // play the audio
        playMusic();
    }

    const playMusic = () => {
        // Setup Audio Context (WebAudio API)
        let context = new AudioContext();
        let src = context.createMediaElementSource(audio);
        let analyser = context.createAnalyser();
        src.connect(analyser);
        analyser.connect(context.destination);
        analyser.fftSize = 512;
        let bufferLength = analyser.frequencyBinCount;
        let dataArray = new Uint8Array(bufferLength);

        // Three JS
        let scene = new THREE.Scene();
        let camera = new THREE.PerspectiveCamera(45, window.innerWidth / window.innerHeight, 0.1, 1000);
        camera.position.set(0, 0, 150); // Ensure the camera is positioned correctly
        scene.add(camera);

        let renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true });
        renderer.setSize(window.innerWidth, window.innerHeight);
        document.getElementById('execute').appendChild(renderer.domElement);

        // Create main object (sphere)
        let geometry = new THREE.IcosahedronGeometry(10, 3);
        let material = new THREE.MeshLambertMaterial({ color: 0xF3F3F3 });
        let object = new THREE.Mesh(geometry, material);
        scene.add(object); // Ensure the object is added to the scene

        // Particle System
        const particleCount = 1000;
        const particles = new THREE.BufferGeometry(); // Ensure this is a BufferGeometry
        const positions = new Float32Array(particleCount * 3); // x, y, z for each particle
        const colors = new Float32Array(particleCount * 3); // r, g, b for each particle

        for (let i = 0; i < particleCount; i++) {
            // Random positions
            positions[i * 3] = (Math.random() - 0.5) * 200; // x
            positions[i * 3 + 1] = (Math.random() - 0.5) * 200; // y
            positions[i * 3 + 2] = (Math.random() - 0.5) * 200; // z

            // Initial colors
            colors[i * 3] = Math.random(); // r
            colors[i * 3 + 1] = Math.random(); // g
            colors[i * 3 + 2] = Math.random(); // b
        }

        // Set attributes for the particle system
        particles.setAttribute('position', new THREE.BufferAttribute(positions, 3));
        particles.setAttribute('color', new THREE.BufferAttribute(colors, 3));

        const particleMaterial = new THREE.PointsMaterial({
            size: 1,
            vertexColors: true, // Use vertex colors
            transparent: true,
            opacity: 0.7,
        });

        const particleSystem = new THREE.Points(particles, particleMaterial);
        scene.add(particleSystem); // Add particle system to the scene

        // Additional Shapes
        const cubeGeometry = new THREE.BoxGeometry(5, 5, 5);
        const cubeMaterial = new THREE.MeshLambertMaterial({ color: 0x00ff00 });
        const cube = new THREE.Mesh(cubeGeometry, cubeMaterial);
        cube.position.set(20, 0, 0);
        scene.add(cube);

        // Lighting
        let ambientLight = new THREE.AmbientLight(0xaaaaaa, 1);
        scene.add(ambientLight);
        let spotLight = new THREE.SpotLight(0xffffff);
        spotLight.position.set(-10, 40, 20);
        scene.add(spotLight);

        // Animation loop
        const updateAudio = () => {
            analyser.getByteFrequencyData(dataArray);

            // Update particle positions based on audio data
            const positions = particleSystem.geometry.attributes.position.array;
            for (let i = 0; i < particleCount; i++) {
                // Example: Move particles based on audio data
                const audioInfluence = dataArray[i % bufferLength] / 255; // Normalize audio data
                positions[i * 3 + 1] += (Math.random() - 0.5) * audioInfluence; // Y position influenced by audio
                positions[i * 3] += (Math.random() - 0.5) * audioInfluence; // X position influenced by audio
            }

            // Update particle sizes based on audio data
            const sizes = new Float32Array(particleCount);
            for (let i = 0; i < particleCount; i++) {
                sizes[i] = 1 + (dataArray[i % bufferLength] / 255) * 5; // Size influenced by audio
            }
            particles.setAttribute('size', new THREE.BufferAttribute(sizes, 1)); // Set sizes

            // Notify Three.js that the position attribute has changed
            particleSystem.geometry.attributes.position.needsUpdate = true;

            // Update sphere (object) position based on audio data
            const sphereInfluence = dataArray[0] / 255; // Use the first frequency data for influence
            object.position.y = Math.sin(Date.now() * 0.001) * sphereInfluence * 10; // Move up and down

            // Manipulate the sphere: Scale and Color Change
            const scaleInfluence = 1 + (sphereInfluence * 2); // Scale based on audio
            object.scale.set(scaleInfluence, scaleInfluence, scaleInfluence); // Scale the sphere

            // Change color based on audio data
            const colorInfluence = new THREE.Color(dataArray[0] / 255, dataArray[1] / 255, dataArray[2] / 255);
            object.material.color = colorInfluence; // Change the sphere's color

            object.rotation.x += 0.01; // Rotate the sphere
            object.rotation.y += 0.01;

            // Update cube rotation based on audio data
            cube.rotation.x += 0.01 * (dataArray[0] / 255);
            cube.rotation.y += 0.01 * (dataArray[1] / 255);

            // Change background color based on audio data
            const bgColor = new THREE.Color(dataArray[0] / 255, dataArray[1] / 255, dataArray[2] / 255);
            scene.background = bgColor;

            renderer.render(scene, camera); // Render the scene
            requestAnimationFrame(updateAudio); // Continue the animation loop
        };

        updateAudio(); // Start the audio update loop
    };
}

window.onload = mainVisual(); // load the main function

// Returns the average
const average = (arr) => {
    let totalSum = arr.reduce(function(sum, b) { return sum + b; });
    return (totalSum / arr.length);
}
// Returns the maximum
const maximum = (arr) => {
    return arr.reduce(function(a, b) { return Math.max(a, b); })
}
// Function to calculate fractionate of music
const fractional = (val, minVal, maxVal) => {
    return (val - minVal) / (maxVal - minVal);
}
// Function to modulate the music tune
const modulation = (val, minVal, maxVal, outerMin, outerMax) => {
    let fr = fractional(val, minVal, maxVal);
    let deltaFormula = outerMax - outerMin;
    return outerMin + (fr * deltaFormula);
}