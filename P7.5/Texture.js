
var ambient;
var diffuse;
var specular;
var emission;
var shininess;
var refractionIndex;
var transparency;
var illumType;
var diffuseMap; // diffuse map texture source/data
var normalMap; // normal map texture source/data

function Texture() {

    this.ambient = [0, 0, 0];
    this.diffuse = [0, 0, 0];
    this.specular = [0, 0, 0];
    this.emission = [0, 0, 0];
    this.shininess = 0;
    this.refractionIndex = 1;
    this.transparency = 1;
    this.illumType = 0;
    this.diffuseMap = null; // keeps null if it does not use diffuse map
    this.normalMap = null;

}