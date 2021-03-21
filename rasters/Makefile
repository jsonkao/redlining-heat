# MAKEFLAGS += -j4

SHAPEFILE = ../data/fullshpfile/shapefile/holc_ad_data.shp

OSMTOGEOJSON = node --max_old_space_size=8192 `which osmtogeojson`

OSM_DIR = osm-data
GTIFF_DIR = geotiffs
BASE_DIR = bases
TEMP_DIR = temperatures
REL_DIR = reliefs

# Cities to generate base maps for. Replaces any spaces in city names with underscore.
CITIES = Richmond # Detroit # Baltimore
TARGETS = $(CITIES:%=$(REL_DIR)/%.png) $(CITIES:%=$(BASE_DIR)/%.png)

OVERPASS_QUERY = https://overpass-api.de/api/interpreter?data=[bbox]\;\(way[highway][highway!=footway]\;way[building]\;\)\;._\;out%20geom\;

WIDTH = 2000

all: folders $(TARGETS)

# Transform temperature data into color reliefs
$(REL_DIR)/%.png: $(TEMP_DIR)/%.tif
	gdaldem color-relief $< colors.txt $(patsubst %.png,%.tif,$@) -alpha
	gdalwarp -ts $(WIDTH) 0 -of PNG $(patsubst %.png,%.tif,$@) $@

# Download temperature data
$(TEMP_DIR)/%.tif: $(OSM_DIR)/%.topojson
	node index.js $(shell jq -c '.bbox' $<) | xargs -n1 wget -O $@.zip
	unzip -p $@.zip > $@
	rm $@.zip

$(BASE_DIR)/%.png: $(GTIFF_DIR)/%.tif
	gdalwarp -ts $(WIDTH 0) -of PNG $< $@

# Rasterize streets and buildings. Calculate aspect ratio using bbox extent,
# then calculate height with that.
$(GTIFF_DIR)/%.tif: $(OSM_DIR)/%.topojson
	$(eval HEIGHT = $(shell jq '.bbox' $< | jq '$(WIDTH) * (.[3] - .[1]) / (.[2] - .[0])'))
	gdal_rasterize -burn 177 -ot Byte -ts $(WIDTH) $(HEIGHT) \
		-l lines -l polygons -a_nodata 255 $< $@

.PRECIOUS: $(OSM_DIR)/%.topojson

# Download streets and building polygons from OSM using Overpass.
# Convert to TopoJSON (NDJSON first to remove unnecessary properties).
$(OSM_DIR)/%.topojson:
	$(eval BBOX = $(shell mapshaper $(SHAPEFILE) \
		-filter 'city == "$(notdir $(basename $@))".replace("_", " ")' \
		-o - bbox format=geojson \
		| jq -r '.bbox | join(",")'))
	wget -O - $(OVERPASS_QUERY)\&bbox=$(BBOX) \
	| $(OSMTOGEOJSON) -f osm --ndjson \
	| ndjson-map 'd.properties = {highway: d.properties.tags.highway}, d' \
	| ndjson-reduce 'p.features.push(d), p' '{type: "FeatureCollection", features: []}' \
	| mapshaper - \
	-rename-layers lines,polygons \
	-clean \
	-clip bbox=$(BBOX) \
	-o $@ format=topojson bbox

folders:
	mkdir -p $(OSM_DIR) $(GTIFF_DIR) $(TEMP_DIR) $(REL_DIR) $(BASE_DIR)
