import reliefs from '../data/reliefs/*.png';
import basemaps from '../data/basemaps/*.png';
import boundaries from '../data/boundaries/*.svg';
import charts from '../data/charts/*.png';

const cities = [...new Set(Object.keys(reliefs).map(f => f.split('-')[0]))];
const map = document.getElementById('map');

/* Dropdown setup */

const citySelector = document.getElementById('city-select');
const yearSelector = document.getElementById('year-select');
[
  [citySelector, cities],
  [yearSelector, [2000, 2020]],
].forEach(([selector, options]) => {
  options.forEach(value => {
    const option = document.createElement('option');
    option.value = value;
    option.innerHTML = ('' + value).replace('_', ' ');
    selector.append(option);
  });
});

/* Primary change function */

function setCity(city, year) {
  setCityMap(city, year);
  setCityChart(city);
}

// Just change the temperature layer of the current map
function setYear(year) {
  map.children[2].src = reliefs[citySelector.value + '-' + year];
}

/* Map logic */

function setCityMap(city, year) {
  const [boundarySvg, basemapImg, reliefImg] = map.children;
  const boundaryImg = document.createElement('img');
  boundaryImg.setAttribute('onload', 'SVGInject(this)');
  boundaryImg.src = boundaries[city];
  // SVGInject(boundaryImg);
  map.replaceChild(boundaryImg, boundarySvg);
  reliefImg.src = reliefs[city + '-' + year];
  basemapImg.src = basemaps[city];
}

/* Chart */

function setCityChart(
  city,
  chartImg = document.getElementById('chart'),
  chartTkyImg = document.getElementById('chart-tky'),
) {
  chartImg.src = charts[city];
  chartTkyImg.src = charts[city + '-tky'];
}

/* Dropdown listeners */

citySelector.addEventListener('change', function () {
  setCity(this.value, yearSelector.value);
});

yearSelector.addEventListener('change', function () {
  setYear(this.value);
});

document.addEventListener('DOMContentLoaded', function () {
  citySelector.value = 'Baltimore';
  yearSelector.value = 2020;
  citySelector.dispatchEvent(new Event('change'));

  // Nation chart stuff
  setCityChart(
    'nation',
    document.getElementById('nation-chart'),
    document.getElementById('nation-chart-tky'),
  );
});
