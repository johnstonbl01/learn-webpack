const avengers = require('./avengers.js');
const style = require('../styles/styles.css'); // eslint-disable-line no-unused-vars

window.onload = Object.keys(avengers)
  .forEach((avengerName) => {
    const div = document.createElement('div');
    const p = document.createElement('p');

    p.textContent = avengers[avengerName];
    p.className = avengerName;

    div.appendChild(p);

    document.body.appendChild(div);
  });
