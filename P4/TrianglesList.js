this.triangles = [];

function TrianglesList() {
    this.triangles = [];
}

TrianglesList.prototype.addTriangle = function (tri) {
    this.triangles.push(tri);
}

TrianglesList.prototype.addTriangles = function (triList) {
    for (var i = 0; i < triList.length; i++) {
        this.triangles.push(triList[i]);
    }
}

TrianglesList.prototype.sort = function () {
    this.triangles.sort(function (a, b) {
        if (a.maxZ < b.minZ && a.minZ < b.minZ) {
            return 1;
        }
        if (a.maxZ < b.maxZ && a.minZ < b.minZ) {
            return 1;
        }
        if (a.maxZ < b.maxZ && a.minZ < b.maxZ) {
            return 1;
        }
        if (a.maxZ >= b.maxZ && a.minZ < b.maxZ) {
            return -1;
        }
        if (a.maxZ >= b.maxZ && a.minZ >= b.maxZ) {
            return -1;
        }
        if (a.maxZ >= b.maxZ && a.minZ < b.minZ) {
            return 1;
        }
    });
}

TrianglesList.prototype.draw = function (ctx, Mmcpv, ray) {
    this.sort();
    for (var i = 0; i < this.triangles.length; i++) {
        this.triangles[i].drawTriangle(ctx, Mmcpv, ray);
    }
}