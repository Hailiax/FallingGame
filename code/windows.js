// JavaScript Document
document.getElementById("start").onclick = function() {
    document.getElementById("beginscreen").style.display = "none";
    hurtScreen.material.opacity = 1.0;
    hurtScreen.material.color.set(0xffffff);
    window.setTimeout(function(){
        hurtScreen.material.color.set(0xcc1100);
    }, 1500);
    animate();
}

document.getElementById("retry").onclick = function() {
    animate();
    hurtScreen.material.opacity = 1.0;
    hurtScreen.material.color.set(0xffffff);
    window.setTimeout(function(){
        hurtScreen.material.color.set(0xcc1100);
    }, 1500);
    dead = false;
    score = 0;
    life = 100;
    for (obstacle of obstacles) {
        scene.remove(obstacle.mesh);
    }
    obstacles = [];
    document.getElementById("endscreen").style.display = "none";
}

function dead() {
    document.getElementById("endscreen").style.display = "block";
    document.getElementById("endScore").innerHTML = "Score :" + Math.round(score);
}