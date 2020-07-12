import { COORDINATE_SYSTEM } from "@deck.gl/core";
import { load, registerLoaders } from "@loaders.gl/core";
import { TerrainLoader, QuantizedMeshLoader } from "@loaders.gl/terrain";
import { TileLayer } from "@deck.gl/geo-layers";
import {
  ELEVATION_DECODER,
  getLandsatUrl,
  getTerrainUrl,
  getMeshMaxError,
} from "./util";
import { Matrix4 } from "math.gl";
import {
  RasterMeshLayer,
  combineBands,
  promiseAllObject,
  pansharpenBrovey,
} from "@kylebarron/deck.gl-raster";
import { parse } from "@loaders.gl/core";
import { loadImageArray, ImageLoader } from "@loaders.gl/images";
import GL from "@luma.gl/constants";
import { Texture2D } from "@luma.gl/core";

const DEFAULT_TEXTURE_PARAMETERS = {
  [GL.TEXTURE_MIN_FILTER]: GL.LINEAR_MIPMAP_LINEAR,
  [GL.TEXTURE_MAG_FILTER]: GL.LINEAR,
  [GL.TEXTURE_WRAP_S]: GL.CLAMP_TO_EDGE,
  [GL.TEXTURE_WRAP_T]: GL.CLAMP_TO_EDGE,
};

registerLoaders([ImageLoader]);

const DUMMY_DATA = [1];

const MOSAIC_URL = "dynamodb://us-west-2/landsat8-2019-spring";

export function TerrainTileLayer({ gl, minZoom = 0, maxZoom = 17 } = {}) {
  return new TileLayer({
    id: "terrain-tiles",
    minZoom,
    maxZoom,
    getTileData: (args) => getTileData(gl, args),
    renderSubLayers,
  });
}

async function getTileData(gl, { x, y, z }) {
  const pan = z >= 12;

  // Load terrain
  const terrainUrl = getTerrainUrl({ x, y, z });
  const bounds = [0, 1, 1, 0];
  const terrain = loadTerrain({
    terrainImage: terrainUrl,
    bounds,
    elevationDecoder: ELEVATION_DECODER,
    meshMaxError: getMeshMaxError(z),
  });

  const colormap = true;
  const colormapUrl =
    "https://cdn.jsdelivr.net/gh/kylebarron/deck.gl-raster/assets/colormaps/spectral.png";

  const urls = [
    pan ? getLandsatUrl({ x, y, z, bands: 8, url: MOSAIC_URL }) : null,
    colormap ? colormapUrl : null,
    getLandsatUrl({ x, y, z, bands: 4, url: MOSAIC_URL }),
    getLandsatUrl({ x, y, z, bands: 3, url: MOSAIC_URL }),
    getLandsatUrl({ x, y, z, bands: 2, url: MOSAIC_URL }),
  ];

  const [imagePan, imageColormap, ...imageBands] = await imageUrlsToTextures(
    gl,
    urls
  );
  return Promise.all([
    promiseAllObject({
      imageBands,
      imageColormap,
      imagePan,
    }),
    terrain,
  ]);
}

function renderSubLayers(props) {
  const { data, tile } = props;
  const { z } = tile;
  const pan = z >= 12;
  const modules = [combineBands];
  const [textures, mesh] = data;

  return [
    new RasterMeshLayer(props, {
      // NOTE: currently you need to set each sublayer id so they don't conflict
      id: `terrain-simple-mesh-layer-${tile.x}-${tile.y}-${tile.z}`,
      data: DUMMY_DATA,
      mesh,
      modules: modules,
      asyncModuleProps: textures,
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

export async function imageUrlsToTextures(gl, urls) {
  const images = await Promise.all(urls.map((url) => loadImageUrl(url)));
  const textures = images.map((image) => {
    return new Texture2D(gl, {
      data: image,
      parameters: DEFAULT_TEXTURE_PARAMETERS,
      // Colormaps are 10 pixels high
      // Load colormaps as RGB; all others as LUMINANCE
      format: image && image.height === 10 ? GL.RGB : GL.LUMINANCE,
    });
  });
  return textures;
}

async function loadImageUrl(url) {
  if (!url) {
    return;
  }

  const res = await fetch(url);
  const header = JSON.parse(res.headers.get("x-assets") || "[]");
  const imageOptions = { image: { type: "imagebitmap" } };
  return await parse(res.arrayBuffer(), ImageLoader, imageOptions);
}
