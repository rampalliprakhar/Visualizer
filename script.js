// Initialize Simplex Noise function
let noise = new SimplexNoise();
// Main Function for Visualizer
var mainVisual = function(){
  // DOM Elements
  let file = document.getElementById("mainFile");
  let audio = document.getElementById("audio");
  let fileName = document.querySelector("label.file");

  document.onload = (e) => {                       // Play the music
    audio.play();
    playMusic();
  }

  file.onchange = function(){                      // Change the music
    fileName.classList.add('fixed');               // add tokens to the fileName of the list
    audio.classList.add('working');                // add tokens to the audio of the list
    let files = this.files;
    audio.src = URL.createObjectURL(files[0]);     // Creates URL of the fileList object
    audio.load();                                  // load the audio                         
    audio.play();                                  // play the audio
    playMusic();
  }
  //function playMusic(){                            // play Function
  const playMusic = () => {
    // Setup Audio Context (WebAudio API)
    let context = new AudioContext();
    const gui = new dat.GUI();
    let src = context.createMediaElementSource(audio);
    let analyser = context.createAnalyser();
    src.connect(analyser);                         // connect the source to be analyzed
    analyser.connect(context.destination);
    analyser.fftSize = 512;
    let bufferLength = analyser.frequencyBinCount;
    let dataArray = new Uint8Array(bufferLength);

    // Three JS
    let scene = new THREE.Scene();
    let group = new THREE.Group();
    let camera = new THREE.PerspectiveCamera(45, window.innerWidth / window.innerHeight, 0.1, 1000);
    camera.position.set(0,0,100);
    camera.lookAt(scene.position);
    scene.add(camera);

    let renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true });
    renderer.setSize(window.innerWidth, window.innerHeight);

    // Creating an object using IcosahedronGeometry
    const radius = 10;
    const details = 3;
    let geometry = new THREE.IcosahedronGeometry(radius, details);
    let material = new THREE.MeshLambertMaterial({color: 0xF3F3F3, wireframe: true});
    let object = new THREE.Mesh(geometry, material);
    object.position.set(0, 0, 0);
    group.add(object);

    // options for the GUI
    const options = {
      color: 0x0000FF, speed: 0.01, wireframe: false
    };

    // changes the color of the object
    gui.addColor(options, 'color').onChange(function(e) {
        object.material.color.set(e);
    });

    // manipulates the rotation speed of the object
    gui.add(options, 'speed', 0, 0.1); 

    // manipulates the wireframe by check-mark button
    gui.add(options, 'wireframe').onChange(function(e) {
        object.material.wireframe = e;
    });
    // manipulates the rotation speed
    let pace = 0;

    // value of the object that will be manipulated by GUI
    const objectValue = {
      radius: 1,
      detail: 0,
    };

    // Reshape the object size using the manipulated value
    const reshapeObject = () => {
      const newObject = new THREE.IcosahedronGeometry(objectValue.radius, objectValue.detail)
      object.geometry.dispose();
      object.geometry = newObject;
    };

    // Code for Object GUI manipulation
    const objectFolder = gui.addFolder('Object');
    const objectPropertiesFolder = objectFolder.addFolder('Properties');
    objectPropertiesFolder.add(objectValue, 'radius', 0.1, 10).onChange(reshapeObject);
    objectPropertiesFolder.add(objectValue, 'detail', 0, 5).step(1).onChange(reshapeObject);

    // Setting ambientLight and Spotlight for the LambertMaterial object
    let ambientLight = new THREE.AmbientLight(0xaaaaaa);
    scene.add(ambientLight);

    let spotLight = new THREE.SpotLight(0xffffff);  // default color
    spotLight.intensity = 0.9;                      // strength of the light
    spotLight.position.set(-10, 40, 20);            // set the position of the light
    spotLight.lookAt(object);                       // convert object's local space to world space
    spotLight.castShadow = true;                    // light will cast dynamic shadows
    scene.add(spotLight);                           // adds spotlight to the scene
    
    scene.add(group);

    // resizing the window
    const resizeWindow = () => {
      camera.aspect = window.innerWidth / window.innerHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(window.innerWidth, window.innerHeight);
    }

    document.getElementById('execute').appendChild(renderer.domElement);

    window.addEventListener('resize', resizeWindow, false);

    // update the audio
    const updateAudio = () => {
      analyser.getByteFrequencyData(dataArray);

      let lowerHalfData = dataArray.slice(0, (dataArray.length/2) - 1);
      let upperHalfData = dataArray.slice((dataArray.length/2) - 1, dataArray.length - 1);

      let lowerMax = maximum(lowerHalfData);
      let upperAvg = average(upperHalfData);

      let lowerMaxFr = lowerMax / lowerHalfData.length;
      let upperAvgFr = upperAvg / upperHalfData.length;
      
      tuneObject(object, modulation(Math.pow(lowerMaxFr, 0.8), 0, 1, 0, 8), modulation(upperAvgFr, 0, 1, 0, 4));
      
      //animate the object
      time = 1;
      object.rotation.y = time/1000;
      pace += options.speed;
      // Bounces the object
      object.position.y = 4 * Math.abs(Math.sin(pace)); 
      group.rotation.y += 0.005;
      renderer.render(scene, camera);
      requestAnimationFrame(updateAudio);
    }

    // tune the shape boundary based on the music sound
    const tuneObject = (mesh, bassFr, treFr) => {
      mesh.geometry.vertices.forEach(function (vertex, i) {
        let offset = mesh.geometry.parameters.radius;
        let amplify = 7;
        let time = window.performance.now();
        vertex.normalize();
        let rf = 0.00001;
        let distance = (offset + bassFr ) + noise.noise3D(vertex.x + time *rf*7, vertex.y +  time*rf*8, vertex.z + time*rf*9) * amplify * treFr;
        vertex.multiplyScalar(distance);
      });
      mesh.geometry.verticesNeedUpdate = true;
      mesh.geometry.normalsNeedUpdate = true;
      mesh.geometry.computeVertexNormals();
      mesh.geometry.computeFaceNormals();
    }

    const tune = {
      bassFr: 2, treFr: 2, distance:0
    };
    gui.add(tune, 'bassFr', 0, 10); 
    // manipulates the rotation speed of the object
    gui.add(tune, 'treFr', 0, 10); 
    gui.add(tune, 'distance', 0, 10); 


    updateAudio();
    audio.play(); // plays the music and changes the shape according to the tune
  };
}

window.onload = mainVisual(); // load the main function

document.body.addEventListener('touchend', function(ev) { context.resume(); });

// Returns the average
const average = (arr) =>{
  let totalSum = arr.reduce(function(sum, b) { return sum + b; });
  return (totalSum / arr.length);
}
// Returns the maximum
const maximum = (arr) =>{
  return arr.reduce(function(a, b){ return Math.max(a, b); })
}
// Function to calculate fractionate of music
const fractional = (val, minVal, maxVal) => {
  return (val - minVal)/(maxVal - minVal);
}
// Function to modulate the music tune
const modulation = (val, minVal, maxVal, outerMin, outerMax) => {
  let fr = fractional(val, minVal, maxVal);
  let deltaFormula = outerMax - outerMin;
  return outerMin + (fr * deltaFormula);
}
