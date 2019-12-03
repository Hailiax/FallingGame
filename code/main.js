// Javascript Document
/* global THREE*/

var startTime = Date.now();
var obstacles = [];
var objloader = new THREE.OBJLoader();
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
    xhr.setRequestHeader('X-PINGOTHER', 'pingpong');
    xhr.send(null);
    return xhr.responseText;
}

var passthruShader = get('shaders/passthru.txt');
var bgShader = get('shaders/bg.txt');
var cylinderShader = get('shaders/cylinder.txt');
var noiseFunction = get('shaders/noise.txt');

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
    fragmentShader: noiseFunction + bgShader
});

var bgMesh = new THREE.Mesh(new THREE.PlaneGeometry(2, 2), bgMaterial);
sceneBg.add(bgMesh);

bgUniforms.resolution.value.x = window.innerWidth;
bgUniforms.resolution.value.y = window.innerHeight;

////////////////
// Init Scene //
////////////////
var scene = new THREE.Scene();
var camera = new THREE.PerspectiveCamera(75, window.innerWidth/window.innerHeight, 0.1, 1000 );

var uniforms = {
    time: {
        type: "f",
        value: 1.0
    },
    resolution: {
        type: "v2",
        value: new THREE.Vector2()
    }
};
var material = new THREE.ShaderMaterial({
    uniforms: uniforms,
    vertexShader: passthruShader,
    fragmentShader: noiseFunction + cylinderShader,
    transparent: true
});

objloader.load( 'assets/cylinder.obj', function(object){
    object.traverse( function ( child ) {
        if ( child instanceof THREE.Mesh ) {
            child.material = material;
        }
    });
    object.scale.set(3, 100, 3);
    object.rotation.set(Math.PI/2, 0, 0);
    scene.add( object );
}, null, null, null );

var light = new THREE.PointLight( 0xff0000, 10, 100 );
light.position.set( 0, 0, -70);
scene.add( light );


//load the hands
// objloader.load( 'assets/hand.obj', function(object){
//     object.scale.set(.5, .5, .5)
//     scene.add(object);
// }, null, null, null);

//load the bird
var birdGeometry;
var birdMaterial = new THREE.MeshPhongMaterial({color:0xffffff});
objloader.load( 'assets/bird.obj', function(object){
    birdGeometry = object.children[0].geometry;
}, null, null, null);

//////////////
// Init HUD //
//////////////
var cameraHud = new THREE.Camera();
cameraHud.position.z = 1;
var sceneHud = new THREE.Scene();

var mesh = new THREE.Mesh(new THREE.PlaneGeometry(2, 2), new THREE.MeshBasicMaterial( { color: 0xff0000, opacity: 0.0, transparent: true } ));
sceneHud.add(mesh);

////////////
// Update //
////////////
function updateBg() {
    elapsedMilliseconds = Date.now() - startTime;
    var elapsedSeconds = elapsedMilliseconds / 1000.;
    bgUniforms.time.value = 60. * elapsedSeconds;
    uniforms.time.value = 60. * elapsedSeconds;
}

var lastBirdSpawned = Date.now();
function updateScene() {
    updateCamera();

    if (Date.now() - lastBirdSpawned > 3000) {
        lastBirdSpawned = Date.now();
        var bird = new THREE.Mesh(birdGeometry, birdMaterial)
        console.log(bird)
        bird.scale.set(.5, .5, .5)
        bird.position.set(Math.random(), Math.random(), -20);
        scene.add(bird);
        console.log("Bird Added")
        velScale = .2
        obstacles.push({
            mesh: bird,
            velocity: new THREE.Vector3((Math.random()-.5)*velScale, (Math.random()-.5)*velScale,(Math.random()+1)/2 -.5),
        });
    }

    for (bird of obstacles) {
        bird.mesh.position.add( bird.velocity );
        if (bird.mesh.position.z > 0) {
            scene.remove(bird);
        }
    }
}

var up = false;
var left = false;
var down = false;
var right = false;

function updateCamera() {
    var x = camera.position.x;
    var y = camera.position.y;
    var z = camera.position.z;

    //distance of camera movement per frame
    var tick = .02

    if (up) {y += tick};
    if (left) {x -= tick};
    if (right) {x+= tick};
    if (down) {y -= tick};

    var radius = 2
    if (Math.sqrt(x**2+y**2) > radius) {
        //do nothing
    } else {
        camera.position.set(x,y,z);
    }
    console.log("Camera Pos: ", camera.position);
}


function updateHud() {
    
}

////////////////////
// Event Listners //
////////////////////


document.body.onkeypress = function(e){
    var bounds = 2
    pos = camera.position
    if (e.keyCode == 119 || e.keyCode == 87 || e.keyCode == 38) {
        up = true;
    } else if (e.keyCode == 97 || e.keyCode == 65 || e.keyCode == 37) {
        left = true;
    } else if (e.keyCode == 115 || e.keyCode == 83 || e.keyCode == 40) {
        down = true;
    } else if (e.keyCode == 100 || e.keyCode == 68 || e.keyCode == 39) {
        right = true;
    }
}

document.body.onkeyup = function(e){
    var pos = camera.position
    if (e.keyCode == 87 || e.keyCode == 38) {
        up = false;
    } else if (e.keyCode == 65 || e.keyCode == 37) {
        left = false;
    } else if (e.keyCode == 83 || e.keyCode == 40) {
        down = false;
    } else if (e.keyCode == 68 || e.keyCode == 39) {
        right = false;
    }

    //If the position update would move the camera outside of the bounds, maintain current position
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
