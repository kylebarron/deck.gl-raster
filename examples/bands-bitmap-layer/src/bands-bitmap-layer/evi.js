const fs = `\
// Calculate enhanced vegetation index
// EVI = 2.5 * ((Band 5 – Band 4) / (Band 5 + 6 * Band 4 – 7.5 * Band 2 + 1))
// https://www.usgs.gov/land-resources/nli/landsat/landsat-enhanced-vegetation-index
float enhanced_vegetation_index_calc(vec4 image) {
  float band5 = image.r;
  float band4 = image.g;
  float band2 = image.b;

  float numerator = band5 - band4;
  float denominator = band5 + (6. * band4) - (7.5 * band2) + 1.;
  return 2.5 * (numerator / denominator);
}
`;

export default {
  name: "enhanced_vegetation_index",
  fs,
  inject: {
    "fs:MUTATE_COLOR": `
    image = vec4(enhanced_vegetation_index_calc(image), 0., 0., 0.);
    `,
  },
};
