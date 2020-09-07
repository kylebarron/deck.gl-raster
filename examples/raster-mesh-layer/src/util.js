export const TERRAIN_IMAGE = `https://s3.amazonaws.com/elevation-tiles-prod/terrarium/{z}/{x}/{y}.png`;
export const MOSAIC_URL =
  's3://kylebarron-landsat-test/mosaics/8113f57876010a63aadacef4eac6d010d10c9aafcf36a5ece064ea7f.json.gz';

function colorStr(nBands) {
  const colorBands = 'RGB'.slice(0, nBands);
  let colorStr = `gamma ${colorBands} 3.5, sigmoidal ${colorBands} 15 0.35`;

  if (nBands === 3) {
    colorStr += ', saturation 1.7';
  }
  return colorStr;
}

export function getLandsatUrl(options) {
  const {bands, url, x, y, z} = options;
  const bandsArray = Array.isArray(bands) ? bands : [bands];
  const params = {
    url,
    bands: bandsArray.join(','),
    color_ops: colorStr(bandsArray.length),
  };
  const searchParams = new URLSearchParams(params);
  let baseUrl = `https://us-west-2-lambda.kylebarron.dev/landsat/tiles/${z}/${x}/${y}.jpg?`;
  baseUrl += searchParams.toString();
  return baseUrl;
}

export function getTerrainUrl({x, y, z}) {
  return TERRAIN_IMAGE.replace('{x}', x).replace('{y}', y).replace('{z}', z);
}

export const ELEVATION_DECODER = {
  rScaler: 256,
  gScaler: 1,
  bScaler: 1 / 256,
  offset: -32768,
};

// Error suggestion from here
// https://www.linkedin.com/pulse/fast-cesium-terrain-rendering-new-quantized-mesh-output-alvaro-huarte/
export function getMeshMaxError(z) {
  return 77067.34 / (1 << z);
}
