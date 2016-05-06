/**
 * Created by gleicher on 10/9/2015.
 */

/*
this is the "main" file - it gets loaded last - after all the objects are loaded
make sure that twgl is loaded first

it sets up the main function to be called on window.onload

 */

 var isValidGraphicsObject = function (object) {
    if(object.name === undefined) {
        console.log("warning: GraphicsObject missing name field");
        return false;
    }

    if(typeof object.draw !== "function" && typeof object.drawAfter !== "function") {
        console.log("warning: GraphicsObject of type " + object.name + " does not contain either a draw or drawAfter method");
        return false;
    }

    if(typeof object.center !== "function") {
        console.log("warning: GraphicsObject of type " + object.name + " does not contain a center method. ");
        return false;
    }

    if(typeof object.init !== "function") {
        console.log("warning: GraphicsObject of type " + object.name + " does not contain an init method. ");
        return false;
    }

    return true;
 }
window.onload = function() {
    "use strict";

    var rot = 0.01;

    // set up the canvas and context
    var canvas = document.createElement("canvas");
    canvas.setAttribute("width",600);
    canvas.setAttribute("height",600);
    document.body.appendChild(canvas);

    // make a place to put the drawing controls - a div
    var controls = document.createElement("DIV");
    controls.id = "controls";
    document.body.appendChild(controls);

    // a switch between camera modes
    var uiMode = document.createElement("select");
    uiMode.innerHTML += "<option>Spaceship Player</option>";
    uiMode.innerHTML += "<option>Player</option>";
    uiMode.innerHTML += "<option>ArcBall</option>";
    uiMode.innerHTML += "<option>Drive</option>";
    uiMode.innerHTML += "<option>Fly</option>";
    uiMode.innerHTML += "</select>";
    controls.appendChild(uiMode);

    var resetButton = document.createElement("button");
    resetButton.innerHTML = "Reset View";
    resetButton.onclick = function() {
        // note - this knows about arcball (defined later) since arcball is lifted
        arcball.reset();

        drivePos = [0,.2,5];
        driveTheta = 0;
        driveXTheta = 0;

    }
    controls.appendChild(resetButton);

    // make some checkboxes - using my cheesy panels code
    var checkboxes = makeCheckBoxes([ ["Run",1], ["Examine",0] ]); //


    // make some sliders - using my cheesy panels code
    var sliders = makeSliders([["TimeOfDay",0.0,24.0,12.0]]);

    // this could be gl = canvas.getContext("webgl");
    // but twgl is more robust
    var gl = twgl.getWebGLContext(canvas);

    // make a fake drawing state for the object initialization
    var drawingState = {
        gl: gl,
        shaderProgram: initShader(gl),
        proj : twgl.m4.identity(),
        view : twgl.m4.identity(),
        camera : twgl.m4.identity(),
        sunDirection : [0,1,0]
    }
    

    // information for the cameras
    var lookAt = [0,0,0];
    var lookFrom = [0,5,-10];
    var fov = 0.5;

    var arcball = new ArcBall(canvas);

    // for timing
    var realtime = 0
    var lastTime = Date.now();

    // parameters for driving
    var drivePos = [0,.2,5];
    var driveTheta = 0;
    var driveXTheta = 0;

    // parameters for player mode
    var playerXaxis = [0, 0, -1];
    var playerYaxis = [1, 0, 0];
    var characterRot = 0; 
    var characterSpd = 1;
    var isMovingForward = false;
    var timeMoving = 0;

    var theta = 0; // viewing angle on XY-plane from X- to Y-axis
    var phi = 80; // viewing angle down from Z-axis
    var zoom = 20;
    var tilt = 0; // tilt angle for the camera

    var eye;
    var target = [0, 0, 0]; // position multiplier for camera
    var up = [0, 1, 0];

    // parameters for spaceship player mode
    var MAX_SPEED = 4;
    var ACCEL_FACTOR = 1.5;
    var activePlayer;
    var spaceshipXaxis = [0, 0, -1];
    var spaceshipYaxis = [-1, 0, 0];
    var spaceshipTiltX = 0;
    var spaceshipTiltY = 0;
    var spaceshipRot = 0;
    var spaceshipSpd = 0;
    var wingOpen = false;
    var wingOpenValue = 0;
    var moveLock = false;

    var theta2 = 0; // viewing angle on XY-plane from X- to Y-axis
    var phi2 = 80; // viewing angle down from Z-axis
    var zoom2 = 20;
    var tilt2 = 0; // tilt angle for the camera

    var eye2;
    var target2 = [0, 0, 0]; // position multiplier for camera
    var up2 = [0, 1, 0];

    // For FPS purposes
    var now;
    var then = Date.now() / 1000;
    var numFramesToAverage = 16;
    var frameTimeHistory = [];
    var frameTimeIndex = 0;
    var totalTimeForFrames = 0;

    // cheesy keyboard handling
    var keysdown = {};

    document.body.onkeydown = function(e) {
        var event = window.event ? window.event : e;
        keysdown[event.keyCode] = true;
        e.stopPropagation();
    };
    document.body.onkeyup = function(e) {
        var event = window.event ? window.event : e;
        delete keysdown[event.keyCode];
        e.stopPropagation();
    };

    // TEMPORARY CODE BLOCK 
    var textureImgData = "data:image/jpeg;base64,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";

    var rawXWingBody = new RawModel(drawingState, 
    	xWingBodyData, 
    	xWingBodyTexData);
    var rawXWingWindow = new RawModel(drawingState, 
    	xWingWindowData, 
    	xWingWindowTexData);
    var rawXWingR2D2 = new RawModel(drawingState,
        xWingR2D2Data,
        xWingR2D2TexData);
    var rawXWingWingSet1 = new RawModel(drawingState,
        xWingWingSet1Data,
        xWingWingSet1TexData);
    var rawXWingWingSet2 = new RawModel(drawingState,
        xWingWingSet2Data,
        xWingWingSet2TexData);
    var rawArc170Body = new RawModel(drawingState,
        arc170BodyData,
        arc170BodyTexData);
    var rawGround = new RawModel(drawingState,
        groundData,
        groundTexData);

    var temp;
    //temp = new Model(drawingState.gl,
    //    crystalData,
    //    textureImgData,
    //    0.1, [2, 0, 0],
    //    "crystal");
    //grobjects.push(temp);
    temp = new Model(drawingState,
        rawGround,
        1, [0, -3.3, 0],
        [0, 0, 1], 0,
        "ground");
    grobjects.push(temp);
    var xWing = new Model(drawingState,
        rawXWingBody,
        10, [0, 0, 0],
        [0, 0, 1], 0,
        "x wing body");
    xWing.addChild(drawingState,
        rawXWingWindow,
        "x wing window");
    xWing.addChild(drawingState,
        rawXWingR2D2,
        "x wing r2d2");
    xWing.addChild(drawingState,
        rawXWingWingSet1,
        "x wing wing set 1");
    xWing.addChild(drawingState,
        rawXWingWingSet2,
        "x wing wing set 2");
    grobjects.push(xWing);
    //temp = new Model(drawingState,
    //    snowTerrainData,
    //    snowTerrainTexData,
    //    50, [0, -15, 0],
    //    [0, 1, 0], 0,
    //    "snow terrain");
    //grobjects.push(temp);
    temp = new Model(drawingState,
        rawArc170Body,
        0.5, [0, -3.2, 0],
        [0, 1, 0], toRad(180),
        "arc 170 body");
    grobjects.push(temp);
    var terrain0 = new Terrain(drawingState, 0, 0, LoadedImageFiles["terrainHeightMap.png"], LoadedImageFiles["686.jpg"], LoadedImageFiles["686_NRM.jpg"], 0, 0);
    var aimHUDElement = new gui(gl, LoadedImageFiles["aimHUD.png"], [0.15, 0.3, 0], [0, 0.45, 0]);
    var actionBarHUDElement = new gui(gl, LoadedImageFiles["actionBarHUD.png"], [0.225, 0.45, 0], [0, -1.22, 0]);
    var menuHUDElement = new gui(gl, LoadedImageFiles["menuHUD.png"], [0.225, 0.45, 0], [1.022, 0.54, 0]);
    // TEMPORARY CODE BLOCK END

    // a selector for which object should be examined
    var toExamine = document.createElement("select");
    grobjects.forEach(function (obj) {
        toExamine.innerHTML += "<option>" + obj.name + "</option>";
    });
    controls.appendChild(toExamine);

    //
    initSkybox(canvas, drawingState.view);
    // the actual draw function - which is the main "loop"
    function draw() {
        // advance the clock appropriately (unless its stopped)
        var curTime = Date.now();
        if (checkboxes.Run.checked) {
            realtime += (curTime - lastTime);
        }
        lastTime = curTime;

        canvas.width = window.innerWidth - 25;
        canvas.height = window.innerHeight - 110;
        gl.viewport(0, 0, canvas.width, canvas.height);

        // first, let's clear the screen
        gl.clearColor(0.0, 0.0, 0.0, 1.0);
        gl.enable(gl.DEPTH_TEST);
        gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

        ////////////////// COMPUTE FPS ///////////////////////////
        var fpsElement = document.getElementById("fps");
        var now = Date.now() / 1000;  // get time in seconds

        // compute time since last frame
        var elapsedTime = now - then;
        then = now;

        // update the frame history.
        // Add the new time and substract the oldest time from the total
        totalTimeForFrames += elapsedTime - (frameTimeHistory[frameTimeIndex] || 0);
        // record the new time
        frameTimeHistory[frameTimeIndex] = elapsedTime;
        // advance the history index.
        frameTimeIndex = (frameTimeIndex + 1) % numFramesToAverage;

        // compute fps
        var averageElapsedTime = totalTimeForFrames / numFramesToAverage;
        var fps = 1 / averageElapsedTime;
        fpsElement.innerText = fps.toFixed(2);
        /////////////// COMPUTE FPS END ///////////////////////////

        // figure out the transforms
        var projM = twgl.m4.perspective(fov, window.innerWidth / window.innerHeight, 0.1, 5000);
        var cameraM = twgl.m4.lookAt(lookFrom,lookAt,[0,1,0]);
        var viewM = twgl.m4.inverse(cameraM);

        activePlayer = xWing;

        // implement the camera UI
        if (uiMode.value == "ArcBall") {
            viewM = arcball.getMatrix();
            twgl.m4.setTranslation(viewM, [0, 0, -10], viewM);
            if (keysdown[70]) {
                if (keysdown[16]) {
                    fov += 0.01;
                }
                else {
                    fov -= 0.01;
                }
            }

        } else if (uiMode.value == "Drive") {
            if (keysdown[65]) { driveTheta += .02; }
            if (keysdown[68]) { driveTheta -= .02; }
            if (keysdown[87]) {
                var dz = Math.cos(driveTheta);
                var dx = Math.sin(driveTheta);
                drivePos[0] -= .05*dx;
                drivePos[2] -= .05*dz;
            }
            if (keysdown[83]) {
                var dz = Math.cos(driveTheta);
                var dx = Math.sin(driveTheta);
                drivePos[0] += .05*dx;
                drivePos[2] += .05*dz;
            }

            cameraM = twgl.m4.rotationY(driveTheta);
            twgl.m4.setTranslation(cameraM, drivePos, cameraM);
            viewM = twgl.m4.inverse(cameraM);
        }else if (uiMode.value == "Fly") {

            if (keysdown[65] || keysdown[37]) { 
                driveTheta += .07; 
            }else if (keysdown[68] || keysdown[39]) { 
                driveTheta -= .07; 
            }

            if (keysdown[38]) { driveXTheta += .07; }
            if (keysdown[40]) { driveXTheta -= .07; }

            var dz = Math.cos(driveTheta);
            var dx = Math.sin(driveTheta);
            var dy = Math.sin(driveXTheta);

            if (keysdown[87]) {
                drivePos[0] -= .1*dx;
                drivePos[2] -= .1*dz;
                drivePos[1] += .1 * dy;
            }

            if (keysdown[83]) {
                drivePos[0] += .1*dx;
                drivePos[2] += .1*dz;
                drivePos[1] -= .1 * dy;
            }

            cameraM = twgl.m4.rotationX(driveXTheta);
            twgl.m4.multiply(cameraM, twgl.m4.rotationY(driveTheta), cameraM);
            twgl.m4.setTranslation(cameraM, drivePos, cameraM);
            viewM = twgl.m4.inverse(cameraM);
        } else if (uiMode.value == "Player") {
            inputControl();

            eye = [
                zoom * Math.sin(toRad(theta)) * Math.sin(toRad(phi)),
                zoom * Math.cos(toRad(phi)),
                zoom * Math.cos(toRad(theta)) * Math.sin(toRad(phi))];
            var tCamera = twgl.m4.inverse(twgl.m4.lookAt(eye, [0, 0, 0], up)); // get camera position
            tCamera = twgl.m4.multiply(twgl.m4.axisRotation(eye, toRad(tilt)), tCamera); // apply current tilt
            viewM = twgl.m4.multiply(twgl.m4.translation(twgl.v3.mulScalar(target, -1)), tCamera); // place camera in the right position
        } else if (uiMode.value == "Spaceship Player") {
            spaceshipInputControl();

            grobjects[grobjects.length - 2].setTranslation(twgl.m4.translation([target2[0], target2[1], target2[2]]));
            grobjects[grobjects.length - 2].setRotation(twgl.m4.axisRotation(spaceshipXaxis, toRad(spaceshipTiltX)));
            grobjects[grobjects.length - 2].addRotation(twgl.m4.axisRotation(spaceshipYaxis, toRad(spaceshipTiltY)));
            grobjects[grobjects.length - 2].addRotation(twgl.m4.axisRotation([0, 1, 0], toRad(180 + theta2)));
            grobjects[grobjects.length - 2].addRotation(twgl.m4.axisRotation([-1, 0, 0], toRad(phi2 - 72.5)));

            grobjects[grobjects.length - 2].children["x wing wing set 1"].addRotation(twgl.m4.axisRotation([0, 0, 1], -wingOpenValue));
            grobjects[grobjects.length - 2].children["x wing wing set 2"].addRotation(twgl.m4.axisRotation([0, 0, 1], wingOpenValue));
            if (wingOpen) {
                if (wingOpenValue < 0.3) {
                    wingOpenValue += 0.01;
                }
            }
            else {
                if (wingOpenValue > 0) {
                    wingOpenValue -= 0.01;
                }
            }

            eye2 = [
                zoom2 * Math.sin(toRad(theta2)) * Math.sin(toRad(phi2)),
                zoom2 * Math.cos(toRad(phi2)),
                zoom2 * Math.cos(toRad(theta2)) * Math.sin(toRad(phi2))];
            var tCamera = twgl.m4.inverse(twgl.m4.lookAt(eye2, [0, 0, 0], up2)); // get camera position
            tCamera = twgl.m4.multiply(twgl.m4.axisRotation(eye2, toRad(tilt2)), tCamera); // apply current tilt
            viewM = twgl.m4.multiply(twgl.m4.translation(twgl.v3.mulScalar(target2, -1)), tCamera); // place camera in the right position
        }

        // get lighting information
        var tod = Number(sliders.TimeOfDay.value);
        var sunAngle = Math.PI * (tod-6)/12;
        var sunDirection = [100000.0 * Math.cos(sunAngle), 100000.0 * Math.sin(sunAngle), 0];


        // make a real drawing state for drawing
        var drawingState = {
            gl : gl,
            proj : projM,   // twgl.m4.identity(),
            view : viewM,   // twgl.m4.identity(),
            camera : cameraM,
            timeOfDay : tod,
            sunDirection : sunDirection,
            realtime : realtime
        }

        terrain0.draw(drawingState);
        // initialize all of the objects that haven't yet been initialized (that way objects can be added at any point)
        grobjects.forEach(function(obj) { 
            if(!obj.__initialized) {
                if(isValidGraphicsObject(obj)){
                    obj.init(drawingState);
                    obj.__initialized = true;
                }
            }
        });


        // now draw all of the objects - unless we're in examine mode
        if (checkboxes.Examine.checked) {
            // get the examined object - too bad this is an array not an object
            var examined = undefined;
            grobjects.forEach(function(obj) { if (obj.name == toExamine.value) {examined=obj;}});
            var ctr = examined.center(drawingState);
            var shift = twgl.m4.translation([-ctr[0],-ctr[1],-ctr[2]]);
            twgl.m4.multiply(shift,drawingState.view,drawingState.view);

            if(examined.draw) examined.draw(drawingState);
            if(examined.drawAfter) examined.drawAfter(drawingState);
        } else {

            grobjects.forEach(function (obj) {
                if(obj.draw) obj.draw(drawingState);
            });

            grobjects.forEach(function (obj) {
                if(obj.drawAfter) obj.drawAfter();
            });
        }

        drawSkybox(drawingState, tod);
        if (uiMode.value == "Spaceship Player") {
        	aimHUDElement.renderGUI(gl);
        	actionBarHUDElement.renderGUI(gl);
        	menuHUDElement.renderGUI(gl);
    	}
        window.requestAnimationFrame(draw);
    };
    draw();

    function inputControl() {
        /* CAMERA CONTROLS */
        if (keysdown[39]) {
            // right arrow >> spin camera right
            theta = (theta - 5) % 360;
            playerXaxis =
                twgl.v3.normalize(
                twgl.m4.transformDirection(
                twgl.m4.axisRotation([0, 1, 0], toRad(-5)),
                playerXaxis));
        }

        if (keysdown[37]) {
            // left arrow >> spin camera left
            theta = (theta + 5) % 360;
            playerXaxis =
                twgl.v3.normalize(
                twgl.m4.transformDirection(
                twgl.m4.axisRotation([0, 1, 0], toRad(5)),
                playerXaxis));
        }

        if (keysdown[40]) {
            // down arrow >> spin camera up
            if (phi < 90) {
                phi = (phi + 5);
            }
        }

        if (keysdown[38]) {
            // up arrow >> spin camera down
            if (phi > 5) {
                phi = (phi - 5);
            }
        }

        if (keysdown[84]) {
            // T key >> tilt camera counter clockwise
            if (!keysdown[16]) {
                tilt += 5;
            }
                // Shift + T >> tilt camera clockwise
            else {
                tilt -= 5;
            }
        }

        if (keysdown[70]) {
            // F key >> -FOV
            if (!keysdown[16]) {
                if (zoom > 5) {
                    zoom -= 1;
                }
            }
                // Shift + F key >> +FOV
            else {
                if (zoom < 30) {
                    zoom += 1;
                }
            }
        }

        /* PLAYER'S CHARACTER CONTROLS */
        if (keysdown[87]) {
            // W key >> move character forward
            if (!keysdown[83]) {
                target = [
                    target[0] + characterSpd * playerXaxis[0],
                    target[1],
                    target[2] + characterSpd * playerXaxis[2]
                ];
                if (keysdown[65]) characterRot = 45 + theta;
                else if (keysdown[68]) characterRot = -45 + theta;
                else characterRot = theta;
                isMovingForward = true;
            }
            else isMovingForward = false;
        }

        if (keysdown[83]) {
            // S key >> move character backward
            if (!keysdown[87]) {
                target = [
                    target[0] - characterSpd * playerXaxis[0],
                    target[1],
                    target[2] - characterSpd * playerXaxis[2]
                ];
                if (keysdown[65]) characterRot = 135 + theta;
                else if (keysdown[68]) characterRot = -135 + theta;
                else characterRot = 180 + theta;
                isMovingForward = true;
            }
            else isMovingForward = false;
        }

        if (keysdown[65]) {
            // A key >> turn character right
            if (!keysdown[68]) {
                var direction = twgl.v3.cross(up, playerXaxis);
                target = [
                    target[0] + characterSpd * direction[0],
                    target[1],
                    target[2] + characterSpd * direction[2]
                ];
                if (keysdown[87]) characterRot = 45 + theta;
                else if (keysdown[83]) characterRot = 135 + theta;
                else characterRot = 90 + theta;
                isMovingForward = true;
            }
            else isMovingForward = false;
        }

        if (keysdown[68]) {
            // D key >> turn character left
            if (!keysdown[65]) {
                var direction = twgl.v3.cross(up, playerXaxis);
                target = [
                    target[0] - characterSpd * direction[0],
                    target[1],
                    target[2] - characterSpd * direction[2]
                ];
                if (keysdown[87]) characterRot = -45 + theta;
                else if (keysdown[83]) characterRot = -135 + theta;
                else characterRot = -90 + theta;
                isMovingForward = true;
            }
            else isMovingForward = false;
        }
    }


    function spaceshipInputControl() {
        /* CAMERA CONTROLS */
        if (keysdown[39]) {
            // right arrow >> spin camera right
            theta2 = (theta2 - 1.5) % 360;
            spaceshipXaxis =
                twgl.v3.normalize(
                twgl.m4.transformDirection(
                twgl.m4.axisRotation([0, 1, 0], toRad(-1.5)),
                spaceshipXaxis));
            spaceshipYaxis =
                twgl.v3.normalize(
                twgl.m4.transformDirection(
                twgl.m4.axisRotation([0, 1, 0], toRad(-1.5)),
                spaceshipYaxis));

            if (spaceshipTiltX < 20) {
                spaceshipTiltX += (Math.cos(toRad((spaceshipTiltX) * 90 / 20)) + 1) / 2;
            }
        }
        else {
            if (spaceshipTiltX > 0.001) {
                spaceshipTiltX -= (Math.cos(toRad((spaceshipTiltX) * 90 / 20)) + 1) / 2;
            }
        }

        if (keysdown[37]) {
            // left arrow >> spin camera left
            theta2 = (theta2 + 1.5) % 360;
            spaceshipXaxis =
                twgl.v3.normalize(
                twgl.m4.transformDirection(
                twgl.m4.axisRotation([0, 1, 0], toRad(1.5)),
                spaceshipXaxis));
            spaceshipYaxis =
                twgl.v3.normalize(
                twgl.m4.transformDirection(
                twgl.m4.axisRotation([0, 1, 0], toRad(1.5)),
                spaceshipYaxis));

            if (spaceshipTiltX > -20) {
                spaceshipTiltX -= (Math.cos(toRad((spaceshipTiltX) * 90 / 20)) + 1) / 2;
            }
        }
        else {
            if (spaceshipTiltX < -0.001) {
                spaceshipTiltX += (Math.cos(toRad((spaceshipTiltX) * 90 / 20)) + 1) / 2;
            }
        }

        if (keysdown[40]) {
            // down arrow >> orient camera down
            if (phi2 > 30) {
                phi2 = (phi2 - 1.5);
                spaceshipXaxis =
                    twgl.v3.normalize(
                    twgl.m4.transformDirection(
                    twgl.m4.axisRotation(spaceshipYaxis, toRad(1.5)),
                    spaceshipXaxis));
            }

            if (spaceshipTiltY < 15) {
                spaceshipTiltY += (Math.cos(toRad((spaceshipTiltY) * 90 / 20)) + 1) / 2;
            }
        }
        else {
            if (spaceshipTiltY > 0.001) {
                spaceshipTiltY -= (Math.cos(toRad((spaceshipTiltY) * 90 / 20)) + 1) / 2;
            }
        }

        if (keysdown[38]) {
            // up arrow >> orient camera up
            if (phi2 < 130) {
                phi2 = (phi2 + 1.5);
                spaceshipXaxis =
                    twgl.v3.normalize(
                    twgl.m4.transformDirection(
                    twgl.m4.axisRotation(spaceshipYaxis, toRad(-1.5)),
                    spaceshipXaxis));
            }

            if (spaceshipTiltY > -15) {
                spaceshipTiltY -= (Math.cos(toRad((spaceshipTiltY) * 90 / 20)) + 1) / 2;
            }
        }
        else {
            if (spaceshipTiltY < -0.001) {
                spaceshipTiltY += (Math.cos(toRad((spaceshipTiltY) * 90 / 20)) + 1) / 2;
            }
        }

        if (keysdown[84]) {
            // T key >> tilt camera counter clockwise
            if (!keysdown[16]) {
                tilt2 += 5;
            }
                // Shift + T >> tilt camera clockwise
            else {
                tilt2 -= 5;
            }
        }

        if (keysdown[70]) {
            // F key >> -ZOOM
            if (!keysdown[16]) {
                if (zoom2 > 5) {
                    zoom2 -= 1;
                }
            }
                // Shift + F key >> +ZOOM
            else {
                if (zoom2 < 30) {
                    zoom2 += 1;
                }
            }
        }

        /* PLAYER'S CHARACTER CONTROLS */
        if (keysdown[87] || moveLock) {
            // W key >> move character forward
            if (spaceshipSpd <  0.998) {
                spaceshipSpd += 0.5 * Math.pow(0.25, ACCEL_FACTOR * spaceshipSpd + 1);
            }
            else {
                spaceshipSpd = 1;
            }
            target2 = [
                target2[0] + MAX_SPEED * spaceshipSpd * spaceshipXaxis[0],
                target2[1] + MAX_SPEED * spaceshipSpd * spaceshipXaxis[1],
                target2[2] + MAX_SPEED * spaceshipSpd * spaceshipXaxis[2]
            ];
            if (keysdown[65]) spaceshipRot = 45 + theta2;
            else if (keysdown[68]) spaceshipRot = -45 + theta2;
            else spaceshipRot = theta2;
        }
        else {
            if(spaceshipSpd > 0.001) {
                spaceshipSpd -= 0.5 * Math.pow(0.25, ACCEL_FACTOR * spaceshipSpd + 1);
                target2 = [
                target2[0] + MAX_SPEED * spaceshipSpd * spaceshipXaxis[0],
                target2[1] + MAX_SPEED * spaceshipSpd * spaceshipXaxis[1],
                target2[2] + MAX_SPEED * spaceshipSpd * spaceshipXaxis[2]
                ];
            }
            else {
                spaceshipSpd = 0;
            }
        }

        if (keysdown[82]) {
            if (moveLock) {
                moveLock = false;
            }
            else {
                moveLock = true;
            }
        }

        if (activePlayer.name == "x wing body" && keysdown[32]
            && (wingOpenValue < 0.005 || wingOpenValue > 0.295)) {
            if (wingOpen) {
                wingOpen = false;
            }
            else {
                wingOpen = true;
            }
        }
    }


    function toRad(angle) {
        return angle * Math.PI / 180;
    }

};

function initShader(gl) {
    vertexSource = document.getElementById("general-vs").text;
    fragmentSource = document.getElementById("general-fs").text;

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
    var shaderProgram = gl.createProgram();
    gl.attachShader(shaderProgram, vertexShader);
    gl.attachShader(shaderProgram, fragmentShader);
    gl.linkProgram(shaderProgram);
    if (!gl.getProgramParameter(shaderProgram, gl.LINK_STATUS)) {
        alert("Could not initialize shaders");
    }

    shaderProgram.PositionAttribute = gl.getAttribLocation(shaderProgram, "vPosition");
    gl.enableVertexAttribArray(shaderProgram.PositionAttribute);

    shaderProgram.textureCoordAttribute = gl.getAttribLocation(shaderProgram, "vTexCoord");
    gl.enableVertexAttribArray(shaderProgram.textureCoordAttribute);

    shaderProgram.NormalAttribute = gl.getAttribLocation(shaderProgram, "vNormal");
    gl.enableVertexAttribArray(shaderProgram.NormalAttribute);

    shaderProgram.TangentAttribute = gl.getAttribLocation(shaderProgram, "vTang");
    gl.enableVertexAttribArray(shaderProgram.TangentAttribute);

    // this gives us access to the matrix uniform
    shaderProgram.modelMatrix = gl.getUniformLocation(shaderProgram, "modelMatrix");
    shaderProgram.viewMatrix = gl.getUniformLocation(shaderProgram, "viewMatrix");
    shaderProgram.projMatrix = gl.getUniformLocation(shaderProgram, "projMatrix");
    shaderProgram.normalMatrix = gl.getUniformLocation(shaderProgram, "normalMatrix");
    shaderProgram.dirlight = gl.getUniformLocation(shaderProgram, "dirlight");
    shaderProgram.ptlightposn = gl.getUniformLocation(shaderProgram, "ptlightposn");
    shaderProgram.ptlightcolorn = gl.getUniformLocation(shaderProgram, "ptlightcolorn");
    shaderProgram.ptlightdampern = gl.getUniformLocation(shaderProgram, "ptlightdampern");

    shaderProgram.diffuseMap = gl.getUniformLocation(shaderProgram, "diffuseMap");
    shaderProgram.normalMap = gl.getUniformLocation(shaderProgram, "normalMap");
    //Model.shaderProgram.Time = gl.getUniformLocation(Model.shaderProgram, "time");

    shaderProgram.ambient = gl.getUniformLocation(shaderProgram, "ambient");
    shaderProgram.diffuse = gl.getUniformLocation(shaderProgram, "diffuse");
    shaderProgram.specular = gl.getUniformLocation(shaderProgram, "specular");
    shaderProgram.shininess = gl.getUniformLocation(shaderProgram, "shininess");
    shaderProgram.emission = gl.getUniformLocation(shaderProgram, "emission");

    return shaderProgram;
}

