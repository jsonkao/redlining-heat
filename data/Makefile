MAKEFLAGS += -j4

# Cities to generate maps/data for. Replaces any spaces in city names with underscore.
CITIES = Philadelphia Richmond Detroit Baltimore Chicago New_Orleans Atlanta Austin Houston Portland Oakland Cleveland Birmingham Bergen_Co. St._Louis Milwaukee_Co. San_Francisco Manhattan,Bronx,Queens,Brooklyn hi,hi
YEARS = 2000 2020

SHAPEFILE = holc-shapefile/holc_ad_data.shp
OSMTOGEOJSON = node --max_old_space_size=8192 `which osmtogeojson`


#
# Directories
#

SCRIPT_DIR = scripts
TASK_DIR = task-exports

# OSM maps
OSM_DIR = osm-raw
OSM_TOPO_DIR = osm-topojson
OSM_BURNED_DIR = osm-burned
BASE_DIR = basemaps

# GEE-derived maps
TEMP_DIR = gee-temperatures
COLOR_DIR = color-configs
RELIEF_DIR = reliefs

# Others
HOLC_DIR = boundaries
CHART_DIR = charts

OVERPASS_QUERY = https://overpass-api.de/api/interpreter?data=[bbox]\;\(way[highway][highway!=footway][highway!=cycleway][highway!=steps]\;way[building]\;\)\;._\;out%20geom\;

WIDTH = 2000

tempmaps: folders $(foreach C,$(CITIES),$(foreach Y,$(YEARS),$(RELIEF_DIR)/$C-$Y.png))
basemaps: folders $(CITIES:%=$(BASE_DIR)/%.png)
holcmaps: folders $(CITIES:%=$(HOLC_DIR)/%.svg)
all: folders tempmaps basemaps holcmaps tukeyResults.json

#
# GEE temperature reliefs
#

# Transform temperature data into color reliefs
$(RELIEF_DIR)/%.png: $(TEMP_DIR)/%.tif $(COLOR_DIR)/%.txt
	rm -f $@
	gdaldem color-relief $< colors.txt $(patsubst %.png,%.tif,$@) -alpha
	gdalwarp -ts $(WIDTH) 0 -of PNG $(patsubst %.png,%.tif,$@) $@

# Design color scheme for tif
# Download temperature data for 2000
$(TEMP_DIR)/%-2000.tif: $(OSM_TOPO_DIR)/%.topojson city-boundaries.json
	node $(SCRIPT_DIR)/download-temperatures.js $^ 2020 | xargs -n1 wget -O $@.zip
	unzip -p $@.zip > $@
	rm $@.zip

# Haven't figured out how to do the double wildcard on years yet
$(TEMP_DIR)/%-2020.tif: $(OSM_TOPO_DIR)/%.topojson city-boundaries.json
	node $(SCRIPT_DIR)/download-temperatures.js $^ 2000 | xargs -n1 wget -O $@.zip
	unzip -p $@.zip > $@
	rm $@.zip

#
# Basemaps
#

$(BASE_DIR)/%.png: $(OSM_BURNED_DIR)/%.tif
	rm -f $@
	gdalwarp -ts $(WIDTH 0) -of PNG $< $@

# Rasterize streets and buildings. Calculate aspect ratio using bbox extent,
# then calculate height with that.
$(OSM_BURNED_DIR)/%.tif: $(OSM_TOPO_DIR)/%.topojson
	$(eval HEIGHT = $(shell jq '.bbox' $< | jq '$(WIDTH) * (.[3] - .[1]) / (.[2] - .[0])'))
	gdal_rasterize -burn 200 -ot Byte -ts $(WIDTH) $(HEIGHT) \
		-l lines -l polygons -a_nodata 255 $< $@

# Convert to TopoJSON (NDJSON first to remove unnecessary properties).
# Removed -clean because it takes a long time and I don't see how it makes life better
$(OSM_TOPO_DIR)/%.topojson: $(OSM_DIR)/%.osm
	$(OSMTOGEOJSON) -f osm --ndjson $< \
	| ndjson-map 'd.properties = {highway: d.properties.tags.highway}, d' \
	| ndjson-reduce 'p.features.push(d), p' '{type: "FeatureCollection", features: []}' \
	| mapshaper-xl - \
	-rename-layers lines,polygons \
	-clip bbox=$(shell jq -r ".\"$(subst _, ,$(notdir $(basename $<))\" | join(\",\"))" city-bbox-index.json) \
	-o $@ format=topojson bbox

#
# HOLC vector layer
#

$(HOLC_DIR)/%.svg: $(SHAPEFILE)
	mapshaper $< \
	-filter '("$(notdir $(basename $@))".split(",").map(c => c.replace("_", " ")).includes(city)) && holc_grade != "E"' \
	-o $@ width=$(WIDTH) svg-data=holc_grade precision=0.1

#
# Downloading OSM data for each city
#

# TODO: Only download city if date of the .osm > date of the query (maybe w/ a flag)
# Download OSM data for each city
downloads: city-bbox-index.json
	zsh $(SCRIPT_DIR)/download-osm.sh $(OSM_DIR) $(OVERPASS_QUERY) Manhattan,Bronx,Queens,Brooklyn
	# $(CITIES)

city-bbox-index.json:
	mapshaper $(SHAPEFILE) -split city -o format=geojson bbox-index extension='tmp'
	rm *.tmp
	cat bbox-index.json \
	| ndjson-split \
	| ndjson-reduce 'p[d.name] = d.bbox, p' '{}' \
	| node $(SCRIPT_DIR)/custom-merges.js $(CITIES) \
	> $@
	rm bbox-index.json

comma := ,
FILTER_LIST = $(foreach v,$(2),$(if $(findstring $(1),$(v)),$(v),))

city-areas.json: $(TASK_DIR)/cityPixelCounts.geojson
	cat $< \
	| ndjson-split 'd.features' \
	| ndjson-map 'd.properties' \
	| ndjson-reduce 'p[d.city] = d.count, p' '{}' \
	> $@

# $(TASK_DIR)/cityPixelCounts.geojson: EXPORTED FROM GEE

# Boundaries file uploaded to GEE
city-boundaries.json: Makefile
	$(shell mapshaper $(SHAPEFILE) \
		$(foreach c, $(call FILTER_LIST,$(comma), $(CITIES)), $(subst CITY,$(c),-each \"city=\'CITY\'.includes\(city\)?\'CITY\':city\")) \
		-dissolve city \
		-clean \
		-o $@)

#
# Utilities
#

ALL_FOLDERS = $(OSM_TOPO_DIR) $(OSM_BURNED_DIR) $(TEMP_DIR) $(RELIEF_DIR) $(BASE_DIR) $(HOLC_DIR) $(CHART_DIR)
folders:
	mkdir -p $(ALL_FOLDERS)

clean:
	rm -rf $(ALL_FOLDERS) tukeyResults.json
clean_temperatures:
	rm -rf $(TEMP_DIR) $(RELIEF_DIR)

.PRECIOUS: $(TEMP_DIR)/%-2000.tif $(TEMP_DIR)/%-2020.tif $(OSM_BURNED_DIR)/%.tif $(OSM_TOPO_DIR)/%.topojson

#
# Temperature mean formatting and statistics
#

tempstats: $(YEARS:%=$(TASK_DIR)/temperatures-%.json) tukeyResults.json

tukeyResults.json: $(YEARS:%=$(TASK_DIR)/temperatures-%.json) Makefile ../r/runTukey.r
	Rscript ../r/runTukey.r $(CITIES) nation | jq '.' > $@

$(TASK_DIR)/temperatures-%.json: $(TASK_DIR)/tempTask-%.geojson
	cat $< \
	| ndjson-split 'd.features' \
	| ndjson-map 'd.properties' \
	| ndjson-map '{id: d.neighborho, temperature: d.mean, holc_grade: d.holc_grade, year: $(patsubst $(TASK_DIR)/temperatures-%.json,%,$@)}' \
	| ndjson-map 'd.temperature = +(Math.round(d.temperature + "e+2") + "e-2"), d' \
	| ndjson-reduce \
	> $@
