import React from "react";
import DeckGL from "@deck.gl/react";

import { PostProcessEffect } from "@deck.gl/core";
import { TileLayer } from "@deck.gl/geo-layers";

import { StaticMap } from "react-map-gl";

import {
  BandsBitmapLayer,
  PanBandsBitmapLayer,
} from "@kylebarron/deck.gl-extended-layers";

import { loadImageArray } from "@loaders.gl/images";

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
  zoom: 12.1,
  pitch: 0,
  bearing: 0,
};

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
    const layers = [
      new TileLayer({
        minZoom: 0,
        maxZoom: 12,

        getTileData: async ({ x, y, z }) => {
          const { gl } = this.state;
          const pan = z >= 12;

          const urls = [
            landsatUrl({ x, y, z, bands: 4, url: MOSAIC_URL }),
            landsatUrl({ x, y, z, bands: 3, url: MOSAIC_URL }),
            landsatUrl({ x, y, z, bands: 2, url: MOSAIC_URL }),
          ];
          if (pan) {
            urls.push(landsatUrl({ x, y, z, bands: 8, url: MOSAIC_URL }));
          }
          const images = await loadImageArray(
            urls.length,
            ({ index }) => urls[index]
          );

          const textures = images.map((image) => {
            return new Texture2D(gl, {
              data: image,
              parameters: DEFAULT_TEXTURE_PARAMETERS,
              format: GL.RGB,
            });
          });
          return textures;
        },

        renderSubLayers: (props) => {
          const {
            bbox: { west, south, east, north },
            z,
          } = props.tile;
          const { data } = props;
          const pan = z >= 12;

          let image_r, image_g, image_b, image_pan;
          if (Array.isArray(data)) {
            image_r = data[0];
            image_g = data[1];
            image_b = data[2];
            if (pan) {
              image_pan = data[3];
            }
          } else if (data) {
            image_r = data.then((result) => result && result[0]);
            image_g = data.then((result) => result && result[1]);
            image_b = data.then((result) => result && result[2]);
            if (pan) {
              image_pan = data.then((result) => result && result[3]);
            }
          }

          return new BandsBitmapLayer(props, {
            data: null,
            image_r,
            image_g,
            image_b,
            image_pan,
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
