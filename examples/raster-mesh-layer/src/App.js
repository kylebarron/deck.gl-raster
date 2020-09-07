import React from 'react';
import DeckGL from '@deck.gl/react';
import {TerrainTileLayer} from './terrain-tile-layer';

const INITIAL_VIEW_STATE = {
  latitude: 46.21,
  longitude: -122.18,
  zoom: 11.5,
  bearing: 140,
  pitch: 60,
  // My landsat tile server doesn't support very low zooms
  minZoom: 7,
  maxPitch: 80,
};

export default class App extends React.Component {
  render() {
    const layers = TerrainTileLayer({minZoom: 7, maxZoom: 12});

    return (
      <DeckGL
        initialViewState={INITIAL_VIEW_STATE}
        controller={true}
        layers={layers}
        glOptions={{
          // Tell browser to use discrete GPU if available
          powerPreference: 'high-performance',
        }}
      />
    );
  }
}
