var mousePositions = {
    x: null,
    y: null
};

window.addEventListener('mousemove', function(event) {
    // console.log(event);
    mousePositions = {
        x: event.offsetX,
        y: event.offsetY
    }
});

module.exports = {
    getX: function() {
        return mousePositions.x;
    },
    getY: function() {
        return mousePositions.y;
    }
}
