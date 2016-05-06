
function Model(drawingState, rawModel, mSize, pos, rotAxis, rot, mName) {

    if (Model.gl == null) {
        Model.gl = drawingState.gl;
    }
    if (Model.shaderProgram == null) {
        Model.shaderProgram = drawingState.shaderProgram;
    }

    this.modelData = rawModel;

    this.name = mName;
    this.size = mSize;
    this.position = pos;
    this.rotationAxis = rotAxis;
    this.rotDegrees = rot;
    this.children = {};
    this.translation = twgl.m4.translation(this.position);
    this.scale = twgl.m4.scaling([this.size, this.size, this.size]);
    this.rotation = twgl.m4.axisRotation(rotAxis, rot);


}

Model.gl = null;
Model.shaderProgram = null;

Model.prototype.init = function (drawingState) {
};

Model.prototype.draw = function (drawingState) {
    Model.gl.useProgram(Model.shaderProgram);

    Model.gl.uniform1i(Model.shaderProgram.diffuseMap, 0);
    Model.gl.uniform1i(Model.shaderProgram.normalMap, 1);

    Model.gl.uniform3fv(Model.shaderProgram.dirlight, drawingState.sunDirection);
    Model.gl.uniform4fv(Model.shaderProgram.ptlightposn, [5.0, 5.0, -5.0, 1.0, 0.0, -0.5, 2.0, 1.0, drawingState.sunDirection[0], drawingState.sunDirection[1], drawingState.sunDirection[2], 1.0]);
    Model.gl.uniform4fv(Model.shaderProgram.ptlightcolorn, [7.5, 15.0, 15.0, 1.0, 2.0 * 9.7, 2.0 * 8.9, 2.0 * 1.7, 1.0, 5000.0, 5000.0, 5000.0, 1.0]);
    Model.gl.uniform1fv(Model.shaderProgram.ptlightdampern, [2.3, 5.5, 1.0]);

    Model.gl.uniform4fv(Model.shaderProgram.ambient, this.modelData.textureData.ambient);
    Model.gl.uniform4fv(Model.shaderProgram.diffuse, this.modelData.textureData.diffuse);
    Model.gl.uniform4fv(Model.shaderProgram.specular, this.modelData.textureData.specular);
    Model.gl.uniform1f(Model.shaderProgram.shininess, this.modelData.textureData.shininess);
    Model.gl.uniform4fv(Model.shaderProgram.emission, this.modelData.textureData.emission);

    Model.gl.uniformMatrix4fv(Model.shaderProgram.modelMatrix, false, this.getModelMatrix());
    Model.gl.uniformMatrix4fv(Model.shaderProgram.viewMatrix, false, drawingState.view);
    Model.gl.uniformMatrix4fv(Model.shaderProgram.projMatrix, false, drawingState.proj);
    Model.gl.uniformMatrix4fv(Model.shaderProgram.normalMatrix, false, twgl.m4.transpose(twgl.m4.inverse(twgl.m4.multiply(this.getModelMatrix(), drawingState.view))));

    this.bindAllBuffers(Model.shaderProgram.PositionAttribute, Model.shaderProgram.textureCoordAttribute, Model.shaderProgram.NormalAttribute, Model.shaderProgram.TangentAttribute);
    this.drawModel();

    for (var childName in this.children) {
        this.children[childName].draw(drawingState);
    }
};

Model.prototype.center = function (drawingState) {
    return this.position;
}

Model.prototype.addChild = function (drawingState, rawModel, mName) {
    this.children[mName] = new Model(drawingState, rawModel, this.size, this.position, this.rotationAxis, this.rotDegrees, mName);
}

Model.prototype.setTranslation = function (transMatrix) {
    this.translation = transMatrix;
    this.position = twgl.m4.getTranslation(this.translation);

    for (var childName in this.children) {
        this.children[childName].translation = transMatrix;
        this.children[childName].position = twgl.m4.getTranslation(this.translation);
    }
}

Model.prototype.addTranslation = function (transMatrix) {
    var trans = twgl.m4.multiply(transMatrix, this.translation);
    this.translation = trans;
    this.position = twgl.m4.getTranslation(this.translation);

    for (var childName in this.children) {
        this.children[childName].translation = trans;
        this.children[childName].position = twgl.m4.getTranslation(this.translation);
    }
}

Model.prototype.setScale = function (scalingMatrix) {
    this.scale = scalingMatrix;

    for (var childName in this.children) {
        this.children[childName].scale = scalingMatrix;
    }
}

Model.prototype.setRotation = function (rotMatrix) {
    this.rotation = rotMatrix;

    for (var childName in this.children) {
        this.children[childName].rotation = rotMatrix;
    }
}

Model.prototype.addRotation = function (rotMatrix) {
    var r = twgl.m4.multiply(rotMatrix, this.rotation)
    this.rotation = r;

    for (var childName in this.children) {
        this.children[childName].rotation = r;
    }
}

Model.prototype.getModelMatrix = function (modelMatrix) {
    return twgl.m4.multiply(twgl.m4.multiply(this.scale, this.rotation), this.translation);
}

Model.prototype.setUniforms = function () {

}

Model.prototype.bindAllBuffers = function (positionLoc, texcoordLoc, normalLoc, tangentLoc) {

    Model.gl.bindBuffer(Model.gl.ARRAY_BUFFER, this.modelData.trianglePosBuffer);
    Model.gl.vertexAttribPointer(positionLoc, this.modelData.trianglePosBuffer.itemSize, Model.gl.FLOAT, false, 0, 0);

    Model.gl.bindBuffer(Model.gl.ARRAY_BUFFER, this.modelData.normalBuffer);
    Model.gl.vertexAttribPointer(normalLoc, this.modelData.normalBuffer.itemSize, Model.gl.FLOAT, false, 0, 0);

    Model.gl.bindBuffer(Model.gl.ARRAY_BUFFER, this.modelData.tangentBuffer);
    Model.gl.vertexAttribPointer(tangentLoc, this.modelData.tangentBuffer.itemSize, Model.gl.FLOAT, false, 0, 0);

    Model.gl.bindBuffer(Model.gl.ARRAY_BUFFER, this.modelData.colorBuffer);
    Model.gl.vertexAttribPointer(texcoordLoc, this.modelData.colorBuffer.itemSize, Model.gl.FLOAT, false, 0, 0);

    Model.gl.bindBuffer(Model.gl.ELEMENT_ARRAY_BUFFER, this.modelData.indexBuffer);
}

Model.prototype.drawModel = function () {
    Model.gl.activeTexture(Model.gl.TEXTURE1);
    Model.gl.bindTexture(Model.gl.TEXTURE_2D, this.modelData.texture2);
    Model.gl.activeTexture(Model.gl.TEXTURE0);
    Model.gl.bindTexture(Model.gl.TEXTURE_2D, this.modelData.texture);
    Model.gl.drawArrays(Model.gl.TRIANGLES, 0, this.modelData.trianglePosBuffer.numItems);
    //gl.drawElements(gl.TRIANGLES, this.triIndices.length, gl.UNSIGNED_SHORT, 0);
}