const fs = require('fs');
const path = require('path');
const ee = require('@google/earthengine');
const geet = require('./geet.js');
const privateKey = require('./privatekey.json');

// Initialize client library and run analysis.
var runAnalysis = function () {
  ee.initialize(null, null, main, function (e) {
    console.error('Initialization error: ' + e);
  });
};

// Get bits in BQA band
function getQABits(image, start, end, newName) {
  // Compute the bits we need to extract.
  let pattern = 0;
  for (let i = start; i <= end; i++) {
    pattern += Math.pow(2, i);
  }
  // Return a single band image of the extracted QA bits, giving the band
  // a new name.
  return image.select([0], [newName]).bitwiseAnd(pattern).rightShift(start);
}

// Filter images by time and cloud cover
// Map LST computation across images. Take the mean for overlaps
function retrieveTemperatures(bbox, boundary, year) {
  const [collection, lst_calc] = {
    2020: [ee.ImageCollection('LANDSAT/LC08/C01/T1'), geet.lst_calc_ls8],
    2000: [ee.ImageCollection('LANDSAT/LE07/C01/T1'), geet.lst_calc_ls7],
  }[year];
  const filtered = collection
    .filterBounds(bbox)
    .filterDate(year + '-06-01', year + '-08-31')
    .map(function (image) {
      var bqa = getQABits(image.select('BQA'), 4, 4, 'cloud');
      var imageWithArea = image.set({
        cloudArea: bqa
          .reduceRegion({
            reducer: ee.Reducer.sum(),
            geometry: boundary,
            scale: 30,
          })
          .get('cloud'),
        area: bqa
          .reduceRegion({
            reducer: ee.Reducer.count(),
            geometry: boundary,
            scale: 30,
          })
          .get('cloud'),
      });
      return imageWithArea.set({
        proportionCloud: ee
          .Number(imageWithArea.get('cloudArea'))
          .divide(ee.Number(imageWithArea.get('area'))),
      });
    })
    .filter(ee.Filter.lte('proportionCloud', 0.4));
  console.error(filtered.size().getInfo());
  return filtered
    .map(image =>
      lst_calc(image)
        .select('LST')
        .multiply(9 / 5)
        .add(32)
        .rename(year),
    )
    .mean();
}

function main() {
  const topoFileName = './' + process.argv[2];
  const topoFile = JSON.parse(fs.readFileSync(topoFileName));
  const boundariesFile = JSON.parse(fs.readFileSync('./' + process.argv[3]));
  const year = process.argv[4];
  const bbox = ee.Geometry.Rectangle(topoFile.bbox);
  const boundary = ee.Geometry.MultiPolygon(
    boundariesFile.features.filter(
      f => f.properties.city === path.basename(topoFileName, '.topojson').replace('_', ' '),
    )[0].geometry.coordinates,
  );

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

// Authenticate using a service account and run
ee.data.authenticateViaPrivateKey(privateKey, runAnalysis);
