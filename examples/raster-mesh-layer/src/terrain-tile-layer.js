import GL from "@luma.gl/constants";
import { COORDINATE_SYSTEM } from "@deck.gl/core";
import { load, registerLoaders } from "@loaders.gl/core";
import { TerrainLoader } from "@loaders.gl/terrain";
import { ImageLoader } from "@loaders.gl/images";
import { TileLayer } from "@deck.gl/geo-layers";
import { Matrix4 } from "math.gl";
import {
  RasterMeshLayer,
  combineBands,
  pansharpenBrovey,
  normalizedDifference,
  colormap,
} from "@kylebarron/deck.gl-raster";

import {
  ELEVATION_DECODER,
  getLandsatUrl,
  getTerrainUrl,
  getMeshMaxError,
} from "./util";

registerLoaders([ImageLoader]);

const DUMMY_DATA = [1];

const MOSAIC_URL = "dynamodb://us-west-2/landsat8-2019-spring";

export function TerrainTileLayer({ minZoom = 0, maxZoom = 17 } = {}) {
  return new TileLayer({
    id: "terrain-tiles",
    minZoom,
    maxZoom,
    tileSize: 256,
    maxRequests: 12,
    getTileData,
    renderSubLayers,
  });
}

async function getTileData({ x, y, z }) {
  const landsatBands = [5, 4];
  const usePan =
    z >= 12 &&
    landsatBands[0] === 4 &&
    landsatBands[1] === 3 &&
    landsatBands[2] === 2;

  // Load terrain
  const terrainUrl = getTerrainUrl({ x, y, z });
  const bounds = [0, 1, 1, 0];
  const terrain = loadTerrain({
    terrainImage: terrainUrl,
    bounds,
    elevationDecoder: ELEVATION_DECODER,
    meshMaxError: getMeshMaxError(z),
  });

  const useColormap = true;
  const colormapUrl =
    "https://cdn.jsdelivr.net/gh/kylebarron/deck.gl-raster/assets/colormaps/spectral.png";

  const modules = [combineBands, normalizedDifference];

  const bandsUrls = [
    getLandsatUrl({ x, y, z, bands: 5, url: MOSAIC_URL }),
    getLandsatUrl({ x, y, z, bands: 4, url: MOSAIC_URL }),
    // getLandsatUrl({ x, y, z, bands: 2, url: MOSAIC_URL }),
  ];
  const imageBands = bandsUrls.map((url) => loadImage(url));

  let imagePan;
  if (usePan) {
    const panUrl = getLandsatUrl({ x, y, z, bands: 8, url: MOSAIC_URL });
    imagePan = loadImage(panUrl);
    modules.push(pansharpenBrovey);
  }

  // Load colormap
  // Only load if landsatBandCombination is not RGB
  let imageColormap;
  if (useColormap) {
    imageColormap = loadImage(colormapUrl);
    modules.push(colormap);
  }

  // Await all images together
  await Promise.all([imagePan, imageBands, imageColormap]);

  const images = {
    imageBands: await Promise.all(imageBands),
    imageColormap: await imageColormap,
    imagePan: await imagePan,
  };

  return {
    images,
    modules,
    terrain: await terrain,
  };
}

function renderSubLayers(props) {
  const { data, tile } = props;

  if (!data) {
    return null;
  }

  const { images, modules, terrain } = data;

  return [
    new RasterMeshLayer(props, {
      data: DUMMY_DATA,
      mesh: terrain,
      modules,
      images,
      getPolygonOffset: null,
      coordinateSystem: COORDINATE_SYSTEM.CARTESIAN,
      modelMatrix: getModelMatrix(tile),
      getPosition: (d) => [0, 0, 0],
      // Color to use if surfaceImage is unavailable
      getColor: [255, 255, 255],
    }),
  ];
}

// From https://github.com/uber/deck.gl/blob/b1901b11cbdcb82b317e1579ff236d1ca1d03ea7/modules/geo-layers/src/mvt-tile-layer/mvt-tile-layer.js#L41-L52
function getModelMatrix(tile) {
  const WORLD_SIZE = 512;
  const worldScale = Math.pow(2, tile.z);

  const xScale = WORLD_SIZE / worldScale;
  const yScale = -xScale;

  const xOffset = (WORLD_SIZE * tile.x) / worldScale;
  const yOffset = WORLD_SIZE * (1 - tile.y / worldScale);

  return new Matrix4()
    .translate([xOffset, yOffset, 0])
    .scale([xScale, yScale, 1]);
}

function loadTerrain({
  terrainImage,
  bounds,
  elevationDecoder,
  meshMaxError,
  workerUrl,
}) {
  if (!terrainImage) {
    return null;
  }
  const options = {
    terrain: {
      bounds,
      meshMaxError,
      elevationDecoder,
    },
  };
  if (workerUrl) {
    options.terrain.workerUrl = workerUrl;
  }
  return load(terrainImage, TerrainLoader, options);
}

export async function loadImage(url) {
  const image = await load(url, ImageLoader);
  return {
    data: image,
    format: image && image.height === 10 ? GL.RGB : GL.LUMINANCE,
  };
}
