
function gui(gl, image, HUDscale, HUDtranslation) {
    if (gui.shaderProgram == null) {
        gui.shaderProgram = createGUIProgram();
    }

    gl.useProgram(gui.shaderProgram);

    initGUI(this, image);

    this.translate = HUDtranslation;
    this.scale = HUDscale;

    function createGUIProgram() {
        // Read shader source
        var vertexSource = document.getElementById("HUD-vs").text;
        var fragmentSource = document.getElementById("HUD-fs").text;

        // Compile vertex shader
        var vertexShader = gl.createShader(gl.VERTEX_SHADER);
        gl.shaderSource(vertexShader, vertexSource);
        gl.compileShader(vertexShader);
        if (!gl.getShaderParameter(vertexShader, gl.COMPILE_STATUS)) {
            alert(gl.getShaderInfoLog(vertexShader)); return null;
        }

        // Compile fragment shader
        var fragmentShader = gl.createShader(gl.FRAGMENT_SHADER);
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
        return shaderProgram;
    }

    function initGUI(that, img) {
        // with the vertex shader, we need to pass it positions
        // as an attribute - so set up that communication
        gui.shaderProgram.PositionAttribute = gl.getAttribLocation(gui.shaderProgram, "position");
        gl.enableVertexAttribArray(gui.shaderProgram.PositionAttribute);

        // this gives us access to the matrix uniform
        gui.shaderProgram.matrix = gl.getUniformLocation(gui.shaderProgram, "transformationMatrix");

        // Attach uniform "sampler2d" to texture unit #0
        gui.shaderProgram.texSampler = gl.getUniformLocation(gui.shaderProgram, "guiTexture");
        gl.uniform1i(gui.shaderProgram.texSampler, 0);

        var vertexPos = new Float32Array(
            [-1, 1, -1, -1, 1, 1, 1, -1]
            );

        // we need to put the vertices into a buffer so we can
        // block transfer them to the graphics hardware
        that.trianglePosBuffer = gl.createBuffer();
        gl.bindBuffer(gl.ARRAY_BUFFER, that.trianglePosBuffer);
        gl.bufferData(gl.ARRAY_BUFFER, vertexPos, gl.STATIC_DRAW);
        that.trianglePosBuffer.itemSize = 2;
        that.trianglePosBuffer.numItems = 4;


        // Set up texture
        that.texture = gl.createTexture();
        gl.bindTexture(gl.TEXTURE_2D, that.texture);
        gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, 1, 1, 0, gl.RGBA, gl.UNSIGNED_BYTE, null);
        gl.bindTexture(gl.TEXTURE_2D, that.texture);
        gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, img);

        gl.generateMipmap(gl.TEXTURE_2D);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR_MIPMAP_LINEAR);
    }

}

gui.shaderProgram = null;

gui.prototype.renderGUI = function (gl) {
    gl.useProgram(gui.shaderProgram);
    gl.disable(gl.DEPTH_TEST);
    gl.enable(gl.BLEND);
    gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);
    gl.uniform1i(gui.shaderProgram.texSampler, 0);
    // Set up uniforms & attributes
    gl.uniformMatrix4fv(gui.shaderProgram.matrix, false, twgl.m4.multiply(twgl.m4.scaling(this.scale), twgl.m4.translation(this.translate)));

    gl.bindBuffer(gl.ARRAY_BUFFER, this.trianglePosBuffer);
    gl.vertexAttribPointer(gui.shaderProgram.PositionAttribute, this.trianglePosBuffer.itemSize,
      gl.FLOAT, false, 0, 0);

    gl.bindTexture(gl.TEXTURE_2D, this.texture);
    gl.drawArrays(gl.TRIANGLE_STRIP, 0, this.trianglePosBuffer.numItems);
    gl.disable(gl.BLEND);
    gl.enable(gl.DEPTH_TEST);
}

gui.prototype.checkHUDClick = function (mouseRay) {
    if (mouseRay[0] >= this.translate[0] - this.scale[0]
        && mouseRay[0] <= this.translate[0] + this.scale[0]
        && mouseRay[1] >= this.translate[1] - this.scale[1]
        && mouseRay[1] <= this.translate[1] + this.scale[1]) {
        return true;
    }
    return false;
}