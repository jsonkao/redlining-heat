import SVGInject from '@iconfu/svg-inject';

import reliefs from '../rasters/gee-reliefs/*.png';
import basemaps from '../rasters/basemaps/*.png';
import boundaries from '../rasters/holc/*.svg';

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
Object.keys(reliefs).forEach(filename => {
  const option = document.createElement('option');
  const city = filename.split('.')[0];
  option.value = city;
  option.innerHTML = city;
  citySelector.append(option);
});

citySelector.addEventListener('change', function () {
  setCity(this.value);
});

document.addEventListener('DOMContentLoaded', function() {
  setCity('Minneapolis');
});