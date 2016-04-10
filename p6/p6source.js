
///////////////////////////////
//  Global Variables
///////////////////////////////
var canvas;
var gl;
var m4;
var v3;

// Read shader source
var vertexSource;
var fragmentSource;

// Compile vertex shader
var vertexShader;

// Compile fragment shader
var fragmentShader;

// Attach the shaders and link
var shaderProgram;

// Matrix stack
var MStack;

// Model List
var sceneModels;
var sceneModelMatrices = [];
var groundModel;

var time;

var characterBody;
var characterRHand;
var characterLHand;
var characterRLeg;
var characterLLeg;

var theta = 0; // viewing angle on XY-plane from X- to Y-axis
var phi = 80; // viewing angle down from Z-axis
var fov = 30; // field of view angle perspective projection

var tilt = 0; // tilt angle for the camera

var characterPos = [-500, 0, 150]; // player's drone position
var facingDirection = [0, 0, -1]; // direction player is facing at every frame
var leaningAxis = [1, 0, 0]; // leaning axis of player's body (perpendicular to the facing direction)
var characterRot = 0; // XY orientation angle in drone mode
var characterSpd = 5; // player's drone speed
var isMovingForward = false;
var timeMoving = 0;

var eye;
var target = [0, 20, 0]; // position multiplier for camera
var up;

///////////////////////////////
//  Functions
///////////////////////////////

function start() {
    "use strict";

    initialize();

    loadData();
    
    draw();
}

function initialize() {
    // Get canvas, WebGL context, twgl.m4
    canvas = document.getElementById("mycanvas");
    gl = canvas.getContext("webgl");
    m4 = twgl.m4;
    v3 = twgl.v3;

    // Read shader source
    vertexSource = document.getElementById("vs").text;
    fragmentSource = document.getElementById("fs").text;

    // Compile vertex shader
    vertexShader = gl.createShader(gl.VERTEX_SHADER);
    gl.shaderSource(vertexShader, vertexSource);
    gl.compileShader(vertexShader);
    if (!gl.getShaderParameter(vertexShader, gl.COMPILE_STATUS)) {
        alert(gl.getShaderInfoLog(vertexShader)); return null;
    }

    // Compile fragment shader
    fragmentShader = gl.createShader(gl.FRAGMENT_SHADER);
    gl.shaderSource(fragmentShader, fragmentSource);
    gl.compileShader(fragmentShader);
    if (!gl.getShaderParameter(fragmentShader, gl.COMPILE_STATUS)) {
        alert(gl.getShaderInfoLog(fragmentShader)); return null;
    }

    // Attach the shaders and link
    shaderProgram = gl.createProgram();
    gl.attachShader(shaderProgram, vertexShader);
    gl.attachShader(shaderProgram, fragmentShader);
    gl.linkProgram(shaderProgram);
    if (!gl.getProgramParameter(shaderProgram, gl.LINK_STATUS)) {
        alert("Could not initialize shaders");
    }

    gl.useProgram(shaderProgram);

    // with the vertex shader, we need to pass it positions
    // as an attribute - so set up that communication
    shaderProgram.PositionAttribute = gl.getAttribLocation(shaderProgram, "vPosition");
    gl.enableVertexAttribArray(shaderProgram.PositionAttribute);

    shaderProgram.textureCoordAttribute = gl.getAttribLocation(shaderProgram, "vTexture");
    gl.enableVertexAttribArray(shaderProgram.textureCoordAttribute);

    shaderProgram.NormalAttribute = gl.getAttribLocation(shaderProgram, "vNormal");
    gl.enableVertexAttribArray(shaderProgram.NormalAttribute);

    // this gives us access to the matrix uniform
    shaderProgram.MVPmatrix = gl.getUniformLocation(shaderProgram, "uMVP");
    shaderProgram.NormalMatrix = gl.getUniformLocation(shaderProgram, "normalMatrix");
    shaderProgram.ModelViewMatrix = gl.getUniformLocation(shaderProgram, "modelViewMatrix");

    shaderProgram.USampler = gl.getUniformLocation(shaderProgram, "uSampler");
    gl.uniform1i(shaderProgram.USampler, 0);
    shaderProgram.Time = gl.getUniformLocation(shaderProgram, "time");

    shaderProgram.ambient = gl.getUniformLocation(shaderProgram, "ambient");
    shaderProgram.diffuse = gl.getUniformLocation(shaderProgram, "diffuse");
    shaderProgram.specular = gl.getUniformLocation(shaderProgram, "specular");
    shaderProgram.shininess = gl.getUniformLocation(shaderProgram, "shininess");
    shaderProgram.emission = gl.getUniformLocation(shaderProgram, "emission");

    sceneModels = [];
}

function loadData() {
    time = 0;

    groundModel = new Model(gl, groundData);

    var crystal = new Model(gl, crystalData);
    var house = new Model(gl, legoHouseData);

    sceneModels.push(crystal);
    sceneModelMatrices.push(
        m4.multiply(m4.scaling([1, 1, 1]),
        m4.multiply(m4.axisRotation([1, 0, 0], Math.PI / 2),
        m4.translation([-70, -15, 40]))));
    sceneModels.push(crystal);
    sceneModelMatrices.push(
        m4.multiply(m4.scaling([2, 2, 2]),
        m4.multiply(m4.axisRotation([0, 0, 1], Math.PI / 6),
        m4.multiply(m4.axisRotation([1, 0, 0], Math.PI / 2),
        m4.translation([200, -5, -200])))));
    sceneModels.push(crystal);
    sceneModelMatrices.push(
        m4.multiply(m4.scaling([1, 1, 0.5]),
        m4.multiply(m4.axisRotation([0, 0, 1], Math.PI / 6),
        m4.multiply(m4.axisRotation([1, 0, 0], Math.PI / 2),
        m4.translation([0, -20, -300])))));
    sceneModels.push(house);
    sceneModelMatrices.push(
        m4.multiply(m4.scaling([35, 35, 35]),
        m4.translation([0, -30, -600])));
    sceneModels.push(house);
    sceneModelMatrices.push(
        m4.multiply(m4.scaling([35, 35, 35]),
        m4.translation([400, -30, -600])));
    sceneModels.push(house);
    sceneModelMatrices.push(
            m4.multiply(m4.axisRotation([0, 1, 0], Math.PI / 2),
            m4.multiply(m4.scaling([35, 35, 35]),
            m4.translation([-300, -30, -300]))));

    characterBody = new Model(gl, legoBodyData);
    characterRHand = new Model(gl, legoRightHandData);
    characterLHand = new Model(gl, legoLeftHandData);
    characterRLeg = new Model(gl, legoRightLegData);
    characterLLeg = new Model(gl, legoLeftLegData);
}

// Scene (re-)draw routine
function draw() {
    // Update viewport size
    canvas.width = window.innerWidth - 22;
    canvas.height = window.innerHeight - 60;
    gl.viewport(0, 0, canvas.width, canvas.height);

    // Advance time
    time += 0.001;

    // Circle around the y-axis
    eye = [
        200 * Math.sin(toRad(theta)) * Math.sin(toRad(phi)),
        200 * Math.cos(toRad(phi)),
        200 * Math.cos(toRad(theta)) * Math.sin(toRad(phi))];
    up = [0, 1, 0];

    var tCamera = m4.inverse(m4.lookAt(eye, [0, 0, 0], up)); // get camera position
    tCamera = m4.multiply(m4.axisRotation(eye, toRad(tilt)), tCamera); // apply current tilt
    tCamera = m4.multiply(m4.translation(v3.mulScalar(target, -1)), tCamera); // place camera in the right position
    var tProjection = m4.perspective(toRad(fov), window.innerWidth / window.innerHeight, 50, 1000);
    //var modelViewMatrix;
    //var normalMatrix;
    //var tMVP;

    // Initialize Matrix Stack
    MStack = new MatrixStack(m4.identity(), tCamera, tProjection);

    var toOriginMatrix = m4.translation(target); // base matrix that sets model at origin

    // Clear screen, prepare for rendering
    gl.clearColor(0.0, 0.0, 0.0, 1.0);
    gl.enable(gl.DEPTH_TEST);
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

    // Set up global uniforms
    gl.uniform1f(shaderProgram.Time, time);

    //
    //  GROUND
    //

    gl.uniform4fv(shaderProgram.ambient, [0.1, 0.1, 0.1, 1.0]);
    gl.uniform4fv(shaderProgram.diffuse, [1.0, 0.88, 0.77, 10.0]);
    gl.uniform4fv(shaderProgram.specular, [0.1, 0.1, 0.05, 1.0]);
    gl.uniform1f(shaderProgram.shininess, 15.0);
    gl.uniform4fv(shaderProgram.emission, [0.0, 0.0, 0.0, 1.0]);

    MStack.push(); // relative to ground
    gl.uniformMatrix4fv(shaderProgram.ModelViewMatrix, false, MStack.getModelViewMatrix());
    gl.uniformMatrix4fv(shaderProgram.NormalMatrix, false, MStack.getNormalMatrix());
    gl.uniformMatrix4fv(shaderProgram.MVPmatrix, false, MStack.getModelViewProjMatrix());

    groundModel.bindAllBuffers(gl, shaderProgram.PositionAttribute, shaderProgram.textureCoordAttribute, shaderProgram.NormalAttribute, shaderProgram.USampler);
    groundModel.drawModel(gl);

    //
    //  CHARACTER
    //

    gl.uniform4fv(shaderProgram.ambient, [0.1, 0.1, 0.1, 1.0]);
    gl.uniform4fv(shaderProgram.diffuse, [0.5, 0.44, 0.385, 2.0]);
    gl.uniform4fv(shaderProgram.specular, [0.5, 0.44, 0.385, 2.0]);
    gl.uniform1f(shaderProgram.shininess, 15.0);
    gl.uniform4fv(shaderProgram.emission, [0.0, 0.0, 0.0, 1.0]);

    MStack.push(); // relative to body
    var characterBodyDynamicModelMatrix =
        m4.multiply(m4.scaling([10, 10, 10]),
        m4.multiply(m4.axisRotation([0, 1, 0], toRad(characterRot + 180)),
        m4.multiply(m4.translation([0, -40, 0]),
        toOriginMatrix)));
    if (isMovingForward) {
        characterBodyDynamicModelMatrix = m4.multiply(m4.axisRotation(leaningAxis, toRad(1.4 * characterSpd)), characterBodyDynamicModelMatrix);
    }
    MStack.transform(characterBodyDynamicModelMatrix);

    gl.uniformMatrix4fv(shaderProgram.ModelViewMatrix, false, MStack.getModelViewMatrix());
    gl.uniformMatrix4fv(shaderProgram.NormalMatrix, false, MStack.getNormalMatrix());
    gl.uniformMatrix4fv(shaderProgram.MVPmatrix, false, MStack.getModelViewProjMatrix());

    characterBody.bindAllBuffers(gl, shaderProgram.PositionAttribute, shaderProgram.textureCoordAttribute, shaderProgram.NormalAttribute, shaderProgram.USampler);
    characterBody.drawModel(gl);

    // HANDS
    gl.uniform4fv(shaderProgram.diffuse, [0.2, 0.6, 1.0, 10.0]);

    MStack.push(); // relative to right hand
    var characterRHDynamicModelMatrix = m4.translation([0, 3.5, 0]);
    if (isMovingForward) {
        characterRHDynamicModelMatrix = m4.multiply(m4.axisRotation([-1, 0, 0], toRad(16 * characterSpd * Math.sin(timeMoving))), characterRHDynamicModelMatrix);
    }
    MStack.transform(characterRHDynamicModelMatrix);

    gl.uniformMatrix4fv(shaderProgram.ModelViewMatrix, false, MStack.getModelViewMatrix());
    gl.uniformMatrix4fv(shaderProgram.NormalMatrix, false, MStack.getNormalMatrix());
    gl.uniformMatrix4fv(shaderProgram.MVPmatrix, false, MStack.getModelViewProjMatrix());

    characterRHand.bindAllBuffers(gl, shaderProgram.PositionAttribute, shaderProgram.textureCoordAttribute, shaderProgram.NormalAttribute, shaderProgram.USampler);
    characterRHand.drawModel(gl);
    MStack.pop(); // back to relative to body
    //
    MStack.push(); // relative to left hand
    var characterLHDynamicModelMatrix = m4.translation([0, 3.5, 0]);
    if (isMovingForward) {
        characterLHDynamicModelMatrix = m4.multiply(m4.axisRotation([1, 0, 0], toRad(16 * characterSpd * Math.sin(timeMoving))), characterLHDynamicModelMatrix);
    }
    MStack.transform(characterLHDynamicModelMatrix);

    gl.uniformMatrix4fv(shaderProgram.ModelViewMatrix, false, MStack.getModelViewMatrix());
    gl.uniformMatrix4fv(shaderProgram.NormalMatrix, false, MStack.getNormalMatrix());
    gl.uniformMatrix4fv(shaderProgram.MVPmatrix, false, MStack.getModelViewProjMatrix());

    characterLHand.bindAllBuffers(gl, shaderProgram.PositionAttribute, shaderProgram.textureCoordAttribute, shaderProgram.NormalAttribute, shaderProgram.USampler);
    characterLHand.drawModel(gl);
    MStack.pop(); // back to relative to body

    // LEGS
    MStack.push(); // relative to right leg
    var characterRLDynamicModelMatrix = m4.translation([0, 1.38, -.055]);
    if (isMovingForward) {
        characterRLDynamicModelMatrix = m4.multiply(m4.axisRotation([1, 0, 0], toRad(12 * characterSpd * Math.sin(timeMoving))), characterRLDynamicModelMatrix);
    }
    MStack.transform(characterRLDynamicModelMatrix);

    gl.uniformMatrix4fv(shaderProgram.ModelViewMatrix, false, MStack.getModelViewMatrix());
    gl.uniformMatrix4fv(shaderProgram.NormalMatrix, false, MStack.getNormalMatrix());
    gl.uniformMatrix4fv(shaderProgram.MVPmatrix, false, MStack.getModelViewProjMatrix());

    characterRLeg.bindAllBuffers(gl, shaderProgram.PositionAttribute, shaderProgram.textureCoordAttribute, shaderProgram.NormalAttribute, shaderProgram.USampler);
    characterRLeg.drawModel(gl);
    MStack.pop(); // back to relative to body
    //
    MStack.push(); // relative to left leg
    var characterLLDynamicModelMatrix = m4.translation([0, 1.38, -.055]);
    if (isMovingForward) {
        characterLLDynamicModelMatrix = m4.multiply(m4.axisRotation([-1, 0, 0], toRad(12 * characterSpd * Math.sin(timeMoving))), characterLLDynamicModelMatrix);
    }
    MStack.transform(characterLLDynamicModelMatrix);

    gl.uniformMatrix4fv(shaderProgram.ModelViewMatrix, false, MStack.getModelViewMatrix());
    gl.uniformMatrix4fv(shaderProgram.NormalMatrix, false, MStack.getNormalMatrix());
    gl.uniformMatrix4fv(shaderProgram.MVPmatrix, false, MStack.getModelViewProjMatrix());

    characterLLeg.bindAllBuffers(gl, shaderProgram.PositionAttribute, shaderProgram.textureCoordAttribute, shaderProgram.NormalAttribute, shaderProgram.USampler);
    characterLLeg.drawModel(gl);
    MStack.pop(); // back to relative to body
    MStack.pop(); // back to relative to ground

    //
    //  SCENE MODELS
    //
    for (var i = 0; i < sceneModels.length; i++) {
        MStack.push(); // relative to this model
        MStack.transform(sceneModelMatrices[i]);

        // Set up model uniforms & attributes
        gl.uniformMatrix4fv(shaderProgram.ModelViewMatrix, false, MStack.getModelViewMatrix());
        gl.uniformMatrix4fv(shaderProgram.NormalMatrix, false, MStack.getNormalMatrix());
        gl.uniformMatrix4fv(shaderProgram.MVPmatrix, false, MStack.getModelViewProjMatrix());
        gl.uniform4fv(shaderProgram.ambient, [0.1, 0.1, 0.1, 1.0]);
        gl.uniform4fv(shaderProgram.diffuse, [0.8, 0.5, 0.125, 4.0]);
        gl.uniform4fv(shaderProgram.specular, [1.0, 1.0, 0.5, 1.0]);
        gl.uniform1f(shaderProgram.shininess, 35.0);
        gl.uniform4fv(shaderProgram.emission, [0.7, 0.4, 0.0, 1.0]);


        sceneModels[i].bindAllBuffers(gl, shaderProgram.PositionAttribute, shaderProgram.textureCoordAttribute, shaderProgram.NormalAttribute, shaderProgram.USampler);
        sceneModels[i].drawModel(gl);
        MStack.pop(); // back to relative to ground
    }

    MStack.pop(); // back to relative to the absolute origin

    window.requestAnimationFrame(draw);
}

function toRad(angle) {
    return angle * Math.PI / 180;
}

// Input Control Manager
document.onkeydown = function (e) {
    switch (e.keyCode) {
            /* CAMERA CONTROLS */
        case 39: // right arrow >> spin camera left
            theta = (theta + 5) % 360;
            isMovingForward = false;
            timeMoving = 0;
            facingDirection =
                v3.normalize(
                m4.transformDirection(
                m4.axisRotation([0, 1, 0], toRad(5)),
                facingDirection));
            leaningDirection =
                v3.normalize(
                m4.transformDirection(
                m4.axisRotation([0, 1, 0], toRad(5)),
                leaningDirection));
            break;

        case 37: // left arrow >> spin camera right
            theta = (theta - 5) % 360;
            isMovingForward = false;
            timeMoving = 0;
            facingDirection =
                v3.normalize(
                m4.transformDirection(
                m4.axisRotation([0, 1, 0], toRad(-5)),
                facingDirection));
            leaningDirection =
                v3.normalize(
                m4.transformDirection(
                m4.axisRotation([0, 1, 0], toRad(-5)),
                leaningDirection));
            break;

        case 40: // down arrow >> spin camera up
            if (phi < 90) {
                phi = (phi + 5);
            }
            isMovingForward = false;
            timeMoving = 0;
            break;

        case 38: // up arrow >> spin camera down
            if (phi > 5) {
                phi = (phi - 5);
            }
            isMovingForward = false;
            timeMoving = 0;
            break;

        case 84: // T key >> tilt camera counter clockwise
            if (!event.shiftKey) {
                tilt += 10;
            }
                // Shift + T >> tilt camera clockwise
            else {
                tilt -= 10;
            }
            isMovingForward = false;
            timeMoving = 0;
            break;

        case 70: // F key >> -FOV
            if (!event.shiftKey) {
                if (fov > 5) {
                    fov -= toRad(30);
                }
            }
                // Shift + F key >> +FOV
            else {
                if (fov < 50) {
                    fov += toRad(30);
                }
            }
            isMovingForward = false;
            timeMoving = 0;
            break;

            /* PLAYER'S CHARACTER CONTROLS */
        case 87: // W key >> move character forward
            target = [
                target[0] + characterSpd * facingDirection[0],
                target[1],
                target[2] + characterSpd * facingDirection[2]
            ];
            characterRot = 0 + theta;
            isMovingForward = true;
            timeMoving += 0.25;
            break;

        case 83: // S key >> move character backward
            target = [
                target[0] - characterSpd * facingDirection[0],
                target[1],
                target[2] - characterSpd * facingDirection[2]
            ];
            characterRot = 180 + theta;
            isMovingForward = true;
            timeMoving += 0.25;
            break;

        case 65: // A key >> turn character right
            var direction = v3.cross(up, facingDirection);
            target = [
                target[0] + characterSpd * direction[0],
                target[1],
                target[2] + characterSpd * direction[2]
            ];
            characterRot = 90 + theta;
            isMovingForward = true;
            timeMoving += 0.25;
            break;

        case 68: // D key >> turn character left
            var direction = v3.cross(up, facingDirection);
            target = [
                target[0] - characterSpd * direction[0],
                target[1],
                target[2] - characterSpd * direction[2]
            ];
            characterRot = -90 + theta;
            isMovingForward = true;
            timeMoving += 0.25;
            break;

        default:
            isMovingForward = false;
            isMovingBackward = false;
            timeMoving = 0;
    }
};
document.onkeyup = function (e) {
    switch (e.keyCode) {
        case 87: // W key >> move character forward
        case 65: // A key >> turn character right
            isMovingForward = false;
            timeMoving = 0;
            break;

        case 83: // S key >> move character backward
        case 68: // D key >> turn character left
            isMovingForward = false;
            timeMoving = 0;
            break;
    }
}