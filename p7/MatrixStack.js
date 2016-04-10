
var m4;

var tV;
var tMV;
var tMVP;

function MatrixStack(tToOrigin, tView, tProj) {
    m4 = twgl.m4;
    this.tV = tView;
    this.tMV = [];
    this.tMV.push(m4.multiply(tToOrigin, tView));
    this.tMVP = [];
    this.tMVP.push(m4.multiply(this.tMV[0], tProj));
}

MatrixStack.prototype.push = function () {
    this.tMV.push(this.tMV[this.tMV.length - 1]);
    this.tMVP.push(this.tMVP[this.tMVP.length - 1]);
}

MatrixStack.prototype.pop = function () {
    this.tMV.pop(this.tMV[this.tMV.length - 1]);
    this.tMVP.pop(this.tMVP[this.tMVP.length - 1]);
}

MatrixStack.prototype.transform = function (tModel) {
    this.tMV[this.tMV.length - 1] = m4.multiply(tModel, this.tMV[this.tMV.length - 1]);
    this.tMVP[this.tMVP.length - 1] = m4.multiply(tModel, this.tMVP[this.tMVP.length - 1]);
}

MatrixStack.prototype.getViewMatrix = function () {
    return this.tV;
}

MatrixStack.prototype.getModelViewMatrix = function () {
    return this.tMV[this.tMV.length - 1];
}

MatrixStack.prototype.getModelViewProjMatrix = function () {
    return this.tMVP[this.tMVP.length - 1];
}

MatrixStack.prototype.getNormalMatrix = function () {
    return m4.transpose(m4.inverse(this.tMV[this.tMV.length - 1]));
}