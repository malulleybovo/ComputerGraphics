var canvas = document.getElementById('myCanvas');
  var ctx = canvas.getContext('2d');

  // angle : angle by which the sweeps of the mill are
  // rotated at each frame
  var angle = 0;

  // generates the animation
  function animate() {

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    drawMill(300, 180);

    incrementAngle();

    window.requestAnimationFrame(animate);

  }

  // param x : x coord of center of sweeps
  // param y : y coord of center of sweeps
  function drawMill(x, y) {

    // draw body
    ctx.beginPath();
    ctx.moveTo(x-80, y+20);
    ctx.lineTo(x-120, y+320);
    ctx.lineTo(x-30, y+320);
    ctx.lineTo(x-30, y+260);
    ctx.arc(x, y+260, 30, Math.PI, 2*Math.PI);
    ctx.lineTo(x+30, y+320);
    ctx.lineTo(x-30, y+320);
    ctx.lineTo(x+120, y+320);
    ctx.lineTo(x+80, y+20);
    ctx.lineTo(x-90, y+20);

    // draw roof
    ctx.lineTo(x-5, y-35);
    ctx.lineTo(x-5, y-55);
    ctx.lineTo(x+5, y-55);
    ctx.lineTo(x+5, y-35);
    ctx.lineTo(x-5, y-35);
    ctx.lineTo(x-45, y+20);
    ctx.lineTo(x+45, y+20);
    ctx.lineTo(x+5, y-35);
    ctx.lineTo(x+90, y+20);
    ctx.lineTo(x+80, y+20);
    ctx.stroke();

    // draw support for sweeps
    ctx.beginPath();
    ctx.arc(x, y, 15, 0, 2*Math.PI);
    ctx.stroke();
    ctx.beginPath();
    ctx.arc(x, y, 5, 0, 2*Math.PI);
    ctx.stroke();

    // draw sweeps
    drawSweeps(x, y);
  }

  function drawSweeps(x, y) {
    ctx.save();
    // centralize "model" at (x, y)
    ctx.translate(x, y);

    // rotate "model" by angle specified each frame
    ctx.rotate(angle / 50);
    

    // build sweeps
    for(var i = 0; i < 4; i++) {

      ctx.fillRect(-30, 30, 40, 140);
      ctx.beginPath();
      ctx.moveTo(0,0);
      ctx.lineTo(0, 30);
      ctx.stroke();
      ctx.rotate(Math.PI/2);

    }

    // revert to original coord system
    ctx.restore();

  }

  // converts degree angles to radians
  function toRad (angle) {

      return angle * Math.PI / 180;

  }

  // increment the angle global variable
  function incrementAngle () {

      angle++;
      if (angle > 315) angle = 0;

    }

  // starts the animation
  window.onload = function(){animate();};