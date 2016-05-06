function transform(matrix4f, vec4f) {

    var x = matrix4f[0] * vec4f[0] + matrix4f[1] * vec4f[1] + matrix4f[2] * vec4f[2] + matrix4f[3] * vec4f[3];
    var y = matrix4f[4] * vec4f[0] + matrix4f[5] * vec4f[1] + matrix4f[6] * vec4f[2] + matrix4f[7] * vec4f[3];
    var z = matrix4f[8] * vec4f[0] + matrix4f[9] * vec4f[1] + matrix4f[10] * vec4f[2] + matrix4f[11] * vec4f[3];
    var w = matrix4f[12] * vec4f[0] + matrix4f[13] * vec4f[1] + matrix4f[14] * vec4f[2] + matrix4f[15] * vec4f[3];
    return [x, y, z, w];
}