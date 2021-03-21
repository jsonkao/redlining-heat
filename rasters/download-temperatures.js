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

function main() {
  var l8_raw = ee.ImageCollection('LANDSAT/LC08/C01/T1');

  // Filter images by time and cloud cover
  const bounds = ee.Geometry.Rectangle(eval(process.argv[2]));
  var images = l8_raw
    .filterBounds(bounds)
    .filterDate('2020-06-01', '2020-08-31')
    .sort('CLOUD_COVER')
    .filter(ee.Filter.lte('CLOUD_COVER', 20));

  // Map LST computation across images. Take the mean for overlaps
  var composite_computed = images
    .map(function (image) {
      return geet
        .lst_calc_ls8(image)
        .select('LST')
        .multiply(9 / 5)
        .add(32);
    })
    .mean();
  console.log(
    composite_computed.getDownloadURL({ scale: 100, region: bounds }),
  );
}

// Authenticate using a service account.
ee.data.authenticateViaPrivateKey(privateKey, runAnalysis);
