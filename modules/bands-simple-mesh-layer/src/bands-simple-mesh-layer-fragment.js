export default `#version 300 es
#define SHADER_NAME bands-simple-mesh-layer-fs

precision highp float;

uniform bool hasTexture;

uniform bool hasPan;
uniform sampler2D bitmapTexture_r;
uniform sampler2D bitmapTexture_g;
uniform sampler2D bitmapTexture_b;
uniform sampler2D bitmapTexture_pan;

uniform float panWeight;
uniform bool flatShading;
uniform float opacity;

in vec2 vTexCoord;
in vec3 cameraPosition;
in vec3 normals_commonspace;
in vec4 position_commonspace;
in vec4 vColor;

out vec4 fragColor;

// calculate pansharpen ratio
float pansharpen_ratio(vec3 rgb, float pan, float weight) {
    return pan / ((rgb.r + rgb.g + rgb.b * weight) / (2. + weight));
}

// Brovey Method: Each resampled, multispectral pixel is
// multiplied by the ratio of the corresponding
// panchromatic pixel intensity to the sum of all the
// multispectral intensities.
// Original code from https://github.com/mapbox/rio-pansharpen
vec3 pansharpen(vec3 rgb, float pan, float weight) {
    float ratio = pansharpen_ratio(rgb, pan, weight);
    vec3 alteredRGB = ratio * rgb;
    return clamp(alteredRGB, 0., 1.);
}

void main(void) {
  geometry.uv = vTexCoord;

  float r_band = texture2D(bitmapTexture_r, vTexCoord).r;
  float g_band = texture2D(bitmapTexture_g, vTexCoord).r;
  float b_band = texture2D(bitmapTexture_b, vTexCoord).r;
  float pan_band = texture2D(bitmapTexture_pan, vTexCoord).r;
  vec3 image = vec3(r_band, g_band, b_band);

  vec3 pansharpenedImage = hasPan ? pansharpen(image, pan_band, panWeight) : image;
  vec4 color = vec4(pansharpenedImage, 1.0);

  vec3 normal;
  if (flatShading) {

// NOTE(Tarek): This is necessary because
// headless.gl reports the extension as
// available but does not support it in
// the shader.
#ifdef DERIVATIVES_AVAILABLE
    normal = normalize(cross(dFdx(position_commonspace.xyz), dFdy(position_commonspace.xyz)));
#else
    normal = vec3(0.0, 0.0, 1.0);
#endif
  } else {
    normal = normals_commonspace;
  }

  vec3 lightColor = lighting_getLightColor(color.rgb, cameraPosition, position_commonspace.xyz, normal);
  fragColor = vec4(lightColor, color.a * opacity);

  DECKGL_FILTER_COLOR(fragColor, geometry);
}
`;
