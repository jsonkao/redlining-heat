# Downloads are made in this separate file so the makefile can be run in parallel
# while requests to Overpass are made one at a time

outputDir=$1
shift
query=$1
shift
mkdir -p $outputDir

for city in "$@"
do
  echo "=== Downloading $city ==="
  wget -O $outputDir/$city.osm $query\&bbox=$(jq -r ".\"${city/_/ }\" | join(\",\")" city-bbox-index.json)
done
