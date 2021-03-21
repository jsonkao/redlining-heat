## Rasters

`rasters/` generates two image layers for each city. The city-level base layer requires downloading vector data from OSM via the Overpass API and burning it into a web-friendly raster. The temperature layer, I'm still trying to figure out how to clip to specific images.

`OSM_DIR` contains raw OSM data. `VEC_DIR` contains the OSM data turned into a TopoJSON. `GTIFF_DIR` contains the vector streets/buildings burned into rasters. `BASE_DIR` contains the web PNG assets of the burned rasters.

`TEMP_DIR` contains the temperature data from GEE for a certain bounding box. `REL_DIR` contains the color reliefs and web PNG assets of temperature data.

`HOLC_DIR` contains the HOLC boundaries for individual cities in SVG format.

I should probably rename the `rasters/` directory.

## Neighborhood-level temperature means

The `data/fullshpfile.zip` file is from the [Mapping Inequality](https://dsl.richmond.edu/panorama/redlining/#loc=11/40.809/-74.187&city=manhattan-ny&area=D3&text=intro) It is also unzipped. Import the shapefile `fullshpfile/shapefile` into GEE.

The USGS Landsat Tier 1 raw data can be imported directly in GEE.

Run the task at `users/jasonkao/landsat/main` to compute and export the grouped temperature calculation. It takes about a minute. The tasks exports a GeoJSON file called `meanTemperatureTask.json`. Properties are extracted with a make target to `temperatures.json`.

## Next Steps

1. Statistical analysis

2. Presentationn
