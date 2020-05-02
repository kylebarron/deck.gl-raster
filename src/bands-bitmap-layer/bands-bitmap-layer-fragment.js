export default `
#define SHADER_NAME bands-bitmap-layer-fragment-shader

#ifdef GL_ES
precision highp float;
#endif

uniform sampler2D bitmapTexture_r;
uniform sampler2D bitmapTexture_g;
uniform sampler2D bitmapTexture_b;
uniform sampler2D bitmapTexture_pan;
uniform sampler2D bitmapTexture_colormap;

varying vec2 vTexCoord;

uniform bool usePan;
uniform bool useRgb;
uniform bool useNdvi;
uniform bool useEvi;
uniform bool useSavi;
uniform bool useMsavi;
uniform float panWeight;

uniform float desaturate;
uniform vec4 transparentColor;
uniform vec3 tintColor;
uniform float opacity;

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

// Calculate standard normalized difference
float normalized_difference(float band1, float band2) {
  return ((band1 - band2) / (band1 + band2));
}

// Calculate enhanced vegetation index
// EVI = 2.5 * ((Band 5 – Band 4) / (Band 5 + 6 * Band 4 – 7.5 * Band 2 + 1))
// https://www.usgs.gov/land-resources/nli/landsat/landsat-enhanced-vegetation-index
float enhanced_vegetation_index(float band5, float band4, float band2) {
  float numerator = band5 - band4;
  float denominator = band5 + (6. * band4) - (7.5 * band2) + 1.;
  return 2.5 * (numerator / denominator);
}

// Calculate soil-adjusted vegetation index
// SAVI = ((Band 5 – Band 4) / (Band 5 + Band 4 + 0.5)) * (1.5).
// https://www.usgs.gov/land-resources/nli/landsat/landsat-soil-adjusted-vegetation-index
float soil_adjusted_vegetation_index(float band5, float band4) {
  float numerator = band5 - band4;
  float denominator = (band5 + band4 + 0.5) * 1.5;
  return numerator / denominator;
}

// Calculate modified soil-adjusted vegetation index
// MSAVI = (2 * Band 5 + 1 – sqrt ((2 * Band 5 + 1)^2 – 8 * (Band 5 – Band 4))) / 2
// https://www.usgs.gov/land-resources/nli/landsat/landsat-modified-soil-adjusted-vegetation-index
float modified_soil_adjusted_vegetation_index(float band5, float band4) {
  float to_sqrt = ((2. * band5 + 1.) * (2. * band5 + 1.)) - (8. * (band5 - band4));
  return ((2. * band5) + 1. - sqrt(to_sqrt)) / 2.;
}

// Apply colormap texture given value
// Since the texture only varies in the x direction, setting v to 0.5 as a
// constant is fine
// Assumes the input range of value is -1 to 1
vec3 apply_colormap(sampler2D colormap, float value) {
  vec2 uv = vec2(0.5 * value + 0.5, 0.5);
  return texture2D(colormap, uv).rgb;
}

void main(void) {
  float r_band = texture2D(bitmapTexture_r, vTexCoord).r;
  float g_band = texture2D(bitmapTexture_g, vTexCoord).r;
  float b_band = texture2D(bitmapTexture_b, vTexCoord).r;
  float pan_band = texture2D(bitmapTexture_pan, vTexCoord).r;

  vec3 image;
  if (useRgb) {
    image = vec3(r_band, g_band, b_band);
    if (usePan) {
      image = pansharpen(image, pan_band, panWeight);
    }
  } else {
    float value;
    if (useNdvi) {
      value = normalized_difference(r_band, g_band);
    } else if (useEvi) {
      value = enhanced_vegetation_index(r_band, g_band, b_band);
    } else if (useSavi) {
      value = soil_adjusted_vegetation_index(r_band, g_band);
    } else if (useMsavi) {
      value = modified_soil_adjusted_vegetation_index(r_band, g_band);
    }
    image = apply_colormap(bitmapTexture_colormap, value);
  }

  gl_FragColor = apply_opacity(color_tint(color_desaturate(image.rgb)), opacity);

  geometry.uv = vTexCoord;
  DECKGL_FILTER_COLOR(gl_FragColor, geometry);
}
`;
