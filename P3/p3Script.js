var canvas = document.getElementById('myCanvas');
var ctx = canvas.getContext('2d');
var m4 = twgl.m4;
var v3 = twgl.v3;
var Mmcpv = [];
Mmcpv.push(m4.identity());

var showAxes = false; // display status for the visualization of coord axes
var isMenuOpen = false; // display status for the menu
var isOrtho = true; // determines which projection type is being applied
var isLookingAtDrone = true; // determines what is the camera target

var theta = 45; // angle on XY-plane from X- to Y-axis
var phi = 60; // angle down from Z-axis
var fov = 10; // field of view angle perspective projection
var zoom = 1.5; // zoom percentage for orthographic projection
var tilt = 0; // tilt angle for the camera

var drone1Rot = 0; // automated drone 1 motion
var drone2Rot = 0; // automated drone 2 motion
var drone3Rot = 0; // automated drone 3 motion
var propelRot = 0; // rotation of propellers

var myDronePos = [-500, 0, 150]; // player's drone position
var myDroneRot = 0; // XY camera rotation in drone mode
var myDroneSpeed = 20; // player's drone speed

var eye = [500, 500, 100]; // base eye position (not static)
var target = [0, 0, 0]; // base target position (not static)
var up = [0, 0, 1]; // base up position (not static)

var n = 1; // near plane
var f = 200; // far plane
var t = -200; // top plane
var b = 200; // bottom plane
var l = -200; // left plane
var r = 200; // right plane

var camStaticPos = [2000, 2000, 1000]; // position multiplier for camera

function animate() {
    "use strict";
    canvas.width = window.innerWidth - 22;
    canvas.height = window.innerHeight - 22;

    document.onkeydown = function (e) {
        switch (e.keyCode) {
                /* SPECIAL COMMANDS */
            case 32: // Space bar >> change target (world pos / my drone pos)
                if (isLookingAtDrone) {
                    isLookingAtDrone = false;
                }
                else {
                    isLookingAtDrone = true;
                }
                break;
            case 49:
                if (showAxes) {
                    showAxes = false;
                }
                else {
                    showAxes = true;
                }
                break;

            case 67:
                if (isMenuOpen) {
                    isMenuOpen = false;
                }
                else {
                    isMenuOpen = true;
                }
                break;

            case 13: // Enter >> changes projection type (ortho - pers)
                if (isOrtho === false) {
                    isOrtho = true;
                }
                else {
                    isOrtho = false;
                }
                break;

                /* CAMERA CONTROLS */
            case 39: // right arrow >> spin camera left
                (!isLookingAtDrone && theta < 360) ? theta += 5 : theta = 0;
                break;

            case 37: // left arrow >> spin camera right
                (!isLookingAtDrone && theta > 0) ? theta -= 5 : theta = 360;
                break;

            case 40: // down arrow >> spin camera up
                if (phi < 175) {
                    phi += 5;
                }
                break;

            case 38: // up arrow >> spin camera down
                if (phi > 5) {
                    phi -= 5;
                }
                break;

            case 84: // T key >> tilt camera counter clockwise
                if (!event.shiftKey) {
                    tilt += 10;
                }
                // Shift + T >> tilt camera clockwise
                else {
                    tilt -= 10;
                }
                break;

            case 70: // F key >> +FOV
                if (!event.shiftKey) {
                    if (!isOrtho && fov < 50) {
                        fov += toRad(30);
                    }
                }
                    // Shift + F key >> -FOV
                else {
                    if (!isOrtho && fov > 5) {
                        fov -= toRad(30);
                    }
                }
                break;

            case 90: // Z key >> zoom in
                if (!event.shiftKey) {
                    if (isOrtho && zoom < 5) {
                        zoom += 0.05;
                    }
                }
                // Shift + Z >> zoom out
                else {
                    if (isOrtho && zoom > 0.5) {
                        zoom -= 0.05;
                    }
                }
                break;

                /* PLAYER'S DRONE CONTROLS */
            case 81: // Q key >> move player's drone up
                if (isLookingAtDrone) {
                    if (!event.shiftKey) {
                        myDronePos[2] += 10;
                    }
                    // Shift + Z key >> move player's drone down
                    else {
                        myDronePos[2] -= 10;
                    }
                }
                break;

            case 65: // A key >> turn player's drone right
                if (isLookingAtDrone) {
                    myDroneRot += 5 * Math.PI / 180;
                }
                break;

            case 68: // D key >> turn player's drone left
                if (isLookingAtDrone) {
                    myDroneRot -= 5 * Math.PI / 180;
                }
                break;

            case 87: // W key >> move player's drone
                if (isLookingAtDrone) {
                    myDronePos[0] += myDroneSpeed * Math.cos(myDroneRot);
                    myDronePos[1] += myDroneSpeed * Math.sin(myDroneRot);
                }
                break;

                /* TARGET POSITION CONTROLS */
            case 66: // B key >> look at x + 10 (orthographic proj only)
                if (!isLookingAtDrone) {
                    if (!event.shiftKey) {
                        target[0] += 10;
                    }
                    // Shift + B key >> look at x - 10
                    else {
                        target[0] -= 10;
                    }
                }
                break;

            case 78: // N key >> look at y + 10 (orthographic proj only)
                if (!isLookingAtDrone) {
                    if (!event.shiftKey) {
                        target[1] += 10;
                    }
                        // Shift + N key >> look at y - 10
                    else {
                        target[1] -= 10;
                    }
                }
                break;

            case 77: // M key >> look at z + 10
                if (!isLookingAtDrone) {
                    if (!event.shiftKey) {
                        target[2] += 10;
                    }
                    // Shift + M key >> look at z - 10
                    else {
                        target[2] -= 10;
                    }
                }
                break;
        }
    };

    var Mcam; // setup camera matrix
    if (isLookingAtDrone) { // drone mode matrix
        Mcam = m4.inverse(m4.lookAt(eye, myDronePos, up));
        eye = [myDronePos[0] - camStaticPos[0] * Math.cos(myDroneRot) * Math.sin(toRad(phi)), myDronePos[1] - camStaticPos[1] * Math.sin(myDroneRot) * Math.sin(toRad(phi)), myDronePos[2] + camStaticPos[2] * Math.cos(toRad(phi))];
    }
    else { // position mode matrix
        Mcam = m4.inverse(m4.lookAt(eye, target, up));
        eye = [target[0] + camStaticPos[0] * Math.cos(toRad(theta)) * Math.sin(toRad(phi)), target[1] + camStaticPos[1] * Math.sin(toRad(theta)) * Math.sin(toRad(phi)), target[2] + camStaticPos[2] * Math.cos(toRad(phi))];
    }

    var Mproj; // setup projection matrix
    if (isOrtho) { // orthographic projection mode
        Mproj = m4.ortho(l / zoom, r / zoom, t / zoom, b / zoom, n, f);
    }
    else { // perspective projection mode
        Mproj = m4.perspective(toRad(fov), 1, 20, 1000);
    }

    // setup viewport matrix
    var Mvp = m4.multiply(m4.scaling([200, -200, 200]), m4.translation([(canvas.width - 1) / 2, (canvas.height - 1) / 2, 0]));

    // setup overall transformation matrix
    Mmcpv[0] = m4.multiply(m4.multiply(Mcam, Mproj), Mvp);

    // clear previous frame
    canvas.width = canvas.width;

    // manages camera tilt
    if (isLookingAtDrone) { // tilt in drone mode
        translate3D(myDronePos[0], myDronePos[1], myDronePos[2]);
        var a = v3.subtract(myDronePos, eye);
        rotate3D(a[0], a[1], a[2], toRad(tilt));
        translate3D(-myDronePos[0], -myDronePos[1], -myDronePos[2]);
    }
    else { // tilt in position mode
        translate3D(target[0], target[1], target[2]);
        var a = v3.subtract(target, eye);
        rotate3D(a[0], a[1], a[2], toRad(tilt));
        translate3D(-target[0], -target[1], -target[2]);
    }

    // draw world
    draw();

    window.requestAnimationFrame(animate);

    function draw() {

        // display aim icon when in position mode
        if (!isLookingAtDrone) {
            ctx.strokeStyle = "red";
            ctx.beginPath();
            arc3D(target[0], target[1], target[2], 2, 0, 2 * Math.PI);
            ctx.stroke();
        }

        // display grid
        drawGrid();

        // manages display axes
        if (showAxes) {
            drawAxes("green");
        }

        // generate tower
        save3D();
        ctx.strokeStyle = "black";
        ctx.beginPath();
        scale3D(1.5, 1.5, 1.5);
        drawTower();
        ctx.closePath()
        ctx.stroke();
        restore3D();

        // generate automated drone 1
        save3D();
        ctx.strokeStyle = "orange";
        rotate3D(0, 0, 1, drone1Rot);
        drone1Rot -= 0.02;
        drawDrone(0, 300, 100, propelRot);
        restore3D();

        save3D();
        ctx.strokeStyle = "blue";
        rotate3D(0, 0, 1, drone2Rot);
        drone2Rot += 0.02;
        drawDrone(0, 250, 200, propelRot);
        restore3D();

        save3D();
        ctx.strokeStyle = "#336600";
        rotate3D(0, 0, 1, drone3Rot);
        drone3Rot += 0.02;
        drawDrone(0, 700, 600, propelRot);
        restore3D();

        save3D();
        ctx.strokeStyle = "black";
        translate3D(myDronePos[0], myDronePos[1], myDronePos[2], propelRot);
        rotate3D(0, 0, 1, myDroneRot);
        drawDrone(1, 0, 0, propelRot);
        restore3D();

        propelRot += 18;

        // manages display menu
        drawMenu();

    }

    function drawMenu() {

        save3D();
        ctx.strokeStyle = "white";
        ctx.lineWidth = 5;
        ctx.font = "bold 14px Comic Sans MS";
        if (!isMenuOpen) {
            ctx.strokeText("CONTROLS MENU (CLICK 'C' TO OPEN)", 5, 20);
            ctx.fillText("CONTROLS MENU (CLICK 'C' TO OPEN)", 5, 20);
        }
        else {
            ctx.strokeText("CONTROLS MENU (CLICK 'C' TO CLOSE)", 5, 20);
            ctx.fillText("CONTROLS MENU (CLICK 'C' TO CLOSE)", 5, 20);
            ctx.strokeText("SPACE : CHANGE TARGET TO DRONE/POSITION MODE", 25, 45);
            ctx.fillText("SPACE : CHANGE TARGET TO DRONE/POSITION MODE", 25, 45);
            ctx.strokeText("ENTER : CHANGE PROJECTION TYPE (ORTHOGRAPHIC/PERSPECTIVE)", 25, 70);
            ctx.fillText("ENTER : CHANGE PROJECTION TYPE (ORTHOGRAPHIC/PERSPECTIVE)", 25, 70);
            ctx.strokeText("1 : SHOW COORDINATE SYSTEM REPRESENTATION", 25, 95);
            ctx.fillText("1 : SHOW COORDINATE SYSTEM REPRESENTATION", 25, 95);
            ctx.strokeText("B/N/M (SHIFT+) : CHANGE X/Y/Z VALUES (POSITION MODE)", 25, 120);
            ctx.fillText("B/N/M (SHIFT+) : CHANGE X/Y/Z VALUES (POSITION MODE)", 25, 120);
            ctx.strokeText("W : MOVE YOUR DRONE (DRONE MODE)", 25, 145);
            ctx.fillText("W : MOVE YOUR DRONE (DRONE MODE)", 25, 145);
            ctx.strokeText("A/D : TURN YOUR DRONE LEFT/RIGHT (DRONE MODE)", 25, 170);
            ctx.fillText("A/D : TURN YOUR DRONE LEFT/RIGHT (DRONE MODE)", 25, 170);
            ctx.strokeText("Q/SHIFT+Q : MOVE YOUR DRONE UP/DOWN (DRONE MODE)", 25, 195);
            ctx.fillText("Q/SHIFT+Q : MOVE YOUR DRONE UP/DOWN (DRONE MODE)", 25, 195);
            ctx.strokeText("ARROWS : MOVE CAMERA (LEFT/RIGHT ONLY IN POSITION MODE)", 25, 220);
            ctx.fillText("ARROWS : MOVE CAMERA (LEFT/RIGHT ONLY IN POSITION MODE)", 25, 220);
            ctx.strokeText("T/SHIFT+T : TILT CAMERA", 25, 245);
            ctx.fillText("T/SHIFT+T : TILT CAMERA", 25, 245);
            ctx.strokeText("Z/SHIFT+Z : ZOOM (ORTHOGRAPHIC PROJECTION MODE)", 25, 270);
            ctx.fillText("Z/SHIFT+Z : ZOOM (ORTHOGRAPHIC PROJECTION MODE)", 25, 270);
            ctx.strokeText("F/SHIFT+F : FIELD OF VIEW (PERSPECTIVE PROJECTION MODE)", 25, 295);
            ctx.fillText("F/SHIFT+F : FIELD OF VIEW (PERSPECTIVE PROJECTION MODE)", 25, 295);
        }
        restore3D();
    }

    function drawGrid() {
        ctx.strokeStyle = "#EEEEEE";
        ctx.beginPath();
        for (var i = -1000; i <= 1000; i += 100) {
            moveTo3D(-1000, i, 0);
            lineTo3D(1000, i, 0);
            moveTo3D(i, -1000, 0);
            lineTo3D(i, 1000, 0);
        }
        ctx.closePath();
        ctx.stroke();
    }

    function drawAxes(rgb) {
        ctx.strokeStyle = (rgb);
        ctx.beginPath();
        // Axes
        moveTo3D(120, 0, 0); lineTo3D(0, 0, 0); lineTo3D(0, 120, 0);
        moveTo3D(0, 0, 0); lineTo3D(0, 0, 120);
        // Arrowheads
        moveTo3D(110, 5, 0); lineTo3D(120, 0, 0); lineTo3D(110, 0, 5);
        moveTo3D(110, -5, 0); lineTo3D(120, 0, 0); lineTo3D(110, 0, -5);
        moveTo3D(5, 110, 0); lineTo3D(0, 120, 0); lineTo3D(0, 110, 5);
        moveTo3D(-5, 110, 0); lineTo3D(0, 120, 0); lineTo3D(0, 110, -5);
        moveTo3D(5, 0, 110); lineTo3D(0, 0, 120); lineTo3D(0, 5, 110);
        moveTo3D(-5, 0, 110); lineTo3D(0, 0, 120); lineTo3D(0, -5, 110);
        // X-label
        moveTo3D(130, -5, 0); lineTo3D(140, 5, 0);
        moveTo3D(130, 5, 0); lineTo3D(140, -5, 0);
        // Y-label
        moveTo3D(-5, 130, 0); lineTo3D(0, 135, 0); lineTo3D(5, 130, 0);
        moveTo3D(0, 135, 0); lineTo3D(0, 142, 0);
        // Z-label
        moveTo3D(5, -5, 140); lineTo3D(-5, 5, 140); lineTo3D(5, -5, 130);
        lineTo3D(-5, 5, 130);
        ctx.stroke();
    }

    function drawBall(x, y, z, radius, num) {

        ctx.beginPath();

        for (var i = -radius; i <= radius; i += radius / num) {
            
            arc3D(x, y, z + i, Math.sqrt(Math.abs(radius * radius - (z-i) * (z-i))), 0, 2 * Math.PI);
            ctx.stroke();
        }

    }

    function drawTower() {

        moveTo3D(50, 50, 0);
        lineTo3D(50, -50, 0);
        lineTo3D(-50, -50, 0);
        lineTo3D(-50, 50, 0);
        lineTo3D(50, 50, 0);
        lineTo3D(50, 50, 150);
        lineTo3D(50, -50, 150);
        lineTo3D(-50, -50, 150);
        lineTo3D(-50, 50, 150);
        lineTo3D(50, 50, 150);
        moveTo3D(50, -50, 150);
        lineTo3D(50, -50, 0);
        moveTo3D(-50, 50, 150);
        lineTo3D(-50, 50, 0);
        moveTo3D(-50, -50, 150);
        lineTo3D(-50, -50, 0);

        moveTo3D(30, 30, 150);
        lineTo3D(30, -30, 150);
        lineTo3D(-30, -30, 150);
        lineTo3D(-30, 30, 150);
        lineTo3D(30, 30, 150);
        lineTo3D(30, 30, 300);
        lineTo3D(30, -30, 300);
        lineTo3D(-30, -30, 300);
        lineTo3D(-30, 30, 300);
        lineTo3D(30, 30, 300);
        moveTo3D(30, -30, 300);
        lineTo3D(30, -30, 150);
        moveTo3D(-30, 30, 300);
        lineTo3D(-30, 30, 150);
        moveTo3D(-30, -30, 300);
        lineTo3D(-30, -30, 150);

        moveTo3D(15, 15, 300);
        lineTo3D(15, -15, 300);
        lineTo3D(-15, -15, 300);
        lineTo3D(-15, 15, 300);
        lineTo3D(15, 15, 300);
        lineTo3D(15, 15, 450);
        lineTo3D(15, -15, 450);
        lineTo3D(-15, -15, 450);
        lineTo3D(-15, 15, 450);
        lineTo3D(15, 15, 450);
        moveTo3D(15, -15, 450);
        lineTo3D(15, -15, 300);
        moveTo3D(-15, 15, 450);
        lineTo3D(-15, 15, 300);
        moveTo3D(-15, -15, 450);
        lineTo3D(-15, -15, 300);

    }

    function drawDrone(x, y, z, rpm) {

        var propellerAxes = drawBody(x, y, z);

        for (var i = 0; i < propellerAxes.length; i++) {

            drawPropeller(propellerAxes[i][0],
                propellerAxes[i][1],
                propellerAxes[i][2],
                rpm);

        }

        function drawBody(x, y, z) {

            ctx.beginPath();
            save3D();
            translate3D(x, y, z);
            // TODO draw body
            moveTo3D(20, 8, 0);
            lineTo3D(18, 10, 0);
            lineTo3D(-18, 10, 0);
            lineTo3D(-20, 8, 0);
            lineTo3D(-20, -8, 0);
            lineTo3D(-18, -10, 0);
            lineTo3D(18, -10, 0);
            lineTo3D(20, -8, 0);
            lineTo3D(20, 8, 0);

            lineTo3D(25, 8, -4);
            lineTo3D(22, 12, -4);
            lineTo3D(18, 15, -4);
            lineTo3D(18, 10, 0);
            lineTo3D(18, 15, -4);
            lineTo3D(-18, 15, -4);
            lineTo3D(-18, 10, 0);
            lineTo3D(-18, 15, -4);
            lineTo3D(-22, 12, -4);
            lineTo3D(-25, 8, -4);
            lineTo3D(-20, 8, 0);
            lineTo3D(-25, 8, -4);
            lineTo3D(-25, -8, -4);
            lineTo3D(-20, -8, 0);
            lineTo3D(-25, -8, -4);
            lineTo3D(-22, -12, -4);
            lineTo3D(-18, -15, -4);
            lineTo3D(-18, -10, 0);
            lineTo3D(-18, -15, -4);
            lineTo3D(18, -15, -4);
            lineTo3D(18, -10, 0);
            lineTo3D(18, -15, -4);
            lineTo3D(22, -12, -4);
            lineTo3D(25, -8, -4);
            lineTo3D(20, -8, 0);
            lineTo3D(25, -8, -4);
            lineTo3D(25, 8, -4);

            lineTo3D(28, 10, -6);
            lineTo3D(20, 18, -6);
            lineTo3D(18, 20, -8);
            lineTo3D(-18, 20, -8);
            lineTo3D(-20, 18, -6);
            lineTo3D(-28, 10, -6);
            lineTo3D(-30, 8, -8);
            lineTo3D(-30, -8, -8);
            lineTo3D(-28, -10, -6);
            lineTo3D(-21, -17, -6);
            lineTo3D(-19, -19, -8);
            lineTo3D(19, -19, -8);
            lineTo3D(21, -17, -6);
            lineTo3D(28, -10, -6);
            lineTo3D(30, -8, -8);
            lineTo3D(30, 8, -8);
            lineTo3D(28, 10, -6);
            
            moveTo3D(28, 6, -14);
            lineTo3D(16, 18, -14);
            lineTo3D(-16, 18, -14);
            lineTo3D(-28, 6, -14);
            lineTo3D(-28, -6, -14);
            lineTo3D(-17, -17, -14);
            lineTo3D(17, -17, -14);
            lineTo3D(28, -6, -14);
            lineTo3D(28, 6, -14);

            //
            lineTo3D(38, 42, -6);
            lineTo3D(44, 55, -6);
            lineTo3D(40, 57, -6);
            lineTo3D(33, 44.25, -6);
            lineTo3D(16, 18, -14);
            lineTo3D(18, 20, -8);
            lineTo3D(31, 44.25, -4);
            lineTo3D(40, 60, -4);
            lineTo3D(46, 57, -4);
            lineTo3D(40, 40, -4);
            lineTo3D(30, 8, -8);
            lineTo3D(28, 6, -14);

            moveTo3D(28, 10, -6);
            lineTo3D(38, 42, -2);
            lineTo3D(44, 55, -2);
            lineTo3D(40, 57, -2);
            lineTo3D(33, 44.25, -2);
            lineTo3D(20, 18, -6);
            lineTo3D(18, 15, -4);

            moveTo3D(38, 42, -6);
            lineTo3D(33, 44.25, -6);
            lineTo3D(31, 44.25, -4);
            lineTo3D(33, 44.25, -2);
            lineTo3D(38, 42, -2);
            lineTo3D(40, 40, -4);
            lineTo3D(38, 42, -6);

            moveTo3D(44, 55, -6);
            lineTo3D(46, 57, -4);
            lineTo3D(44, 55, -2);
            lineTo3D(40, 57, -2);
            lineTo3D(40, 60, -4);
            lineTo3D(40, 57, -6);

            //
            moveTo3D(-28, 6, -14);
            lineTo3D(-38, 42, -6);
            lineTo3D(-44, 55, -6);
            lineTo3D(-40, 57, -6);
            lineTo3D(-33, 44.25, -6);
            lineTo3D(-16, 18, -14);
            lineTo3D(-18, 20, -8);
            lineTo3D(-31, 44.25, -4);
            lineTo3D(-40, 60, -4);
            lineTo3D(-46, 57, -4);
            lineTo3D(-40, 40, -4);
            lineTo3D(-30, 8, -8);
            lineTo3D(-28, 6, -14);

            moveTo3D(-28, 10, -6);
            lineTo3D(-38, 42, -2);
            lineTo3D(-44, 55, -2);
            lineTo3D(-40, 57, -2);
            lineTo3D(-33, 44.25, -2);
            lineTo3D(-20, 18, -6);
            lineTo3D(-18, 15, -4);

            moveTo3D(-38, 42, -6);
            lineTo3D(-33, 44.25, -6);
            lineTo3D(-31, 44.25, -4);
            lineTo3D(-33, 44.25, -2);
            lineTo3D(-38, 42, -2);
            lineTo3D(-40, 40, -4);
            lineTo3D(-38, 42, -6);

            moveTo3D(-44, 55, -6);
            lineTo3D(-46, 57, -4);
            lineTo3D(-44, 55, -2);
            lineTo3D(-40, 57, -2);
            lineTo3D(-40, 60, -4);
            lineTo3D(-40, 57, -6);

            //
            moveTo3D(-28, -6, -14);
            lineTo3D(-38, -42, -6);
            lineTo3D(-44, -55, -6);
            lineTo3D(-40, -57, -6);
            lineTo3D(-33, -44.25, -6);
            lineTo3D(-16, -18, -14);
            lineTo3D(-18, -20, -8);
            lineTo3D(-31, -44.25, -4);
            lineTo3D(-40, -60, -4);
            lineTo3D(-46, -57, -4);
            lineTo3D(-40, -40, -4);
            lineTo3D(-30, -8, -8);
            lineTo3D(-28, -6, -14);

            moveTo3D(-28, -10, -6);
            lineTo3D(-38, -42, -2);
            lineTo3D(-44, -55, -2);
            lineTo3D(-40, -57, -2);
            lineTo3D(-33, -44.25, -2);
            lineTo3D(-20, -18, -6);
            lineTo3D(-18, -15, -4);

            moveTo3D(-38, -42, -6);
            lineTo3D(-33, -44.25, -6);
            lineTo3D(-31, -44.25, -4);
            lineTo3D(-33, -44.25, -2);
            lineTo3D(-38, -42, -2);
            lineTo3D(-40, -40, -4);
            lineTo3D(-38, -42, -6);
            
            moveTo3D(-44, -55, -6);
            lineTo3D(-46, -57, -4);
            lineTo3D(-44, -55, -2);
            lineTo3D(-40, -57, -2);
            lineTo3D(-40, -60, -4);
            lineTo3D(-40, -57, -6);

            //
            moveTo3D(28, -6, -14);
            lineTo3D(38, -42, -6);
            lineTo3D(44, -55, -6);
            lineTo3D(40, -57, -6);
            lineTo3D(33, -44.25, -6);
            lineTo3D(16, -18, -14);
            lineTo3D(18, -20, -8);
            lineTo3D(31, -44.25, -4);
            lineTo3D(40, -60, -4);
            lineTo3D(46, -57, -4);
            lineTo3D(40, -40, -4);
            lineTo3D(30, -8, -8);
            lineTo3D(28, -6, -14);

            moveTo3D(28, -10, -6);
            lineTo3D(38, -42, -2);
            lineTo3D(44, -55, -2);
            lineTo3D(40, -57, -2);
            lineTo3D(33, -44.25, -2);
            lineTo3D(20, -18, -6);
            lineTo3D(18, -15, -4);

            moveTo3D(38, -42, -6);
            lineTo3D(33, -44.25, -6);
            lineTo3D(31, -44.25, -4);
            lineTo3D(33, -44.25, -2);
            lineTo3D(38, -42, -2);
            lineTo3D(40, -40, -4);
            lineTo3D(38, -42, -6);

            moveTo3D(44, -55, -6);
            lineTo3D(46, -57, -4);
            lineTo3D(44, -55, -2);
            lineTo3D(40, -57, -2);
            lineTo3D(40, -60, -4);
            lineTo3D(40, -57, -6);
            
            restore3D();
            ctx.stroke();
            
            var propellerAxes = [
                [x + 41, y + 54, z - 2],
                [x - 41, y + 54, z - 2],
                [x - 41, y - 54, z - 2],
                [x + 41, y - 54, z - 2]
            ]
            return propellerAxes;

        }

        function drawPropeller(x, y, z, rpm) {

            ctx.beginPath();
            save3D();
            translate3D(x, y, z);
            rotate3D(0, 0, 1, rpm);
            // TODO draw propeller
            moveTo3D(-30, -30, 0);
            lineTo3D(30, 30, 0);
            lineTo3D(20, 28, 0.5);
            lineTo3D(-3, 13, 2);
            lineTo3D(3, -13, -2);
            lineTo3D(-20, -28, -0.5);
            lineTo3D(-30, -30, 0);
            ctx.stroke();
            restore3D();

        }

    }
}

function moveTo3D(x, y, z) {
    var pos3D = m4.transformPoint(Mmcpv[Mmcpv.length - 1], [x, y, z]);
    ctx.moveTo(pos3D[0], pos3D[1]);
}

function lineTo3D(x, y, z) {
    var pos3D = m4.transformPoint(Mmcpv[Mmcpv.length - 1], [x, y, z]);
    ctx.lineTo(pos3D[0], pos3D[1]);
}

function arc3D(x, y, z, radius, startAngle, endAngle) {   
    var angle_UpEye = v3.dot([0,0,1], v3.normalize(eye));
    var pos3D = m4.transformPoint(Mmcpv[Mmcpv.length - 1], [x, y, z]);
    ctx.ellipse(pos3D[0], pos3D[1], radius, radius * Math.abs(angle_UpEye), 0, startAngle, endAngle);
}

function rotate3D(x, y, z, rad) {
    Mmcpv[Mmcpv.length - 1] = m4.multiply(m4.axisRotation([x, y, z], rad), Mmcpv[Mmcpv.length - 1]);
}

function translate3D(x, y, z) {
    Mmcpv[Mmcpv.length - 1] = m4.multiply(m4.translation([x, y, z]), Mmcpv[Mmcpv.length - 1]);
}

function scale3D(x, y, z) {
    Mmcpv[Mmcpv.length - 1] = m4.multiply(m4.scaling([x, y, z]), Mmcpv[Mmcpv.length - 1]);
}

function save3D() {
    Mmcpv.push(Mmcpv[Mmcpv.length - 1]);
}

function restore3D() {
    Mmcpv.pop();
}

function toRad(angle) {
    return angle * Math.PI / 180;
}

window.onload = animate;
