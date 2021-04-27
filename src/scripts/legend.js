import { makeGradient, getScheme } from './color-utils.js';

export const numBins = 6;
const numImpBins = 4;

const impLegend = document.getElementById('legend-imp');
const tempLegend = document.getElementById('legend-temp');
const yAxis = document.getElementById('y-axis');
const yAxisLabel = document.getElementById('y-axis-label');

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

const legend = document.getElementById('legend');
const gridSize = 40;
const width = numImpBins * gridSize;
const height = numBins * gridSize;
legend.style.width = width + 'px';
legend.style.height = height + 'px';

const HUE = 60;
updateHueOffset(HUE);

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
<line x1="0" y1="${arrowMargin / 2}" x2="${width - 9}" y2="${
  arrowMargin / 2
}" marker-end="url(#arrowhead)" />
</svg>`;

/* Canvas stuff */

const labelArrays = {};

const labelState = [];
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

console.log(labelState);
function anyLabel() {
  return labelState.some(r => r.some(a => a));
}

const canvas = document.getElementById('composite');
export async function composite(assets) {
  const ctx = canvas.getContext('2d');
  const refImg = document.getElementById('temperature-map');
  let palette;
  refImg.onload = async () => {
    await processLabels(assets['../data/Richmond-2000-labels.png']);
    await processLabels(assets['../data/Richmond-1,10-labels.png']);
    const [window, width, height] = await chooseLabels(
      assets['../data/Richmond-2000-labels.png'],
      assets['../data/Richmond-1,10-labels.png'],
      4,
      2,
      false,
    );
    palette = ctx.getImageData(0, 0, width, height); //x,y,w,h
    canvas.height = height;
    canvas.width = width;
    canvas.style.height = refImg.height + 'px';
    canvas.style.width = refImg.width + 'px';
  };

  impLegend.addEventListener('click', async function ({ offsetX, offsetY }) {
    const impLabel = Math.floor(offsetX / gridSize);
    const tempLabel = numBins - 1 - Math.floor(offsetY / gridSize);
    const [window, width, height] = await chooseLabels(
      assets['../data/Richmond-2000-labels.png'],
      assets['../data/Richmond-1,10-labels.png'],
      tempLabel,
      impLabel,
    );
    palette.data.set(window);
    ctx.putImageData(palette, 0, 0);
  });
}

async function processLabels(file) {
  const labelsUrl = (await file()).default;
  const response = await fetch(labelsUrl);
  const buffer = await response.arrayBuffer();
  const array = new Uint16Array(buffer);
  labelArrays[labelsUrl] = array;
}

async function chooseLabels(temp_f, imp_f, temp_l, imp_l, doShit = true) {
  if (doShit) {
    labelState[temp_l][imp_l] = !labelState[temp_l][imp_l];
    syncLegendLabels();
  }
  const tempArray = labelArrays[(await temp_f()).default];
  const impArray = labelArrays[(await imp_f()).default];
  const width = tempArray[1];
  const height = tempArray[0];
  const t_labels = tempArray.slice(2);
  const i_labels = impArray.slice(2);
  const window = new Uint8ClampedArray(width * height * 4);
  window.fill(255);
  for (let i = 0; i < width * height; i++) {
    if (labelState[t_labels[i]][i_labels[i]]) {
      window[i * 4] = window[i * 4 + 1] = window[i * 4 + 2] = 0;
    }
  }
  return [window, width, height];
}

function syncLegendLabels() {
  console.log(labelState);
  canvas.classList = anyLabel() ? '' : 'invisible';
  for (let r = 0; r < numBins; r++) {
    for (let c = 0; c < numImpBins; c++) {
      let rr = numBins - r - 1;
      const div = tempLegend.children[rr].children[c];
      div.classList = labelState[rr][c] ? 'chosen' : '';
    }
  }
}
