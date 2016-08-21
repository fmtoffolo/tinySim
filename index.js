var vector = require('victor');
var Animal = require('./animal.js');




function createDeers(amount) {
    var animals = [];
    for (var i = 0; i < amount; i++) {
        animals.push(Animal());
    }
    animals.forEach(function(animal) {
        animal.setUniverse(animals);
    })
    return animals;
}

var animals = createDeers(10);

var renderer = PIXI.autoDetectRenderer(window.innerWidth, window.innerHeight, {
    backgroundColor: 0xDFD4C9
});
document.body.appendChild(renderer.view);
var velocityDom = document.getElementById('velocity');


// create the root of the scene graph
var stage = new PIXI.Container();

//crude map
var home = new PIXI.Graphics();

home.beginFill(0xBBBBBB);

home.lineStyle(0, 0xBBBBBB);

home.drawRect(75, 75, 50, 50);

stage.addChild(home);

//food source
//crude map
var food = new PIXI.Graphics();

food.beginFill(0x8CABA8);

food.lineStyle(0, 0x8CABA8);

food.drawRect(175, 475,50, 50);

stage.addChild(food);

//water source
//crude map
var water = new PIXI.Graphics();

water.beginFill(0xA1D7EC);

water.lineStyle(0, 0xA1D7EC);

water.drawRect(975, 75,50, 50);

stage.addChild(water);


animals.forEach(function(animal) {
    stage.addChild(animal.sprite);

    console.log(animal);
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
        animal.update()
    });

    frames++;
    renderer.render(stage);
}
