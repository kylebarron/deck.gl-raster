// NOTE: this should be considered an experimental export for now

// \x93NUMPY
const NPY_MAGIC = new Uint8Array([147, 78, 85, 77, 80, 89]);

// The basic string format consists of 3 parts:
// - a character describing the byteorder of the data (<: little-endian, >: big-endian, |: not-relevant)
// - a character code giving the basic type of the array
// - an integer providing the number of bytes the type uses.
// https://numpy.org/doc/stable/reference/arrays.interface.html
const DTYPES = {
  '<u1': {
    name: 'uint8',
    arrayConstructor: Uint8Array,
  },
  '|u1': {
    name: 'uint8',
    arrayConstructor: Uint8Array,
  },
  '|i1': {
    name: 'int8',
    arrayConstructor: Int8Array,
  },
  '<u2': {
    name: 'uint16',
    arrayConstructor: Uint16Array,
  },
  '<i2': {
    name: 'int16',
    arrayConstructor: Int16Array,
  },
  '<u4': {
    name: 'uint32',
    arrayConstructor: Int32Array,
  },
  '<i4': {
    name: 'int32',
    arrayConstructor: Int32Array,
  },
  // '<u8': {
  //   name: 'uint64',
  //   arrayConstructor: BigUint64Array,
  // },
  // '<i8': {
  //   name: 'int64',
  //   arrayConstructor: BigInt64Array,
  // },
  '<f4': {
    name: 'float32',
    arrayConstructor: Float32Array,
  },
  '<f8': {
    name: 'float64',
    arrayConstructor: Float64Array,
  },
};

export function parseNpy(arrayBuffer) {
  const view = new DataView(arrayBuffer);

  const magic = new Uint8Array(arrayBuffer, 0, 6);
  if (!arrayEqual(magic, NPY_MAGIC)) {
    console.warn('NPY Magic not matched!');
  }

  const majorVersion = view.getUint8(6);
  // const minorVersion = view.getUint8(7);

  let offset = 8;
  let headerLength;
  if (majorVersion >= 2) {
    headerLength = view.getUint32(8, true);
    offset += 4;
  } else {
    headerLength = view.getUint16(8, true);
    offset += 2;
  }

  // TODO: major versions 1 and 2 use ASCII (in practice latin-1)
  const decoder = new TextDecoder('utf-8');
  const headerArray = new Uint8Array(arrayBuffer, offset, headerLength);
  const headerText = decoder.decode(headerArray);
  offset += headerLength;

  const header = JSON.parse(
    headerText
      .replace(/'/g, '"')
      .replace('False', 'false')
      .replace('(', '[')
      .replace(/,*\),*/g, ']')
  );

  const dtype = DTYPES[header.descr];
  const data = new dtype['arrayConstructor'](arrayBuffer, offset);

  return {
    dtype: dtype.name,
    data,
    header,
  };
}

function arrayEqual(a, b) {
  for (let i = 0; i < a.length; i++) {
    if (a[i] !== b[i]) {
      return false;
    }
  }
  return true;
}
