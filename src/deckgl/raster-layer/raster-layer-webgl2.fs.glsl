#version 300 es
#define SHADER_NAME raster-layer-fragment-shader

precision highp float;
precision highp int;
precision highp usampler2D;

in vec2 vTexCoord;

out vec4 color;

uniform float desaturate;
uniform vec4 transparentColor;
uniform vec3 tintColor;
uniform float opacity;

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
  vec4 image;
  DECKGL_CREATE_COLOR(image, vTexCoord);

  DECKGL_MUTATE_COLOR(image, vTexCoord);

  color = apply_opacity(color_tint(color_desaturate(image.rgb)), opacity);

  geometry.uv = vTexCoord;
  // DECKGL_FILTER_COLOR(color, geometry);
}

// void main() {
//   // Scale intesities.
//   float intensityValue0 = (float(texture(channel0, vTexCoord).r) - sliderValues[0][0]) / max(1.0, (sliderValues[0][1] - sliderValues[0][0]));
//   float intensityValue1 = (float(texture(channel1, vTexCoord).r) - sliderValues[1][0]) / max(1.0, (sliderValues[1][1] - sliderValues[1][0]));
//   float intensityValue2 = (float(texture(channel2, vTexCoord).r) - sliderValues[2][0]) / max(1.0, (sliderValues[2][1] - sliderValues[2][0]));
//   float intensityValue3 = (float(texture(channel3, vTexCoord).r) - sliderValues[3][0]) / max(1.0, (sliderValues[3][1] - sliderValues[3][0]));
//   float intensityValue4 = (float(texture(channel4, vTexCoord).r) - sliderValues[4][0]) / max(1.0, (sliderValues[4][1] - sliderValues[4][0]));
//   float intensityValue5 = (float(texture(channel5, vTexCoord).r) - sliderValues[5][0]) / max(1.0, (sliderValues[5][1] - sliderValues[5][0]));

//   // Find out if the frag is in bounds of the lens.
//   bool isFragInLensBounds = fragInLensBounds();
//   bool isFragOnLensBounds = fragOnLensBounds();

//   // Declare variables.
//   vec3 rgbCombo = vec3(0.0);
//   vec3 hsvCombo = vec3(0.0);
//   float intensityArray[6] = float[6](intensityValue0, intensityValue1, intensityValue2, intensityValue3, intensityValue4, intensityValue5);

//   for(int i = 0; i < 6; i++) {
//     // If we are using the lens and this frag is in bounds, focus on only the selection.
//     // Otherwise, use the props color value.
//     bool inLensAndUseLens = isLensOn && isFragInLensBounds;
//     float useColorValue = float(int((inLensAndUseLens && i == lensSelection) || (!inLensAndUseLens)));
//     // Ternaries are much faster than if-then statements.
//     hsvCombo = rgb2hsv(max(vec3(colorValues[i]), (1.0 - useColorValue) * vec3(255, 255, 255)));
//     // Sum up the intesitiies in additive blending.
//     hsvCombo = vec3(hsvCombo.xy, max(0.0, intensityArray[i]));
//     rgbCombo += hsv2rgb(hsvCombo);
//   }

//   // Ternaries are faster than checking this first and then returning/breaking out of shader.
//   rgbCombo = (isLensOn && isFragOnLensBounds) ? lensBorderColor : rgbCombo;

//   color = vec4(rgbCombo, opacity);
//   geometry.uv = vTexCoord;
//   DECKGL_FILTER_COLOR(color, geometry);
// }
