MAKEFLAGS += -j4

#
# PARAMETERS
#

# Cities to generate maps/data for. Replace any spaces in city names with
# underscores. To group cities, use commas.
CITIES := $(shell cat all_cities.txt)

# Years to generate temperature maps for
YEARS = 2000 2020 1990
# Group bounds of imperivous surfaces descriptor layer
IMP_GRP_BOUNDS = 1,6 9,10 11,12

# Width of PNG assets
WIDTH = 3000

HEADER = [bbox] # [maxsize:2000000000][timeout:900]
OVERPASS_QUERY = https://overpass-api.de/api/interpreter?data=$(strip $(HEADER))\;\(way[highway][highway!=footway][highway!=cycleway][highway!=steps]\;way[building]\;\)\;._\;out%20geom\;

#
# Directories and filename constants
#

SCRIPT_DIR = scripts
TASK_DIR = task-exports

# Basemaps and OSM data
OSM_DIR = osm-raw
OSM_GEO_DIR = osm-geojson
OSM_BURNED_DIR = osm-burned
BASE_DIR = basemaps

# Reliefs and temperature data
TEMP_DIR = gee-temperatures
COLOR_DIR = color-configs
RELIEF_DIR = reliefs

# Color and relief dirs for testing different ordinal scales.
COLOR_ORD_DIR = color-configs-ord
RELIEF_ORD_DIR = reliefs-ord

# Impervious reliefs and surfaces data
IMP_RELIEF_DIR = impervious-reliefs
IMP_DESC_DIR = gee-impervious-desc
IMP_PCT_DIR = gee-impervious-pct

# Others
HOLC_DIR = boundaries
CHART_DIR = charts
SHAPEFILE = holc-shapefile/holc_ad_data_adjusted.shp


tempmaps: folders $(foreach C,$(CITIES),$(foreach Y,$(YEARS),$(RELIEF_DIR)/$C-$Y.png))
tempmaps_ord: folders $(foreach C,$(CITIES),$(foreach Y,$(YEARS),$(RELIEF_ORD_DIR)/$C-$Y.png))
color_ord: folders $(foreach C,$(CITIES),$(foreach Y,$(YEARS),$(COLOR_ORD_DIR)/$C-$Y.txt))
tempdownloads: folders $(foreach C,$(CITIES),$(foreach Y,$(YEARS),$(TEMP_DIR)/$C-$Y.tif))

basemaps: folders $(CITIES:%=$(BASE_DIR)/%.png)
boundaries: folders $(CITIES:%=$(HOLC_DIR)/%.svg)

impervious_descriptor: folders $(CITIES:%=$(IMP_DESC_DIR)/%.tif)
impervious_pct: folders $(CITIES:%=$(IMP_PCT_DIR)/%.tif)
impervious_reliefs: folders $(foreach C,$(CITIES),$(foreach B,$(IMP_GRP_BOUNDS),$(IMP_RELIEF_DIR)/$C-$B.png))

all: folders tempmaps basemaps boundaries charts

#
# GEE temperature reliefs
#

# Transform temperature data into color reliefs
$(RELIEF_DIR)/%.png: $(TEMP_DIR)/%.tif $(COLOR_DIR)/%.txt
	rm -f $@
	gdaldem color-relief $^ $(patsubst %.png,%.tif,$@) -alpha
	python3 $(SCRIPT_DIR)/project.py $(patsubst %.png,%.tif,$@) $@ $(WIDTH)
	rm $(patsubst %.png,%.tif,$@)

# Design color scheme for tif
$(COLOR_DIR)/%.txt: $(TEMP_DIR)/%.tif $(SCRIPT_DIR)/create-color-config.py
	python3 $(SCRIPT_DIR)/create-color-config.py $< city-boundaries.json $@ --nocalc

# Transform temperature data into color reliefs (ord)
$(RELIEF_ORD_DIR)/%.png: $(TEMP_DIR)/%.tif $(COLOR_ORD_DIR)/%.txt
	rm -f $@
	gdaldem color-relief $^ $(patsubst %.png,%.tif,$@) -alpha
	python3 $(SCRIPT_DIR)/project.py $(patsubst %.png,%.tif,$@) $@ $(WIDTH)
	rm $(patsubst %.png,%.tif,$@)

# Design color scheme for tif
$(COLOR_ORD_DIR)/%.txt: $(TEMP_DIR)/%.tif
	python3 $(SCRIPT_DIR)/create-color-config.py $< city-boundaries.json $@ --bins=5 --diverging

# Download temperature data for 2000
$(TEMP_DIR)/%-2000.tif:
	node $(SCRIPT_DIR)/download-temperatures.js $@ city-bbox-index.json city-boundaries.json 2000 \
	| xargs -n1 wget -O $@.zip \
	&& unzip -p $@.zip > $@ \
	&& rm $@.zip
# Haven't figured out how to do the double wildcard on years yet
$(TEMP_DIR)/%-2020.tif:
	node $(SCRIPT_DIR)/download-temperatures.js $@ city-bbox-index.json city-boundaries.json 2020 \
	| xargs -n1 wget -O $@.zip \
	&& unzip -p $@.zip > $@ \
	&& rm $@.zip
# Haven't figured out how to do the double wildcard on years yet
$(TEMP_DIR)/%-1990.tif:
	node $(SCRIPT_DIR)/download-temperatures.js $@ city-bbox-index.json city-boundaries.json 1990 \
	| xargs -n1 wget -O $@.zip \
	&& unzip -p $@.zip > $@ \
	&& rm $@.zip

# Impervious surfaces descriptor layer
$(IMP_DESC_DIR)/%.tif:
	node $(SCRIPT_DIR)/download-impervious.js $@ city-bbox-index.json impervious_descriptor \
	| xargs -n1 wget -O $@.zip \
	&& unzip -p $@.zip > $@.albers \
	&& rm $@.zip
	$(eval CITY := $(notdir $(basename $@)))
	$(eval BBOX := $(shell jq '.["$(subst _, ,$(CITY))"] | join(" ")' -r city-bbox-index.json))
	$(eval SIZE := $(shell gdalinfo gee-temperatures/$(CITY)-2020.tif | sed -n 3p | cut -c9- | sed 's/,//g'))
	gdalwarp -t_srs EPSG:4326 -srcnodata 127 -te $(BBOX) -ts $(SIZE) $@.albers $@
	rm $@.albers

# Impervious surfaces pixel percentage
$(IMP_PCT_DIR)/%.tif:
	node $(SCRIPT_DIR)/download-impervious.js $@ city-bbox-index.json impervious \
	| xargs -n1 wget -O $@.zip \
	&& unzip -p $@.zip > $@.albers \
	&& rm $@.zip
	$(eval CITY := $(notdir $(basename $@)))
	$(eval BBOX := $(shell jq '.["$(subst _, ,$(CITY))"] | join(" ")' -r city-bbox-index.json))
	$(eval SIZE := $(shell gdalinfo gee-temperatures/$(CITY)-2020.tif | sed -n 3p | cut -c9- | sed 's/,//g'))
	gdalwarp -t_srs EPSG:4326 -te $(BBOX) -ts $(SIZE) $@.albers $@
	rm $@.albers

comma := ,

# Basename is of the form CITY-LOW,HI.png
$(IMP_RELIEF_DIR)/%.png: $(IMP_RELIEF_DIR)/%.tif.relief
	python3 $(SCRIPT_DIR)/project.py $< $@ $(WIDTH) && rm $@.aux.xml

# Basename is of the form CITY-LOW,HI.tif.relief
$(IMP_RELIEF_DIR)/%.tif.relief: $(IMP_RELIEF_DIR)/%.tif
	gdaldem color-relief $< colors_imp.txt $@ -alpha -of GTiff

# Basename is of the form CITY-LOW,HI.tif where we calc LOW <= A and A <= HI
# Prerequisites are hardcoded bc Im lazy
$(IMP_RELIEF_DIR)/%.tif:
	$(eval BASE := $(notdir $(basename $@)))
	$(eval CITY := $(shell echo $(BASE) | rev | cut -d "-" -f2- | rev))
	$(eval RANGE := $(shell echo $(BASE) | rev | cut -d "-" -f1 | rev))
	gdal_calc.py -A $(IMP_DESC_DIR)/$(CITY).tif -B $(IMP_PCT_DIR)/$(CITY).tif \
	--calc='B * logical_and($(subst $(comma),<=A$(comma)A<=,$(RANGE)))' --outfile=$@ --NoDataValue=0

#
# Basemaps
#

$(BASE_DIR)/%.png: $(OSM_BURNED_DIR)/%.tif
	rm -f $@
	python3 $(SCRIPT_DIR)/project.py $< $@ $(WIDTH)

# Rasterize streets and buildings. Calculate aspect ratio using bbox extent,
# then calculate height with that.
$(OSM_BURNED_DIR)/%.tif: $(OSM_GEO_DIR)/%.geojson
	$(eval CITY := $(subst _, ,$(notdir $(basename $<))))
	$(eval BBOX := $(shell jq -c '.["$(CITY)"]' city-bbox-index.json))
	$(eval HEIGHT := $(shell jq '$(WIDTH) * (.[3] - .[1]) / (.[2] - .[0])' <<< $(BBOX)))
	gdal_rasterize -burn 200 -ot Byte -ts $(WIDTH) $(HEIGHT) \
	-te $(shell jq -r 'join(" ")' <<< $(BBOX)) \
	-a_nodata 255 $< $@

# Convert OSM XML data to GeoJSON
$(OSM_GEO_DIR)/%.geojson: $(OSM_DIR)/%.osm
	python3 $(SCRIPT_DIR)/xml2geojson.py $< > $@

#
# HOLC vector layer
#

$(HOLC_DIR)/%.svg: $(SHAPEFILE)
	mapshaper $< \
	-filter '("$(notdir $(basename $@))".replace(/_/g," ").split(",").includes(city)) && holc_grade != "E"' \
	-proj $(shell python3 $(SCRIPT_DIR)/project.py $@ --proj4) \
	-split holc_grade \
	-o $@ width=$(WIDTH) svg-data=holc_grade precision=0.1 target=*

#
# Downloading OSM data for each city
#

# Download OSM data for each city
downloads:
	zsh $(SCRIPT_DIR)/download-osm.sh $(OSM_DIR) $(OVERPASS_QUERY) $(CITIES)

#
# Useful reference files
#

city-reference: city-bbox-index.json city-boundaries.json

# The bbox of each city is used to download temperature and OSM data
city-bbox-index.json: $(SHAPEFILE) $(SCRIPT_DIR)/custom-merges.js
	mapshaper $< -split city -o format=geojson bbox-index extension='tmp'
	rm *.tmp
	cat bbox-index.json \
	| ndjson-split \
	| ndjson-reduce 'p[d.name] = d.bbox, p' '{}' \
	| node $(SCRIPT_DIR)/custom-merges.js $(CITIES) \
	> $@
	rm bbox-index.json

FILTER_LIST = $(foreach v,$(2),$(if $(findstring $(1),$(v)),$(v),))

# Boundaries file used to compute cloud covers.
# I filter all cities for those with commas in them, and assign the city of any
# polygons within those cities to be the comma-connected conglomerate.
# I dissolve each city into one boundary and drop any holes to prevent GDAL errors.
city-boundaries.json: $(SHAPEFILE)
	$(shell mapshaper $< \
		$(foreach c, $(call FILTER_LIST,$(comma), $(CITIES)), $(subst CITY,$(c),-each \"city=\'CITY\'.includes\(city.replace\(/\\s/g,\'_\'\)\)?\'CITY\':city\")) \
		-dissolve city \
		-clean \
		-drop holes \
		-each 'city = city.replace(/_/g, " ")' \
		-o $@)

#
# Utilities
#

ALL_FOLDERS = $(OSM_GEO_DIR) $(OSM_BURNED_DIR) $(TEMP_DIR) $(RELIEF_DIR) $(BASE_DIR) $(HOLC_DIR) $(CHART_DIR) $(COLOR_DIR) $(IMP_DESC_DIR) $(IMP_RELIEF_DIR) $(IMP_PCT_DIR) $(RELIEF_ORD_DIR) $(COLOR_ORD_DIR)
folders:
	mkdir -p $(ALL_FOLDERS)

clean:
	rm -rf $(ALL_FOLDERS)
clean_temperatures:
	rm -rf $(TEMP_DIR) $(RELIEF_DIR)

keep: $(CITIES:%=$(TEMP_DIR)/%-2000.tif) $(CITIES:%=$(TEMP_DIR)/%-2020.tif) $(CITIES:%=$(OSM_BURNED_DIR)/%.tif) $(CITIES:%=$(OSM_GEO_DIR)/%.geojson) $(foreach C,$(CITIES),$(foreach Y,$(YEARS),$(COLOR_DIR)/$C-$Y.txt)) $(foreach C,$(CITIES),$(foreach Y,$(YEARS),$(COLOR_ORD_DIR)/$C-$Y.txt)) $(foreach C,$(CITIES),$(foreach B,$(IMP_GRP_BOUNDS),$(IMP_RELIEF_DIR)/$C-$B.tif))

#
# Temperature mean formatting and statistics
#

charts: folders $(CITIES:%=$(CHART_DIR)/%.png) $(CHART_DIR)/nation.png

tempstats: $(YEARS:%=$(TASK_DIR)/temperatures-%.json)
impervious: $(TASK_DIR)/impervious-2016.json

$(CHART_DIR)/%.png:
	- Rscript ../r/runTukey.r $(notdir $(basename $@)) > /dev/null

$(TASK_DIR)/temperatures-%.json: $(TASK_DIR)/tempTask-%.geojson
	cat $< \
	| ndjson-split 'd.features' \
	| ndjson-map 'd.properties' \
	| ndjson-map '{id: d.neighborho, temperature: d.mean, holc_grade: d.holc_grade, year: $(patsubst $(TASK_DIR)/temperatures-%.json,%,$@)}' \
	| ndjson-map 'd.temperature = +(Math.round(d.temperature + "e+2") + "e-2"), d' \
	| ndjson-reduce \
	> $@

$(TASK_DIR)/impervious-%.json: $(TASK_DIR)/imperviousTask-%.geojson Makefile
	cat $< \
	| ndjson-split 'd.features' \
	| ndjson-map 'd.properties' \
	| ndjson-map 'Object.assign({id: d.neighborho, holc_grade: d.holc_grade}, Object.keys(d.histogram).reduce((a, k) => {a["freq"+k] = d.histogram[k]; return a;}, {}))' \
	| ndjson-reduce \
	| jq '.' \
	> $@

#
# Utility for checking whether city names are unique
#

check-unique:
	mapshaper $(SHAPEFILE) \
	-dissolve city,state \
	-o - format=geojson \
	| python3 $(SCRIPT_DIR)/check-unique.py $(CITIES)

all_cities.txt: Makefile
	mapshaper $(SHAPEFILE) \
	-dissolve city,state \
	-o - format=geojson \
	| python3 $(SCRIPT_DIR)/list-cities.py \
	> $@

#
# Directly modify shapefile to simplify and de-duplicy some city names
#

shapefile: rm-shapefile $(SHAPEFILE)

rm-shapefile:
	rm $(SHAPEFILE)

# Modifies original shapefile to remove commas from Stamford, rename Johnson, and disambiguate some cities
$(SHAPEFILE): holc-shapefile/holc_ad_data.shp rm-shapefile
	mapshaper $< \
	-each 'city = city.includes("Stamford") ? "Stamford" : city' \
	-each 'city = city.includes("Binghamton-Johnson") ? "Johnson City" : city' \
	-each 'city = ["Lexington", "Rochester", "Columbus", "Springfield", "Jackson"].includes(city) ? city + "@" + state : city' \
	-each 'city = city.replace("&", "and")' \
	-drop fields=area_descr \
	-o $@
