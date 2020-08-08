export default `#version 300 es
#define SHADER_NAME raster-layer-fragment-shader

#ifdef GL_ES
precision highp float;
#endif

in vec2 vTexCoord;

uniform float desaturate;
uniform vec4 transparentColor;
uniform vec3 tintColor;
uniform float opacity;

uniform highp usampler2D bitmapTexture_r;
uniform highp usampler2D bitmapTexture_g;
uniform highp usampler2D bitmapTexture_b;
uniform highp usampler2D bitmapTexture_a;

out vec4 fragColor;

// apply desaturation
vec3 color_desaturate(vec3 color) {
  float luminance = (color.r + color.g + color.b) * 0.333333333;
  return mix(color, vec3(luminance), desaturate);
}

// apply tint
vec3 color_tint(vec3 color) {
  return color * tintColor;
}

// blend with background color
vec4 apply_opacity(vec3 color, float alpha) {
  return mix(transparentColor, vec4(color, 1.0), alpha);
}

void main(void) {
  uvec4 image;
  // float r_band = texture(bitmapTexture_r, vTexCoord).r;
  // float g_band = texture(bitmapTexture_g, vTexCoord).r;
  // float b_band = texture(bitmapTexture_b, vTexCoord).r;
  // float a_band = texture(bitmapTexture_a, vTexCoord).r;
  float r_band = vec4(texture(bitmapTexture_r, vTexCoord)).r / 65535.0;
  float g_band = vec4(texture(bitmapTexture_g, vTexCoord)).r / 65535.0;
  float b_band = vec4(texture(bitmapTexture_b, vTexCoord)).r / 65535.0;
  float a_band = vec4(texture(bitmapTexture_a, vTexCoord)).r / 65535.0;
  // vec4(texture(tex, pixelCoordinate)) / 65535.0

  image = uvec4(r_band, g_band, b_band, a_band);
  // DECKGL_CREATE_COLOR(image, vTexCoord);

  // DECKGL_MUTATE_COLOR(image, vTexCoord);

  // fragColor = apply_opacity(color_tint(color_desaturate(image.rgb)), opacity);
  fragColor = vec4(image.rgb, 1.);

  geometry.uv = vTexCoord;
  DECKGL_FILTER_COLOR(fragColor, geometry);
}
`;
