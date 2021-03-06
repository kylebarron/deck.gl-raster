import GL from '@luma.gl/constants';
import {SimpleMeshLayer} from '@deck.gl/mesh-layers';
import {Model, Geometry, isWebGL2} from '@luma.gl/core';
import {project32, phongLighting, log} from '@deck.gl/core';
import {ProgramManager} from '@luma.gl/engine';

import {shouldComposeModelMatrix} from './matrix';
import {loadImages} from '../images';
import fsWebGL1 from './raster-mesh-layer-webgl1.fs.glsl';
import fsWebGL2 from './raster-mesh-layer-webgl2.fs.glsl';
import vsWebGL1 from './raster-mesh-layer-webgl1.vs.glsl';
import vsWebGL2 from './raster-mesh-layer-webgl2.vs.glsl';

function validateGeometryAttributes(attributes) {
  log.assert(
    attributes.positions || attributes.POSITION,
    'RasterMeshLayer requires "postions" or "POSITION" attribute in mesh property.'
  );
}

/*
 * Convert mesh data into geometry
 * @returns {Geometry} geometry
 */
function getGeometry(data) {
  if (data.attributes) {
    validateGeometryAttributes(data.attributes);
    if (data instanceof Geometry) {
      return data;
    } else {
      return new Geometry(data);
    }
  } else if (data.positions || data.POSITION) {
    validateGeometryAttributes(data);
    return new Geometry({
      attributes: data,
    });
  }
  throw Error('Invalid mesh');
}

const defaultProps = {
  ...SimpleMeshLayer.defaultProps,
  modules: {type: 'array', value: [], compare: true},
  images: {type: 'object', value: {}, compare: true},
  moduleProps: {type: 'object', value: {}, compare: true},
};

export default class RasterMeshLayer extends SimpleMeshLayer {
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
        module.defines.SAMPLER_TYPE = 'sampler2D';
      }
    }

    return {
      ...super.getShaders(),
      vs: webgl2 ? vsWebGL2 : vsWebGL1,
      fs: webgl2 ? fsWebGL2 : fsWebGL1,
      modules: [project32, phongLighting, ...modules],
    };
  }

  updateState({props, oldProps, changeFlags}) {
    super.updateState({props, oldProps, changeFlags});

    if (
      props.mesh !== oldProps.mesh ||
      changeFlags.extensionsChanged ||
      props.modules !== oldProps.modules
    ) {
      if (this.state.model) {
        this.state.model.delete();
      }
      if (props.mesh) {
        this.setState({model: this.getModel(props.mesh)});

        const attributes = props.mesh.attributes || props.mesh;
        this.setState({
          hasNormals: Boolean(attributes.NORMAL || attributes.normals),
        });
      }
      this.getAttributeManager().invalidateAll();
    }

    if (props && props.images) {
      this.updateImages({props, oldProps});
    }

    if (this.state.model) {
      this.state.model.setDrawMode(
        this.props.wireframe ? GL.LINE_STRIP : GL.TRIANGLES
      );
    }
  }

  updateImages({props, oldProps}) {
    const {images} = this.state;
    const {gl} = this.context;

    const newImages = loadImages({
      gl,
      images,
      props,
      oldProps,
    });

    if (newImages) {
      this.setState({images: newImages});
    }
  }

  draw({uniforms}) {
    const {model, images} = this.state;
    const {moduleProps} = this.props;

    // Render the image
    if (
      !model ||
      !images ||
      Object.keys(images).length === 0 ||
      !Object.values(images).every((item) => item)
    ) {
      return;
    }

    const {viewport} = this.context;
    const {sizeScale, coordinateSystem, _instanced} = this.props;

    model
      .setUniforms(
        Object.assign({}, uniforms, {
          sizeScale,
          composeModelMatrix:
            !_instanced || shouldComposeModelMatrix(viewport, coordinateSystem),
          flatShading: !this.state.hasNormals,
        })
      )
      .updateModuleSettings({
        ...moduleProps,
        ...images,
      })
      .draw();
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

  getModel(mesh) {
    const {gl} = this.context;

    const model = new Model(
      gl,
      Object.assign({}, this.getShaders(), {
        id: this.props.id,
        geometry: getGeometry(mesh),
        isInstanced: true,
      })
    );

    return model;
  }
}

RasterMeshLayer.layerName = 'RasterMeshLayer';
RasterMeshLayer.defaultProps = defaultProps;
