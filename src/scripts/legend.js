import { makeGradient, getScheme } from './color-utils.js';
import makeAxes from './axis.js';

const HUE = 60;
const numBins = 6;
const numImpBins = 4;
const gridSize = 40;
const width = numImpBins * gridSize;
const height = numBins * gridSize;

const impLegend = document.getElementById('legend-imp');
const tempLegend = document.getElementById('legend-temp');
const yAxis = document.getElementById('y-axis');
const yAxisLabel = document.getElementById('y-axis-label');
makeAxes(width, height);

export function setLegendVisibility(b) {
  [impLegend, yAxis, yAxisLabel].forEach(el => (el.classList = b && 'visible'));
  impLegend.classList = b && 'visible';
}

// Scheme skeletons (only S and L, no H).
const tempSchemeSL = getScheme(numBins, true);
const impSchemeSL = getScheme(numImpBins);

const input = document.getElementById('hue-offset');
const hueLabel = document.getElementById('hue-offset-value');
function updateHueOffset(h) {
  tempLegend.style.background = makeGradient(tempSchemeSL, h);
  impLegend.style.background = makeGradient(impSchemeSL, h + 240, false, 90);
  hueLabel.innerHTML = h;
}
input.addEventListener('input', e => {
  updateHueOffset(+e.target.value);
});
updateHueOffset(HUE);

const legend = document.getElementById('legend');
legend.style.width = width + 'px';
legend.style.height = height + 'px';

/* Canvas stuff */

const labelArrays = {};

// Make (numBins + 1) x (numImpBins + 1) divs
let labelState = [];
for (let r = 0; r < numBins + 1; r++) {
  labelState.push([]);
  const d = document.createElement('div');
  d.style.height = gridSize + 'px';
  for (let c = 0; c < numImpBins + 1; c++) {
    labelState[r].push(false);
    const dd = document.createElement('div');
    dd.style.width = gridSize + 'px';
    dd.style.height = gridSize + 'px';
    if (c < numImpBins) d.append(dd);
  }
  if (r < numBins) tempLegend.append(d);
}

const canvas = document.getElementById('composite');
const ctx = canvas.getContext('2d');
let palette;
let labels;

let globalSettings = {};

export async function updateFilter(settings, forceUpdateDims, localLabels) {

  if (localLabels) {
    labels = localLabels;
  }
  const { city, year, impSetting } = (globalSettings = {
    ...globalSettings,
    ...settings,
  });
  if (impSetting === 'DESELECT') { // Deselect impervious map layers
    labelState = Array.from({ length: numBins + 1 }, () =>
      Array.from({ length: numImpBins + 1 }, () => false),
    );
    syncLegendLabels();
    return;
  }

  const refImg = document.getElementById('temperature-map');
  const tempName = city + '-' + year;
  const impName = city + impSetting; // impSetting already has dash

  if (refImg.complete) {
    await cache();
    if (forceUpdateDims) {
      updateDims();
    }
    updateImageData(await chooseLabels(tempName, impName));
  }
  refImg.onload = updateDims;
  async function updateDims() {
    await cache();
    canvas.style.height = refImg.height + 'px';
    canvas.style.width = refImg.width + 'px';
    const [height, width] = labelArrays[tempName].slice(0, 2);
    palette = ctx.getImageData(0, 0, width, height);
    canvas.height = height;
    canvas.width = width;
    if (labelState.some(r => r.some(a => a))) {
      updateImageData(await chooseLabels(tempName, impName));
    }
  }
  async function cache() {
    await cacheLabels(labels, tempName);
    await cacheLabels(labels, impName);
  }
  function updateImageData(window) {
    if (palette !== undefined) {
      palette.data.set(window);
      ctx.putImageData(palette, 0, 0);
    }
  }

  impLegend.onclick = async function ({ offsetX, offsetY }) {
    const impLabel = Math.floor(offsetX / gridSize);
    const tempLabel = numBins - 1 - Math.floor(offsetY / gridSize);
    const window = await chooseLabels(tempName, impName, tempLabel, impLabel);
    updateImageData(window);
  };
}

async function cacheLabels(labels, fname) {
  if (!(fname in labelArrays)) {
    const labelsUrl = (await labels[fname]()).default;
    const response = await fetch(labelsUrl);
    const buffer = await response.arrayBuffer();
    const array = new Uint16Array(buffer);
    labelArrays[fname] = array;
  }
}

async function chooseLabels(tempName, impName, tempLabel, impLabel) {
  if (tempLabel !== undefined && impLabel !== undefined) {
    labelState[tempLabel][impLabel] = !labelState[tempLabel][impLabel];
    syncLegendLabels();
  }
  const tempArray = labelArrays[tempName].slice(2);
  const impArray = labelArrays[impName].slice(2);
  const window = new Uint8ClampedArray(tempArray.length * 4);
  window.fill(255); // Fill with all white
  for (let i = 0; i < tempArray.length; i++) {
    if (labelState[tempArray[i]][impArray[i]]) {
      // Black pixels means we can see through them using lighten blend
      window[i * 4] = window[i * 4 + 1] = window[i * 4 + 2] = 0;
    }
  }
  return window;
}

function syncLegendLabels() {
  canvas.classList = labelState.some(r => r.some(a => a)) ? '' : 'invisible';
  for (let r = 0; r < numBins; r++) {
    for (let c = 0; c < numImpBins; c++) {
      let rr = numBins - r - 1;
      const div = tempLegend.children[rr].children[c];
      div.classList = labelState[rr][c] ? 'chosen' : '';
    }
  }
}
