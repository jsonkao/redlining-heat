const sat_i = 0.65;
const sat_f = 0;
const val_i = 0.84;
const val_f = 0.98;
// Based on https://stackoverflow.com/a/54116681
let sv2sl = (s, v, l = v - (v * s) / 2, m = Math.min(l, 1 - l)) => [
  m ? (v - l) / m : 0,
  l,
];

function seqColors(n) {
  // Generate n sequential colors (whitish to a saturated hue)
  // Initial (white) and final (saturated hue) values

  const output = [];
  const interpolate = (init, final, i) => init + (i * (final - init)) / (n - 1);
  for (let i = 0; i < n; i++) {
    const sl = sv2sl(
      interpolate(sat_i, sat_f, i),
      interpolate(val_i, val_f, i),
    );
    [0, 1].forEach(i => (sl[i] = sl[i] * 100 + '%'));
    output.push(sl);
  }
  return output;
}

export function getScheme(numBins, isDiverging = false) {
  if (isDiverging) {
    if (numBins % 2 === 1){
      const n_seq = (numBins + 1) / 2;
      return seqColors(n_seq).slice(0, -1).concat(seqColors(n_seq).reverse());
    }
    const n_seq = (numBins / 2) + 1;
    return seqColors(n_seq).slice(0, -1).concat(seqColors(n_seq).slice(0, -1).reverse());
  }
  return seqColors(numBins).reverse();
}

export function makeGradient(scheme, hue, isDiverging = true, degree = 0) {
  const pct = i => (i / scheme.length) * 100 + '%';
  return `linear-gradient(${degree}deg ${scheme
    .map(
      (
        c,
        i,
        _,
        h = isDiverging ? (i < scheme.length / 2 ? hue + 120 : hue) : hue,
      ) => `, hsl(${h},${c.join(',')}) ${pct(i)} ${pct(i + 1)}`,
    )
    .join('')})`;
}
