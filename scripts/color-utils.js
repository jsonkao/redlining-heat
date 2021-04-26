const sat_i = 0.85;
const sat_f = 0;
const val_i = 0.9;
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
    if (numBins % 2 === 1) {
      const n_seq = (numBins + 1) / 2;
      return seqColors(n_seq).slice(0, -1).concat(seqColors(n_seq).reverse());
    }
    const n_seq = numBins / 2 + 1;
    return seqColors(n_seq)
      .slice(0, -1)
      .concat(seqColors(n_seq).slice(0, -1).reverse());
  }
  return seqColors(numBins).reverse();
}

export function makeGradient(scheme, hue, isDiverging = true, degree = 0) {
  const pct = i => (i / scheme.length) * 100 + '%';
  const hslValues = getColors(scheme, hue, isDiverging);
  return `linear-gradient(${degree}deg ${hslValues
    .map(([h, ...c], i) => `, hsl(${h},${c.join(',')}) ${pct(i)} ${pct(i + 1)}`)
    .join('')})`;
}

export function getColors(scheme, hue, isDiverging = true) {
  return scheme.map((c, i) => {
    const h = isDiverging ? (i < scheme.length / 2 ? hue + 120 : hue) : hue;
    return [h, ...c];
  });
}

export function getColorsRGB(scheme, hue, isDiverging = true) {
  const hslValues = getColors(scheme, hue, isDiverging);
  for (let i = 0; i < hslValues.length; i++) {
    hslValues[i][0] /= 360;
    [1, 2].forEach(j => hslValues[i][j] = +hslValues[i][j].slice(0, -1) / 100);
  }
  return hslValues;
}

/**
 * Converts an HSL color value to RGB. Conversion formula
 * adapted from http://en.wikipedia.org/wiki/HSL_color_space.
 * Assumes h, s, and l are contained in the set [0, 1] and
 * returns r, g, and b in the set [0, 255].
 *
 * @param   {number}  h       The hue
 * @param   {number}  s       The saturation
 * @param   {number}  l       The lightness
 * @return  {Array}           The RGB representation
 */
 function hslToRgb(h, s, l){
  var r, g, b;

  if(s == 0){
      r = g = b = l; // achromatic
  }else{
      var hue2rgb = function hue2rgb(p, q, t){
          if(t < 0) t += 1;
          if(t > 1) t -= 1;
          if(t < 1/6) return p + (q - p) * 6 * t;
          if(t < 1/2) return q;
          if(t < 2/3) return p + (q - p) * (2/3 - t) * 6;
          return p;
      }

      var q = l < 0.5 ? l * (1 + s) : l + s - l * s;
      var p = 2 * l - q;
      r = hue2rgb(p, q, h + 1/3);
      g = hue2rgb(p, q, h);
      b = hue2rgb(p, q, h - 1/3);
  }

  return [Math.round(r * 255), Math.round(g * 255), Math.round(b * 255)];
}