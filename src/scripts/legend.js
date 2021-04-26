import { makeGradient, getScheme } from './color-utils.js';

export const numBins = 6;
const numImpBins = 4;

const impLegend = document.getElementById('legend-imp');
const tempLegend = document.getElementById('legend-temp');

export function setLegendVisibility(b) {
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
  // reliefImg.style.filter = `hue-rotate(${h}deg)`;
  // impImg.style.filter = `hue-rotate(${h + 240}deg)`;
  hueLabel.innerHTML = h;
}
input.addEventListener('input', e => {
  updateHueOffset(+e.target.value);
});

const legend = document.getElementById('legend');
const gridSize = 40;
const width = numImpBins * gridSize;
const height = numBins * gridSize;
legend.style.width = width + 'px';
legend.style.height = height + 'px';

updateHueOffset(60);

/* Axis stuff */

const xAxis = document.getElementById('x-axis');
xAxis.style.height = height + 'px';
xAxis.style.width = '20px';

