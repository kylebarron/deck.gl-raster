import {BitmapLayer} from '@deck.gl/layers';
import {project32} from '@deck.gl/core';
import {ProgramManager} from '@luma.gl/engine';
import {isWebGL2} from '@luma.gl/core';
import isEqual from 'lodash.isequal';

import {loadImages} from '../images';
import fsWebGL1 from './raster-layer-webgl1.fs.glsl';
import fsWebGL2 from './raster-layer-webgl2.fs.glsl';
import vsWebGL1 from './raster-layer-webgl1.vs.glsl';
import vsWebGL2 from './raster-layer-webgl2.vs.glsl';

const defaultProps = {
  ...BitmapLayer.defaultProps,
  modules: {type: 'array', value: [], compare: true},
  images: {type: 'object', value: {}, compare: true},
  moduleProps: {type: 'object', value: {}, compare: true},
};

export default class RasterLayer extends BitmapLayer {
  initializeState() {
    const {gl} = this.context;
    const programManager = ProgramManager.getDefaultProgramManager(gl);

    const fsStr1 = 'fs:DECKGL_MUTATE_COLOR(inout vec4 image, in vec2 coord)';
    const fsStr2 = 'fs:DECKGL_CREATE_COLOR(inout vec4 image, in vec2 coord)';

    // Only initialize shader hook functions _once globally_
    // Since the program manager is shared across all layers, but many layers
    // might be created, this solves the performance issue of always adding new
    // hook functions. See #22
    if (!programManager._hookFunctions.includes(fsStr1)) {
      programManager.addShaderHook(fsStr1);
    }
    if (!programManager._hookFunctions.includes(fsStr2)) {
      programManager.addShaderHook(fsStr2);
    }

    // images is a mapping from keys to Texture2D objects. The keys should match
    // names of uniforms in shader modules
    this.setState({images: {}});

    super.initializeState();
  }

  draw({uniforms}) {
    const {model, images} = this.state;
    const {desaturate, transparentColor, tintColor, moduleProps} = this.props;

    // Render the image
    if (
      !model ||
      !images ||
      Object.keys(images).length === 0 ||
      !Object.values(images).every((item) => item)
    ) {
      return;
    }

    model
      .setUniforms(
        Object.assign({}, uniforms, {
          desaturate,
          transparentColor: transparentColor.map((x) => x / 255),
          tintColor: tintColor.slice(0, 3).map((x) => x / 255),
        })
      )
      .updateModuleSettings({
        ...moduleProps,
        ...images,
      })
      .draw();
  }

  getShaders() {
    const {gl} = this.context;
    const {modules = []} = this.props;
    const webgl2 = isWebGL2(gl);

    // Choose webgl version for module
    // If fs2 or fs1 keys exist, prefer them, but fall back to fs, so that
    // version-independent modules don't need to care
    for (const module of modules) {
      module.fs = webgl2 ? module.fs2 || module.fs : module.fs1 || module.fs;

      // Sampler type is always float for WebGL1
      if (!webgl2 && module.defines) {
        module.defines.SAMPLER_TYPE = 'sampler2D'
      }
    }

    return {
      ...super.getShaders(),
      vs: webgl2 ? vsWebGL2 : vsWebGL1,
      fs: webgl2 ? fsWebGL2 : fsWebGL1,
      modules: [project32, ...modules],
    };
  }

  updateState({props, oldProps, changeFlags}) {
    // setup model first
    const modulesChanged = props && props.modules && oldProps && !isEqual(props.modules, oldProps.modules);
    if (changeFlags.extensionsChanged || modulesChanged) {
      const {gl} = this.context;
      if (this.state.model) {
        this.state.model.delete();
      }
      this.setState({model: this._getModel(gl)});
      this.getAttributeManager().invalidateAll();
    }

    if (props && props.images) {
      this.updateImages({props, oldProps});
    }

    const attributeManager = this.getAttributeManager();

    if (props.bounds !== oldProps.bounds) {
      const oldMesh = this.state.mesh;
      const mesh = this._createMesh();
      this.state.model.setVertexCount(mesh.vertexCount);
      for (const key in mesh) {
        if (oldMesh && oldMesh[key] !== mesh[key]) {
          attributeManager.invalidate(key);
        }
      }
      this.setState({mesh});
    }
  }

  updateImages({props, oldProps}) {
    const {images} = this.state;
    const {gl} = this.context;

    const newImages = loadImages({gl, images, props, oldProps});
    if (newImages) {
      this.setState({images: newImages});
    }
  }

  finalizeState() {
    super.finalizeState();

    if (this.state.images) {
      for (const image of Object.values(this.state.images)) {
        if (Array.isArray(image)) {
          image.map((x) => x && x.delete());
        } else {
          image && image.delete();
        }
      }
    }
  }
}

RasterLayer.defaultProps = defaultProps;
RasterLayer.layerName = 'RasterLayer';
