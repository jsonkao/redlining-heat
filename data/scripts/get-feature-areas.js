/* NOT USING BEACUSE OF E2BIG ERROR, RESORTED TO JUST EXPORTING FOR NOW */

// Require client library and private key.
const ee = require('@google/earthengine');
const privateKey = require('./privatekey.json');
const boundaries = require('../' + process.argv[2]);

// Initialize client library and run analysis.
var runAnalysis = function () {
  ee.initialize(null, null, main, function (e) {
    console.error('Initialization error: ' + e);
  });
};

function main() {
  const boundaryCollection = ee.FeatureCollection(boundaries);
  const images = ee
    .ImageCollection('LANDSAT/LC08/C01/T1')
    .filterBounds(boundaryCollection.geometry())
    .filterDate('2020-06-01', '2020-08-20')
    .mosaic()
    .select('B1');
  const pixelCounts = images.reduceRegions({
    reducer: ee.Reducer.count(),
    collection: boundaryCollection,
    scale: 30,
  });

  // Output download URL
  ee.data.startProcessing(ee.data.newTaskId(1));
}

// Authenticate using a service account and run
ee.data.authenticateViaPrivateKey(privateKey, runAnalysis);
