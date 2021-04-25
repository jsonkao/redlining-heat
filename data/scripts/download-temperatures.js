const fs = require('fs');
const path = require('path');
const ee = require('@google/earthengine');
const geet = require('./geet.js');
const { run } = require('./utils.js');

function main() {
  const targetName = './' + process.argv[2];
  const city = path
    .basename(targetName)
    .replace(/_/g, ' ')
    .split('-')
    .slice(0, -1)
    .join('-');
  const boundariesFile = JSON.parse(fs.readFileSync('./' + process.argv[4]));
  const bbox = ee.Geometry.Rectangle(
    JSON.parse(fs.readFileSync('./' + process.argv[3]))[city],
  );
  const boundary = ee.Geometry.MultiPolygon(
    boundariesFile.features.filter(f => f.properties.city === city)[0].geometry
      .coordinates,
  );
  const year = process.argv[5];

  const temporalTemperatures = retrieveTemperatures(bbox, boundary, year, city);

  // Mask the image
  var mask = ee
    .Image('JRC/GSW1_2/GlobalSurfaceWater')
    .select('max_extent')
    .eq(0);

  // Output download URL
  console.log(
    temporalTemperatures.mask(mask).getDownloadURL({
      scale: city === 'Los Angeles' ? 45 : 30,
      region: bbox,
    }),
  );
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
function retrieveTemperatures(bbox, boundary, year, city, yearDiff = 1) {
  const years = [];
  for (let i = -yearDiff; i <= yearDiff; i++)
    years.push((+year + i).toString());
  const [collection, lst_calc] = {
    2020: [ee.ImageCollection('LANDSAT/LC08/C01/T1'), geet.lst_calc_ls8],
    2000: [ee.ImageCollection('LANDSAT/LE07/C01/T1'), geet.lst_calc_ls7],
    1990: [ee.ImageCollection('LANDSAT/LT05/C01/T1'), geet.lst_calc_ls5],
  }[year];
  const images = collection
    .filterBounds(bbox)
    .filter(ee.Filter.or(...years.map(inSummer)))
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
  let filtered = images.filter(
    ee.Filter.lte('proportionCloud', cloudThreshold),
  );
  let filteredSize = filtered.size().getInfo();
  while (filteredSize === 0) {
    if (cloudThreshold >= 0.4) {
      console.error(
        `\n${city}-${year}: Retrying with yearDiff=${yearDiff + 1}`,
      );
      return retrieveTemperatures(bbox, boundary, year, city, yearDiff + 1);
    }
    filtered = images.filter(
      ee.Filter.lte('proportionCloud', (cloudThreshold += 0.1)),
    );
    filteredSize = filtered.size().getInfo();
  }
  console.error(
    `\n${city}-${year}: ${filtered
      .size()
      .getInfo()} at threshold ${cloudThreshold}\n`,
  );
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

run(main);
