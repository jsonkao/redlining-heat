import { makeGradient, getScheme } from './color-utils.js';

export const numBins = 6;
const numImpBins = 4;

const impLegend = document.getElementById('legend-imp');
const tempLegend = document.getElementById('legend-temp');
const yAxis = document.getElementById('y-axis');
const yAxisLabel = document.getElementById('y-axis-label');

export function setLegendVisibility(b) {
  [impLegend, yAxis, yAxisLabel].forEach(el => el.classList = b && 'visible');
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
const arrowMargin = 16;
xAxis.style.width = '16px';
xAxis.innerHTML = `<svg viewBox="-8 0 16 ${height}">
<defs>
  <marker id="arrowhead" markerWidth="10" markerHeight="6"
  refX="0" refY="3" orient="auto">
    <polygon points="0 0, 6 3, 0 6" />
  </marker>
</defs>
<line x1="0" y1="${
  height / 2
}" x2="0" y2="${arrowMargin}" marker-end="url(#arrowhead)" />
<line x1="0" y1="${height / 2}" x2="0" y2="${
  height - arrowMargin
}" marker-end="url(#arrowhead)" />
</svg>`;

const xAxisLabels = document.getElementById('x-axis-labels');
xAxisLabels.style.height = height - 30 + 'px';

yAxis.innerHTML = `<svg viewBox="0 0 ${width} ${arrowMargin}">
<defs>
  <marker id="arrowhead" markerWidth="10" markerHeight="6"
  refX="0" refY="3" orient="auto">
    <polygon points="0 0, 6 3, 0 6" />
  </marker>
</defs>
<line x1="0" y1="${
  arrowMargin / 2
}" x2="${width - 9}" y2="${arrowMargin / 2}" marker-end="url(#arrowhead)" />
</svg>`;