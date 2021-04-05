## Data and map generation (`/data`)

The Makefile handles all data processing. It has the following functions.

0. Uses mapshaper to create necessary prerequisite files: `city-bbox-index.json` (maps city to bounding box), `city-boundaries.json` (maps city to dissolved bounary).

1. It generates a basemap for each city. A shell script downloads vector data from OSM via the Overpass API into `OSM_DIR`. [`osmtogeojson`](https://github.com/tyrasd/osmtogeojson) and mapshaper convert the data into TopoJSON (`OSM_TOPO_DIR`). GDAL burns it into a web-friendly raster (`OSM_BURNED_DIR`)

2. It generates a temperatre layers for each city. I use the GEE JavaScript API to download temperature layer into `TEMP_DIR` and converts it (`gdaldem color-relief`) into a colored relief (`RELIEF_DIR`). Each temperature file is made a custom color configuration (`COLOR_DIR`). The Node and Python scripts that download OSM and temperature data and create the color configurations are in `SCRIPT_DIR`.

3. It generates city-level HOLC boundary SVGs into `HOLC_DIR` using the Mapping Inequality shapefile (I downloaded the compressed data from [Mapping Inequality](https://dsl.richmond.edu/panorama/redlining/#loc=11/40.809/-74.187&city=manhattan-ny&area=D3&text=intro), unzipped it, and kept only the `shapefile` directory, which I renamed to `holc-shapefile`). It uses `mapshaper -split` to group polygons into `<g>`'s.

4. It extracts the essentials from GEE task exports with ndjson-cli into `temperatures-YYYY.json`.

5. It takes the GEE task export and uses the R script `./r/runTukey.r` to run the Tukey HSD test on all cities. The script also generates Tukey and density plot visualizations for all cities.

Latest benchmarks with 19 cities, including NYC and LA, without OSM download time:
```
make basemaps  484.17s user 11.69s system 181% cpu 4:32.91 total

# old
make all  1710.72s user 748.96s system 112% cpu 36:24.79 total
```

## Next Steps

* Policy analysis

* Trees, impervious surfaces, what else?

* Downloading OSM data in multiple tiles of a bbox: Step 1 requests too much from both OSM and GEE for the city of Los Angeles.

## Prerequisites

Tools: GDAL, Python GDAL/OGR, jq, mapshaper, ndjson-cli, R, Node

Files: [`data/scripts/privatekey.json`](https://developers.google.com/earth-engine/guides/service_account)
