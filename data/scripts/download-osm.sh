# Downloads are made in this separate file so the makefile can be run in parallel
# while requests to Overpass are made one at a time

outputDir=$1
shift
query=$1
shift
mkdir -p $outputDir

for city in "$@"
do
  outFile=$outputDir/$city.osm
  [[ -e osm-geojson/$city.geojson ]] && continue
  if [ -e $outFile ]; then
    if [ ! -s $outFile ]; then
      rm $outFile
    else
      continue
    fi
  fi
  echo "=== Downloading $city ==="
  wget -O $outFile $query\&bbox=$(jq -r ".\"${city//_/ }\" | join(\",\")" city-bbox-index.json)
  [[ $? -ne 0 ]] && rm $outFile
  sleep 5
done
