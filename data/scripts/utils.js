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

function lst_calc_ls7(image) {
  var toa = geet.toa_radiance(image, 6);
  var ndvi = geet.ndvi_l7(toa);
  var bt = geet.brightness_temp_l7c(ndvi, true);
  var propVeg = geet.prop_veg(bt);
  var lse = geet.surface_emissivity(propVeg);
  var lst = geet.surface_temperature_tm(lse);
  return lst;
}

function lst_calc_ls8(image) {
  var toa = geet.toa_radiance(image, 10);
  var ndvi = geet.ndvi_l8(toa);
  var bt = geet.brightness_temp_l8c(ndvi, true);
  var propVeg = geet.prop_veg(bt);
  var lse = geet.surface_emissivity(propVeg);
  var lst = geet.surface_temperature_tm(lse);
  return lst;
}

// Return a filter for the summer of a particular year
function inSummer(year) {
  return ee.Filter.date(year + '-06-01', year + '-08-31');
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
function retrieveTemperatures(bbox, boundary, year, city) {
  const [collection, lst_calc] = {
    2020: [ee.ImageCollection('LANDSAT/LC08/C01/T1'), lst_calc_ls8],
    2000: [ee.ImageCollection('LANDSAT/LE07/C01/T1'), lst_calc_ls7],
    1990: [ee.ImageCollection('LANDSAT/LT05/C01/T1'), geet.lst_calc_ls5],
  }[year];
  const images = collection
    .filterBounds(bbox)
    .filter(ee.Filter.or(...[year-1, year, year+1].map(inSummer)))
    .map(function (image) {
      var bqa = getQABits(image.select('BQA'), 4, 4, 'cloud');
      var reducers = ee.Reducer.sum().combine({
        reducer2: ee.Reducer.count(),
        sharedInputs: true,
      });
      var stats = bqa.reduceRegion({
        reducer: reducers,
        geometry: boundary,
        /* THE BELOW APPLIES TO NATION-WIDE TEMPERATURE RETRIEVAL
        geometry: holc_vectors.filterBounds(
          ee.Geometry.Polygon(
            ee.Geometry(image.get('system:footprint')).coordinates(),
          ),
        ),
        */
        scale: 30,
      });
      return image.set({
        proportionCloud: ee
          .Number(stats.get('cloud_sum'))
          .divide(ee.Number(stats.get('cloud_count'))),
      });
    });
  let cloudThreshold = 0.1;
  let filtered = images.filter(ee.Filter.lte('proportionCloud', cloudThreshold));
  while (filtered.size().getInfo() === 0) {
    filtered = images.filter(ee.Filter.lte('proportionCloud', cloudThreshold += 0.1));
  }
  console.error(`\n${city}-${year}: ${filtered.size().getInfo()} at threshold ${cloudThreshold}\n`);
  return filtered
    .map(image =>
      lst_calc(image)
        .select('LST')
        .multiply(9 / 5)
        .add(32)
        .rename(year),
    )
    .median();
}

module.exports = {
  run,
  retrieveTemperatures,
};
