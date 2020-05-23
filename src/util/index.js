// https://lowrey.me/lodash-zipobject-in-es6-javascript/
const zipObject = (props, values) => {
  return props.reduce((prev, prop, i) => {
    return Object.assign(prev, { [prop]: values[i] });
  }, {});
};

// https://stackoverflow.com/a/50437423
export const promiseAllObject = async (object) => {
  return zipObject(
    Object.keys(object),
    await Promise.all(Object.values(object))
  );
};
