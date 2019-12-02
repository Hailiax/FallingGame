// Javascript Document
/* global THREE*/

var startTime = Date.now();
var pixelRatio = window.devicePixelRatio ? window.devicePixelRatio : 1;

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
renderer.setPixelRatio(pixelRatio);
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
    },
    pixelRatio: {
        type: "f",
        value: pixelRatio
    }
};

var bgMaterial = new THREE.ShaderMaterial({
    uniforms: bgUniforms,
    vertexShader: passthruShader,
    fragmentShader: bgShader
});

var bgMesh = new THREE.Mesh(new THREE.PlaneGeometry(2, 2), bgMaterial);
sceneBg.add(bgMesh);

bgUniforms.resolution.value.x = window.innerWidth * pixelRatio;
bgUniforms.resolution.value.y = window.innerHeight * pixelRatio;

////////////////
// Init Scene //
////////////////
var scene = new THREE.Scene();
var camera = new THREE.PerspectiveCamera( 75, window.innerWidth/window.innerHeight, 0.1, 1000 );

var geometry = new THREE.CylinderGeometry( 10, 10, 20, 32, 1, true );
var material = new THREE.MeshPhongMaterial( { color: 0x444400, side: THREE.BackSide } );
var cylinder = new THREE.Mesh( geometry, material );
cylinder.position.z = -40.0;
cylinder.rotation.set(Math.PI/2, 0, 0);
scene.add( cylinder );

var light = new THREE.PointLight( 0xff0000, 10, 100 );
light.position.set( 0, 0, 0 );
scene.add( light );

//////////////
// Init HUD //
//////////////
var cameraHud = new THREE.Camera();
cameraHud.position.z = 1;
var sceneHud = new THREE.Scene();

var mesh = new THREE.Mesh(new THREE.PlaneGeometry(2, 2), new THREE.MeshBasicMaterial( { color: 0xff0000, opacity: 0.1, transparent: true } ));
sceneHud.add(mesh);

////////////
// Update //
////////////
function updateBg() {
    var elapsedMilliseconds = Date.now() - startTime;
    var elapsedSeconds = elapsedMilliseconds / 1000.;
    bgUniforms.time.value = 60. * elapsedSeconds;
}

function updateScene() {
    
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
