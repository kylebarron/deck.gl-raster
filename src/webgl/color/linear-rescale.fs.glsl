uniform float linearRescaleScaler;
uniform float linearRescaleOffset;

// Perform a linear rescaling of image
vec4 linear_rescale(vec4 arr, float scaler, float offset) {
  return arr * scaler + offset;
}
