
var m4;

var name;
var size;
var position;

var tModel;
var trianglePosBuffer;
var colorBuffer;
var normalBuffer;
var tangentBuffer;
var indexBuffer;
var textureData;
var texture;
var texture2;
var image;

var triIndices;


function Model(gl, objData, objTexData, mSize, pos, rotAxis, rot, mName) {
    m4 = twgl.m4;
    this.name = mName;
    this.size = mSize;
    this.position = pos;
    this.tModel = m4.identity();
    twgl.m4.axisRotate(this.tModel, rotAxis, rot, this.tModel);
    twgl.m4.setTranslation(this.tModel, this.position, this.tModel);
    twgl.m4.scale(this.tModel, [this.size, this.size, this.size], this.tModel);

    var loader = new ModelLoader(objData);
    var vertexPos = loader.vertexPos;
    var vertexNormals = loader.vertexNormals;
    var vertexTangents = loader.vertexTangents;
    var vertexColors = loader.vertexColors;
    var vertexIndices = loader.vertexIndices;

    var texLoader = new ModelTexLoader(objTexData);
    this.textureData = texLoader.textures[loader.material];

    this.setTrianglePosBuffer(gl, vertexPos);
    this.setNormalBuffer(gl, vertexNormals);
    this.setTangentBuffer(gl, vertexTangents);
    this.setColorBuffer(gl, vertexColors);
    this.setIndexBuffer(gl, vertexIndices);
    gl.activeTexture(gl.TEXTURE0);
    this.setupTexture(gl, this.textureData.diffuseMap);
    gl.activeTexture(gl.TEXTURE1);
    this.setupTexture2(gl, this.textureData.normalMap);
}

Model.shaderProgram = undefined;
Model.buffers = undefined;

Model.prototype.init = function (drawingState) {
    var gl = drawingState.gl;
    // create the shaders once - for all models
    if (!Model.shaderProgram) {
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
        Model.shaderProgram = gl.createProgram();
        gl.attachShader(Model.shaderProgram, vertexShader);
        gl.attachShader(Model.shaderProgram, fragmentShader);
        gl.linkProgram(Model.shaderProgram);
        if (!gl.getProgramParameter(Model.shaderProgram, gl.LINK_STATUS)) {
            alert("Could not initialize shaders");
        }

        Model.shaderProgram.PositionAttribute = gl.getAttribLocation(Model.shaderProgram, "vPosition");
        gl.enableVertexAttribArray(Model.shaderProgram.PositionAttribute);

        Model.shaderProgram.textureCoordAttribute = gl.getAttribLocation(Model.shaderProgram, "vTexCoord");
        gl.enableVertexAttribArray(Model.shaderProgram.textureCoordAttribute);

        Model.shaderProgram.NormalAttribute = gl.getAttribLocation(Model.shaderProgram, "vNormal");
        gl.enableVertexAttribArray(Model.shaderProgram.NormalAttribute);

        Model.shaderProgram.TangentAttribute = gl.getAttribLocation(Model.shaderProgram, "vTang");
        gl.enableVertexAttribArray(Model.shaderProgram.TangentAttribute);

        // this gives us access to the matrix uniform
        Model.shaderProgram.modelMatrix = gl.getUniformLocation(Model.shaderProgram, "modelMatrix");
        Model.shaderProgram.viewMatrix = gl.getUniformLocation(Model.shaderProgram, "viewMatrix");
        Model.shaderProgram.projMatrix = gl.getUniformLocation(Model.shaderProgram, "projMatrix");
        Model.shaderProgram.normalMatrix = gl.getUniformLocation(Model.shaderProgram, "normalMatrix");
        Model.shaderProgram.dirlight = gl.getUniformLocation(Model.shaderProgram, "dirlight");
        Model.shaderProgram.ptlightposn = gl.getUniformLocation(Model.shaderProgram, "ptlightposn");
        Model.shaderProgram.ptlightcolorn = gl.getUniformLocation(Model.shaderProgram, "ptlightcolorn");
        Model.shaderProgram.ptlightdampern = gl.getUniformLocation(Model.shaderProgram, "ptlightdampern");

        Model.shaderProgram.diffuseMap = gl.getUniformLocation(Model.shaderProgram, "diffuseMap");
        Model.shaderProgram.normalMap = gl.getUniformLocation(Model.shaderProgram, "normalMap");
        //Model.shaderProgram.Time = gl.getUniformLocation(Model.shaderProgram, "time");

        Model.shaderProgram.ambient = gl.getUniformLocation(Model.shaderProgram, "ambient");
        Model.shaderProgram.diffuse = gl.getUniformLocation(Model.shaderProgram, "diffuse");
        Model.shaderProgram.specular = gl.getUniformLocation(Model.shaderProgram, "specular");
        Model.shaderProgram.shininess = gl.getUniformLocation(Model.shaderProgram, "shininess");
        Model.shaderProgram.emission = gl.getUniformLocation(Model.shaderProgram, "emission");
    }
};

Model.prototype.draw = function (drawingState) {
    // the drawing coce is straightforward - since twgl deals with the GL stuff for us
    var gl = drawingState.gl;
    gl.useProgram(Model.shaderProgram);

    gl.uniform1i(Model.shaderProgram.diffuseMap, 0);
    gl.uniform1i(Model.shaderProgram.normalMap, 1);

    gl.uniform3fv(Model.shaderProgram.dirlight, drawingState.sunDirection);
    gl.uniform4fv(Model.shaderProgram.ptlightposn, [5.0, 5.0, -5.0, 1.0, 0.0, -0.5, 2.0, 1.0, drawingState.sunDirection[0], drawingState.sunDirection[1], drawingState.sunDirection[2], 1.0]);
    gl.uniform4fv(Model.shaderProgram.ptlightcolorn, [7.5, 15.0, 15.0, 1.0, 2.0 * 9.7, 2.0 * 8.9, 2.0 * 1.7, 1.0, 50.0, 50.0, 50.0, 1.0]);
    gl.uniform1fv(Model.shaderProgram.ptlightdampern, [2.3,5.5, 1.0]);

    gl.uniform4fv(Model.shaderProgram.ambient, this.textureData.ambient);
    gl.uniform4fv(Model.shaderProgram.diffuse, this.textureData.diffuse);
    gl.uniform4fv(Model.shaderProgram.specular, this.textureData.specular);
    gl.uniform1f(Model.shaderProgram.shininess, this.textureData.shininess);
    gl.uniform4fv(Model.shaderProgram.emission, this.textureData.emission);

    gl.uniformMatrix4fv(Model.shaderProgram.modelMatrix, false, this.tModel);
    gl.uniformMatrix4fv(Model.shaderProgram.viewMatrix, false, drawingState.view);
    gl.uniformMatrix4fv(Model.shaderProgram.projMatrix, false, drawingState.proj);
    gl.uniformMatrix4fv(Model.shaderProgram.normalMatrix, false, twgl.m4.transpose(twgl.m4.inverse(twgl.m4.multiply(this.tModel, drawingState.view))));

    this.bindAllBuffers(gl, Model.shaderProgram.PositionAttribute, Model.shaderProgram.textureCoordAttribute, Model.shaderProgram.NormalAttribute, Model.shaderProgram.TangentAttribute);
    this.drawModel(gl);
};

Model.prototype.center = function (drawingState) {
    return this.position;
}

Model.prototype.setModelMatrixR = function (modelMatrix) {
    this.tModel = m4.multiply(modelMatrix, this.tModel);
}

Model.prototype.setModelMatrixL = function (modelMatrix) {
    this.tModel = m4.multiply(this.tModel, modelMatrix);
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

Model.prototype.setTangentBuffer = function (gl, vertexTangents) {
    this.tangentBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, this.tangentBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, vertexTangents, gl.STATIC_DRAW);
    this.tangentBuffer.itemSize = 3;
    this.tangentBuffer.numItems = vertexTangents.length / 3;
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
    this.image = textureImgSrc;
    this.initTextureThenDraw(gl, textureImgSrc);
}

Model.prototype.initTextureThenDraw = function (gl, textureImgSrc) {
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

Model.prototype.setupTexture2 = function (gl, textureImgSrc) {
    // Set up texture
    this.texture2 = gl.createTexture();
    gl.bindTexture(gl.TEXTURE_2D, this.texture2);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, 1, 1, 0, gl.RGBA, gl.UNSIGNED_BYTE, null);
    this.image2 = textureImgSrc;
    this.image.onload = this.LoadTexture2(gl);
}

Model.prototype.LoadTexture2 = function (gl) {
    gl.bindTexture(gl.TEXTURE_2D, this.texture2);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, this.image2);

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

Model.prototype.bindAllBuffers = function (gl, positionLoc, texcoordLoc, normalLoc, tangentLoc) {

    gl.bindBuffer(gl.ARRAY_BUFFER, this.trianglePosBuffer);
    gl.vertexAttribPointer(positionLoc, this.trianglePosBuffer.itemSize, gl.FLOAT, false, 0, 0);

    gl.bindBuffer(gl.ARRAY_BUFFER, this.normalBuffer);
    gl.vertexAttribPointer(normalLoc, this.normalBuffer.itemSize, gl.FLOAT, false, 0, 0);

    gl.bindBuffer(gl.ARRAY_BUFFER, this.tangentBuffer);
    gl.vertexAttribPointer(tangentLoc, this.tangentBuffer.itemSize, gl.FLOAT, false, 0, 0);

    gl.bindBuffer(gl.ARRAY_BUFFER, this.colorBuffer);
    gl.vertexAttribPointer(texcoordLoc, this.colorBuffer.itemSize, gl.FLOAT, false, 0, 0);
}

Model.prototype.drawModel = function (gl) {
    gl.activeTexture(gl.TEXTURE1);
    gl.bindTexture(gl.TEXTURE_2D, this.texture2);
    gl.activeTexture(gl.TEXTURE0);
    gl.bindTexture(gl.TEXTURE_2D, this.texture);
    gl.drawArrays(gl.TRIANGLES, 0, this.trianglePosBuffer.numItems);
    //gl.drawElements(gl.TRIANGLES, this.triIndices.length, gl.UNSIGNED_SHORT, 0);
}