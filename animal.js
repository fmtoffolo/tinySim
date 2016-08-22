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
        //life stats
        this.hp = 100;
        this.maxHp = 100;
        this.stamina = 30;
        this.maxStamina = 30;
    },
    gainStamina: function(amount) {
        if (this.stamina + amount > this.maxStamina) {
            this.stamina = this.maxStamina;
        } else {
            this.stamina += amount;
        }
    },
    loseStamina: function(amount) {
        if (this.stamina - amount < 0) {
            this.stamina = 0;
        } else {
            this.stamina -= amount;
        }
    },
    calculateHp: function() {
        if (this.stamina === 0) {
            this.hp -= 0.1;
        }
        if (this.hp < 0) {
            this.hp = 0;
        }
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
        // var minBrakeDistance = 70;
        //it has to start braking at the distance needed if he was going max speed
        var minBrakeDistance = this.maxSpeed / this.maxForce;
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
        var minSeparation = 25;
        animals.forEach(function(animal) {

            var separation = _this.location.clone().add(_this.velocity);
            separation = separation.subtract(animal.location.clone().add(animal.velocity));
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

        var danger = this.danger.clone();

        danger = danger.normalize().multiplyScalar(this.maxSpeed * 5 * this.stamina / this.maxStamina);
        danger.subtract(this.velocity);
        danger = limit(danger, this.maxForce) //steer
        var avoid = this.avoid(this.animals).multiplyScalar(1.5); //we try to avoid other animals
        danger.multiplyScalar(5);
        //we apply both forces
        this.applyForce(avoid);
        this.applyForce(danger);

        //update stamina
        this.loseStamina(0.1);
    },
    move: function() {

        //we apply diff weights to these forces
        var avoid = this.avoid(this.animals).multiplyScalar(1.5);
        var seek = this.seek().multiplyScalar(0.5);
        //we apply these forces
        this.applyForce(avoid);
        this.applyForce(seek);

        //update stamina
        this.gainStamina(0.05);
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
        this.checkDanger();
        if (this.currentState) {
            this.currentState();
        }
        this.updatePosition();
        this.calculateHp();

    },
    findFood: function() {
        this.destination = new Victor(200, 500);
        this.move();
        if (this.location.clone().subtract(this.destination).magnitude() <= 50) {
            this.popState();
            if (Math.random() > 0.5) {
                this.pushState(this.drinkWater);
            } else {
                this.pushState(this.goHome);
            }
        }
    },
    goHome: function() {
        this.destination = new Victor(100, 100);
        this.move();
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

    },
    drinkWater: function() {
        this.destination = new Victor(1000, 100);
        this.move();
        if (this.location.clone().subtract(this.destination).magnitude() <= 40) {
            this.popState();
            if (Math.random() > 0.5) {
                this.pushState(this.findFood);
            } else {
                this.pushState(this.goHome);
            }
        }

    },
    stop: function() {
        if (parseInt(this.velocity.magnitude().toFixed(1)) === 0) {
            this.stack.pop();
            return;
        }
        var brake = this.velocity.clone().multiplyScalar(-this.maxForce);
        this.applyForce(brake);
    },
    rest: function() {
        if (this.stamina > 0) {
            this.stack.pop();
        }
    },
    checkDanger: function() {

        var danger = this.location.clone().subtract(new Victor(mousePosition.getX(), mousePosition.getY()))
        dangerDist = danger.magnitude();

        if (this.stack[this.stack.length - 1].name === 'runAway') {
            return;
        }

        if (dangerDist < 50) {

            this.pushState(this.runAway);
        }
    },
    runAway: function() {

        var danger = this.location.clone().subtract(new Victor(mousePosition.getX(), mousePosition.getY()))
        dangerDist = danger.magnitude();
        this.danger = danger;

        if (dangerDist > 150) {
            this.stack.pop();
            if (!this.stack.length) {
                this.stack.push(this.stop);
            }
            this.danger = null;
        } else if (this.stamina === 0) {
            this.stack.pop();
            this.stack.push(this.stop);
        } else {
            this.evade();
        }

    }
}



module.exports = function() {
    var temp = Object.create(animal);
    temp.init();
    return temp;
}
