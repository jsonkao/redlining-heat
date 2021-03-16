## Reproduction

First, download `fullshpfile.zip` from the [Mapping Inequality](https://dsl.richmond.edu/panorama/redlining/#loc=11/40.809/-74.187&city=manhattan-ny&area=D3&text=intro) project. Unzip it. The shapefule you want is in `fullshpfile/shapefile`. Import that in GEE.

The USGS Landsat 8 Surface Reflectance Tier 1 data can be imported directly in GEE.

Run the task at `users/jasonkao/landsat/main` to compute and export the grouped temperature calculation. It takes about a minute. The tasks exports a GeoJSON file called `meanTemperatureTask.json`. Properties are extracted with a make target to `temperatures.json`.

## Next Steps

1. Statistical analysis

2. Presentationn
