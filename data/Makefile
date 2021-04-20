MAKEFLAGS += -j4

#
# PARAMETERS
#

# Cities to generate maps/data for. Replace any spaces in city names with
# underscores. To group cities, use commas.
CITIES = Philadelphia Richmond Detroit Baltimore Chicago New_Orleans Atlanta Austin Houston \
	Portland Oakland Cleveland Birmingham Bergen_Co. St._Louis,East_St._Louis Milwaukee_Co. San_Francisco \
	Manhattan,Bronx,Queens,Brooklyn Los_Angeles \
	Denver Seattle Dallas Tulsa Miami Memphis Flint \
	Kenosha Boston San_Diego Essex_Co. Greater_Kansas_City \
	Akron Union_Co. Sioux_City Fort_Worth Toledo St._Paul Syracuse Knoxville Erie Montgomery \
	Little_Rock Sacramento Greensboro El_Paso Savannah Kenosha Cambridge \
	Jacksonville Chattanooga Indianapolis Joliet Youngstown Fort_Wayne \
	Terre_Haute Decatur Wichita Warren Battle_Creek Bay_City \
	South_Bend Dayton Grand_Rapids Portsmouth Racine Muskegon Kalamazoo Hamilton \
	Rochester@NY Trenton Camden Utica Stamford \
	New_Britain Holyoke_Chicopee Haverhill Manchester Altoona Buffalo Brockton San_Jose Niagara_Falls \
	Johnson_City Fresno Spokane Stockton Tacoma Roanoke Louisville Charlotte  Poughkeepsie \
	Lexington@KY Macon Durham Augusta Norfolk Winston-Salem Charleston Columbus@OH New_Haven


# Years to generate temperature maps for
YEARS = 2000 2020 1990

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

# Impervious surfaces data
IMPERVIOUS_DIR = impervious

# Others
HOLC_DIR = boundaries
CHART_DIR = charts
SHAPEFILE = holc-shapefile/holc_ad_data_adjusted.shp


tempmaps: folders $(foreach C,$(CITIES),$(foreach Y,$(YEARS),$(RELIEF_DIR)/$C-$Y.png))
tempdownloads: folders $(foreach C,$(CITIES),$(foreach Y,$(YEARS),$(TEMP_DIR)/$C-$Y.tif))
basemaps: folders $(CITIES:%=$(BASE_DIR)/%.png)
boundaries: folders $(CITIES:%=$(HOLC_DIR)/%.svg)
all: folders tempmaps basemaps boundaries charts

#
# GEE temperature reliefs
#

# Transform temperature data into color reliefs
$(RELIEF_DIR)/%.png: $(TEMP_DIR)/%.tif $(COLOR_DIR)/%.txt
	rm -f $@
	gdaldem color-relief $^ $(patsubst %.png,%.tif,$@) -alpha
	python3 $(SCRIPT_DIR)/project.py $(patsubst %.png,%.tif,$@) $@ $(WIDTH)

# Design color scheme for tif
$(COLOR_DIR)/%.txt: $(TEMP_DIR)/%.tif
	python3 $(SCRIPT_DIR)/create-color-config.py $< city-boundaries.json > $@

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

# Impervious surfaces
$(IMPERVIOUS_DIR)/%.tif:
	node $(SCRIPT_DIR)/download-impervious.js $@ city-bbox-index.json \
	| xargs -n1 wget -O $@.zip \
	&& unzip -p $@.zip > $@ \
	&& rm $@.zip

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

comma := ,
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

ALL_FOLDERS = $(OSM_GEO_DIR) $(OSM_BURNED_DIR) $(TEMP_DIR) $(RELIEF_DIR) $(BASE_DIR) $(HOLC_DIR) $(CHART_DIR) $(COLOR_DIR)
folders:
	mkdir -p $(ALL_FOLDERS)

clean:
	rm -rf $(ALL_FOLDERS)
clean_temperatures:
	rm -rf $(TEMP_DIR) $(RELIEF_DIR)

keep: $(CITIES:%=$(TEMP_DIR)/%-2000.tif) $(CITIES:%=$(TEMP_DIR)/%-2020.tif) $(CITIES:%=$(OSM_BURNED_DIR)/%.tif) $(CITIES:%=$(OSM_GEO_DIR)/%.geojson) $(foreach C,$(CITIES),$(foreach Y,$(YEARS),$(COLOR_DIR)/$C-$Y.txt))

#
# Temperature mean formatting and statistics
#

charts: folders $(CITIES:%=$(CHART_DIR)/%.png) $(CHART_DIR)/nation.png

tempstats: $(YEARS:%=$(TASK_DIR)/temperatures-%.json)

$(CHART_DIR)/%.png:
	Rscript ../r/runTukey.r $(notdir $(basename $@)) > /dev/null

$(TASK_DIR)/temperatures-%.json: $(TASK_DIR)/tempTask-%.geojson
	cat $< \
	| ndjson-split 'd.features' \
	| ndjson-map 'd.properties' \
	| ndjson-map '{id: d.neighborho, temperature: d.mean, holc_grade: d.holc_grade, year: $(patsubst $(TASK_DIR)/temperatures-%.json,%,$@)}' \
	| ndjson-map 'd.temperature = +(Math.round(d.temperature + "e+2") + "e-2"), d' \
	| ndjson-reduce \
	> $@

#
# Utility for checking whether city names are unique
#

check-unique:
	mapshaper $(SHAPEFILE) \
	-dissolve city,state \
	-o - format=geojson \
	| python3 $(SCRIPT_DIR)/check-unique.py $(CITIES)

ls-cities:
	mapshaper $(SHAPEFILE) \
	-dissolve city,state \
	-o - format=geojson \
	| python3 $(SCRIPT_DIR)/list-cities.py $(CITIES)

%.check-unique:
	@echo $(basename $@)
	@echo $(shell mapshaper $(SHAPEFILE) -filter "'$(basename $@)'.replace(/_/g,' ').split(',').includes(city)" -uniq state -calc 'count()' 2>&1 | tail -n1 | cut -c 18-) $(basename $@)

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
	-drop fields=area_descr \
	-o $@
