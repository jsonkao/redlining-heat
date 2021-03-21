# MAKEFLAGS += -j4

SHAPEFILE = ../data/fullshpfile/shapefile/holc_ad_data.shp

OSMTOGEOJSON = node --max_old_space_size=8192 `which osmtogeojson`

VEC_DIR = vectors
OSM_DIR = osm
GTIFF_DIR = geotiffs
BASE_DIR = bases
TEMP_DIR = temperatures
REL_DIR = reliefs
HOLC_DIR = holc

# Cities to generate base maps for. Replaces any spaces in city names with underscore.
CITIES = Richmond Detroit Baltimore Chicago Houston Philadelphia Minneapolis Portland

OVERPASS_QUERY = https://overpass-api.de/api/interpreter?data=[bbox]\;\(way[highway][highway!=footway][highway!=cycleway][highway!=steps]\;way[building]\;\)\;._\;out%20geom\;

WIDTH = 2000

rasters: folders $(CITIES:%=$(REL_DIR)/%.png) $(CITIES:%=$(BASE_DIR)/%.png)
vectors: folders $(CITIES:%=$(HOLC_DIR)/%.svg)
downloads:
	zsh download-osm.sh $(OSM_DIR) $(OVERPASS_QUERY) $(CITIES)
all: rasters vectors

.PRECIOUS:

# Transform temperature data into color reliefs
$(REL_DIR)/%.png: $(TEMP_DIR)/%.tif
	gdaldem color-relief $< colors.txt $(patsubst %.png,%.tif,$@) -alpha
	gdalwarp -ts $(WIDTH) 0 -of PNG $(patsubst %.png,%.tif,$@) $@

# Download temperature data
$(TEMP_DIR)/%.tif: $(VEC_DIR)/%.topojson
	node index.js $(shell jq -c '.bbox' $<) | xargs -n1 wget -O $@.zip
	unzip -p $@.zip > $@
	rm $@.zip

$(BASE_DIR)/%.png: $(GTIFF_DIR)/%.tif
	gdalwarp -ts $(WIDTH 0) -of PNG $< $@

# Rasterize streets and buildings. Calculate aspect ratio using bbox extent,
# then calculate height with that.
$(GTIFF_DIR)/%.tif: $(VEC_DIR)/%.topojson
	$(eval HEIGHT = $(shell jq '.bbox' $< | jq '$(WIDTH) * (.[3] - .[1]) / (.[2] - .[0])'))
	gdal_rasterize -burn 200 -ot Byte -ts $(WIDTH) $(HEIGHT) \
		-l lines -l polygons -a_nodata 255 $< $@

# Convert to TopoJSON (NDJSON first to remove unnecessary properties).
$(VEC_DIR)/%.topojson: $(OSM_DIR)/%.osm
	$(OSMTOGEOJSON) -f osm --ndjson $< \
	| ndjson-map 'd.properties = {highway: d.properties.tags.highway}, d' \
	| ndjson-reduce 'p.features.push(d), p' '{type: "FeatureCollection", features: []}' \
	| mapshaper-xl - \
	-rename-layers lines,polygons \
	-clean \
	-clip bbox=$(BBOX) \
	-o $@ format=topojson bbox

$(HOLC_DIR)/%.svg:
	mapshaper $(SHAPEFILE) \
	-filter 'city == "$(notdir $(basename $@))".replace("_", " ")' \
	-o $@ width=$(WIDTH) svg-data=holc_grade precision=0.1

city-bbox-index.json: Makefile
	mapshaper $(SHAPEFILE) -split city -o format=geojson bbox-index extension='trash'
	rm *.trash
	cat bbox-index.json \
	| ndjson-split \
	| ndjson-reduce 'p[d.name] = d.bbox, p' '{}' \
	> $@
	rm bbox-index.json

folders:
	mkdir -p $(VEC_DIR) $(GTIFF_DIR) $(TEMP_DIR) $(REL_DIR) $(BASE_DIR) $(HOLC_DIR)
