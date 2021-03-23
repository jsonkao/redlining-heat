import SVGInject from '@iconfu/svg-inject';

import reliefs from '../data/reliefs/*.png';
import basemaps from '../data/basemaps/*.png';
import boundaries from '../data/boundaries/*.svg';

function setCity(city) {
  const map = document.getElementById('map');
  const [boundarySvg, basemapImg, reliefImg] = map.children;
  const boundaryImg = document.createElement('img');
  boundaryImg.src = boundaries[city];
  SVGInject(boundaryImg);
  map.replaceChild(boundaryImg, boundarySvg);
  reliefImg.src = reliefs[city];
  basemapImg.src = basemaps[city];
}

const citySelector = document.getElementById('city-selector');
const cities = Object.keys(reliefs).map(filename => filename.split('.')[0])
cities.forEach(city => {
  const option = document.createElement('option');
  option.value = option.innerHTML = city;
  citySelector.append(option);
});

citySelector.addEventListener('change', function () {
  setCity(this.value);
});

document.addEventListener('DOMContentLoaded', function() {
  setCity(cities[0]);
});