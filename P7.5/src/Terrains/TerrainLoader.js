
function TerrainLoader(gl, SIZE, MAX_HEIGHT, MAX_PIXEL_COLOR,
    heightMap, textureImgSrc, normalMapImage, reflectX, reflectZ) {

    this.gl = gl;
    this.generateTerrain(SIZE, MAX_HEIGHT, MAX_PIXEL_COLOR,
        heightMap, textureImgSrc, normalMapImage, reflectX, reflectZ);

}

TerrainLoader.prototype.generateTerrain = function (SIZE, MAX_HEIGHT, MAX_PIXEL_COLOR,
    heightMap, textureImgSrc, normalMapImage, reflectX, reflectZ) {

    var VERTEX_COUNT = heightMap.height;
    var pixelDataArray = getPixelDataArray(this, heightMap);
    var count = VERTEX_COUNT * VERTEX_COUNT;

    var vertices = [];
    var normals = [];
    var textureCoords = [];
    var tangents = [];
    var indices = [];
    var vertexPointer = 0;

    var flipX = 1;
    var offsetX = 0;
    if (reflectX) {
        flipX = -1;
        offsetX = -SIZE;
    }

    var flipZ = 1;
    var offsetZ = 0;
    if (reflectZ) {
        flipZ = -1;
        offsetZ = -SIZE;
    }

    for (var i = 0; i < VERTEX_COUNT; i++) {
        for (var j = 0; j < VERTEX_COUNT; j++) {
            vertices.push((-j * flipX / (VERTEX_COUNT - 1) * SIZE) + offsetX);
            vertices.push(getSmoothHeight(j, i, heightMap));
            vertices.push((-i * flipZ / (VERTEX_COUNT - 1) * SIZE) + offsetZ);
            var vNormal = calculateNormal(j, i, heightMap);
            normals.push(vNormal[0]);
            normals.push(vNormal[1]);
            normals.push(vNormal[2]);
            textureCoords.push(200 * j / (VERTEX_COUNT - 1));
            textureCoords.push(200 * i / (VERTEX_COUNT - 1));
            vertexPointer++;
        }
        i = i;
    }

    var pointer = 0;
    for (var gz = 0; gz < VERTEX_COUNT - 1; gz++) {
        for (var gx = 0; gx < VERTEX_COUNT - 1; gx++) {
            var topLeft = (gz * VERTEX_COUNT) + gx;
            var topRight = topLeft + 1;
            var bottomLeft = ((gz + 1) * VERTEX_COUNT) + gx;
            var bottomRight = bottomLeft + 1;
            indices[pointer++] = topLeft;
            indices[pointer++] = bottomLeft;
            indices[pointer++] = topRight;
            indices[pointer++] = topRight;
            indices[pointer++] = bottomLeft;
            indices[pointer++] = bottomRight;
        }
    }

    vertices = new Float32Array(vertices);
    normals = new Float32Array(normals);
    textureCoords = new Float32Array(textureCoords);
    indices = new Uint16Array(indices);
    tangents = computeTangents(indices, vertices, textureCoords);

    setupBuffers(this);

    //
    //  Sub Functions
    //  - getSmoothHeight
    //  - getHeight
    //  - getPixelDataArray
    //  - calculateNormal
    //  - computeTangents
    //  - setupBuffers
    //
    function getSmoothHeight(x, z, img) {
        var corners = (getHeight(x - 1, z - 1, img) + getHeight(x - 1, z + 1, img) + getHeight(x + 1, z - 1, img) + getHeight(x + 1, z + 1, img)) / 16.0;
        var sides = (getHeight(x - 1, z, img) + getHeight(x + 1, z, img) + getHeight(x, z - 1, img) + getHeight(x, z + 1, img)) / 8.0;
        var center = getHeight(x, z, img) / 4.0;
        return center + sides + corners;
    }

    function getHeight(x, z, img) {
        if (x < 0 || x >= img.height || z < 0 || z >= img.height) {
            return 0;
        }
        var rgbIndex = (4 * (x + img.width * z))
        var height = (pixelDataArray[rgbIndex] + pixelDataArray[rgbIndex] + pixelDataArray[rgbIndex]) / 3; // R * G * B
        height = height - MAX_PIXEL_COLOR / 2.0;
        height = height / (MAX_PIXEL_COLOR / 2.0);
        height = MAX_HEIGHT * height;
        return height;
    }

    function getPixelDataArray(that, heightMap) {
        var texture = that.gl.createTexture();
        texture.image = heightMap;
        // Push Texture data to GPU memory
        that.gl.bindTexture(that.gl.TEXTURE_2D, texture);
        that.gl.texImage2D(that.gl.TEXTURE_2D, 0, that.gl.RGBA, that.gl.RGBA, that.gl.UNSIGNED_BYTE, heightMap);
        that.gl.texParameteri(that.gl.TEXTURE_2D, that.gl.TEXTURE_MAG_FILTER, that.gl.LINEAR);
        that.gl.texParameteri(that.gl.TEXTURE_2D, that.gl.TEXTURE_MIN_FILTER, that.gl.LINEAR);

        // Create a framebuffer backed by the texture
        var framebuffer = that.gl.createFramebuffer();
        that.gl.bindFramebuffer(that.gl.FRAMEBUFFER, framebuffer);
        that.gl.framebufferTexture2D(that.gl.FRAMEBUFFER, that.gl.COLOR_ATTACHMENT0, that.gl.TEXTURE_2D, texture, 0);

        // Read the contents of the framebuffer (data stores the pixel data)
        var data = new Uint8Array(heightMap.width * heightMap.height * 4);
        that.gl.readPixels(0, 0, heightMap.width, heightMap.height, that.gl.RGBA, that.gl.UNSIGNED_BYTE, data);

        that.gl.deleteFramebuffer(framebuffer);
        return data;
    }

    function calculateNormal(x, z, img) {
        var heightL = getHeight(x - 1, z, img) / MAX_HEIGHT;
        var heightR = getHeight(x + 1, z, img) / MAX_HEIGHT;
        var heightD = getHeight(x, z - 1, img) / MAX_HEIGHT;
        var heightU = getHeight(x, z + 1, img) / MAX_HEIGHT;
        var a = heightL - heightR;
        var b = heightD - heightU;
        var normal = [
            -heightL + heightR,
            ((1.0 - Math.abs(a)) + (1.0 - Math.abs(b))) / 4.0,
            -heightD + heightU
        ];
        normal = twgl.v3.normalize(normal);
        return normal;
    }

    function computeTangents(indices, vertices, textureCoords) {
        var tangents = [];
        var deltaUv1;
        var deltaUv2;
        var deltaPos1;
        var deltaPos2;
        var r;
        var j = 0;
        for (var i = 0; i < indices.length; i += 3) {

            deltaUv1 = [
                textureCoords[2 * indices[i + 1]] - textureCoords[2 * indices[i]],
                textureCoords[2 * indices[i + 1] + 1] - textureCoords[2 * indices[i] + 1]
            ];
            deltaUv2 = [
                textureCoords[2 * indices[i + 2]] - textureCoords[2 * indices[i]],
                textureCoords[2 * indices[i + 2] + 1] - textureCoords[2 * indices[i] + 1]
            ];
            deltaPos1 = [
                deltaUv2[1] * (vertices[3 * indices[i + 1]] - vertices[3 * indices[i]]),
                deltaUv2[1] * (vertices[3 * indices[i + 1] + 1] - vertices[3 * indices[i] + 1]),
                deltaUv2[1] * (vertices[3 * indices[i + 1] + 2] - vertices[3 * indices[i] + 2]),
            ];
            deltaPos2 = [
                deltaUv1[1] * (vertices[3 * indices[i + 2]] - vertices[3 * indices[i]]),
                deltaUv1[1] * (vertices[3 * indices[i + 2] + 1] - vertices[3 * indices[i] + 1]),
                deltaUv1[1] * (vertices[3 * indices[i + 2] + 2] - vertices[3 * indices[i] + 2]),
            ];
            r = 1.0 / (deltaUv1[0] * deltaUv2[1] - deltaUv1[1] * deltaUv2[0]);
            tangents[3 * indices[i]] = (r * (deltaPos1[0] - deltaPos2[0]));
            tangents[3 * indices[i] + 1] = (r * (deltaPos1[1] - deltaPos2[1]));
            tangents[3 * indices[i] + 2] = (r * (deltaPos1[2] - deltaPos2[2]));
            tangents[3 * indices[i + 1]] = (tangents[3 * indices[i]]);
            tangents[3 * indices[i + 1] + 1] = (tangents[3 * indices[i] + 1]);
            tangents[3 * indices[i + 1] + 2] = (tangents[3 * indices[i] + 2]);
            tangents[3 * indices[i + 2]] = (tangents[3 * indices[i]]);
            tangents[3 * indices[i + 2] + 1] = (tangents[3 * indices[i] + 1]);
            tangents[3 * indices[i + 2] + 2] = (tangents[3 * indices[i] + 2]);
            j += 2;

        }
        return new Float32Array(tangents);

    }

    function setupBuffers(that) {

        that.trianglePosBuffer = that.gl.createBuffer();
        that.gl.bindBuffer(that.gl.ARRAY_BUFFER, that.trianglePosBuffer);
        that.gl.bufferData(that.gl.ARRAY_BUFFER, vertices, that.gl.STATIC_DRAW);
        that.trianglePosBuffer.itemSize = 3;
        that.trianglePosBuffer.numItems = vertices.length / 3;

        that.normalBuffer = that.gl.createBuffer();
        that.gl.bindBuffer(that.gl.ARRAY_BUFFER, that.normalBuffer);
        that.gl.bufferData(that.gl.ARRAY_BUFFER, normals, that.gl.STATIC_DRAW);
        that.normalBuffer.itemSize = 3;
        that.normalBuffer.numItems = normals.length / 3;

        that.texCoordBuffer = that.gl.createBuffer();
        that.gl.bindBuffer(that.gl.ARRAY_BUFFER, that.texCoordBuffer);
        that.gl.bufferData(that.gl.ARRAY_BUFFER, textureCoords, that.gl.STATIC_DRAW);
        that.texCoordBuffer.itemSize = 2;
        that.texCoordBuffer.numItems = textureCoords.length / 2;

        that.tangentBuffer = that.gl.createBuffer();
        that.gl.bindBuffer(that.gl.ARRAY_BUFFER, that.tangentBuffer);
        that.gl.bufferData(that.gl.ARRAY_BUFFER, tangents, that.gl.STATIC_DRAW);
        that.tangentBuffer.itemSize = 3;
        that.tangentBuffer.numItems = tangents.length / 3;

        that.indexBuffer = that.gl.createBuffer();
        that.indexBuffer.length = indices.length;
        that.gl.bindBuffer(that.gl.ELEMENT_ARRAY_BUFFER, that.indexBuffer);
        that.gl.bufferData(that.gl.ELEMENT_ARRAY_BUFFER, indices, that.gl.STATIC_DRAW);

        that.gl.activeTexture(that.gl.TEXTURE1);
        that.texture2 = that.gl.createTexture();
        that.gl.bindTexture(that.gl.TEXTURE_2D, that.texture2);
        that.gl.texImage2D(that.gl.TEXTURE_2D, 0, that.gl.RGBA, 1, 1, 0, that.gl.RGBA, that.gl.UNSIGNED_BYTE, null);
        that.image2 = normalMapImage;
        that.gl.bindTexture(that.gl.TEXTURE_2D, that.texture2);
        that.gl.texImage2D(that.gl.TEXTURE_2D, 0, that.gl.RGBA, that.gl.RGBA, that.gl.UNSIGNED_BYTE, that.image2);
        that.gl.generateMipmap(that.gl.TEXTURE_2D);
        that.gl.texParameteri(that.gl.TEXTURE_2D, that.gl.TEXTURE_MIN_FILTER, that.gl.LINEAR_MIPMAP_LINEAR);

        that.gl.activeTexture(that.gl.TEXTURE0);
        that.texture = that.gl.createTexture();
        that.gl.bindTexture(that.gl.TEXTURE_2D, that.texture);
        that.gl.texImage2D(that.gl.TEXTURE_2D, 0, that.gl.RGBA, 1, 1, 0, that.gl.RGBA, that.gl.UNSIGNED_BYTE, null);
        that.image = textureImgSrc;
        that.gl.bindTexture(that.gl.TEXTURE_2D, that.texture);
        that.gl.texImage2D(that.gl.TEXTURE_2D, 0, that.gl.RGBA, that.gl.RGBA, that.gl.UNSIGNED_BYTE, that.image);
        that.gl.generateMipmap(that.gl.TEXTURE_2D);
        that.gl.texParameteri(that.gl.TEXTURE_2D, that.gl.TEXTURE_MIN_FILTER, that.gl.LINEAR_MIPMAP_LINEAR);

    }
}
