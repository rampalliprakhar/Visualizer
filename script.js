// Initialize Simplex Noise function
var noise = new SimplexNoise();
// Main Function for Visualizer
var mainVisual = function(){
  // DOM Elements
  var file = document.getElementById("mainFile");
  var audio = document.getElementById("audio");
  var fileName = document.querySelector("label.file");

  document.onload = function(e){                   // Play the music
    audio.play();
    playMusic();
  }
  file.onchange = function(){                      // Change the music
    fileName.classList.add('fixed');               // add tokens to the fileName of the list
    audio.classList.add('working');                // add tokens to the audio of the list
    var files = this.files;
    audio.src = URL.createObjectURL(files[0]);     // Creates URL of the fileList object
    audio.load();                                  // load the audio                         
    audio.play();                                  // play the audio
    playMusic();
  }
  function playMusic(){                            // play Function
    // Setup Audio Context (WebAudio API)
    var context = new AudioContext();
    var src = context.createMediaElementSource(audio);
    var analyser = context.createAnalyser();
    src.connect(analyser);                         // connect the source to be analyzed
    analyser.connect(context.destination);
    analyser.fftSize = 512;
    var bufferLength = analyser.frequencyBinCount;
    var dataArray = new Uint8Array(bufferLength);

    // Three JS
    var scene = new THREE.Scene();
    var group = new THREE.Group();
    var camera = new THREE.PerspectiveCamera(45, window.innerWidth / window.innerHeight, 0.1, 1000);
    camera.position.set(0,0,100);
    camera.lookAt(scene.position);
    scene.add(camera);

    var renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true });
    renderer.setSize(window.innerWidth, window.innerHeight);

    // Creating an object using IcosahedronGeometry
    var geometry = new THREE.IcosahedronGeometry(10, 3);
    var material = new THREE.MeshLambertMaterial({color: 0xF3F3F3, wireframe: true});
    var object = new THREE.Mesh(geometry, material);
    object.position.set(0, 0, 0);
    group.add(object);

    // Setting ambientLight and Spotlight for the LambertMaterial object
    var ambientLight = new THREE.AmbientLight(0xaaaaaa);
    scene.add(ambientLight);

    var spotLight = new THREE.SpotLight(0xffffff);  // default color
    spotLight.intensity = 0.9;                      // strength of the light
    spotLight.position.set(-10, 40, 20);            // set the position of the light
    spotLight.lookAt(object);                       // convert object's local space to world space
    spotLight.castShadow = true;                    // light will cast dynamic shadows
    scene.add(spotLight);                           // adds spotlight to the scene
    
    scene.add(group);

    document.getElementById('execute').appendChild(renderer.domElement);

    window.addEventListener('resize', resizeWindow, false);

    updateAudio();
    // update the audio
    function updateAudio() {
      analyser.getByteFrequencyData(dataArray);

      var lowerHalfData = dataArray.slice(0, (dataArray.length/2) - 1);
      var upperHalfData = dataArray.slice((dataArray.length/2) - 1, dataArray.length - 1);

      var lowerMax = maximum(lowerHalfData);
      var upperAvg = average(upperHalfData);

      var lowerMaxFr = lowerMax / lowerHalfData.length;
      var upperAvgFr = upperAvg / upperHalfData.length;
      
      tuneObject(object, modulation(Math.pow(lowerMaxFr, 0.8), 0, 1, 0, 8), modulation(upperAvgFr, 0, 1, 0, 4));
      
      //animate the object
      group.rotation.y += 0.005;
      renderer.render(scene, camera);
      requestAnimationFrame(updateAudio);
    }
    // resizing the window
    function resizeWindow() {
      camera.aspect = window.innerWidth / window.innerHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(window.innerWidth, window.innerHeight);
    }
    // tune the shape boundary based on the music sound
    function tuneObject(mesh, bassFr, treFr) {
      mesh.geometry.vertices.forEach(function (vertex, i) {
        var offset = mesh.geometry.parameters.radius;
        var amplify = 7;
        var time = window.performance.now();
        vertex.normalize();
        var rf = 0.00001;
        var distance = (offset + bassFr ) + noise.noise3D(vertex.x + time *rf*7, vertex.y +  time*rf*8, vertex.z + time*rf*9) * amplify * treFr;
        vertex.multiplyScalar(distance);
      });
      mesh.geometry.verticesNeedUpdate = true;
      mesh.geometry.normalsNeedUpdate = true;
      mesh.geometry.computeVertexNormals();
      mesh.geometry.computeFaceNormals();
    }
    audio.play(); // plays the music and changes the shape according to the tune
  };
}

window.onload = mainVisual(); // load the main function

document.body.addEventListener('touchend', function(ev) { context.resume(); });

// Returns the average
function average(arr){
  var totalSum = arr.reduce(function(sum, b) { return sum + b; });
  return (totalSum / arr.length);
}
// Returns the maximum
function maximum(arr){
  return arr.reduce(function(a, b){ return Math.max(a, b); })
}
// Function to calculate fractionate of music
function fractional(val, minVal, maxVal) {
    return (val - minVal)/(maxVal - minVal);
}
// Function to modulate the music tune
function modulation(val, minVal, maxVal, outerMin, outerMax) {
    var fr = fractional(val, minVal, maxVal);
    var deltaFormula = outerMax - outerMin;
    return outerMin + (fr * deltaFormula);
}
