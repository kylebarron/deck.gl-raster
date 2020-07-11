import React from "react";
import DeckGL from "@deck.gl/react";

import { PostProcessEffect } from "@deck.gl/core";
import { TileLayer } from "@deck.gl/geo-layers";
import { StaticMap } from "react-map-gl";

import {
  RasterLayer,
  combineBands,
  pansharpenBrovey,
  modifiedSoilAdjustedVegetationIndex,
  normalizedDifference,
  colormap,
} from "@kylebarron/deck.gl-raster";

import { load } from "@loaders.gl/core";
import { ImageLoader } from "@loaders.gl/images";

import { vibrance } from "@luma.gl/shadertools";
import { Texture2D } from "@luma.gl/core";
import GL from "@luma.gl/constants";

const DEFAULT_TEXTURE_PARAMETERS = {
  [GL.TEXTURE_MIN_FILTER]: GL.LINEAR_MIPMAP_LINEAR,
  [GL.TEXTURE_MAG_FILTER]: GL.LINEAR,
  [GL.TEXTURE_WRAP_S]: GL.CLAMP_TO_EDGE,
  [GL.TEXTURE_WRAP_T]: GL.CLAMP_TO_EDGE,
};

const initialViewState = {
  longitude: -112.1861,
  latitude: 36.1284,
  zoom: 11.5,
  pitch: 0,
  bearing: 0,
};

const MOSAIC_URL = "dynamodb://us-west-2/landsat8-2019-spring";

function colorStr(nBands) {
  const colorBands = "RGB".slice(0, nBands);
  let colorStr = `gamma ${colorBands} 3.5, sigmoidal ${colorBands} 15 0.35`;

  if (nBands === 3) {
    colorStr += ", saturation 1.7";
  }
  return colorStr;
}

function landsatUrl(options) {
  const { bands, url, x, y, z } = options;
  const bandsArray = Array.isArray(bands) ? bands : [bands];
  const params = {
    url,
    bands: bandsArray.join(","),
    color_ops: colorStr(bandsArray.length),
  };
  const searchParams = new URLSearchParams(params);
  let baseUrl = `https://us-west-2-lambda.kylebarron.dev/landsat/tiles/${z}/${x}/${y}.jpg?`;
  baseUrl += searchParams.toString();
  return baseUrl;
}

const vibranceEffect = new PostProcessEffect(vibrance, {
  amount: 1,
});

export default class App extends React.Component {
  state = {
    gl: null,
  };

  render() {
    const { gl } = this.state;

    const layers = [
      new TileLayer({
        minZoom: 0,
        maxZoom: 12,
        tileSize: 256,

        getTileData: (args) => getTileData(gl, args),

        renderSubLayers: (props) => {
          const {
            bbox: { west, south, east, north },
          } = props.tile;
          const { modules, ...moduleProps } = props.data;
          return new RasterLayer(props, {
            modules,
            moduleProps,
            bounds: [west, south, east, north],
          });
        },
      }),
    ];

    return (
      <DeckGL
        onWebGLInitialized={(gl) => this.setState({ gl })}
        initialViewState={initialViewState}
        layers={layers}
        effects={[vibranceEffect]}
        controller
      >
        <StaticMap
          mapStyle="https://cdn.jsdelivr.net/gh/nst-guide/osm-liberty-topo@gh-pages/style.json"
          mapOptions={{ hash: true }}
        />
      </DeckGL>
    );
  }
}

async function getTileData(gl, { x, y, z }) {
  const landsatBands = [5, 4];
  const usePan =
    z >= 12 &&
    landsatBands[0] === 4 &&
    landsatBands[1] === 3 &&
    landsatBands[2] === 2;
  const useColormap = true;
  const colormapUrl =
    "https://cdn.jsdelivr.net/gh/kylebarron/deck.gl-raster/assets/colormaps/cfastie.png";
  const modules = [combineBands, normalizedDifference];

  const bandsUrls = [
    landsatUrl({ x, y, z, bands: 5, url: MOSAIC_URL }),
    landsatUrl({ x, y, z, bands: 4, url: MOSAIC_URL }),
    // landsatUrl({ x, y, z, bands: 2, url: MOSAIC_URL }),
  ];
  const imageBands = bandsUrls.map((url) => imageUrlToTextures(gl, url));

  let imagePan;
  if (usePan) {
    const panUrl = landsatUrl({ x, y, z, bands: 8, url: MOSAIC_URL });
    imagePan = imageUrlToTextures(gl, panUrl);
    modules.push(pansharpenBrovey);
  }

  // Load colormap
  // Only load if landsatBandCombination is not RGB
  let imageColormap;
  if (useColormap) {
    imageColormap = imageUrlToTextures(gl, colormapUrl);
    modules.push(colormap);
  }

  // Await all images together
  await Promise.all([imagePan, imageBands, imageColormap]);

  return {
    imageBands: await Promise.all(imageBands),
    imageColormap: await imageColormap,
    imagePan: await imagePan,
    modules,
  };
}

export async function imageUrlToTextures(gl, url) {
  if (!url) {
    return null;
  }

  const image = await load(url, ImageLoader);
  return new Texture2D(gl, {
    data: image,
    parameters: DEFAULT_TEXTURE_PARAMETERS,
    // Colormaps are 10 pixels high
    // Load colormaps as RGB; all others as LUMINANCE
    format: image && image.height === 10 ? GL.RGB : GL.LUMINANCE,
  });
}
