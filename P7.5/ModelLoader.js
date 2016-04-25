
var objDataContent;
var vertexPos;
var vertexNormals;
var vertexColors;
var vertexIndices;
var vertexTangents;
var material;

function ModelLoader(objData) {
    this.vertexPos = [];
    this.vertexNormals = [];
    this.vertexColors = [];
    this.vertexIndices = [];
    this.vertexTangents = [];
    this.material = null;
    this.loadObjData(objData);
    this.vertexPos = new Float32Array(this.vertexPos);
    this.vertexNormals = new Float32Array(this.vertexNormals);
    this.vertexColors = new Float32Array(this.vertexColors);
    this.vertexIndices = new Uint16Array(this.vertexIndices);
    this.computeTangents();
}

ModelLoader.prototype.loadObjData = function (content) {
    var unorderedVertexPos = [];
    var unorderedVertexNormals = [];
    var unorderedVertexColors = [];
    var numFaces = 0;

    var lines = content.split("\n");
    for (var i = 0; i < lines.length; i++) {

        if (lines[i].includes("v ")) {
            var subLine = lines[i].split("v ");
            var triSet = subLine[1].split(" ");
            unorderedVertexPos.push(parseFloat(triSet[0]));
            unorderedVertexPos.push(parseFloat(triSet[1]));
            unorderedVertexPos.push(parseFloat(triSet[2]));
        }
        else if (lines[i].includes("vn ")) {
            var subLine = lines[i].split("vn ");
            var triSet = subLine[1].split(" ");
            unorderedVertexNormals.push(parseFloat(triSet[0]));
            unorderedVertexNormals.push(parseFloat(triSet[1]));
            unorderedVertexNormals.push(parseFloat(triSet[2]));
        }
        else if (lines[i].includes("vt ")) {
            var subLine = lines[i].split("vt ");
            var triSet = subLine[1].split(" ");
            unorderedVertexColors.push(parseFloat(triSet[0]));
            unorderedVertexColors.push(-parseFloat(triSet[1]));
        }
        else if (lines[i].includes("f ")) {
            var subLine = lines[i].split("f ");
            var triSet = subLine[1].split(" ");
            for (var j = 0; j < 3; j++) {
                var triSubset = triSet[j].split("/");
                this.vertexPos.push(unorderedVertexPos[ 3 * (parseInt(triSubset[0])-1) ]);
                this.vertexPos.push(unorderedVertexPos[ 3 * (parseInt(triSubset[0])-1) + 1 ]);
                this.vertexPos.push(unorderedVertexPos[ 3 * (parseInt(triSubset[0])-1) + 2 ]);
                this.vertexNormals.push(unorderedVertexNormals[ 3 * (parseInt(triSubset[2])-1) ]);
                this.vertexNormals.push(unorderedVertexNormals[ 3 * (parseInt(triSubset[2])-1) + 1 ]);
                this.vertexNormals.push(unorderedVertexNormals[ 3 * (parseInt(triSubset[2])-1) + 2 ]);
                this.vertexColors.push(unorderedVertexColors[ 2 * (parseInt(triSubset[1])-1) ]);
                this.vertexColors.push(unorderedVertexColors[ 2 * (parseInt(triSubset[1])-1) + 1 ]);
            }
            this.vertexIndices.push(3 * numFaces);
            this.vertexIndices.push(3 * numFaces + 1);
            this.vertexIndices.push(3 * numFaces + 2);
            numFaces++;
        }
        else if (lines[i].includes("usemtl ")) {
            var subLine = lines[i].split("usemtl ");
            this.material = subLine[1];
        }
    }
}

ModelLoader.prototype.computeTangents = function () {
    var deltaUv1;
    var deltaUv2;
    var deltaPos1;
    var deltaPos2;
    var r;
    var j = 0;
    for (var i = 0; i < this.vertexPos.length; i += 9) {

        deltaUv1 = [
            this.vertexColors[j + 2] - this.vertexColors[j],
            this.vertexColors[j + 3] - this.vertexColors[j + 1]
        ];
        deltaUv2 = [
            this.vertexColors[j + 4] - this.vertexColors[j],
            this.vertexColors[j + 5] - this.vertexColors[j + 1]
        ];
        deltaPos1 = [
            deltaUv2[1] * (this.vertexPos[i + 3] - this.vertexPos[i]),
            deltaUv2[1] * (this.vertexPos[i + 4] - this.vertexPos[i + 1]),
            deltaUv2[1] * (this.vertexPos[i + 5] - this.vertexPos[i + 2]),
        ];
        deltaPos2 = [
            deltaUv1[1] * (this.vertexPos[i + 6] - this.vertexPos[i]),
            deltaUv1[1] * (this.vertexPos[i + 7] - this.vertexPos[i + 1]),
            deltaUv1[1] * (this.vertexPos[i + 8] - this.vertexPos[i + 2]),
        ];
        r = 1.0 / (deltaUv1[0] * deltaUv2[1] - deltaUv1[1] * deltaUv2[0]);
        this.vertexTangents.push(r * (deltaPos1[0] - deltaPos2[0]));
        this.vertexTangents.push(r * (deltaPos1[1] - deltaPos2[1]));
        this.vertexTangents.push(r * (deltaPos1[2] - deltaPos2[2]));
        this.vertexTangents.push(this.vertexTangents[i]);
        this.vertexTangents.push(this.vertexTangents[i + 1]);
        this.vertexTangents.push(this.vertexTangents[i + 2]);
        this.vertexTangents.push(this.vertexTangents[i]);
        this.vertexTangents.push(this.vertexTangents[i + 1]);
        this.vertexTangents.push(this.vertexTangents[i + 2]);
        j += 6;

    }
    this.vertexTangents = new Float32Array(this.vertexTangents);

}