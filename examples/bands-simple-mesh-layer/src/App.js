/* eslint-disable max-statements */
import React from 'react';
import DeckGL from '@deck.gl/react';
import {StaticMap} from 'react-map-gl';
import {TerrainTileLayer} from './terrain-tile-layer';

const INITIAL_VIEW_STATE = {
  latitude: 46.21,
  longitude: -122.18,
  zoom: 11.5,
  bearing: 140,
  pitch: 60
};

export default class App extends React.Component {
  state = {
    gl: null,
  };

  _initializeWebGL = (gl) => {
    this.setState({gl})
  }

  render() {
    const {gl} = this.state;
    const layers = gl ? TerrainTileLayer({gl}) : [];

    return (
      <DeckGL
        onWebGLInitialized={this._initializeWebGL}
        initialViewState={INITIAL_VIEW_STATE}
        controller={true}
        layers={layers}
      >
        <StaticMap
          mapStyle="https://raw.githubusercontent.com/kylebarron/fiord-color-gl-style/master/style.json"
          mapOptions={{ hash: true }}
        />
      </DeckGL>
    );
  }
}
