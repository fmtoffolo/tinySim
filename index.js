var vector = require('victor');
var Animal = require('./animal.js');

var animals = [];


function createDeers(amount) {
    for (var i = 0; i < amount; i++) {
        animals.push(Animal());
    }
}

createDeers(20);

var renderer = PIXI.autoDetectRenderer(window.innerWidth, window.innerHeight, {
    backgroundColor: 0x1099bb
});
document.body.appendChild(renderer.view);
var velocityDom = document.getElementById('velocity');


// create the root of the scene graph
var stage = new PIXI.Container();

animals.forEach(function(animal) {
    stage.addChild(animal.sprite);
});


// start animating
var mouse = {
    x: 200,
    y: 200
}
animate();

window.addEventListener('mousedown', function(event) {
    mouse.x = event.offsetX;
    mouse.y = event.offsetY;
})
var frames = 0;

function animate() {
    requestAnimationFrame(animate);


    animals.forEach(function(animal) {
        animal.applyBehaviors(mouse.x, mouse.y, animals);
    });

    frames++;
    renderer.render(stage);
}
