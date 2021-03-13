data/temperatures.json: data/meanTemperatureTask.json
	cat $< \
	| ndjson-split 'd.features' \
	| ndjson-map 'd.properties' \
	| ndjson-map '{neighborhood: d.neighborho, grade: d.holc_grade, temperature: d.mean}' \
	| ndjson-reduce \
	> $@