// Javascript Document
/* global THREE*/

var startTime = Date.now();
var obstacles = [];
/*
{
    mesh: threejs object mesh
    velocity: THREE.Vector3(0.08,0.03,0.1)
}
*/

// Load shaders
function get(path) {
    var xhr = new XMLHttpRequest();
    xhr.open("GET", path, false);
    xhr.send(null);
    return xhr.responseText
}

var passthruShader = get('shaders/passthru.txt');
var bgShader = get('shaders/bg.txt');

///////////////////
// Init Renderer //
///////////////////
var renderer = new THREE.WebGLRenderer();
renderer.setPixelRatio(window.devicePixelRatio ? window.devicePixelRatio : 1);
document.body.appendChild(renderer.domElement);
document.body.appendChild(renderer.domElement);
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.autoClear = false;

/////////////
// Init Bg //
/////////////
var cameraBg = new THREE.Camera();
cameraBg.position.z = 1;
var sceneBg = new THREE.Scene();

var bgUniforms = {
    time: {
        type: "f",
        value: 1.0
    },
    resolution: {
        type: "v2",
        value: new THREE.Vector2()
    }
};

var bgMaterial = new THREE.ShaderMaterial({
    uniforms: bgUniforms,
    vertexShader: passthruShader,
    fragmentShader: bgShader
});

var bgMesh = new THREE.Mesh(new THREE.PlaneGeometry(2, 2), bgMaterial);
sceneBg.add(bgMesh);

bgUniforms.resolution.value.x = window.innerWidth;
bgUniforms.resolution.value.y = window.innerHeight;

////////////////
// Init Scene //
////////////////
var scene = new THREE.Scene();
var camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);

var geometry = new THREE.CylinderGeometry(10, 10, 20, 32, 1, true);
var material = new THREE.MeshPhongMaterial({ color: 0x444400, side: THREE.BackSide });
var cylinder = new THREE.Mesh(geometry, material);
cylinder.position.z = -40.0;
cylinder.rotation.set(Math.PI / 2, 0, 0);
scene.add(cylinder);

var light = new THREE.PointLight(0xff0000, 10, 100);
light.position.set(0, 0, 0);
scene.add(light);

//////////////
// Init HUD //
//////////////
var cameraHud = new THREE.Camera();
cameraHud.position.z = 1;
var sceneHud = new THREE.Scene();

var mesh = new THREE.Mesh(new THREE.PlaneGeometry(2, 2), new THREE.MeshBasicMaterial({ color: 0xff0000, opacity: 0.1, transparent: true }));
sceneHud.add(mesh);

////////////
// Update //
////////////
function updateBg() {
    elapsedMilliseconds = Date.now() - startTime;
    var elapsedSeconds = elapsedMilliseconds / 1000.;
    bgUniforms.time.value = 60. * elapsedSeconds;
}

var lastBirdSpawned = Date.now();
function updateScene() {
    if (Date.now() - lastBirdSpawned > 3000) {
        // TODO add bird
        // Use assets/bird.gltf for geometry and material
        var bird = new THREE.mesh(geometry, material);
        obstacles.push({
            mesh: bird,
            velocity: new THREE.Vector3(rand, rand1, rand2),
        });
        bird.position.set(rand4, rand5, rand6);
        scene.add(bird);
    }
    for (bird of obstacles) {
        bird.mesh.position += bird.velocity;
        if (bird.position.z > 0) {
            scene.remove(bird);
        }
    }
}
var minutesLabel = document.getElementById("minutes");
var secondsLabel = document.getElementById("seconds");
var totalSeconds = 0;
setInterval(setTime, 1000);

function setTime() {
    ++totalSeconds;
    secondsLabel.innerHTML = pad(totalSeconds % 60);
    minutesLabel.innerHTML = pad(parseInt(totalSeconds / 60));
}

function pad(val) {
    var valString = val + "";
    if (valString.length < 2) {
        return "0" + valString;
    } else {
        return valString;
    }
}
function updateHud() {

}

/////////////////
// Render loop //
/////////////////
function animate() {
    requestAnimationFrame(animate);
    renderer.clear();

    updateBg();
    renderer.render(sceneBg, cameraBg);
    renderer.clearDepth();

    updateScene();
    renderer.render(scene, camera);
    renderer.clearDepth();

    updateHud();
    renderer.render(sceneHud, cameraHud);
    renderer.clearDepth();
}
animate();
