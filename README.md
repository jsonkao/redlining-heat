This repository contains temperature and ecological data used to explore the relationship between heat, infrastructure, and redlining.

## Tabular data

#### `task-exports/temperature-YYYY.json`

An array of `{ id, temperature, holc_grade }` objects that each represent the id, grade, and median temperature in year `YYYY` of a HOLC neighborhood (see [section II-C](https://jsonkao.github.io/redlining-heat/Final.pdf)). The id of a HOLC neighborhood was given by [_Mapping Inequality_](https://dsl.richmond.edu/panorama/redlining/#loc=11/40.809/-74.187&city=manhattan-ny&area=D3&text=downloads).

#### `task-exports/impervious-YYYY.json`

An array of `{ id, freq* }` objects. Any of the keys `freq1`, `freq2`, ..., `freq12` may exist, where `freqX` represents the number of pixels in each HOLC polygon of impervious surface [descriptor value](https://developers.google.com/earth-engine/datasets/catalog/USGS_NLCD_RELEASES_2016_REL#bands) `X` (see [section II-D](https://jsonkao.github.io/redlining-heat/Final.pdf)). The total number of pixels in each HOLC polygon can be found by summing the `freqX` values in `task-exports/impervious-YYYY-unweighted.json`.

#### `task-exports/tree-YYYY.json`

An array of `{ id, prop_tree }` objects that each represent the id and proportion tree canopy cover in year `YYYY` of a HOLC neighborhood (see [section II-E](https://jsonkao.github.io/redlining-heat/Final.pdf)).

## Raster data

#### `gee-temperatures/CITY-YYYY.json`

Temperature information at 30-m resolution in Fahrenheit for a particular year over the bounding box of a particular city ([section II-C](https://jsonkao.github.io/redlining-heat/Final.pdf)).
