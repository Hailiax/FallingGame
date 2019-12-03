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
    object.scale.set(3, 165, 3);
    object.rotation.set(Math.PI/2, 0, 0);
    scene.add( object );
}, null, null, null );

var light = new THREE.PointLight( 0xffffff, 10, 100 );
light.position.set( 0, 0, -80);
scene.add( light );

var directionalLight1 = new THREE.DirectionalLight( 0xffffff, 0.5 );
directionalLight1.position.set(0, 1, 0)
scene.add( directionalLight1 );

var directionalLight2 = new THREE.DirectionalLight( 0xffffff, 0.5 );
directionalLight2.position.set(1, 0, 0)
scene.add( directionalLight2 );

var directionalLight2 = new THREE.DirectionalLight( 0xffffff, 0.1 );
directionalLight2.position.set(0, -1, 0)
scene.add( directionalLight2 );


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



//load the bird
var birdObject;
var birdMaterial = new THREE.MeshPhongMaterial({color:0xffffff});
objloader.load( 'assets/bird.obj', function(object){
    birdObject = object;
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

var lastBirdSpawned = Date.now();
function updateScene() {
    updateCamera();



    if (Date.now() - lastBirdSpawned > 1300 + Math.random() * 50) {
        lastBirdSpawned = Date.now();
        for (var i = 0; i < score/1000 + 10; i++){
            var bird = birdObject.clone();
            bird.traverse( function ( child ) {
                if ( child instanceof THREE.Mesh ) {
                    child.material = birdMaterial;
                }
            });

            bird.scale.set(.15, .15, .15);
            var velScale = .2;
            var fallingVelocity = 1.5;


            birdVelocity = new THREE.Vector3((Math.random()-.5)*velScale, (Math.random()-.5)*velScale, (Math.random()*.05 + fallingVelocity))
            bird.lookAt(-birdVelocity.x, -birdVelocity.y, -birdVelocity.z/16);
            bird.rotateZ((Math.random()-.5)*0.2)
            bird.rotateX(Math.PI);
            bird.position.set(0, 0, -200);



            scene.add(bird);
            console.log("Bird Added")
            obstacles.push({
                mesh: bird,
                velocity: birdVelocity,
                boundingBox: new THREE.Box3().setFromObject(bird)
            });
        }
    }

    for (var i = 0; i < obstacles.length; i++) {
        var obstacle = obstacles[i];
        obstacle.mesh.position.add( obstacle.velocity );
        obstacle.boundingBox.min.add( obstacle.velocity );
        obstacle.boundingBox.max.add( obstacle.velocity );
        
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

    //distance of camera movement per frame
    var tick = .005;
    var friction = .5

    if (up) {
        yVelo += tick;
    } else if (down) {
        yVelo -= tick;
    } else {
        yVelo *= friction;
    }


    if (right) {
        xVelo += tick;
    } else if (left) {
        xVelo -= tick;
    } else {
        xVelo *= friction;
    }

    //Round to 3 decimal places
    yVelo = Math.round(yVelo*1000)/1000;
    xVelo = Math.round(xVelo*1000)/1000; 

    var veloCap = .4;
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

    var radius = 2.8
    if (Math.sqrt(x**2+y**2) > radius) {
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
