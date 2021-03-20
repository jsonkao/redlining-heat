# MAKEFLAGS += -j4

SHAPEFILE = ../redlining-heat/data/fullshpfile/shapefile/holc_ad_data.shp

OSMTOGEOJSON = node --max_old_space_size=8192 `which osmtogeojson`

OSM_DIR = osm-data
RAS_DIR = geotiffs

# Cities to generate base maps for. Replaces any spaces in city names with underscore.
CITIES = Richmond Detroit # Baltimore
TARGETS = $(CITIES:%=$(RAS_DIR)/%.tif)

OVERPASS_QUERY = https://overpass-api.de/api/interpreter?data=[bbox]\;\(way[highway][highway!=footway]\;way[building]\;\)\;._\;out%20geom\;

WIDTH = 2000

all: folders $(TARGETS)

# Rasterize streets and buildings. Calculate aspect ratio using bbox extent,
# then calculate height with that.
$(RAS_DIR)/%.tif: $(OSM_DIR)/%.topojson
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
	mkdir -p $(OSM_DIR) $(RAS_DIR)

$(OSM_DIR)/%.osm:
	$(eval BBOX = $(shell mapshaper $(SHAPEFILE) \
		-filter 'city == "$(notdir $(basename $@))".replace("_", " ")' \
		-o - bbox format=geojson \
		| jq -r '.bbox | join(",")'))
	wget -O $@ $(OVERPASS_QUERY)\&bbox=$(BBOX)