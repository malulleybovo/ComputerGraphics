var m4 = twgl.m4;
var v3 = twgl.v3;
this.id;

var vert1;
var vert2;
var vert3;
var minZ;
var maxZ;
var normal;
var dot;
var rgb;

this.vec1;
this.vec2;
this.vec3;
this.n;
this.color;

this.Mmodel;

function Triangle(vert1, vert2, vert3, normal, rgb, num, Mmodel, Mmcpv) {
    this.id = num;
    this.vert1 = vert1;
    this.vert2 = vert2;
    this.vert3 = vert3;
    this.normal = normal;
    this.rgb = rgb;
    if (Mmodel != null) {
        this.Mmodel = Mmodel;
    }
    else {
        this.Mmodel = m4.identity();
    }

    if (Mmcpv != null) {
        this.vec1 = m4.transformPoint(Mmcpv[Mmcpv.length - 1], this.vert1);
        this.vec2 = m4.transformPoint(Mmcpv[Mmcpv.length - 1], this.vert2);
        this.vec3 = m4.transformPoint(Mmcpv[Mmcpv.length - 1], this.vert3);
        this.maxZ = Math.max(this.vec1[2], this.vec2[2], this.vec3[2]);
        this.minZ = Math.min(this.vec1[2], this.vec2[2], this.vec3[2]);
    }

    if (normal == null) {
        var a = [
            this.vert2[0] - this.vert1[0],
            this.vert2[1] - this.vert1[1],
            this.vert2[2] - this.vert1[2]
        ]
        var b = [
            this.vert3[0] - this.vert1[0],
            this.vert3[1] - this.vert1[1],
            this.vert3[2] - this.vert1[2]
        ]
        var c = v3.cross(b, a)  
        this.n = c;
    }
}

Triangle.prototype.applyModelTransform = function (Mmodel) {
    this.Mmodel = Mmodel;
}

Triangle.prototype.drawTriangle = function (ctx, Mmcpv, aim, Mcp) {

    this.vec1 = m4.transformPoint(m4.multiply(this.Mmodel, Mmcpv[Mmcpv.length - 1]), this.vert1);
    this.vec2 = m4.transformPoint(m4.multiply(this.Mmodel, Mmcpv[Mmcpv.length - 1]), this.vert2);
    this.vec3 = m4.transformPoint(m4.multiply(this.Mmodel, Mmcpv[Mmcpv.length - 1]), this.vert3);
    
    if (this.normal != null) {
        this.n = (m4.transformNormal(this.Mmodel, this.normal));
    }
    this.maxZ = Math.max(this.vec1[2], this.vec2[2], this.vec3[2]);
    this.minZ = Math.min(this.vec1[2], this.vec2[2], this.vec3[2]);

    this.dot = v3.dot(v3.normalize(this.n), v3.normalize(aim));
    var l = .5 + Math.abs(this.dot);
    var r = this.rgb[0] * l;
    var g = this.rgb[1] * l;
    var b = this.rgb[2] * l;

    this.color = "rgb(" + Math.round(r) + "," + Math.round(g) + "," + Math.round(b) + ")";

    ctx.strokeStyle = "rgb(" + this.rgb[0] + "," + this.rgb[1] + "," + this.rgb[2] + ")";
    ctx.beginPath();
    ctx.moveTo(this.vec1[0], this.vec1[1]);
    ctx.lineTo(this.vec2[0], this.vec2[1]);
    ctx.lineTo(this.vec3[0], this.vec3[1]);
    ctx.lineTo(this.vec1[0], this.vec1[1]);
    ctx.fillStyle = this.color;
    ctx.fill();
    ctx.stroke();

}