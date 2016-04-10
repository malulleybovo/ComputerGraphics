var canvas = document.getElementById('myCanvas');
var ctx = canvas.getContext('2d');
var speed_slider = document.getElementById('slider');
speed_slider.value = 30.0;

var xPos = canvas.width + 300; // x position of the center of the model
var SPEED = speed_slider.value; // speed of model's movement

var WALK_FRAMES = 55 - SPEED; // number of frames per segment of motion

var laserPos = 0; // position of the laser being shot by the model
var LASER_SPEED = 40; // speed of the laser

// angles of each leg 1 part
// changed inevery frame of motion
var anglesLeg1 = [-30.0, 30.0, 0.0, 0.0]; 
var bounceLeg1Y = -20.0; // how much leg 1 bounces

// angles of each leg 2 part
// changed inevery frame of motion
var anglesLeg2 = [30.0, 15.0, 0.0, -45.0];
var bounceLeg2Y = 20.0; // how much leg 2 bounces

var walkFrame = 1; // current frame
var walkPart = 1; // current segment of motion being executed

// MAIN LOOP
window.onload = function () { animate(); };

//
// generates each frame of the animation
//
function animate() {

    canvas.width = canvas.width;

    document.getElementById("myCanvas").style.backgroundColor = '#F7F7F7';

    // draw model standing at the bottom of the canvas
    drawATST(xPos, canvas.height - 310);

    // gets new x position of model
    xPos -= 5 * SPEED / WALK_FRAMES;
    if (xPos < -300) {
        xPos = canvas.width + 300;
    }

    animation_walk();

    window.requestAnimationFrame(animate);

}

//
//  generates a frame of motion for the action "walk"
//  *this complex motion is divided in four segments
//
function animation_walk() {

    switch (walkPart) {
        case 1:
            // leaving foot 1 from ground
            anglesLeg1[0] += 30 / WALK_FRAMES;
            anglesLeg1[1] += 15 / WALK_FRAMES;
            anglesLeg1[2] += 15 / WALK_FRAMES;
            anglesLeg1[3] -= 90 / WALK_FRAMES;
            bounceLeg1Y += 2 * 20 / WALK_FRAMES;

            // dragging foot 2 with the ground ("friction")
            // part 1
            anglesLeg2[0] -= 30 / WALK_FRAMES;
            anglesLeg2[1] += 20 / WALK_FRAMES;
            // no change in anglesLeg2[2]
            anglesLeg2[3] += 10 / WALK_FRAMES;
            bounceLeg2Y -= 20 / WALK_FRAMES;
            break;

        case 2:
            // placing foot 1 on the ground
            anglesLeg1[0] += 30 / WALK_FRAMES;
            anglesLeg1[1] -= 30 / WALK_FRAMES;
            anglesLeg1[2] -= 15 / WALK_FRAMES;
            anglesLeg1[3] += 45 / WALK_FRAMES;
            // no bounce during this movement

            // dragging foot 2 with the ground ("friction")
            // part 2
            anglesLeg2[0] -= 30 / WALK_FRAMES;
            anglesLeg2[1] -= 5 / WALK_FRAMES;
            // no change in anglesLeg2[2]
            anglesLeg2[3] += 35 / WALK_FRAMES;
            bounceLeg2Y -= 20 / WALK_FRAMES;


            break;

        case 3:
            // dragging foot 1 with the ground ("friction")
            // part 1
            anglesLeg1[0] -= 30 / WALK_FRAMES;
            anglesLeg1[1] += 20 / WALK_FRAMES;
            // no change in anglesLeg1[2]
            anglesLeg1[3] += 10 / WALK_FRAMES;
            bounceLeg1Y -= 20 / WALK_FRAMES;

            // leaving foot 2 from ground
            anglesLeg2[0] += 30 / WALK_FRAMES;
            anglesLeg2[1] += 15 / WALK_FRAMES;
            anglesLeg2[2] += 15 / WALK_FRAMES;
            anglesLeg2[3] -= 90 / WALK_FRAMES;
            bounceLeg2Y += 2 * 20 / WALK_FRAMES;
            break;

        case 4:
            // dragging foot 1 with the ground ("friction")
            // part 2
            anglesLeg1[0] -= 30 / WALK_FRAMES;
            anglesLeg1[1] -= 5 / WALK_FRAMES;
            // no change in anglesLeg1[2]
            anglesLeg1[3] += 35 / WALK_FRAMES;
            bounceLeg1Y -= 20 / WALK_FRAMES;

            // placing foot 2 on the ground
            anglesLeg2[0] += 30 / WALK_FRAMES;
            anglesLeg2[1] -= 30 / WALK_FRAMES;
            anglesLeg2[2] -= 15 / WALK_FRAMES;
            anglesLeg2[3] += 45 / WALK_FRAMES;
            // no bounce during this movement
            break;

    }

    // advance frame
    walkFrame++;

    // advance motion after the completion of each segment
    if (walkFrame > WALK_FRAMES) {

        walkFrame = 1;

        // update speed and freq. of motion
        // using the slider
        SPEED = speed_slider.value;
        WALK_FRAMES = 40 * 15 / SPEED;

        walkPart++;

        // loop motion after completion of all segments
        if (walkPart > 4) {

            walkPart = 1;

        }

        // tool to set appropriate speeds for each segment
        // (avoid sliding)
        if (walkPart == 2 || walkPart == 4) {
            SPEED = SPEED * 2;
        }
        else {
            SPEED = SPEED / 2;
        }

    }

}

//
// generates a single frame of the model
//
function drawATST(x, y) {
    ctx.save();

    // center model at specified position
    ctx.translate(x, y);

    ctx.globalCompositeOperation = 'destination-over';

    ///////////////////////////////////////////////
    /* draw leg 1 (the one closer to the camera) */
    ///////////////////////////////////////////////
    ctx.save();
    ctx.translate(0, -bounceLeg1Y);
    ctx.rotate(toRad(anglesLeg1[0]));
    drawSupLeg();

    ctx.translate(100, 50);
    ctx.rotate(toRad(anglesLeg1[1]));
    drawInfLeg();

    ctx.translate(43, 200);
    ctx.rotate(toRad(anglesLeg1[2]));
    drawHindLeg();

    ctx.translate(-20, 80);
    ctx.rotate(toRad(anglesLeg1[3]));
    drawFoot();
    ctx.restore();

    ///////////////
    /* draw head */
    ///////////////
    ctx.save();
    // lets head bounce in y direction as it moves
    ctx.translate(-10, -86 + (bounceLeg1Y + bounceLeg2Y) / 3);
    drawHead();
    ctx.restore();

    ///////////////
    /* draw base */
    ///////////////
    ctx.save();
    // lets base bounce in y direction as it moves
    ctx.translate(0, (bounceLeg1Y + bounceLeg2Y) / 2);
    ctx.rotate(-Math.PI / 10);
    drawBase();
    ctx.restore();

    ///////////////////////////////////////////////////
    /* draw leg 2 (the one farthest from the camera) */
    ///////////////////////////////////////////////////
    ctx.save();
    ctx.translate(0, -bounceLeg2Y);
    ctx.rotate(toRad(anglesLeg2[0]));
    drawSupLeg();

    ctx.translate(100, 50);
    ctx.rotate(toRad(anglesLeg2[1]));
    drawInfLeg();

    ctx.translate(43, 200);
    ctx.rotate(toRad(anglesLeg2[2]));
    drawHindLeg();

    ctx.translate(-20, 80);
    ctx.rotate(toRad(anglesLeg2[3]));
    drawFoot();
    ctx.restore();

    ////////////////////////////////////////
    /* draw laser being shot by the model */
    ////////////////////////////////////////
    ctx.save();
    // shoot (move laser away from model)
    ctx.translate(-115 - laserPos, -44);
    ctx.scale(1, 7);
    drawLaser();
    // lets it replay animation
    laserPos = (laserPos > 4 * canvas.width) ? 0 : laserPos + LASER_SPEED;
    ctx.restore();

    ctx.restore();


    //
    //  generates the image of the base
    //
    function drawBase() {

        ctx.rect(15, -10, 80, 30);
        ctx.rect(-15, -10, 30, 20);
        ctx.rect(-15, -16, 58, 6);
        ctx.rect(55, -22, 40, 12);
        ctx.rect(55, -22, 40, 3);
        ctx.rect(43, -19, 12, 9);
        ctx.rect(50, -10, 25, 15);
        ctx.stroke();

        ctx.moveTo(5, -16);
        ctx.lineTo(-10, -36);
        ctx.lineTo(17.5, -86);
        ctx.lineTo(45, -36);
        ctx.lineTo(30, -16);
        ctx.fillStyle = "#CCCCCC";
        ctx.fill();
        ctx.stroke();

    }

    //
    //  generates the image of the head
    //
    function drawHead() {

        ctx.moveTo(20, 5);
        ctx.arc(-12, 5, 32, 0, 2 * Math.PI);
        ctx.stroke();

        ctx.moveTo(3, 5);
        ctx.arc(-12, 5, 15, 0, 2 * Math.PI);
        ctx.stroke();

        ctx.moveTo(0, 5);
        ctx.arc(-12, 5, 12, 0, 2 * Math.PI);
        ctx.stroke();

        ctx.moveTo(62, -80);
        ctx.lineTo(58, -87);
        ctx.lineTo(53, -90);
        ctx.lineTo(25, -83);
        ctx.lineTo(20, -74);
        ctx.stroke();

        ctx.moveTo(60, -83);
        ctx.lineTo(-15, -64);
        ctx.lineTo(-15, -56);
        ctx.lineTo(-48, -48);
        ctx.lineTo(-53, -48);
        ctx.lineTo(-62, 30);
        ctx.lineTo(-45, 33);
        ctx.lineTo(-32, 31);
        ctx.stroke();

        ctx.moveTo(-15, -54);
        ctx.lineTo(15, -30);
        ctx.lineTo(30, -5);
        ctx.lineTo(30, 3);
        ctx.lineTo(76, 3);
        ctx.stroke();

        ctx.moveTo(65, -80);
        ctx.lineTo(-55, -50);
        ctx.stroke();

        ctx.fillStyle = "#CCCCCC";
        ctx.fill();

        ctx.moveTo(-55, -51);
        ctx.lineTo(-76, -42);
        ctx.lineTo(-75, -40);
        ctx.lineTo(-53, -49);
        ctx.lineTo(-65, 30);
        ctx.stroke();

        ctx.moveTo(-66, 45);
        ctx.lineTo(-115, 45);
        ctx.lineTo(-115, 40);
        ctx.lineTo(-65, 40);
        ctx.stroke();

        ctx.rect(-115, 38, 20, 9);
        ctx.rect(-76, 38, 10, 9);
        ctx.stroke();

        ctx.moveTo(14, 25);
        ctx.lineTo(80, 25);
        ctx.lineTo(65, -80);
        ctx.lineTo(-55, -50);
        ctx.lineTo(-68, 65);
        ctx.lineTo(-45, 69);
        ctx.lineTo(-35, 65);
        ctx.lineTo(-20, 36);
        ctx.lineTo(-24, 44);
        ctx.lineTo(0, 44);
        ctx.lineTo(14, 25);
        ctx.stroke();

        ctx.fill();
        ctx.stroke();

    }

    //
    //  generates the image of a single superior leg
    //
    function drawSupLeg() {


        ctx.moveTo(10, 0);
        ctx.arc(0, 0, 10, 0, 2 * Math.PI);
        ctx.stroke();
        ctx.moveTo(15, 0);
        ctx.arc(0, 0, 15, 0, 2 * Math.PI);
        ctx.stroke();
        ctx.moveTo(30, 10);
        ctx.arc(22, 10, 8, 0, 2 * Math.PI);
        ctx.stroke();
        ctx.fillStyle = "#CCCCCC";
        ctx.fill();

        ctx.moveTo(0, 15);
        ctx.lineTo(20, 27);
        ctx.lineTo(78, 50);
        ctx.arc(98, 50, 19, -Math.PI, -Math.PI / 2);
        ctx.lineTo(50, -5);
        ctx.lineTo(5, -25);
        ctx.lineTo(0, -35);
        ctx.lineTo(0, -15);
        ctx.stroke();

        ctx.moveTo(40, -5);
        ctx.lineTo(87, 33);
        ctx.stroke();

        ctx.moveTo(80, 40);
        ctx.lineTo(10, -14);
        ctx.lineTo(0, 0);
        ctx.stroke();

        ctx.moveTo(20, 27);
        ctx.lineTo(35, 6);
        ctx.stroke();

        ctx.moveTo(23, 25);
        ctx.lineTo(80, 48);
        ctx.stroke();

        ctx.fill();
        ctx.stroke();

    }

    //
    //  generates the image of a single inferior leg
    //
    function drawInfLeg() {

        ctx.moveTo(10, 0);
        ctx.arc(0, 0, 10, 0, 2 * Math.PI);
        ctx.moveTo(20, 0);
        ctx.arc(0, 0, 20, 0, 2 * Math.PI);
        ctx.fillStyle = "#CCCCCC";
        ctx.stroke();
        ctx.fill();

        ctx.moveTo(-5, 20);
        ctx.lineTo(40, 182);
        ctx.lineTo(42, 182);
        ctx.lineTo(34, 152);
        ctx.lineTo(37, 147);
        ctx.lineTo(50, 154);
        ctx.lineTo(50, 167);
        ctx.lineTo(53, 179);
        ctx.lineTo(55, 157);
        ctx.lineTo(15, 12);
        ctx.stroke();

        ctx.moveTo(34, 152);
        ctx.lineTo(50, 212);
        ctx.lineTo(55, 217);
        ctx.lineTo(59, 202);
        ctx.lineTo(50, 167);
        ctx.lineTo(50, 154);
        ctx.lineTo(37, 147);
        ctx.stroke();

        ctx.moveTo(-1, 32);
        ctx.lineTo(15, 12);
        ctx.stroke();

        ctx.moveTo(30, 147);
        ctx.lineTo(50, 140);
        ctx.stroke();

        ctx.fill();
        ctx.stroke();

    }

    //
    //  generates the image of a single hind leg
    //
    function drawHindLeg() {
        ctx.moveTo(13, -30);
        ctx.lineTo(5, 15);
        ctx.lineTo(-13, 73);

        ctx.arc(-20, 78, 7, -Math.PI / 6, 10 * Math.PI / 7);

        ctx.lineTo(5, -35);
        ctx.lineTo(7, -36);
        ctx.lineTo(13, -30);

        ctx.moveTo(-7.5, 30);
        ctx.lineTo(-20, 75);
        ctx.stroke();

    }

    //
    //  generates the image of a single foot
    //
    function drawFoot() {

        ctx.moveTo(6, 15);
        ctx.quadraticCurveTo(-4, -15, -54, 15);
        ctx.lineTo(6, 15);
        ctx.stroke();

        ctx.lineTo(8, 15);
        ctx.lineTo(8, 9);
        ctx.lineTo(4, 9);
        ctx.lineTo(-39, 0);
        ctx.lineTo(-39, -2);
        ctx.lineTo(-52, 3);
        ctx.lineTo(-52, 15);
        ctx.lineTo(8, 15);
        ctx.stroke();

        ctx.moveTo(-52, 5);
        ctx.lineTo(-69, 8);
        ctx.lineTo(-76, 15);
        ctx.lineTo(-64, 15);
        ctx.lineTo(-64, 10);
        ctx.lineTo(-52, 10);
        ctx.closePath();
        ctx.stroke();

        ctx.moveTo(-29, 2);
        ctx.lineTo(-39, 0);
        ctx.lineTo(-24, -8);
        ctx.lineTo(-24, -5);
        ctx.lineTo(-14, 0);
        ctx.closePath();
        ctx.stroke();
        ctx.moveTo(-4, 0);
        ctx.arc(0, 0, 4, -Math.PI, 0);
        ctx.lineTo(4, 8);
        ctx.stroke();

        ctx.fill();
        ctx.stroke();

    }
}

//
//  generates the image of a red plasma bolt ("laser")
//
function drawLaser() {

    ctx.beginPath();
    ctx.strokeStyle = "#FF3333";
    ctx.moveTo(0, 0);
    ctx.lineTo(-60, 0);
    ctx.closePath();
    ctx.stroke();

}

//
// converts degrees to radians
//
function toRad(angle) {

    return angle * Math.PI / 180;

}