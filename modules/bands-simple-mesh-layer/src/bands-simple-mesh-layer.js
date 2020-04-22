import GL from "@luma.gl/constants";
import { SimpleMeshLayer } from "@deck.gl/mesh-layers";

import fs from "./bands-simple-mesh-layer-fragment";

import {
  Layer,
  project32,
  phongLighting,
  picking,
  COORDINATE_SYSTEM,
  log,
} from "@deck.gl/core";
import { Model, Geometry, Texture2D, isWebGL2 } from "@luma.gl/core";
import { hasFeature, FEATURES } from "@luma.gl/webgl";
import { shouldComposeModelMatrix } from "./matrix";

const DEFAULT_TEXTURE_PARAMETERS = {
  [GL.TEXTURE_MIN_FILTER]: GL.LINEAR_MIPMAP_LINEAR,
  [GL.TEXTURE_MAG_FILTER]: GL.LINEAR,
  [GL.TEXTURE_WRAP_S]: GL.CLAMP_TO_EDGE,
  [GL.TEXTURE_WRAP_T]: GL.CLAMP_TO_EDGE,
};

/*
 * Convert image data into texture
 * @returns {Texture2D} texture
 */
function getTextureFromData(gl, data, opts) {
  if (data instanceof Texture2D) {
    return data;
  }
  return new Texture2D(gl, Object.assign({ data }, opts));
}

function validateGeometryAttributes(attributes) {
  log.assert(
    attributes.positions || attributes.POSITION,
    'SimpleMeshLayer requires "postions" or "POSITION" attribute in mesh property.'
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
  throw Error("Invalid mesh");
}

const DEFAULT_COLOR = [0, 0, 0, 255];

const defaultProps = {
  mesh: { value: null, type: "object", async: true },
  image_r: { type: "object", value: null, async: true },
  image_g: { type: "object", value: null, async: true },
  image_b: { type: "object", value: null, async: true },
  image_pan: { type: "object", value: null, async: true },
  panWeight: { type: "number", min: 0, max: 1, value: 0.2 },

  sizeScale: { type: "number", value: 1, min: 0 },
  // TODO - parameters should be merged, not completely overridden
  parameters: {
    depthTest: true,
    depthFunc: GL.LEQUAL,
  },

  // _instanced is a hack to use world position instead of meter offsets in mesh
  // TODO - formalize API
  _instanced: true,
  // NOTE(Tarek): Quick and dirty wireframe. Just draws
  // the same mesh with LINE_STRIPS. Won't follow edges
  // of the original mesh.
  wireframe: false,
  // Optional material for 'lighting' shader module
  material: true,
  getPosition: { type: "accessor", value: (x) => x.position },
  getColor: { type: "accessor", value: DEFAULT_COLOR },

  // yaw, pitch and roll are in degrees
  // https://en.wikipedia.org/wiki/Euler_angles
  // [pitch, yaw, roll]
  getOrientation: { type: "accessor", value: [0, 0, 0] },
  getScale: { type: "accessor", value: [1, 1, 1] },
  getTranslation: { type: "accessor", value: [0, 0, 0] },
  // 4x4 matrix
  getTransformMatrix: { type: "accessor", value: [] },
};

export default class BandsSimpleMeshLayer extends SimpleMeshLayer {
  getShaders() {
    const transpileToGLSL100 = !isWebGL2(this.context.gl);

    // use object.assign to make sure we don't overwrite existing fields like `vs`, `modules`...
    return Object.assign({}, super.getShaders(), {
      fs,
      transpileToGLSL100
    });
  }

  updateState({ props, oldProps, changeFlags }) {
    super.updateState({ props, oldProps, changeFlags });

    if (props.mesh !== oldProps.mesh || changeFlags.extensionsChanged) {
      if (this.state.model) {
        this.state.model.delete();
      }
      if (props.mesh) {
        this.setState({ model: this.getModel(props.mesh) });

        const attributes = props.mesh.attributes || props.mesh;
        this.setState({
          hasNormals: Boolean(attributes.NORMAL || attributes.normals),
        });
      }
      this.getAttributeManager().invalidateAll();
    }

    if (props.image_r !== oldProps.image_r) {
      const bitmapTexture_r = this.loadTexture(props.image_r);
      if (this.state.bitmapTexture_r) {
        this.state.bitmapTexture_r.delete();
      }
      this.setState({ bitmapTexture_r });
    }
    if (props.image_g !== oldProps.image_g) {
      const bitmapTexture_g = this.loadTexture(props.image_g);
      if (this.state.bitmapTexture_g) {
        this.state.bitmapTexture_g.delete();
      }
      this.setState({ bitmapTexture_g });
    }
    if (props.image_b !== oldProps.image_b) {
      const bitmapTexture_b = this.loadTexture(props.image_b);
      if (this.state.bitmapTexture_b) {
        this.state.bitmapTexture_b.delete();
      }
      this.setState({ bitmapTexture_b });
    }
    if (props.image_pan !== oldProps.image_pan) {
      const bitmapTexture_pan = this.loadTexture(props.image_pan);
      if (this.state.bitmapTexture_pan) {
        this.state.bitmapTexture_pan.delete();
      }
      this.setState({ bitmapTexture_pan });
    }

    if (this.state.model) {
      this.state.model.setDrawMode(
        this.props.wireframe ? GL.LINE_STRIP : GL.TRIANGLES
      );
    }
  }

  finalizeState() {
    super.finalizeState();

    if (this.state.bitmapTexture_r) {
      this.state.bitmapTexture_r.delete();
    }
    if (this.state.bitmapTexture_g) {
      this.state.bitmapTexture_g.delete();
    }
    if (this.state.bitmapTexture_b) {
      this.state.bitmapTexture_b.delete();
    }
    if (this.state.bitmapTexture_pan) {
      this.state.bitmapTexture_pan.delete();
    }
  }

  draw({ uniforms }) {
    const {
      bitmapTexture_r,
      bitmapTexture_g,
      bitmapTexture_b,
      bitmapTexture_pan,
      model,
    } = this.state;

    if (
      !bitmapTexture_r ||
      !bitmapTexture_g ||
      !bitmapTexture_b ||
      !model
    ) {
      return;
    }

    const { viewport } = this.context;
    const { sizeScale, coordinateSystem, _instanced, panWeight } = this.props;
    const hasPan = Boolean(bitmapTexture_pan);

    model
      .setUniforms(
        Object.assign({}, uniforms, {
          sizeScale,
          composeModelMatrix:
            !_instanced || shouldComposeModelMatrix(viewport, coordinateSystem),
          flatShading: !this.state.hasNormals,
          bitmapTexture_r,
          bitmapTexture_g,
          bitmapTexture_b,
          bitmapTexture_pan,
          hasPan,
          panWeight,
        })
      )
      .draw();
  }

  getModel(mesh) {
    const { gl } = this.context;
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

  loadTexture(image) {
    const { gl } = this.context;

    if (image instanceof Texture2D) {
      return image;
    } else if (image instanceof HTMLVideoElement) {
      // Initialize an empty texture while we wait for the video to load
      return {
        bitmapTexture: new Texture2D(gl, {
          width: 1,
          height: 1,
          parameters: DEFAULT_TEXTURE_PARAMETERS,
          mipmaps: false,
        }),
      };
    } else if (image) {
      // Browser object: Image, ImageData, HTMLCanvasElement, ImageBitmap
      return {
        bitmapTexture: new Texture2D(gl, {
          data: image,
          parameters: DEFAULT_TEXTURE_PARAMETERS,
        }),
      };
    }
  }

  // setTexture(image) {
  //   const { gl } = this.context;
  //   const { emptyTexture, model } = this.state;

  //   if (this.state.texture) {
  //     this.state.texture.delete();
  //   }

  //   const texture = image ? getTextureFromData(gl, image) : null;
  //   this.setState({ texture });

  //   if (model) {
  //     // props.mesh may not be ready at this time.
  //     // The sampler will be set when `getModel` is called
  //     model.setUniforms({
  //       sampler: texture || emptyTexture,
  //       hasTexture: Boolean(texture),
  //     });
  //   }
  // }
}

BandsSimpleMeshLayer.layerName = "BandsSimpleMeshLayer";
BandsSimpleMeshLayer.defaultProps = defaultProps;
