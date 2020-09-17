const float epsilon = 0.00000001;

uniform float gamma_r;
uniform float gamma_g;
uniform float gamma_b;
uniform float gamma_a;

// Gamma correction is a nonlinear operation that
// adjusts the image's channel values pixel-by-pixel according
// to a power-law:
//
// .. math:: pixel_{out} = pixel_{in} ^ {\gamma}
//
// Setting gamma (:math:`\gamma`) to be less than 1.0 darkens the image and
// setting gamma to be greater than 1.0 lightens it.

// Parameters
// ----------
// gamma (:math:`\gamma`): float
//     Reasonable values range from 0.8 to 2.4.

// NOTE: Input array must have float values between 0 and 1!
// NOTE: gamma must be >= 0
float gammaContrast(float arr, float g) {
  // Gamma must be > 0
  g = g - epsilon <= 0. ? epsilon : g;

  return pow(arr, 1.0 / g);
}

vec4 gammaContrast(vec4 arr, float gamma1, float gamma2, float gamma3, float gamma4) {
  arr.r = gammaContrast(arr.r, gamma1);
  arr.g = gammaContrast(arr.g, gamma2);
  arr.b = gammaContrast(arr.b, gamma3);
  arr.a = gammaContrast(arr.a, gamma4);

  return arr;
}
