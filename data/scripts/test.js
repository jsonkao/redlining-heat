const fs = require('fs');
const ee = require('@google/earthengine');
const deasync = require('deasync');
const { run, retrieveTemperatures } = require('./utils.js');

function main() {
  const geoJSON = JSON.parse(
    fs.readFileSync('./holc-shapefile/holc_ad_data.geojson'),
  );
  const bbox = ee.Geometry(geoJSON);
  const features = retrieveTemperatures(bbox, bbox, 2020).reduceRegions({
    reducer: ee.Reducer.mean(),
    collection: ee.FeatureCollection(geoJSON),
    scale: 30,
  });
  const params = {
    element: features,
    type: 'EXPORT_FEATURES',
    driveFileNamePrefix: 'export',
    fileFormat: 'GeoJSON',
  };
  const taskId = ee.data.newTaskId(1);
  let done = false;
  ee.data.startProcessing(taskId, params, () => {
    console.log(done = true);
  });
}

function test() {
  ee.data.listOperations(100, console.log);
}

run(main);
