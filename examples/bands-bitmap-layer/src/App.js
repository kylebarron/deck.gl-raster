import React from "react";
import DeckGL from "@deck.gl/react";

import { PostProcessEffect } from "@deck.gl/core";
import { TileLayer } from "@deck.gl/geo-layers";

import { StaticMap } from "react-map-gl";

import { BandsBitmapLayer } from "@kylebarron/bands-bitmap-layer";

import { ImageLoader } from "@loaders.gl/images";
import { load } from "@loaders.gl/core";

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
        data:
          "https://landsat-lambda.kylebarron.dev/tiles/229bc0ed88ac7f39effdb554efa0959766e41bb3948754faba13f74f/{z}/{x}/{y}@2x.jpg?bands=&color_ops=gamma+R+3.5%2C+sigmoidal+R+15+0.35",

        minZoom: 0,
        maxZoom: 12,

        getTileData: async ({ url }) => {
          const { gl } = this.state;
          const urls = [
            url.replace("bands=", "bands=4"),
            url.replace("bands=", "bands=3"),
            url.replace("bands=", "bands=2"),
          ];
          const images = await Promise.all([
            load(urls[0], ImageLoader),
            load(urls[1], ImageLoader),
            load(urls[2], ImageLoader),
          ]);

          const texture_r = new Texture2D(gl, {
            data: images[0],
            parameters: DEFAULT_TEXTURE_PARAMETERS,
            format: GL.RGB,
          });
          const texture_g = new Texture2D(gl, {
            data: images[1],
            parameters: DEFAULT_TEXTURE_PARAMETERS,
            format: GL.RGB,
          });
          const texture_b = new Texture2D(gl, {
            data: images[2],
            parameters: DEFAULT_TEXTURE_PARAMETERS,
            format: GL.RGB,
          });

          return [texture_r, texture_g, texture_b];
        },

        renderSubLayers: (props) => {
          const {
            bbox: { west, south, east, north },
          } = props.tile;
          const { data } = props;

          let image_r, image_g, image_b;
          if (Array.isArray(data)) {
            image_r = data[0];
            image_g = data[1];
            image_b = data[2];
          } else if (data) {
            image_r = data.then((result) => result && result[0]);
            image_g = data.then((result) => result && result[1]);
            image_b = data.then((result) => result && result[2]);
          }

          return new BandsBitmapLayer(props, {
            data: null,
            image_r,
            image_g,
            image_b,
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
