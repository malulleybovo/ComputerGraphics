
function RawModel(drawingState, objData, objTexData) {
    var gl = drawingState.gl;

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

RawModel.prototype.setTrianglePosBuffer = function (gl, vertexPos) {
    this.trianglePosBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, this.trianglePosBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, vertexPos, gl.STATIC_DRAW);
    this.trianglePosBuffer.itemSize = 3;
    this.trianglePosBuffer.numItems = vertexPos.length / 3;
}

RawModel.prototype.setColorBuffer = function (gl, vertexColors) {
    this.colorBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, this.colorBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, vertexColors, gl.STATIC_DRAW);
    this.colorBuffer.itemSize = 2;
    this.colorBuffer.numItems = vertexColors.length / 2;
}

RawModel.prototype.setNormalBuffer = function (gl, vertexNormals) {
    this.normalBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, this.normalBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, vertexNormals, gl.STATIC_DRAW);
    this.normalBuffer.itemSize = 3;
    this.normalBuffer.numItems = vertexNormals.length / 3;
}

RawModel.prototype.setTangentBuffer = function (gl, vertexTangents) {
    this.tangentBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, this.tangentBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, vertexTangents, gl.STATIC_DRAW);
    this.tangentBuffer.itemSize = 3;
    this.tangentBuffer.numItems = vertexTangents.length / 3;
}

RawModel.prototype.setIndexBuffer = function (gl, triangleIndices) {
    this.triIndices = triangleIndices;
    this.indexBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, this.indexBuffer);
    gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, triangleIndices, gl.STATIC_DRAW);
}

RawModel.prototype.setupTexture = function (gl, textureImgSrc) {
    // Set up texture
    this.texture = gl.createTexture();
    gl.bindTexture(gl.TEXTURE_2D, this.texture);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, 1, 1, 0, gl.RGBA, gl.UNSIGNED_BYTE, null);
    this.image = textureImgSrc;
    this.initTextureThenDraw(gl, textureImgSrc);
}

RawModel.prototype.initTextureThenDraw = function (gl, textureImgSrc) {
    this.image.onload = this.LoadTexture(gl);

}

RawModel.prototype.LoadTexture = function (gl) {
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

RawModel.prototype.setupTexture2 = function (gl, textureImgSrc) {
    // Set up texture
    this.texture2 = gl.createTexture();
    gl.bindTexture(gl.TEXTURE_2D, this.texture2);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, 1, 1, 0, gl.RGBA, gl.UNSIGNED_BYTE, null);
    this.image2 = textureImgSrc;
    this.image.onload = this.LoadTexture2(gl);
}

RawModel.prototype.LoadTexture2 = function (gl) {
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
