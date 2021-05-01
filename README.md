The Makefile (`/data/Makefile`) handles all data processing. It has the following functions.

0. Uses mapshaper to create necessary prerequisite files: `city-bbox-index.json` (maps city to bounding box), `city-boundaries.json` (maps city to dissolved bounary).

1. It generates a basemap for each city. `scripts/download-osm.sh` downloads vector data from OSM via the Overpass API into `OSM_DIR`. `scripts/xml2geojson.py` converts the data into GeoJSON (`OSM_GEO_DIR`). GDAL burns the vectors into a web-friendly raster (`OSM_BURNED_DIR`). `scripts/project.py` applies a local Albers projection and converts the raster into a PNG.

2. It generates a temperature layers for each city. I use the GEE JavaScript API to download a temperature layer for each city's bounding box into `TEMP_DIR`. I convert it (`gdaldem color-relief`) into a colored relief (`RELIEF_DIR`). `scripts/create-color-config.py` makes a custom color configuration (`COLOR_DIR`) for each temperature raster that only considers values inside a city's boundary. Alongside that, the script creates a label file for pixel filtering. `scripts/project.py` applies an Albers projection and converts the raster into a PNG.

3. It generates impervious descriptor layers for each city. Must generate `$(IMP_DESC_DIR)/$(CITY).tif` and `$(IMP_PCT_DIR)/$(CITY).tif` before generating `$(IMP_RELIEF_DIR)/$(CITY)-$(BOUND).tif`. Alongside the relief, `scripts/create-color-config.py` creates a label file for pixel filtering.

4. It generates city-level HOLC boundary SVGs into `HOLC_DIR` using the Mapping Inequality shapefile (I downloaded the compressed data from [Mapping Inequality](https://dsl.richmond.edu/panorama/redlining/#loc=11/40.809/-74.187&˜city=manhattan-ny&area=D3&text=intro), unzipped it, and kept only the `shapefile` directory, which I renamed to `holc-shapefile`. I then adjusted the shapefile to simplify/de-duplify some city names.). It uses [`-split holc_grade`](https://github.com/mbloch/mapshaper/wiki/Command-Reference#-split) to group polygons into `<g>`'s. It uses mapshaper to project the SVG according to the string produced by `scripts/project.py --proj4`.

5. It extracts the essentials from temperature GEE task exports with ndjson-cli into `temperatures-YYYY.json`. It does the same for impervious surfaces and tree canopy exports into `impervious-YYYY.json`.

6. It takes the GEE temperature task export and uses the R script `./r/runTukey.r` to run the Tukey HSD test on all cities. The script also generates Tukey and density plot visualizations for all cities.

Every relief is projected into a local Albers.

## Prerequisites

* Command line tools: GDAL, jq, mapshaper, ndjson-cli, R
* Files: [`data/scripts/privatekey.json`](https://developers.google.com/earth-engine/guides/service_account)
* Libraries: `npm install`; `osgeo`, `kmeans1d`, `rasterio` for Python

## Reference material

* [USGS National Land Cover Database (NLCD) band value reference](https://developers.google.com/earth-engine/datasets/catalog/USGS_NLCD_RELEASES_2016_REL#bands)