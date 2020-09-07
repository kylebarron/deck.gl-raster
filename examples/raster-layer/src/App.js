import React from 'react';
import DeckGL from '@deck.gl/react';

import {PostProcessEffect} from '@deck.gl/core';
import {TileLayer} from '@deck.gl/geo-layers';

import {
  RasterLayer,
  combineBands,
  pansharpenBrovey,
  modifiedSoilAdjustedVegetationIndex,
  normalizedDifference,
  colormap,
} from '@kylebarron/deck.gl-raster';

import {load} from '@loaders.gl/core';
import {ImageLoader} from '@loaders.gl/images';

import {vibrance} from '@luma.gl/shadertools';
import GL from '@luma.gl/constants';

const initialViewState = {
  longitude: -112.1861,
  latitude: 36.1284,
  zoom: 11.5,
  pitch: 0,
  bearing: 0,
  // My landsat tile server doesn't support very low zooms
  minZoom: 6,
};

// NOTE: others should change this URL
// Refer to `cogeo-mosaic` documentation for more information on mosaic backends
// https://github.com/developmentseed/cogeo-mosaic
const MOSAIC_URL = 'dynamodb://us-west-2/landsat8-2019-spring';

function colorStr(nBands) {
  const colorBands = 'RGB'.slice(0, nBands);
  let colorStr = `gamma ${colorBands} 3.5, sigmoidal ${colorBands} 15 0.35`;

  if (nBands === 3) {
    colorStr += ', saturation 1.7';
  }
  return colorStr;
}

function landsatUrl(options) {
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

const vibranceEffect = new PostProcessEffect(vibrance, {
  amount: 1,
});

export default class App extends React.Component {
  render() {
    const layers = [
      new TileLayer({
        minZoom: 7,
        maxZoom: 12,
        tileSize: 256,
        getTileData,
        renderSubLayers: (props) => {
          const {
            bbox: {west, south, east, north},
          } = props.tile;
          const {modules, images, ...moduleProps} = props.data;
          return new RasterLayer(props, {
            images,
            modules,
            moduleProps,
            bounds: [west, south, east, north],
          });
        },
      }),
    ];

    return (
      <DeckGL
        initialViewState={initialViewState}
        layers={layers}
        effects={[vibranceEffect]}
        controller
        glOptions={{
          // Tell browser to use discrete GPU if available
          powerPreference: 'high-performance',
        }}
      />
    );
  }
}

async function getTileData({
  x,
  y,
  z,
  landsatBands = [5, 4],
  useColormap = true,
}) {
  const usePan =
    z >= 12 &&
    landsatBands[0] === 4 &&
    landsatBands[1] === 3 &&
    landsatBands[2] === 2;
  const colormapUrl =
    'https://cdn.jsdelivr.net/gh/kylebarron/deck.gl-raster/assets/colormaps/cfastie.png';
  const modules = [combineBands, normalizedDifference];

  const bandsUrls = landsatBands.map((band) =>
    landsatUrl({x, y, z, bands: band, url: MOSAIC_URL})
  );
  const imageBands = bandsUrls.map((url) => loadImage(url));

  let imagePan;
  if (usePan) {
    const panUrl = landsatUrl({x, y, z, bands: 8, url: MOSAIC_URL});
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
  };
}

export async function loadImage(url) {
  const image = await load(url, ImageLoader);
  return {
    data: image,
    format: image && image.height === 10 ? GL.RGB : GL.LUMINANCE,
  };
}
