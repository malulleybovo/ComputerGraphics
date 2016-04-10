
var m4;

var tModel;
var trianglePosBuffer;
var colorBuffer;
var normalBuffer;
var indexBuffer;
var texture;
var image;

var triIndices;

function Model(gl, objData, textureImgSrc) {
    m4 = twgl.m4;
    this.tModel = m4.identity();
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
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);

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