
function Texture() {

    this.ambient = [0, 0, 0]; // Default ambient color
    this.diffuse = [0, 0, 0]; // Default diffuse color
    this.specular = [0, 0, 0]; // Default specular color
    this.emission = [0, 0, 0]; // Default emission color
    this.shininess = 0; // Default shininess color
    this.refractionIndex = 1; // Default refraction index
    this.transparency = 1; // Default transparency
    this.illumType = 0; // Default illumination type
    this.diffuseMap = null; // Default diffuse map value (not initialized)
    this.normalMap = null; // Default normal map value (not initialized)

}