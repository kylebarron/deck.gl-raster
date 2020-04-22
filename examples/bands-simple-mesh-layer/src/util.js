const MOSAIC_URL =
  "s3://kylebarron-landsat-test/mosaics/8113f57876010a63aadacef4eac6d010d10c9aafcf36a5ece064ea7f.json.gz";

function colorStr(nBands) {
  const colorBands = "RGB".slice(0, nBands);
  let colorStr = `gamma ${colorBands} 3.5, sigmoidal ${colorBands} 15 0.35`;

  if (nBands === 3) {
    colorStr += ", saturation 1.7";
  }
  return colorStr;
}

export function getLandsatUrl(options) {
  const { bands, url, x, y, z } = options;
  const bandsArray = Array.isArray(bands) ? bands : [bands];
  const params = {
    url,
    bands: bandsArray.join(","),
    color_ops: colorStr(bandsArray.length),
  };
  const searchParams = new URLSearchParams(params);
  let baseUrl = `https://landsat-lambda.kylebarron.dev/tiles/${z}/${x}/${y}@2x.jpg?`;
  baseUrl += searchParams.toString();
  return baseUrl;
}

export function getTerrainUrl({ x, y, z }) {
  return TERRAIN_IMAGE.replace("{x}", x).replace("{y}", y).replace("{z}", z);
}
