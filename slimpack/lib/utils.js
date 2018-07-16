module.exports = {
  trimString,
  flatten
};

function trimString(string) {
  return string.replace(/\s+/g, ' ').trim();
}

function flatten(list) {
  return [].concat(...list);
}
