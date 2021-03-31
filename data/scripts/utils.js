const ee = require('@google/earthengine');
const geet = require('./geet.js');
const privateKey = require('./privatekey.json');

function run(fn) {
  // Authenticate using a service account and run
  ee.data.authenticateViaPrivateKey(privateKey, function () {
    // Initialize client library and run analysis.
    ee.initialize(null, null, fn, e =>
      console.error('Initialization error: ' + e),
    );
  });
}

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
      var reducers = ee.Reducer.sum().combine({
        reducer2: ee.Reducer.count(),
        sharedInputs: true,
      });
      var stats = bqa.reduceRegion({
        reducer: reducers,
        geometry: holc_vectors.filterBounds(
          ee.Geometry.Polygon(
            ee.Geometry(image.get('system:footprint')).coordinates(),
          ),
        ),
        scale: 30,
      });
      return image.set({
        proportionCloud: ee
          .Number(stats.get('cloud_count'))
          .divide(ee.Number(stats.get('cloud_sum'))),
      });
    })
    .filter(ee.Filter.lte('proportionCloud', 0.3));
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

module.exports = {
  run,
  retrieveTemperatures,
};
