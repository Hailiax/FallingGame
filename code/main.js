// Javascript Document
/* global THREE*/

var startTime = Date.now();
var obstacles = [];
var objloader = new THREE.OBJLoader();
var score = 0;
var life = 100;
var invulnerable = false;
var invulnerableTimeout = setTimeout(function(){},0);
var dead = false;
var tunnelLength = 165;

/*
{
    mesh: threejs object mesh
    velocity: THREE.Vector3(0.08,0.03,0.1)
    boundingBox: threejs box3
}
*/

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
var tunnelMaterial = new THREE.ShaderMaterial({
    uniforms: uniforms,
    vertexShader: passthruShader,
    fragmentShader: noiseFunction + cylinderShader,
    transparent: true
});

//Load the cylander that the player "falls" through
objloader.load( 'assets/cylinder.obj', function(object){
    object.traverse( function ( child ) {
        if ( child instanceof THREE.Mesh ) {
            child.material = tunnelMaterial;
        }
    });
    object.scale.set(3, tunnelLength, 3);
    object.rotation.set(Math.PI/2, 0, 0);
    scene.add( object );
}, null, null, null );


//Create the lighting
var light = new THREE.PointLight( 0xffffff, 10, 100 );
light.position.set( 0, 0, -80);
scene.add( light );

var directionalLight1 = new THREE.DirectionalLight( 0xffffff, 0.5 );
directionalLight1.position.set(0, 1, 0)
scene.add( directionalLight1 );

var directionalLight2 = new THREE.DirectionalLight( 0xffffff, 0.5 );
directionalLight2.position.set(1, 0, 0)
scene.add( directionalLight2 );

var directionalLight3 = new THREE.DirectionalLight( 0xffffff, 0.1 );
directionalLight3.position.set(0, -1, 0)
scene.add( directionalLight3 );


// load the hands
// var handObject;
// var handMaterial = new THREE.MeshPhongMaterial({color:0xFF0000})
// objloader.load( 'assets/hand.obj', function(object){
//     handObject = object
// }, null, null, null);

// //Add the hands to the scene
// var leftHand = handObject.clone();
//     leftHand.traverse( function ( child ) {
//     if ( child instanceof THREE.Mesh ) {
//         child.material = handMaterial;
//     }
// });
// leftHand.scale = (.1,.1,.1)
// leftHand.position = (camera.position.x, camera.position.y, -4)



//load the bird object
var birdObject;
var birdMaterial = new THREE.MeshPhongMaterial({color:0xffffff});
objloader.load( 'assets/bird.obj', function(object){
    birdObject = object;
}, null, null, null);

//load the spike object
var spikeObject;
// var spikeMaterial = new THREE.MeshPhongMaterial({color:0xaa33cc}) //TODO: make the material/shader the same for the spike as the walls
var spikeMaterial = tunnelMaterial;
objloader.load( 'assets/spike.obj', function(object){
    spikeObject = object;
}, null, null, null);


//////////////
// Init HUD //
//////////////
var cameraHud = new THREE.Camera();
cameraHud.position.z = 1;
var sceneHud = new THREE.Scene();

var hurtScreen = new THREE.Mesh(new THREE.PlaneGeometry(2, 2), new THREE.MeshBasicMaterial( { color: 0xff0000, opacity: 0.0, transparent: true } ));
sceneHud.add(hurtScreen);

////////////
// Update //
////////////
function updateBg() {
    var elapsedSeconds = elapsedMilliseconds / 1000.;
    bgUniforms.time.value = 60. * elapsedSeconds;
    uniforms.time.value = 60. * elapsedSeconds;
}


var fallingVelocity = 1.5;  //base falling velocity that alters the z-movement of all objects
var lastBirdSpawned = Date.now();
function updateScene() {
    updateCamera();

    //add spike
    if (Date.now() - lastBirdSpawned > 1200 + Math.random() * 200) { //TODO: track when spikes are spawned and spawn accordingly
        var spike = spikeObject.clone();
        spike.traverse( function ( child ) {
            if ( child instanceof THREE.Mesh ) {
                child.material = spikeMaterial;
            }
        });
        spike.scale.set(.5, .5, .5);

        //set rotation pointed to pi=0
        spike.rotateX(Math.PI/2);
        spike.rotateY(.253*Math.PI);
        //rotate random amount 0-2pi, set position on the cylander directly behind.
        let rotation = Math.random()*2*Math.PI
        spike.rotateY(rotation);
        spike.position.set(-3*Math.cos(rotation), -3*Math.sin(rotation), -tunnelLength);
        scene.add(spike);
        console.log(spike.position);
        spikeVelocity = new THREE.Vector3(0, 0, fallingVelocity);


        obstacles.push({
            mesh: spike,
            velocity: spikeVelocity,
            boundingBox: new THREE.Box3().setFromObject(spike)
        });
    }

    if (Date.now() - lastBirdSpawned > 1200 + Math.random() * 200) {
        lastBirdSpawned = Date.now();
        for (var i = 0; i < score/1000 + 10; i++){
            var bird = birdObject.clone();
            bird.traverse( function ( child ) {
                if ( child instanceof THREE.Mesh ) {
                    child.material = birdMaterial;
                }
            });

            //set bird size, velocity, and orientation
            bird.scale.set(.15, .15, .15);
            var velScale = .2;

            birdVelocity = new THREE.Vector3((Math.random()-.5)*velScale, (Math.random()-.5)*velScale, ((Math.random()-.5)*.1 + fallingVelocity))
            bird.lookAt(-birdVelocity.x, -birdVelocity.y, -birdVelocity.z/16);
            bird.rotateZ((Math.random()-.5)*0.2)
            bird.rotateX(Math.PI);
            bird.position.set(0, 0, -200);

            //add bird to scene and index in obstacles
            scene.add(bird);
            console.log("Bird Added")
            obstacles.push({
                mesh: bird,
                velocity: birdVelocity,
                boundingBox: new THREE.Box3().setFromObject(bird)
            });
        }
    }

    //Update obstacles
    for (var i = 0; i < obstacles.length; i++) {
        var obstacle = obstacles[i];
        obstacle.mesh.position.add( obstacle.velocity );
        obstacle.boundingBox.min.add( obstacle.velocity );
        obstacle.boundingBox.max.add( obstacle.velocity );
        
        //remove obstacles once they pass behind the camera
        if (obstacle.mesh.position.z > 0) {
            scene.remove(obstacle.mesh);
            obstacles.splice(i, 1);
        }
    }
}

var up = false;
var left = false;
var down = false;
var right = false;

var xVelo = 0;
var yVelo = 0;

function updateCamera() {
    var x = camera.position.x;
    var y = camera.position.y;
    var z = camera.position.z;

    var tick = .008;     //distance of camera movement per frame
    var friction = .13;   //amount that the camera slows while not inputting movement (higher number == less movement)
    var veloCap = .4;    //maximum velocity
    var motionRadius = 2.8 //sets the radius that limits camera movement

    if (up) {
        yVelo += tick;
    } else if (down) {
        yVelo -= tick;
    } else {
        yVelo *= (1-friction);
    }

    if (right) {
        xVelo += tick;
    } else if (left) {
        xVelo -= tick;
    } else {
        xVelo *= (1-friction);
    }

    //Round to 2 decimal places
    yVelo = Math.round(yVelo*1000)/1000;
    xVelo = Math.round(xVelo*1000)/1000; 

    if (xVelo > veloCap) {
        xVelo = veloCap;
    } else if (xVelo < -veloCap) {
        xVelo = -veloCap;
    }
    if (yVelo > veloCap) {
        yVelo = veloCap;
    } else if (yVelo < -veloCap) {
        yVelo = -veloCap;
    }

    x += xVelo;
    y += yVelo;


    if (Math.sqrt(x**2+y**2) > motionRadius) {
        //do nothing
    } else {
        camera.position.set(x,y,z);
    }
}


function updateHud() {
    function isPointInsideAABB(point, box) {
        return (point.x >= box.min.x && point.x <= box.max.x) &&
               (point.y >= box.min.y && point.y <= box.max.y) &&
               (point.z >= box.min.z && point.z <= box.max.z);
    }
    if (!invulnerable) {
       for (obstacle of obstacles) {
            var collides = isPointInsideAABB(camera.position, obstacle.boundingBox);
            if (collides) {
                hurtScreen.material.opacity += 0.5;
                life -= 25;
                invulnerable = true;
                clearTimeout(invulnerableTimeout);
                invulnerableTimeout = setTimeout(function(){
                    invulnerable = false;
                }, 1000)
                break;
            }
        } 
    }
    if ( hurtScreen.material.opacity > 0 ){
        hurtScreen.material.opacity -= 0.02;
    } else {
        hurtScreen.material.opacity = 0;
    }
    if (!dead && life <= 0) {
        dead = true;
        document.getElementById("endscreen").style.display = "block";
        document.getElementById("endscreen").innerHTML = "Nice try! Your score was: " + Math.round(score);
    }
}

////////////////////
// Event Listners //
////////////////////


document.body.onkeydown = function(e){
    var bounds = 2;
    pos = camera.position;
    if (e.keyCode === 119 || e.keyCode === 87 || e.keyCode === 38) {
        up = true;
    } else if (e.keyCode === 97 || e.keyCode === 65 || e.keyCode === 37) {
        left = true;
    } else if (e.keyCode === 115 || e.keyCode === 83 || e.keyCode === 40) {
        down = true;
    } else if (e.keyCode === 100 || e.keyCode === 68 || e.keyCode === 39) {
        right = true;
    }
}

document.body.onkeyup = function(e){
    var pos = camera.position;
    if (e.keyCode === 119 || e.keyCode === 87 || e.keyCode === 38) {
        up = false;
    } else if (e.keyCode === 97 || e.keyCode === 65 || e.keyCode === 37) {
        left = false;
    } else if (e.keyCode === 115 || e.keyCode === 83 || e.keyCode === 40) {
        down = false;
    } else if (e.keyCode === 100 || e.keyCode === 68 || e.keyCode === 39) {
        right = false;
    }

    //If the position update would move the camera outside of the bounds, maintain current position
}

/////////////////
// Render loop //
/////////////////
var elapsedMilliseconds = 0;
function animate() {
    requestAnimationFrame(animate);
    
    elapsedMilliseconds = Date.now() - startTime;
    score += elapsedMilliseconds / 2371;
    document.getElementById("score").innerHTML = "Score: " + Math.round(score);
    document.getElementById("life").innerHTML = "Life: " + Math.round(life);
    
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
