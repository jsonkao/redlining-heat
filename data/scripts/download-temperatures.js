// Require client library and private key.
const ee = require('@google/earthengine');
const geet = require('./geet.js');
const privateKey = require('./privatekey.json');

// Initialize client library and run analysis.
var runAnalysis = function () {
  ee.initialize(null, null, main, function (e) {
    console.error('Initialization error: ' + e);
  });
};

const parameters = {
  2020: []
}

function main() {
  const bbox = ee.Geometry.Rectangle(eval(process.argv[2]));
  const year = process.argv[3]

  // Filter images by time and cloud cover
  // Map LST computation across images. Take the mean for overlaps
  const retrieveTemperatures = year => {
    const [ collection, lst_calc ] = {
      '2020': [ee.ImageCollection('LANDSAT/LC08/C01/T1'), geet.lst_calc_ls8],
      '2000': [ee.ImageCollection('LANDSAT/LE07/C01/T1'), geet.lst_calc_ls7],
    }[year]
    return collection
      .filterBounds(bbox)
      .filterDate(year + '-06-01', year + '-08-31')
      .sort('CLOUD_COVER')
      .filter(ee.Filter.lte('CLOUD_COVER', 30))
      .map(image =>
        lst_calc(image)
          .select('LST')
          .multiply(9 / 5)
          .add(32)
          .rename(year),
      )
      .mean();}

  // Stack all years into one image
  // const temporalTemperatures = retrieveTemperatures(2020).addBands(retrieveTemperatures(2000))
  const temporalTemperatures = retrieveTemperatures(year)

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

// Authenticate using a service account.
ee.data.authenticateViaPrivateKey(privateKey, runAnalysis);
