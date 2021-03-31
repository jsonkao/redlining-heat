const fs = require('fs');
const path = require('path');
const ee = require('@google/earthengine');
const { makeRun, retrieveTemperatures } = require('./utils.js');

function main() {
  const topoFileName = './' + process.argv[2];
  const city = path.basename(topoFileName, '.topojson').replace('_', ' ');
  const boundariesFile = JSON.parse(fs.readFileSync('./' + process.argv[4]));
  const bbox = ee.Geometry.Rectangle(JSON.parse(fs.readFileSync('./' + process.argv[3]))[city]);
  const boundary = ee.Geometry.MultiPolygon(
    boundariesFile.features.filter(
      f => f.properties.city === city,
    )[0].geometry.coordinates,
  );
  const year = process.argv[5];

  const temporalTemperatures = retrieveTemperatures(bbox, boundary, year);

  // Mask the image
  var mask = ee
    .Image('JRC/GSW1_2/GlobalSurfaceWater')
    .select('max_extent')
    .eq(0);

  // Output download URL
  console.log(
    temporalTemperatures.mask(mask).getDownloadURL({
      scale: 30,
      region: bbox,
    }),
  );
}

makeRun(main)