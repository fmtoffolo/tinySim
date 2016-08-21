var Victor = require('victor');
var texture = PIXI.Texture.fromImage('./assets/deer.png');
var mousePosition = require('./mousePosition.js');


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
        this.stack = [];
        this.pushState(this.findFood);
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
        var minSeparation = 15;
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
    evade: function() {
        if (!this.danger) {
          return new Victor(0,0);
        }
        var danger = this.danger;

        danger = danger.normalize().multiplyScalar(10);
        danger.subtract(this.velocity);

        return limit(danger, this.maxForce * 5 ); //limit steer with force
    },
    applyBehaviors: function() {
        //we apply diff weights to these forces
        var avoid = this.avoid(this.animals).multiplyScalar(1.25);
        var seek = this.seek().multiplyScalar(0.2);
        var evade = this.evade().multiplyScalar(4);

        //we apply these forces
        this.applyForce(avoid);
        this.applyForce(seek);
        this.applyForce(evade);

        //we update the position based on the new velocity
        this.updatePosition();
    },
    updateDisplay: function() {
        this.sprite.position.x = this.location.x;
        this.sprite.position.y = this.location.y;
        this.sprite.rotation = this.velocity.angle() + (Math.PI / 2);
    },
    pushState: function(state) {
        this.stack.push(state);
    },
    popState: function() {
        this.stack.pop();
    },
    update: function() {
        var _this = this;
        this.currentState = this.stack[this.stack.length - 1];
        if (this.currentState) {
            this.currentState();
        }
        this.checkDanger();
    },
    findFood: function() {
        this.destination = new Victor(200, 500);
        if (this.location.clone().subtract(this.destination).magnitude() <= 40) {
            this.popState();
            if (Math.random() > 0.5) {
                this.pushState(this.drinkWater);
            } else {
                this.pushState(this.goHome);
            }
        }

        this.applyBehaviors();
    },
    goHome: function() {
        this.destination = new Victor(100, 100);
        if (this.location.clone().subtract(this.destination).magnitude() <= 40) {
            this.maxSpeed = 2;
            this.maxForce = 0.1;
            this.popState();
            if (Math.random() > 0.5) {
                this.pushState(this.findFood);
            } else {
                this.pushState(this.drinkWater);
            }
        }
        this.applyBehaviors();
    },
    drinkWater: function() {
        this.destination = new Victor(1000, 100);
        if (this.location.clone().subtract(this.destination).magnitude() <= 40) {
            this.popState();
            if (Math.random() > 0.5) {
                this.pushState(this.findFood);
            } else {
                this.pushState(this.goHome);
            }
        }
        this.applyBehaviors();
    },
    checkDanger: function() {

        var danger = this.location.clone().subtract(new Victor(mousePosition.getX(), mousePosition.getY()))
        dangerDist = danger.magnitude();

        if (dangerDist < 50) {
            this.danger = danger;
            this.pushState(this.runAway);
        }
    },
    runAway: function() {
        if (!this.danger) {
            // this.stack.pop();
        }


        var danger = this.location.clone().subtract(new Victor(mousePosition.getX(), mousePosition.getY()))
        dangerDist = danger.magnitude();

        if (dangerDist > 150) {
            this.stack.pop();
            this.danger = null;
        } else {
            this.evade();
        }
        this.applyBehaviors();
    }
}



module.exports = function() {
    var temp = Object.create(animal);
    temp.init();
    return temp;
}
