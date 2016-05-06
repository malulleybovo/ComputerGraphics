
function Terrain(drawingState, gridX, gridZ, heightMap, textureImgSrc, normalMapImage, reflectX, reflectZ) {

    this.gl = drawingState.gl;
    this.shaderProgram = drawingState.shaderProgram;

    this.x = gridX * Terrain.SIZE;
    this.z = gridZ * Terrain.SIZE;
    this.modelMatrix = twgl.m4.translation([this.x + 4700, 0, this.z + 4800]);

    var loader = new TerrainLoader(this.gl, Terrain.SIZE, Terrain.MAX_HEIGHT, Terrain.MAX_PIXEL_COLOR,
        heightMap, textureImgSrc, normalMapImage, reflectX, reflectZ);

    this.trianglePosBuffer = loader.trianglePosBuffer;
    this.normalBuffer = loader.normalBuffer;
    this.texCoordBuffer = loader.texCoordBuffer;
    this.tangentBuffer = loader.tangentBuffer;
    this.indexBuffer = loader.indexBuffer;
    this.texture = loader.texture;
    this.texture2 = loader.texture2;

}

//
//  Static Variables
//  - SIZE
//  - MAX_HEIGHT
//  - MAX_PIXEL_COLOR
//
Terrain.SIZE = 10000;
Terrain.MAX_HEIGHT = 400;
Terrain.MAX_PIXEL_COLOR = 256;

Terrain.prototype.setX = function (newX) {
    this.x = newX;
    this.modelMatrix = twgl.m4.translation([this.x, 0, this.z]);
}

Terrain.prototype.setZ = function (newZ) {
    this.z = newZ;
    this.modelMatrix = twgl.m4.translation([this.x, 0, this.z]);
}

Terrain.prototype.draw = function (drawingState) {
    
    setUniforms(this);
    bindAllBuffers(this, this.shaderProgram.PositionAttribute, this.shaderProgram.textureCoordAttribute, this.shaderProgram.NormalAttribute, this.shaderProgram.TangentAttribute);
    drawModel(this);

    //
    //  Sub Functions
    //  - setUniforms
    //  - bindAllBuffers
    //  - drawModel
    //
    function setUniforms(that) {
        that.gl.useProgram(that.shaderProgram);

        that.gl.uniform1i(that.shaderProgram.diffuseMap, 0);
        that.gl.uniform1i(that.shaderProgram.normalMap, 1);

        that.gl.uniform3fv(that.shaderProgram.dirlight, drawingState.sunDirection);
        that.gl.uniform4fv(that.shaderProgram.ptlightposn, [5.0, 5.0, -5.0, 1.0, 0.0, -0.5, 2.0, 1.0, drawingState.sunDirection[0], drawingState.sunDirection[1], drawingState.sunDirection[2], 1.0]);
        that.gl.uniform4fv(that.shaderProgram.ptlightcolorn, [7.5, 15.0, 15.0, 1.0, 2.0 * 9.7, 2.0 * 8.9, 2.0 * 1.7, 1.0, 5000.0, 5000.0, 5000.0, 1.0]);
        that.gl.uniform1fv(that.shaderProgram.ptlightdampern, [2.3, 5.5, 1.0]);

        that.gl.uniform4fv(that.shaderProgram.ambient, [0, 0, 0, 1]);
        that.gl.uniform4fv(that.shaderProgram.diffuse, [1, 1, 1, 1]);
        that.gl.uniform4fv(that.shaderProgram.specular, [0, 0, 0, 1]);
        that.gl.uniform1f(that.shaderProgram.shininess, 100.0);
        that.gl.uniform4fv(that.shaderProgram.emission, [0, 0, 0, 1]);

        that.gl.uniformMatrix4fv(that.shaderProgram.modelMatrix, false, that.modelMatrix);
        that.gl.uniformMatrix4fv(that.shaderProgram.viewMatrix, false, drawingState.view);
        that.gl.uniformMatrix4fv(that.shaderProgram.projMatrix, false, drawingState.proj);
        that.gl.uniformMatrix4fv(that.shaderProgram.normalMatrix, false, twgl.m4.transpose(twgl.m4.inverse(twgl.m4.multiply(that.modelMatrix, drawingState.view))));
    }

    function bindAllBuffers (that, positionLoc, texcoordLoc, normalLoc, tangentLoc) {

       this.gl.bindBuffer(this.gl.ARRAY_BUFFER, that.trianglePosBuffer);
       this.gl.vertexAttribPointer(positionLoc, that.trianglePosBuffer.itemSize, this.gl.FLOAT, false, 0, 0);

       this.gl.bindBuffer(this.gl.ARRAY_BUFFER, that.normalBuffer);
       this.gl.vertexAttribPointer(normalLoc, that.normalBuffer.itemSize, this.gl.FLOAT, false, 0, 0);

       this.gl.bindBuffer(this.gl.ARRAY_BUFFER, that.tangentBuffer);
       this.gl.vertexAttribPointer(tangentLoc, that.tangentBuffer.itemSize, this.gl.FLOAT, false, 0, 0);

       this.gl.bindBuffer(this.gl.ARRAY_BUFFER, that.texCoordBuffer);
       this.gl.vertexAttribPointer(texcoordLoc, that.texCoordBuffer.itemSize, this.gl.FLOAT, false, 0, 0);

       this.gl.bindBuffer(this.gl.ELEMENT_ARRAY_BUFFER, that.indexBuffer);
   }

    function drawModel (that) {
       this.gl.activeTexture(this.gl.TEXTURE1);
       this.gl.bindTexture(this.gl.TEXTURE_2D, that.texture2);
       this.gl.activeTexture(this.gl.TEXTURE0);
       this.gl.bindTexture(this.gl.TEXTURE_2D, that.texture);
       this.gl.drawElements(this.gl.TRIANGLES, that.indexBuffer.length, this.gl.UNSIGNED_SHORT, 0);
   }
}