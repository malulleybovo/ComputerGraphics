
var objDataContent;
var vertexPos;
var vertexNormals;
var vertexColors;
var vertexIndices;

function ModelLoader(objData) {
    this.vertexPos = [];
    this.vertexNormals = [];
    this.vertexColors = [];
    this.vertexIndices = [];
    this.loadObjData(objData);
    this.vertexPos = new Float32Array(this.vertexPos);
    this.vertexNormals = new Float32Array(this.vertexNormals);
    this.vertexColors = new Float32Array(this.vertexColors);
    this.vertexIndices = new Uint16Array(this.vertexIndices);
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
            unorderedVertexColors.push(parseFloat(triSet[1]));
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
    }
}