import { intersectTop } from './scripts/utils';

// Glob import all assets, then split them into variables and access module default
const assets = import.meta.globEager('../data/**/*.{png,svg}');
const [reliefs, basemaps, boundaries, charts] = [
  'reliefs',
  'basemaps',
  'boundaries',
  'charts',
].map(dir =>
  Object.keys(assets)
    .filter(k => k.includes(dir))
    .reduce((acc, k) => {
      acc[k.split('/')[3].slice(0, -4)] = assets[k].default;
      return acc;
    }, {}),
);

const cities = [...new Set(Object.keys(reliefs).map(f => f.split('-')[0]))];
const map = document.getElementById('map');
const variableCityName = document.getElementById('variable-city');

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
  variableCityName.innerHTML = city.replace('_', ' ');
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

/* Selector intersection stuff */

const selectors = document.getElementById('selectors');
const topIntersect = document.getElementById('top-intersect');
const selectorsTop = window.getComputedStyle(selectors).top;
topIntersect.style.height = selectorsTop;
intersectTop({
  node: topIntersect,
  onEnter: () => {
    selectors.classList.add('fixed');
    const { height, top } = selectors.getBoundingClientRect();
    topIntersect.style.height = height + top + 'px';
  },
  onExit: () => {
    selectors.classList.remove('fixed');
    topIntersect.style.height = selectorsTop;
  },
});
