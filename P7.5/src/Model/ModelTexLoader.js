
function ModelTexLoader(objTexData) {

    this.textures = this.textures || {};
    this.parse(objTexData);

}

ModelTexLoader.prototype.parse = function (content) {

    var lines = content.split("\n");
    var currName;

    for (var i = 0; i < lines.length; i++) {

        if (lines[i].includes("newmtl ")) {
            var subLine = lines[i].split("newmtl ");
            currName = subLine[1];
            this.textures[currName] = new Texture();

        }
        else if (lines[i].includes("Ns ")) {
            var subLine = lines[i].split("Ns ");
            this.textures[currName].shininess = parseFloat(subLine[1]);
        }
        else if (lines[i].includes("Ka ")) {
            var subLine = lines[i].split("Ka ");
            var triSet = subLine[1].split(" ");
            this.textures[currName].ambient = [
                parseFloat(triSet[0]),
                parseFloat(triSet[1]),
                parseFloat(triSet[2]),
                1
            ];
        }
        else if (lines[i].includes("map_Kd ")) {
            var subLine = lines[i].split("map_Kd ");
            this.textures[currName].diffuseMap = LoadedImageFiles[subLine[1]];
        }
        else if (lines[i].includes("map_Kn ")) {
            var subLine = lines[i].split("map_Kn ");
            this.textures[currName].normalMap = LoadedImageFiles[subLine[1]];
        }
        else if (lines[i].includes("Kd ")) {
            var subLine = lines[i].split("Kd ");
            var triSet = subLine[1].split(" ");
            this.textures[currName].diffuse = [
                parseFloat(triSet[0]),
                parseFloat(triSet[1]),
                parseFloat(triSet[2]),
                1
            ];
        }
        else if (lines[i].includes("Ks ")) {
            var subLine = lines[i].split("Ks ");
            var triSet = subLine[1].split(" ");
            this.textures[currName].specular = [
                parseFloat(triSet[0]),
                parseFloat(triSet[1]),
                parseFloat(triSet[2]),
                1
            ];
        }
        else if (lines[i].includes("Ke ")) {
            var subLine = lines[i].split("Ke ");
            var triSet = subLine[1].split(" ");
            this.textures[currName].emission = [
                parseFloat(triSet[0]),
                parseFloat(triSet[1]),
                parseFloat(triSet[2]),
                1
            ];
        }
        else if (lines[i].includes("Ni ")) {
            var subLine = lines[i].split("Ni ");
            this.textures[currName].refractionIndex = parseFloat(subLine[1]);
        }
        else if (lines[i].includes("d ")) {
            var subLine = lines[i].split("d ");
            this.textures[currName].transparency = parseFloat(subLine[1]);
        }
        else if (lines[i].includes("illum ")) {
            var subLine = lines[i].split("illum ");
            this.textures[currName].illumType = parseInt(subLine[1]);
        }
    }

    for (var i in this.textures) {
        if (this.textures[i].diffuseMap == null) {
            this.textures[i].diffuseMap = new Image();
            this.textures[i].diffuseMap.src = "data:image/jpeg;base64,/9j/4AAQSkZJRgABAQEAYABgAAD/4QBmRXhpZgAATU0AKgAAAAgABAEaAAUAAAABAAAAPgEbAAUAAAABAAAARgEoAAMAAAABAAIAAAExAAIAAAAQAAAATgAAAAAAAABgAAAAAQAAAGAAAAABcGFpbnQubmV0IDQuMC45AP/bAEMAAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAf/bAEMBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAf/AABEIABAAEAMBIgACEQEDEQH/xAAfAAABBQEBAQEBAQAAAAAAAAAAAQIDBAUGBwgJCgv/xAC1EAACAQMDAgQDBQUEBAAAAX0BAgMABBEFEiExQQYTUWEHInEUMoGRoQgjQrHBFVLR8CQzYnKCCQoWFxgZGiUmJygpKjQ1Njc4OTpDREVGR0hJSlNUVVZXWFlaY2RlZmdoaWpzdHV2d3h5eoOEhYaHiImKkpOUlZaXmJmaoqOkpaanqKmqsrO0tba3uLm6wsPExcbHyMnK0tPU1dbX2Nna4eLj5OXm5+jp6vHy8/T19vf4+fr/xAAfAQADAQEBAQEBAQEBAAAAAAAAAQIDBAUGBwgJCgv/xAC1EQACAQIEBAMEBwUEBAABAncAAQIDEQQFITEGEkFRB2FxEyIygQgUQpGhscEJIzNS8BVictEKFiQ04SXxFxgZGiYnKCkqNTY3ODk6Q0RFRkdISUpTVFVWV1hZWmNkZWZnaGlqc3R1dnd4eXqCg4SFhoeIiYqSk5SVlpeYmZqio6Slpqeoqaqys7S1tre4ubrCw8TFxsfIycrS09TV1tfY2dri4+Tl5ufo6ery8/T19vf4+fr/2gAMAwEAAhEDEQA/AP7+KKKKAP/Z";;
        }
    }
}