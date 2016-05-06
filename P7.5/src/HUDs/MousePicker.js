////////////////////////////////////////////
//
//  Mouse Picker for World Interaction
//
//  -it detects where the user has the
//  cursor over and keeps track of the
//  location of that cursor in 3D world
//  space.
//
//  -it can used with either
//  orthographic or perspective 
//  projections and different views
//
//  -it can be used to get the location
//  of a mouse click, current mouse
//  location, and more. This choice,
//  however, is to be implemented in
//  code that is external to this class
//
////////////////////////////////////////////

// The current ray pointing from mouse over
// the canvas display to the world at a
// certain direction
var currRay;

// The projection type and view type
// being used for computation
// -these need to be passed down
var proj;
var view;

function MousePicker(viewMat, projMat) {

    this.proj = projMat;
    this.view = viewMat;

}

MousePicker.prototype.getCurrRay = function () {
    return this.currRay;
}

MousePicker.prototype.update = function (canvas, evt, viewMat) {
    this.view = viewMat;
    this.currRay = this.calcMouseRay(canvas, evt);
}

MousePicker.prototype.calcMouseRay = function (canvas, evt) {
    var mousePos = this.getMousePos(evt);
    var normCoords2d = this.getNormalizedDeviceCoords(canvas, mousePos);
    var clipCoords4d = [
        normCoords2d[0],
        normCoords2d[1],
        -1.0,
        1,0
    ];
    var eyeCoords4d = this.toEyeCoords(clipCoords4d);
    var mouseRay = this.toWorldCoords(eyeCoords4d);
    return mouseRay;
}

MousePicker.prototype.getMousePos = function (evt) {
    return {
        x: evt.clientX,
        y: evt.clientY
    };
}

MousePicker.prototype.getNormalizedDeviceCoords = function (canvas, mousePos) {
    var vec2d = [
        ((2.0 * mousePos.x) / canvas.width) - 1.0,
        1.0 - ((2.0 * mousePos.y) / canvas.height)
    ];
    return vec2d;
}

MousePicker.prototype.toEyeCoords = function (clipCoords4d) {
    var eyeCoords4d = transform(twgl.m4.inverse(this.proj), clipCoords4d);
    return [
        eyeCoords4d[0],
        eyeCoords4d[1],
        -1.0,
        0.0
    ];
}

MousePicker.prototype.toWorldCoords = function (eyeCoords3d) {
    var mouseRay = transform(twgl.m4.inverse(this.view), eyeCoords3d);
    mouseRay = twgl.v3.normalize([mouseRay[0],mouseRay[1],mouseRay[2]]);
    return mouseRay;
}

////////////////////////////////////////////
//
//  HUD Mouse Picker for HUD Interaction
//
//  -it detects where the user has the
//  cursor over and keeps track of the
//  location of that cursor in 2D viewport
//  space.
//
//  -it can be used to get the location
//  of a mouse click, current mouse
//  location, and more. This choice,
//  however, is to be implemented in
//  code that is external to this class
//
////////////////////////////////////////////

var currHUDRay;

function HUDMousePicker() {

}

HUDMousePicker.prototype.update = function (canvas, evt) {
    this.currHUDRay = this.getMousePos(canvas, evt);
}

HUDMousePicker.prototype.getMousePos = function (canvas, evt) {
    return [
        2 * (evt.clientX / canvas.width) - 1,
        -2 * (evt.clientY / canvas.height) + 1
    ];
}