module.exports = function addStyles(styleList) {
  const styles = convertListToStyles(styleList);
  addStylesToDom(styles);
};

function convertListToStyles(styleList) {
  return styleList.reduce((styles, style) => {
    const existingStyle = styles.find((styleObj) => styleObj.id === style[0]);
    const css = style[1];
    const id = style[0];

    if (existingStyle) {
      existingStyle.parts.push({ css });
      return styles;
    }

    const newStyle = { id, parts: [{ css }] };

    return [...styles, newStyle];
  }, []);
}

function addStylesToDom(styles) {
  styles.forEach((style) => {
    style.parts.forEach(({ css }) => {
      const styleElement = createStyleElement();
      styleElement.appendChild(document.createTextNode(css));

      const head = document.querySelector('head');
      head.appendChild(styleElement);
    });
  });
}

function createStyleElement() {
  const style = document.createElement('style');
  style.setAttribute('type', 'text/css');

  return style;
}
