data/temperatures.json: data/meanTemperatureTask.json Makefile
	cat $< \
	| ndjson-split 'd.features' \
	| ndjson-map 'd.properties' \
	| ndjson-map '{neighborhood: d.neighborho, grade: d.holc_grade, temperature: d.mean}' \
	| ndjson-map 'd.temperature = +(Math.round(d.temperature + "e+2") + "e-2"), d' \
	| ndjson-reduce \
	> $@