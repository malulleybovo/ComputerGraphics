var m4 = twgl.m4;

function Model(verticesString, normalsString, facesString, color) {

    this.triangles = [];
    this.Mmodel = [];
    this.Mmodel.push(m4.identity());
    this.load(verticesString, normalsString, facesString, color);
}

Model.prototype.load = function (verticesString, normalsString, facesString, color) {
    
    var unparsedVertices = verticesString.split("v ");
    var unparsedNormals = normalsString.split("vn ");
    var unparsedFaces = facesString.split("f ");

    var vertices = [];
    for (var i = 0; i < unparsedVertices.length; i++) {
        vertices.push(unparsedVertices[i].split(" "));
    }
    var normals = [];
    for (var i = 0; i < unparsedNormals.length; i++) {
        normals.push(unparsedNormals[i].split(" "));
    }
    var faces = [];
    for (var i = 1; i < unparsedFaces.length; i++) {
        var newFace = unparsedFaces[i].split(" ");
        for (var j = 0; j < newFace.length; j++) {
            faces.push(newFace[j].split("/"));
        }
    }

    for (var i = 0; i < faces.length; i += 3) {
        
        this.triangles.push(new Triangle(vertices[faces[i][0]], vertices[faces[i + 1][0]], vertices[faces[i + 2][0]], normals[faces[i][2]], color, i, null, null));
    }
}

Model.prototype.getTris = function() {
    return this.triangles;
}

Model.prototype.applyModelTransform = function (Mmodel) {
    this.Mmodel[this.Mmodel.length - 1] = m4.multiply(this.Mmodel[this.Mmodel.length - 1], Mmodel);
    for (var i = 0; i < this.triangles.length; i++) {
        this.triangles[i].applyModelTransform(this.Mmodel[this.Mmodel.length - 1]);
    }
}

Model.prototype.saveModelTransform = function () {
    this.Mmodel.push(this.Mmodel[this.Mmodel.length - 1]);
}

Model.prototype.restoreModelTransform = function () {
    this.Mmodel.pop();
}