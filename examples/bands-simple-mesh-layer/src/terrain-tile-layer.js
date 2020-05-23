import { SimpleMeshLayer } from "@deck.gl/mesh-layers";
import { COORDINATE_SYSTEM } from "@deck.gl/core";
import { load } from "@loaders.gl/core";
import { TerrainLoader } from "@loaders.gl/terrain";
import { TileLayer } from "@deck.gl/geo-layers";
import {
  MOSAIC_URL,
  ELEVATION_DECODER,
  getLandsatUrl,
  getTerrainUrl,
  getMeshMaxError,
} from "./util";
import { Matrix4 } from "math.gl";
import { BandsSimpleMeshLayer } from "@kylebarron/deck.gl-extended-layers";
import { loadImageArray } from "@loaders.gl/images";
import GL from "@luma.gl/constants";
import { Texture2D } from "@luma.gl/core";

const DEFAULT_TEXTURE_PARAMETERS = {
  [GL.TEXTURE_MIN_FILTER]: GL.LINEAR_MIPMAP_LINEAR,
  [GL.TEXTURE_MAG_FILTER]: GL.LINEAR,
  [GL.TEXTURE_WRAP_S]: GL.CLAMP_TO_EDGE,
  [GL.TEXTURE_WRAP_T]: GL.CLAMP_TO_EDGE,
};

const DUMMY_DATA = [1];

export function TerrainTileLayer({ gl, minZoom = 0, maxZoom = 17 } = {}) {
  return new TileLayer({
    id: "terrain-tiles",
    minZoom,
    maxZoom,
    getTileData: args => getTileData(gl, args),
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

  // Load landsat urls
  const urls = [
    getLandsatUrl({ x, y, z, bands: 4, url: MOSAIC_URL }),
    getLandsatUrl({ x, y, z, bands: 3, url: MOSAIC_URL }),
    getLandsatUrl({ x, y, z, bands: 2, url: MOSAIC_URL }),
  ];
  if (pan) {
    urls.push(getLandsatUrl({ x, y, z, bands: 8, url: MOSAIC_URL }));
  }
  const imageOptions = { image: { type: "imagebitmap" } };
  const images = await loadImageArray(
    urls.length,
    ({ index }) => urls[index],
    imageOptions
  );

  const textures = images.map((image) => {
    return new Texture2D(gl, {
      data: image,
      parameters: DEFAULT_TEXTURE_PARAMETERS,
      format: GL.LUMINANCE,
    });
  });

  return Promise.all([textures, terrain]);
}

function renderSubLayers(props) {
  const { data, tile } = props;
  const {z} = tile;
  const pan = z >= 12;

  // Resolve (separate?) promises
  const textures = data.then((result) => result && result[0]);
  const image_r = textures.then((result) => result && result[0]);
  const image_g = textures.then((result) => result && result[1]);
  const image_b = textures.then((result) => result && result[2]);
  let image_pan;
  if (pan) {
    image_pan = textures.then((result) => result && result[3]);
  }
  const mesh = data.then((result) => result && result[1]);

  return [
    new BandsSimpleMeshLayer(props, {
      // NOTE: currently you need to set each sublayer id so they don't conflict
      id: `terrain-simple-mesh-layer-${tile.x}-${tile.y}-${tile.z}`,
      data: DUMMY_DATA,
      mesh,
      image_r,
      image_g,
      image_b,
      image_pan,
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
