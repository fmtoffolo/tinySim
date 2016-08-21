var Victor = require('victor');
var texture = PIXI.Texture.fromImage('./assets/deer.png');

function map(n, start1, stop1, start2, stop2) {
    return ((n - start1) / (stop1 - start1)) * (stop2 - start2) + start2;
};

function limit(vector, scalar) {
    var mSq = vector.magnitude();

    if (mSq > scalar) {
        vector
            .divideScalar(vector.magnitude())
            .multiplyScalar(scalar);
    }

    return vector;
}

function setMagnitude(vector, scalar) {
    vector
        .divideScalar(vector.magnitude())
        .multiplyScalar(scalar);

    return vector;
}

var animal = {
    init: function() {
        this.location = new Victor(Math.random() * 800, 100);
        this.maxForce = 0.1;
        this.maxSpeed = 2;
        this.id = Math.random();
        this.velocity = new Victor(0, 0);
        this.acceleration = new Victor(0, 0);
        this.sprite = new PIXI.Sprite(texture);
        this.sprite.position.x = this.location.x;
        this.sprite.position.y = this.location.y;
        this.sprite.anchor.x = 0.5;
        this.sprite.anchor.y = 0.5;
        this.sprite.scale = new PIXI.Point(0.2, 0.2);
        this.setState(this.findFood);
    },
    setUniverse: function(universe) {
        this.animals = universe;
    },
    updatePosition: function() {
        this.velocity.add(this.acceleration);
        this.velocity = limit(this.velocity.clone(), this.maxSpeed);
        this.location.add(this.velocity);
        this.acceleration.zero();
        this.updateDisplay();
    },
    applyForce: function(force) {
        this.acceleration.add(force);
    },
    seek: function() {
        var desired = this.destination.clone();
        var minBrakeDistance = 70;
        desired = desired.subtract(this.location);

        var distance = desired.magnitude();

        desired.normalize();
        if (distance < minBrakeDistance) {
            var m = map(distance, 0, minBrakeDistance, 0, this.maxSpeed);
            desired = setMagnitude(desired, m);
        } else {
            desired = setMagnitude(desired, this.maxSpeed);
        }


        desired.subtract(this.velocity);
        steer = limit(desired, this.maxForce);
        return steer;
    },
    avoid: function() {
        var animals = this.animals;
        var _this = this;
        var avoid = new Victor();
        var count = 0;
        var minSeparation = 20;
        animals.forEach(function(animal) {

            var separation = _this.location.clone();
            separation = separation.subtract(animal.location);
            var d = separation.magnitude();

            if (d < minSeparation && d > 0) {
                separation = separation.normalize();
                separation = separation.divideScalar(d);
                avoid.add(separation);
                count++;
            }
        });

        if (count > 0) {
            avoid.divideScalar(count);
            avoid.normalize();
            avoid.multiplyScalar(this.maxSpeed); //accelerate at max speed
            avoid.subtract(this.velocity); //steer
            return limit(avoid, this.maxForce); //limit steer with force
        }

        return avoid;

    },
    applyBehaviors: function() {
        //we apply diff weights to these forces
        var avoid = this.avoid(this.animals).multiplyScalar(1.6);
        var seek = this.seek().multiplyScalar(0.25);

        //we apply these forces
        this.applyForce(avoid);
        this.applyForce(seek);

        //we update the position based on the new velocity
        this.updatePosition();
    },
    updateDisplay: function() {
        this.sprite.position.x = this.location.x;
        this.sprite.position.y = this.location.y;
        this.sprite.rotation = this.velocity.angle() + (Math.PI / 2);
    },
    setState: function(state) {
        this.activeState = state;
    },
    update: function() {
        if (this.activeState) {
            this.activeState();
        }
    },
    findFood: function() {
        this.destination = new Victor(200, 500);
        if (this.location.clone().subtract(this.destination).magnitude() <= 40) {
            console.log('found food');
            this.setState(this.goHome);
        }
        this.applyBehaviors();
    },
    eatFood: function () {

    },
    goHome: function() {
        this.destination = new Victor(100, 100);
        if (this.location.clone().subtract(this.destination).magnitude() <= 40) {
            console.log('got home');
            if (Math.random() > 0.5) {
                this.setState(this.findFood);
            } else {
                this.setState(this.drinkWater);
            }
        }
        this.applyBehaviors();
    },
    drinkWater: function() {
        this.destination = new Victor(1000, 100);
        if (this.location.clone().subtract(this.destination).magnitude() <= 40) {
            console.log('got water');
            this.setState(this.findFood);
        }
        this.applyBehaviors();
    }
}



module.exports = function() {
    var temp = Object.create(animal);
    temp.init();
    return temp;
}
