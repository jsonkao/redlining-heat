const fs = require('fs');
const path = require('path');
const ee = require('@google/earthengine');
const { run } = require('./utils.js');

function main() {
  const targetName = './' + process.argv[2];
  const city = path.basename(targetName, '.tif').replace(/_/g, ' ');
  console.error('city :>> ', targetName, city);
  const bbox = ee.Geometry.Rectangle(
    JSON.parse(fs.readFileSync('./' + process.argv[3]))[city],
  );

  const dataset = ee.Image('Tsinghua/FROM-GLC/GAIA/v10');

  // Mask the image
  var mask = ee
    .Image('JRC/GSW1_2/GlobalSurfaceWater')
    .select('max_extent')
    .eq(0);

  // Output download URL
  console.log(
    dataset.mask(mask).getDownloadURL({
      scale: city === 'Los Angeles' ? 45 : 30,
      region: bbox,
    }),
  );
}

run(main);
