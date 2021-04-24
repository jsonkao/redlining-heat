const fs = require('fs');
const path = require('path');
const ee = require('@google/earthengine');
const { run } = require('./utils.js');

function main() {
  const targetName = './' + process.argv[2];
  const city = path.basename(targetName, '.tif').replace(/_/g, ' ');
  const bbox = ee.Geometry.Rectangle(
    JSON.parse(fs.readFileSync('./' + process.argv[3]))[city],
  );
  const layer = process.argv[4];

  // Filter NLCD dataset to impervious descriptor of 2016 product.
  const year = '2016';
  const impervious = ee
    .ImageCollection('USGS/NLCD_RELEASES/2016_REL')
    .filter(ee.Filter.eq('system:index', year))
    .first()
    .select(layer);

  // Mask the image
  var mask = ee
    .Image('JRC/GSW1_2/GlobalSurfaceWater')
    .select('max_extent')
    .eq(0);

  // Output download URL
  console.log(
    impervious.mask(mask).getDownloadURL({
      // LA is so big the request would get rejected
      scale: city === 'Los Angeles' ? 45 : 30,
      region: bbox,
    }),
  );
}

run(main);
