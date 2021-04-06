const fs = require('fs');
const cityBboxes = JSON.parse(fs.readFileSync(0).toString());

process.argv.slice(2).forEach(customMerge => {
  const bboxes = customMerge.split(',').map(city => cityBboxes[city.replace(/_/g, ' ')]);

  const maximalBbox = bboxes[0];
  bboxes.slice(1).forEach(bbox => {
    // xmin, ymin, xmax, ymax
    for (i = 0; i < bbox.length; i++) {
      const isMin = i < 2 ? 1 : -1;
      if (bbox[i] * isMin < maximalBbox[i] * isMin) {
        maximalBbox[i] = bbox[i]
      }
    }
  });

  cityBboxes[customMerge.replace(/_/g, ' ')] = maximalBbox;
})

console.log(JSON.stringify(cityBboxes));
