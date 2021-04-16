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
      acc[k.split('/')[3].slice(0, -4)] = '.' + assets[k].default;
      return acc;
    }, {}),
);

const fNames = Object.keys(reliefs).map(f => f.split('-'));
const cities = [...new Set(fNames.map(n => n[0]))];
const years = [...new Set(fNames.map(n => +n[1].substring(0, 4)))];

const map = document.getElementById('map');
const variableCitySpans = document.getElementsByClassName('variable-city');

/* Dropdown setup */

// Get pretty name from a city value
const cityNameMods = {
  'Manhattan,Bronx,Queens,Brooklyn': 'New York City',
  'Greater Kansas City': 'Kansas City',
  'St. Louis,East St. Louis': 'St. Louis',
};
function getName(rawValue) {
  const value = ('' + rawValue).replace(/_/g, ' ');
  return cityNameMods[value] || value;
}

const citySelector = document.getElementById('city-select');
const yearSelector = document.getElementById('year-select');
[
  [citySelector, cities],
  [yearSelector, years],
].forEach(([selector, options]) => {
  options.forEach(value => {
    const option = document.createElement('option');
    option.value = value;
    option.innerHTML = getName(value);
    selector.append(option);
  });
});

/* Primary change function */

function setCity(city, year) {
  setCityMap(city, year);
  setCityChart(city);
  for (const el of variableCitySpans) el.innerHTML = getName(city);
}

// Just change the temperature layer of the current map
function setYear(year) {
  map.children[2].src = reliefs[citySelector.value + '-' + year];
}

/* Map logic */

function setCityMap(city, year) {
  const [boundarySvg, basemapImg, reliefImg] = map.children;
  const boundaryImg = document.createElement('img');
  boundaryImg.setAttribute('onload', 'SVGInject(this, {makeIdsUnique: false})');
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
  citySelector.value = 'Manhattan,Bronx,Queens,Brooklyn';
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
const gradeSelector = document.getElementById('grade-selector');

intersectTop({
  node: topIntersect,
  onEnter: () => {
    selectors.classList.add('fixed');
    const { height, top } = selectors.getBoundingClientRect();
    topIntersect.style.height = height + top + 'px';
    gradeSelector.classList.add('visible');
  },
  onExit: () => {
    selectors.classList.remove('fixed');
    topIntersect.style.height = selectorsTop;
    gradeSelector.classList.remove('visible');
  },
});

function intersectTop({ node, onEnter, onExit }) {
  const observer = new IntersectionObserver(
    ([entry]) => {
      const {
        isIntersecting,
        boundingClientRect: { top },
      } = entry;
      if (!isIntersecting && top < 0) {
        // Enter at the top
        onEnter();
      } else if (isIntersecting && top < window.innerHeight / 2) {
        // Exit from the top
        onExit();
      }
    },
    { threshold: 1 },
  );
  observer.observe(node);
}

/* Layer selection */

const gradeState = {
  A: false,
  B: false,
  C: false,
  D: false,
};

const layeringStyles = document.getElementById('layering');

const gradeOptions = document.getElementById('grade-options');
for (const choice of gradeOptions.children) {
  choice.onclick = () => toggleGrade(choice);
  if ('AD'.includes(choice.innerHTML)) toggleGrade(choice);
}

function toggleGrade(div) {
  const grade = div.innerHTML;
  gradeState[grade] = !gradeState[grade];
  div.classList.toggle('checked');
  div.classList.toggle('grade-' + grade.toLowerCase());

  layeringStyles.innerHTML = Object.keys(gradeState)
    .filter(g => gradeState[g])
    .map(g => `g#${g}{opacity:1;}`)
    .join('');
}
