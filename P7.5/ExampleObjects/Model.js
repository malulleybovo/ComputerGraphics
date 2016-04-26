
var m4;

var size;
var position;

var tModel;
var trianglePosBuffer;
var colorBuffer;
var normalBuffer;
var indexBuffer;
var texture;
var image;

var triIndices;


function Model(gl, objData, textureImgSrc, mSize, pos) {
    m4 = twgl.m4;
    this.size = mSize;
    this.position = pos;
    this.tModel = twgl.m4.scaling([this.size, this.size, this.size]);
    twgl.m4.setTranslation(this.tModel, this.position, this.tModel);
    var loader = new ModelLoader(objData);
    var vertexPos = loader.vertexPos;
    var vertexNormals = loader.vertexNormals;
    var vertexColors = loader.vertexColors;
    var vertexIndices = loader.vertexIndices;
    this.setTrianglePosBuffer(gl, vertexPos);
    this.setNormalBuffer(gl, vertexNormals);
    this.setColorBuffer(gl, vertexColors);
    this.setIndexBuffer(gl, vertexIndices);
    this.setupTexture(gl, textureImgSrc);
}

Model.shaderProgram = undefined;
Model.buffers = undefined;

Model.prototype.init = function (drawingState) {
    var gl = drawingState.gl;
    // create the shaders once - for all models
    if (!shaderProgram) {
        // Read shader source
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
        shaderProgram = gl.createProgram();
        gl.attachShader(shaderProgram, vertexShader);
        gl.attachShader(shaderProgram, fragmentShader);
        gl.linkProgram(shaderProgram);
        if (!gl.getProgramParameter(shaderProgram, gl.LINK_STATUS)) {
            alert("Could not initialize shaders");
        }

        shaderProgram.PositionAttribute = gl.getAttribLocation(shaderProgram, "vPosition");
        gl.enableVertexAttribArray(shaderProgram.PositionAttribute);

        shaderProgram.textureCoordAttribute = gl.getAttribLocation(shaderProgram, "vTexture");
        gl.enableVertexAttribArray(shaderProgram.textureCoordAttribute);

        shaderProgram.NormalAttribute = gl.getAttribLocation(shaderProgram, "vNormal");
        gl.enableVertexAttribArray(shaderProgram.NormalAttribute);

        // this gives us access to the matrix uniform
        shaderProgram.modelMatrix = gl.getUniformLocation(shaderProgram, "modelMatrix");
        shaderProgram.viewMatrix = gl.getUniformLocation(shaderProgram, "viewMatrix");
        shaderProgram.projMatrix = gl.getUniformLocation(shaderProgram, "projMatrix");
        shaderProgram.normalMatrix = gl.getUniformLocation(shaderProgram, "normalMatrix");
        shaderProgram.lightdir = gl.getUniformLocation(shaderProgram, "lightdir");

        shaderProgram.diffuseMap = gl.getUniformLocation(shaderProgram, "diffuseMap");
        gl.uniform1i(shaderProgram.diffuseMap, 0);
        //shaderProgram.Time = gl.getUniformLocation(shaderProgram, "time");

        shaderProgram.ambient = gl.getUniformLocation(shaderProgram, "ambient");
        shaderProgram.diffuse = gl.getUniformLocation(shaderProgram, "diffuse");
        shaderProgram.specular = gl.getUniformLocation(shaderProgram, "specular");
        shaderProgram.shininess = gl.getUniformLocation(shaderProgram, "shininess");
        shaderProgram.emission = gl.getUniformLocation(shaderProgram, "emission");
    }
};

Model.prototype.draw = function (drawingState) {
    // the drawing coce is straightforward - since twgl deals with the GL stuff for us
    var gl = drawingState.gl;
    gl.useProgram(shaderProgram);

    gl.uniform4fv(shaderProgram.lightdir, drawingState.sunDirection);

    gl.uniform4fv(shaderProgram.ambient, [0.1, 0.1, 0.1, 1.0]);
    gl.uniform4fv(shaderProgram.diffuse, [1.0, 0.88, 0.77, 10.0]);
    gl.uniform4fv(shaderProgram.specular, [0.1, 0.1, 0.05, 1.0]);
    gl.uniform1f(shaderProgram.shininess, 15.0);
    gl.uniform4fv(shaderProgram.emission, [0.0, 0.0, 0.0, 1.0]);

    gl.uniformMatrix4fv(shaderProgram.modelMatrix, false, this.tModel);
    gl.uniformMatrix4fv(shaderProgram.viewMatrix, false, drawingState.view);
    gl.uniformMatrix4fv(shaderProgram.projMatrix, false, drawingState.proj);
    gl.uniformMatrix4fv(shaderProgram.normalMatrix, false, twgl.m4.transpose(twgl.m4.inverse(twgl.m4.multiply(drawingState.view, drawingState.proj))));

    this.bindAllBuffers(gl, shaderProgram.PositionAttribute, shaderProgram.textureCoordAttribute, shaderProgram.NormalAttribute, shaderProgram.diffuseMap);
    this.drawModel(gl);
};

Model.prototype.center = function (drawingState) {
    return this.position;
}

Model.prototype.setModelMatrix = function (modelMatrix) {
    this.tModel = m4.multiply(modelMatrix, this.tModel);
}

Model.prototype.getModelMatrix = function (modelMatrix) {
    return this.tModel;
}

Model.prototype.setUniforms = function () {

}

Model.prototype.setTrianglePosBuffer = function (gl, vertexPos) {
    this.trianglePosBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, this.trianglePosBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, vertexPos, gl.STATIC_DRAW);
    this.trianglePosBuffer.itemSize = 3;
    this.trianglePosBuffer.numItems = vertexPos.length / 3;
}

Model.prototype.setColorBuffer = function (gl, vertexColors) {
    this.colorBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, this.colorBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, vertexColors, gl.STATIC_DRAW);
    this.colorBuffer.itemSize = 2;
    this.colorBuffer.numItems = vertexColors.length / 2;
}

Model.prototype.setNormalBuffer = function (gl, vertexNormals) {
    this.normalBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, this.normalBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, vertexNormals, gl.STATIC_DRAW);
    this.normalBuffer.itemSize = 3;
    this.normalBuffer.numItems = vertexNormals.length / 3;
}

Model.prototype.setIndexBuffer = function (gl, triangleIndices) {
    this.triIndices = triangleIndices;
    this.indexBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, this.indexBuffer);
    gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, triangleIndices, gl.STATIC_DRAW);
}

Model.prototype.setupTexture = function (gl, textureImgSrc) {
    // Set up texture
    this.texture = gl.createTexture();
    gl.bindTexture(gl.TEXTURE_2D, this.texture);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, 1, 1, 0, gl.RGBA, gl.UNSIGNED_BYTE, null);
    this.image = new Image();
    this.initTextureThenDraw(gl, textureImgSrc);
}

Model.prototype.initTextureThenDraw = function (gl, textureImgSrc) {
    this.image.crossOrigin = "anonymous";
    this.image.src = textureImgSrc;
    this.image.onload = this.LoadTexture(gl);

}

Model.prototype.LoadTexture = function (gl) {
    gl.bindTexture(gl.TEXTURE_2D, this.texture);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, this.image);

    // Option 1 : Use mipmap, select interpolation mode
    gl.generateMipmap(gl.TEXTURE_2D);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR_MIPMAP_LINEAR);

    // Option 2: At least use linear filters
    // gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
    // gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);

    // Optional ... if your shader & texture coordinates go outside the [0,1] range
    // gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    // gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
}

Model.prototype.bindAllBuffers = function (gl, positionLoc, texcoordLoc, normalLoc, uSampler) {

    gl.bindBuffer(gl.ARRAY_BUFFER, this.trianglePosBuffer);
    gl.vertexAttribPointer(positionLoc, this.trianglePosBuffer.itemSize, gl.FLOAT, false, 0, 0);

    gl.bindBuffer(gl.ARRAY_BUFFER, this.normalBuffer);
    gl.vertexAttribPointer(normalLoc, this.normalBuffer.itemSize, gl.FLOAT, false, 0, 0);

    gl.bindBuffer(gl.ARRAY_BUFFER, this.colorBuffer);
    gl.vertexAttribPointer(texcoordLoc, this.colorBuffer.itemSize, gl.FLOAT, false, 0, 0);
}

Model.prototype.drawModel = function (gl) {
    gl.bindTexture(gl.TEXTURE_2D, this.texture);
    gl.drawArrays(gl.TRIANGLES, 0, this.trianglePosBuffer.numItems);
    //gl.drawElements(gl.TRIANGLES, this.triIndices.length, gl.UNSIGNED_SHORT, 0);
}