MAKEFLAGS += -j4

# Cities to generate base maps for. Replaces any spaces in city names with underscore.
CITIES = Richmond Minneapolis Philadelphia # Detroit Baltimore Chicago Houston Portland

SHAPEFILE = ../data/fullshpfile/shapefile/holc_ad_data.shp
OSMTOGEOJSON = node --max_old_space_size=8192 `which osmtogeojson`

#
# Directories
#

# OSM maps
OSM_DIR = osm-raw
VEC_DIR = osm-topojson
GTIFF_DIR = osm-geotiff
BASE_DIR = basemaps

# GEE-derived maps
TEMP_DIR = gee-temperatures
REL_DIR = gee-reliefs

# HOLC maps
HOLC_DIR = holc

OVERPASS_QUERY = https://overpass-api.de/api/interpreter?data=[bbox]\;\(way[highway][highway!=footway][highway!=cycleway][highway!=steps]\;way[building]\;\)\;._\;out%20geom\;

WIDTH = 2000

tempmaps: folders $(CITIES:%=$(REL_DIR)/%.png)
basemaps: folders $(CITIES:%=$(BASE_DIR)/%.png)
holcmaps: folders $(CITIES:%=$(HOLC_DIR)/%.svg)
all: folders tempmaps basemaps holcmaps

#
# GEE temperature reliefs
#

# Transform temperature data into color reliefs
$(REL_DIR)/%.png: $(TEMP_DIR)/%.tif
	gdaldem color-relief $< colors.txt $(patsubst %.png,%.tif,$@) -alpha
	gdalwarp -ts $(WIDTH) 0 -of PNG $(patsubst %.png,%.tif,$@) $@

# Download temperature data
$(TEMP_DIR)/%.tif: $(VEC_DIR)/%.topojson
	node download-temperatures.js $(shell jq -c '.bbox' $<) | xargs -n1 wget -O $@.zip
	unzip -p $@.zip > $@
	rm $@.zip

#
# Basemaps
#

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
	-clip bbox=$(shell jq -r ".\"$(subst _, ,$(notdir $(basename $<))\" | join(\",\"))" city-bbox-index.json) \
	-o $@ format=topojson bbox

#
# HOLC vector layer
#

$(HOLC_DIR)/%.svg:
	mapshaper $(SHAPEFILE) \
	-filter 'city == "$(notdir $(basename $@))".replace("_", " ")' \
	-o $@ width=$(WIDTH) svg-data=holc_grade precision=0.1

#
# Downloading OSM data for each city
#

downloads: city-bbox-index.json
	zsh download-osm.sh $(OSM_DIR) $(OVERPASS_QUERY) $(CITIES)

city-bbox-index.json: Makefile
	mapshaper $(SHAPEFILE) -split city -o format=geojson bbox-index extension='trash'
	rm *.trash
	cat bbox-index.json \
	| ndjson-split \
	| ndjson-reduce 'p[d.name] = d.bbox, p' '{}' \
	> $@
	rm bbox-index.json

#
# Utilities
#

ALL_FOLDERS = $(VEC_DIR) $(GTIFF_DIR) $(TEMP_DIR) $(REL_DIR) $(BASE_DIR) $(HOLC_DIR)
folders:
	mkdir -p $(ALL_FOLDERS)

clean:
	rm -rf $(ALL_FOLDERS)

.PRECIOUS: $(TEMP_DIR)/%.tif $(GTIFF_DIR)/%.tif $(VEC_DIR)/%.topojson
