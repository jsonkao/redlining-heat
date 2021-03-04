## Reproduction

First, download `fullshpfile.zip` from the [Mapping Inequality](https://dsl.richmond.edu/panorama/redlining/#loc=11/40.809/-74.187&city=manhattan-ny&area=D3&text=intro) project. Unzip it. The shapefule you want is in `fullshpfile/shapefile`. Import that in GEE.

The USGS Landsat 8 Surface Reflectance Tier 1 data can be imported directly in GEE.

Run `users/jasonkao/landsat/main` to compute and export the grouped NDVI calculation. It takes about 5 hours. The exported CSV is `means.csv`. The cleaned and formatted JSON data is `means.json`.

## File organization

## Next Steps

1. Analyze NDVI vs. HOLC rating as sanity check

2. Instead of NDVI, calculate temperature
