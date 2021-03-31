## Data and map generation (`/data`)

The Makefile handles all data processing. It has the following functions.

0. Uses mapshaper to create necessary prerequisite files: `city-bbox-index.json`, `city-boundaries.json`.

1. It generates two image layers for each city. The city-level base layer requires downloading vector data from OSM via the Overpass API. Raw OSM data is stored in `OSM_DIR`. That data is converted into TopoJSON (`OSM_TOPO_DIR`) and burned it into a web-friendly raster (`OSM_BURNED_DIR`). The temperature layer is downloaded from GEE into `TEMP_DIR` and converted using `gdaldem color-relief` into a colored relief (`RELIEF_DIR`). Each temperature file is made a custom color configuration (`COLOR_DIR`). The scripts that download OSM and temperature data and create the color configurations are in `SCRIPT_DIR`.

2. It generates city-level HOLC boundary SVGs into `HOLC_DIR` using the Mapping Inequality shapefile (I downloaded the compressed data from [Mapping Inequality](https://dsl.richmond.edu/panorama/redlining/#loc=11/40.809/-74.187&city=manhattan-ny&area=D3&text=intro), unzipped it, and kept only the `shapefile` directory, which I renamed to `holc-shapefile`).

3. It takes the task export from Google Earth Engine and extracts the essentials with ndjson-cli into `temperatures.json`.

4. It takes the GEE task export and uses an R script in `./r` to run the Tukey HSD test on all cities. The script also generates Tukey and density plot visualizations for all cities.

Latest benchmark for building all 16 cities:
```
make all  1710.72s user 748.96s system 112% cpu 36:24.79 total
```

## Next Steps

* Statistics and policy analysis

* Downloading OSM data in multiple tiles of a bbox: Step 1 requests too much from both OSM and GEE for the city of Los Angeles.

* Only 1170 mean's in the new 2000 temp task?

## Setup/prerequisites

Tools: gdal, jq, mapshaper, ndjson-cli, R, Node

Files: [`data/scripts/privatekey.json`](https://developers.google.com/earth-engine/guides/service_account)