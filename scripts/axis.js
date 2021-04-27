export default function (width, height) {
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

  const yAxis = document.getElementById('y-axis');
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
}
