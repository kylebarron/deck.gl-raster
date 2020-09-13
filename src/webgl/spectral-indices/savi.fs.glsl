// Calculate soil-adjusted vegetation index
// SAVI = ((Band 5 – Band 4) / (Band 5 + Band 4 + 0.5)) * (1.5).
// https://www.usgs.gov/land-resources/nli/landsat/landsat-soil-adjusted-vegetation-index
float soil_adjusted_vegetation_index_calc(vec4 image) {
  float band5 = image.r;
  float band4 = image.g;

  float numerator = band5 - band4;
  float denominator = (band5 + band4 + 0.5) * 1.5;
  return numerator / denominator;
}
