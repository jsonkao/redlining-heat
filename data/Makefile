temperatures.json: meanTemperatureTask.json Makefile
	cat $< \
	| ndjson-split 'd.features' \
	| ndjson-map 'd.properties' \
	| ndjson-map '{id: d.neighborho, temperature: d.mean, holc_grade: d.holc_grade}' \
	| ndjson-map 'd.temperature = +(Math.round(d.temperature + "e+2") + "e-2"), d' \
	| ndjson-reduce \
	> $@
