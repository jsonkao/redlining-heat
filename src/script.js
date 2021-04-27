import { setLegendVisibility, updateFilter } from './scripts/legend.js';

// Glob import all assets, then split them into variables and access module default
const assets = import.meta.glob('../data/**/*{Richmond,Baltimore}*.{png,svg}');

const [reliefs, basemaps, boundaries, impReliefs, charts, labels] = [
  'reliefs',
  'basemaps',
  'boundaries',
  'impervious-reliefs',
  'charts',
  'labels',
].map(dir =>
  Object.keys(assets)
    .filter(k => k.includes('/' + dir))
    .reduce((acc, k) => {
      acc[k.split('/')[3].slice(0, -4)] = assets[k];
      return acc;
    }, {}),
);

let cities = 'Manhattan,Bronx,Queens,Brooklyn St._Louis,East_St._Louis Birmingham Mobile Montgomery Little_Rock Phoenix Fresno Los_Angeles Oakland Sacramento San_Diego San_Francisco San_Jose Stockton Denver Pueblo Hartford New_Britain New_Haven Stamford Waterbury Jacksonville Miami St._Petersburg Tampa Atlanta Augusta Columbus@GA Macon Savannah Council_Bluffs Davenport Des_Moines Dubuque Sioux_City Waterloo Aurora Chicago Decatur Joliet Peoria Rockford Springfield@IL Evansville Fort_Wayne Indianapolis Lake_Co._Gary Muncie South_Bend Terre_Haute Topeka Wichita Covington Lexington@KY Louisville New_Orleans Shreveport Arlington Belmont Boston Braintree Brockton Brookline Cambridge Chelsea Dedham Everett Haverhill Holyoke_Chicopee Lexington@MA Malden Medford Melrose Milton Needham Newton Quincy Revere Saugus Somerville Waltham Watertown Winchester Winthrop Baltimore Battle_Creek Bay_City Detroit Flint Grand_Rapids Jackson@MI Kalamazoo Lansing Muskegon Pontiac Saginaw Duluth Minneapolis Rochester@MN St._Paul Greater_Kansas_City Springfield@MO St._Joseph Jackson@MS Asheville Charlotte Durham Greensboro Winston-Salem Lincoln Omaha Manchester Atlantic_City Bergen_Co. Camden Essex_Co. Hudson_Co. Trenton Union_Co. Albany Johnson_City Buffalo Elmira Lower_Westchester_Co. Niagara_Falls Poughkeepsie Rochester@NY Schenectady Staten_Island Syracuse Troy Utica Akron Canton Cleveland Columbus@OH Dayton Hamilton Lima Lorain Portsmouth Springfield@OH Toledo Warren Youngstown Oklahoma_City Tulsa Portland Altoona Bethlehem Chester Erie Harrisburg Johnstown Lancaster New_Castle Philadelphia Pittsburgh Wilkes-Barre York Pawtucket_and_Central_Falls Providence Woonsocket Columbia Chattanooga Knoxville Memphis Nashville Amarillo Austin Beaumont Dallas El_Paso Fort_Worth Galveston Houston Port_Arthur San_Antonio Waco Ogden Salt_Lake_City Lynchburg Newport_News Norfolk Richmond Roanoke Seattle Spokane Tacoma Kenosha Madison Milwaukee_Co. Oshkosh Racine Charleston Huntington Wheeling'
  .split(' ')
  .sort();
cities = ['Richmond', 'Baltimore'];
let years = [
  ...new Set(
    Object.keys(reliefs)
      .map(f => f.split('-'))
      .map(n => +n[n.length - 1].substring(0, 4)),
  ),
];

const map = document.getElementById('map');
const variableCitySpans = document.getElementsByClassName('variable-city');

/* Dropdown setup */

// Get pretty name from a city value
const cityNameMods = {
  'Manhattan,Bronx,Queens,Brooklyn': 'New York City',
  'Greater Kansas City': 'Kansas City',
  'St. Louis,East St. Louis': 'St. Louis',
  'Pawtucket and Central Falls': 'Pawtucket',
  'Lower Westchester Co.': 'Westchester',
};
function getName(rawValue) {
  const value = ('' + rawValue).replace(/_/g, ' ').replace('@', ', ');
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

async function setCity(city, year) {
  await setCityMap(city, year);
  await setCityChart(city);
  for (const el of variableCitySpans) el.innerHTML = getName(city);
}

// Just change the temperature layer of the current map
async function setYear(year) {
  reliefImg.src = (await reliefs[citySelector.value + '-' + year]()).default;
  await updateFilter({ year });
}

/* Map logic */

const impImg = document.getElementById('impervious-map');
const reliefImg = document.getElementById('temperature-map');
async function setCityMap(city, year) {
  const [boundarySvg, basemapImg, _, __] = map.children;
  const boundaryImg = document.createElement('img');
  boundaryImg.setAttribute('onload', 'SVGInject(this, {makeIdsUnique: false})');
  boundaryImg.src = (await boundaries[city]()).default;
  map.replaceChild(boundaryImg, boundarySvg);
  basemapImg.src = (await basemaps[city]()).default;
  reliefImg.src = (await reliefs[city + '-' + year]()).default;
  const impSetting = await updateImpMap(city);
  // Only update filter when city updates, which is when setCityMap is called
  await updateFilter({ city, year, impSetting }, true, labels);
}

const impState = {
  impervious: false,
  road: false,
  nonroad: false,
};
let firstCall = true;
async function updateImpMap(city) {
  const anyVisible = Object.values(impState).some(b => b);
  impImg.classList = anyVisible && 'visible';
  reliefImg.classList = !anyVisible && 'multiply';
  setLegendVisibility(anyVisible);

  // Never show both images on top of each other. Always use composite to prevent weird overlap coloring issues
  let impSetting = 'DESELECT';
  if (Object.values(impState).every(b => b) || firstCall && !anyVisible) {
    impImg.src = (await impReliefs[city + (impSetting = '-1,10')]()).default;
  } else if (anyVisible || firstCall) {
    impImg.src = (
      await impReliefs[
        city + (impSetting = impState['road'] ? '-1,6' : '-9,10')
      ]()
    ).default;
  }
  firstCall = false;
  return impSetting;
}

/* Chart */

async function setCityChart(
  city,
  chartImg = document.getElementById('chart'),
  chartTkyImg = document.getElementById('chart-tky'),
) {
  chartImg.src = (await charts[city]()).default;
  chartTkyImg.src = (await charts[city + '-tky']()).default;
}

/* Dropdown listeners */

citySelector.addEventListener('change', async function () {
  await setCity(this.value, yearSelector.value);
});

yearSelector.addEventListener('change', async function () {
  await setYear(this.value);
});

document.addEventListener('DOMContentLoaded', async function () {
  // citySelector.value = 'Manhattan,Bronx,Queens,Brooklyn';
  citySelector.value = 'Richmond';
  yearSelector.value = 2000;
  citySelector.dispatchEvent(new Event('change'));

  // Nation chart stuff
  await setCityChart(
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
const menu = document.getElementById('menu');

intersectTop({
  node: topIntersect,
  onEnter: () => {
    selectors.classList.add('fixed');
    const { height, top } = selectors.getBoundingClientRect();
    topIntersect.style.height = height + top + 'px';
    menu.classList.add('visible');
  },
  onExit: () => {
    selectors.classList.remove('fixed');
    topIntersect.style.height = selectorsTop;
    menu.classList.remove('visible');
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
  const initialGrades = '';
  if (initialGrades.includes(choice.innerHTML)) toggleGrade(choice);
}

function toggleGrade(div) {
  const grade = div.innerHTML;
  gradeState[grade] = !gradeState[grade];
  div.classList.toggle('grade-' + grade.toLowerCase());

  layeringStyles.innerHTML = Object.keys(gradeState)
    .filter(g => gradeState[g])
    .map(g => `g#${g}{opacity:1;}`)
    .join('');
}

const impOptions = document.getElementById('imp-options');
for (const choice of impOptions.children) {
  choice.onclick = async () => await toggleImp(choice);
}

async function toggleImp(div) {
  const choiceOf = el =>
    el.innerHTML.toLowerCase().replace('-', '').split(' ')[0];
  const choice = choiceOf(div);
  impState[choice] = !impState[choice];
  if (choice === 'impervious') {
    impState['road'] = impState['nonroad'] = impState['impervious'];
  } else {
    const compChoice = choice === 'nonroad' ? 'road' : 'nonroad';
    impState[compChoice] = impState['impervious'];
    impState['impervious'] = false;
  }
  for (const el of div.parentNode.children) {
    el.classList = impState[choiceOf(el)] && 'chosen';
  }
  const impSetting = await updateImpMap(citySelector.value);
  await updateFilter({ impSetting });
}
