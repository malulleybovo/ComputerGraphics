
"use strict";

var gl;   // The webgl context.
var prog;
var aCoords;           // Location of the coords attribute variable in the shader program.
var uProjection;       // Location of the projection uniform matrix in the shader program.
var uModelview;

var projection = twgl.m4.create();   // projection matrix
var modelview;    // modelview matrix

var texID;
var cube;

var tod;

/**
 * Draws the socre ball one face at a time, copying the vertex coords into a VBO for each face.
 */
function drawSkybox(drawingState, timeOfDay) {

    gl.useProgram(prog);
    
    var antiTranslation = twgl.v3.negate(twgl.m4.getTranslation(drawingState.view));
    antiTranslation = twgl.m4.translation(antiTranslation);
    modelview = twgl.m4.multiply(drawingState.view, antiTranslation);

    gl.uniformMatrix4fv(uProjection, false, drawingState.proj);
    gl.uniformMatrix4fv(uModelview, false, modelview);
    gl.uniform1f(tod, timeOfDay);


    gl.bindBuffer(gl.ARRAY_BUFFER, cube.coordsBuffer);
    gl.vertexAttribPointer(aCoords, 3, gl.FLOAT, false, 0, 0);

    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, cube.indexBuffer);

    gl.activeTexture(gl.TEXTURE0);
    gl.bindTexture(gl.TEXTURE_CUBE_MAP, texID);

    gl.drawElements(gl.TRIANGLES, cube.count, gl.UNSIGNED_SHORT, 0);

}


function loadTextureCube(urls) {
    gl.activeTexture(gl.TEXTURE0);
    var ct = 0;
    var img = [
       LoadedImageFiles["peaks_ft.png"], LoadedImageFiles["peaks_bk.png"],
       LoadedImageFiles["peaks_up.png"], LoadedImageFiles["peaks_dn.png"],
       LoadedImageFiles["peaks_rt.png"], LoadedImageFiles["peaks_lf.png"]
    ];
    for (var i = 0; i < 6; i++) {
            ct++;
            if (ct == 6) {
                texID = gl.createTexture();
                gl.bindTexture(gl.TEXTURE_CUBE_MAP, texID);
                var targets = [
                   gl.TEXTURE_CUBE_MAP_POSITIVE_X, gl.TEXTURE_CUBE_MAP_NEGATIVE_X,
                   gl.TEXTURE_CUBE_MAP_POSITIVE_Y, gl.TEXTURE_CUBE_MAP_NEGATIVE_Y,
                   gl.TEXTURE_CUBE_MAP_POSITIVE_Z, gl.TEXTURE_CUBE_MAP_NEGATIVE_Z
                ];
                for (var j = 0; j < 6; j++) {
                    gl.texImage2D(targets[j], 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, img[j]);
                    gl.texParameteri(gl.TEXTURE_CUBE_MAP, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
                    gl.texParameteri(gl.TEXTURE_CUBE_MAP, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
                }
                gl.generateMipmap(gl.TEXTURE_CUBE_MAP);
            }
    }
}


function createModel(modelData) {
    var model = {};
    model.count = modelData.indices.length;
    model.coordsBuffer = setCoordBuffer(modelData.vertexPositions);
    model.indexBuffer = setIndexBuffer(modelData.indices);
    model.render = function () {
        gl.bindBuffer(gl.ARRAY_BUFFER, this.coordsBuffer);
        gl.vertexAttribPointer(aCoords, 3, gl.FLOAT, false, 0, 0);
        gl.uniformMatrix4fv(uModelview, false, modelview);
        gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, this.indexBuffer);
        gl.drawElements(gl.TRIANGLES, this.count, gl.UNSIGNED_SHORT, 0);
        console.log(this.count);
    }
    return model;
}


function createProgram(gl, vertexShaderSource, fragmentShaderSource) {
    var vsh = gl.createShader(gl.VERTEX_SHADER);
    gl.shaderSource(vsh, vertexShaderSource);
    gl.compileShader(vsh);
    if (!gl.getShaderParameter(vsh, gl.COMPILE_STATUS)) {
        throw "Error in vertex shader:  " + gl.getShaderInfoLog(vsh);
    }
    var fsh = gl.createShader(gl.FRAGMENT_SHADER);
    gl.shaderSource(fsh, fragmentShaderSource);
    gl.compileShader(fsh);
    if (!gl.getShaderParameter(fsh, gl.COMPILE_STATUS)) {
        throw "Error in fragment shader:  " + gl.getShaderInfoLog(fsh);
    }
    var prog = gl.createProgram();
    gl.attachShader(prog, vsh);
    gl.attachShader(prog, fsh);
    gl.linkProgram(prog);
    if (!gl.getProgramParameter(prog, gl.LINK_STATUS)) {
        throw "Link error in program:  " + gl.getProgramInfoLog(prog);
    }
    return prog;
}


function getTextContent(elementID) {
    var element = document.getElementById(elementID);
    var fsource = "";
    var node = element.firstChild;
    var str = "";
    while (node) {
        if (node.nodeType == 3) // this is a text node
            str += node.textContent;
        node = node.nextSibling;
    }
    return str;
}


function initSkybox(myCanvas, view) {
    try {
        var canvas = myCanvas;
        gl = twgl.getWebGLContext(canvas);
        if (!gl) {
            throw "Could not create WebGL context.";
        }
        var vertexShaderSource = getTextContent("vshader");
        var fragmentShaderSource = getTextContent("fshader");
        prog = createProgram(gl, vertexShaderSource, fragmentShaderSource);
        gl.useProgram(prog);
        aCoords = gl.getAttribLocation(prog, "coords");
        gl.enableVertexAttribArray(aCoords);
        uModelview = gl.getUniformLocation(prog, "modelview");
        uProjection = gl.getUniformLocation(prog, "projection");
        tod = gl.getUniformLocation(prog, "tod");
        gl.enable(gl.DEPTH_TEST);
        cube = createModel(cube(5000));
    }
    catch (e) {
        return;
    }
    loadTextureCube();
}

function cube(side) {
    var s = (side || 1) / 2;
    var coords = [];
    var normals = [];
    var texCoords = [];
    var indices = [];
    function face(xyz, nrm) {
        var start = coords.length / 3;
        var i;
        for (i = 0; i < 12; i++) {
            coords.push(xyz[i]);
        }
        for (i = 0; i < 4; i++) {
            normals.push(nrm[0], nrm[1], nrm[2]);
        }
        texCoords.push(0, 0, 1, 0, 1, 1, 0, 1);
        indices.push(start, start + 1, start + 2, start, start + 2, start + 3);
    }
    face([-s, -s, s, s, -s, s, s, s, s, -s, s, s], [0, 0, 1]);
    face([-s, -s, -s, -s, s, -s, s, s, -s, s, -s, -s], [0, 0, -1]);
    face([-s, s, -s, -s, s, s, s, s, s, s, s, -s], [0, 1, 0]);
    face([-s, -s, -s, s, -s, -s, s, -s, s, -s, -s, s], [0, -1, 0]);
    face([s, -s, -s, s, s, -s, s, s, s, s, -s, s], [1, 0, 0]);
    face([-s, -s, -s, -s, -s, s, -s, s, s, -s, s, -s], [-1, 0, 0]);
    return {
        vertexPositions: new Float32Array(coords),
        vertexNormals: new Float32Array(normals),
        vertexTextureCoords: new Float32Array(texCoords),
        indices: new Uint16Array(indices)
    }
}

function setCoordBuffer(vertexPos) {
    var coordsBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, coordsBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, vertexPos, gl.STATIC_DRAW);
    coordsBuffer.itemSize = 3;
    coordsBuffer.numItems = vertexPos.length / 3;
    return coordsBuffer;
}

function setIndexBuffer(triangleIndices) {
    var indexBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, indexBuffer);
    gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, triangleIndices, gl.STATIC_DRAW);
    return indexBuffer;
}