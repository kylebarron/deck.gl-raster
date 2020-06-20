import React from "react";
import DeckGL from "@deck.gl/react";

import { PostProcessEffect } from "@deck.gl/core";
import { TileLayer } from "@deck.gl/geo-layers";

import { StaticMap } from "react-map-gl";

import {
  RasterLayer,
  combineBands,
  promiseAllObject,
  pansharpenBrovey,
  modifiedSoilAdjustedVegetationIndex,
  normalizedDifference,
  colormap
} from "@kylebarron/deck.gl-raster";

import { load, parse } from "@loaders.gl/core";
import { loadImageArray, ImageLoader } from "@loaders.gl/images";

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
  let baseUrl = `https://landsat-lambda.kylebarron.dev/tiles/${z}/${x}/${y}@2x.jpg?`;
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
    const {gl} = this.state;

    const layers = [
      new TileLayer({
        minZoom: 0,
        maxZoom: 12,

        getTileData: args => getTileData(gl, args),

        renderSubLayers: (props) => {
          const {
            bbox: { west, south, east, north },
            z,
          } = props.tile;
          const { data } = props;
          // const modules = [combineBands, normalizedDifference, colormap];
          const modules = [combineBands];
          if (z >= 12) {
            modules.push(pansharpenBrovey);
          }

          return new RasterLayer(props, {
            modules: modules,
            moduleProps: data,
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

async function getTileData(gl, {x, y, z}) {
  const pan = z >= 12;
  const colormap = false;
  const colormapUrl =
    "https://cdn.jsdelivr.net/gh/kylebarron/deck.gl-raster/assets/colormaps/spectral.png";

  const urls = [
    pan ? landsatUrl({ x, y, z, bands: 8, url: MOSAIC_URL }) : null,
    colormap ? colormapUrl : null,
    landsatUrl({ x, y, z, bands: 4, url: MOSAIC_URL }),
    landsatUrl({ x, y, z, bands: 3, url: MOSAIC_URL }),
    landsatUrl({ x, y, z, bands: 2, url: MOSAIC_URL }),
  ];

  const [
    imagePan,
    imageColormap,
    ...imageBands
  ] = await imageUrlsToTextures(gl, urls);
  return promiseAllObject({
    imageBands,
    imageColormap,
    imagePan,
  });
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
