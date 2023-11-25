const avengers = require('./avengers.js');
const styles = require('../styles/styles.css');

window.onload = Object.keys(avengers)
  .forEach((avengerName) => {
    const div = document.createElement('div');
    const p = document.createElement('p');

    p.textContent = avengers[avengerName];
    p.className = avengerName;

    div.appendChild(p);

    document.body.appendChild(div);
  });
