"""
Validate existence and uniqueness of city names I put in the Makefile.
Uniqueness/existence issues are fixed by modifying the shapefile directly :(
"""

import sys, json

geojson = json.loads("".join(sys.stdin.readlines()))
locations = [f["properties"] for f in geojson["features"]]

for city in sys.argv[1:]:
    # Ignore intentional groupings
    if "," in city:
        continue
    city = city.replace("_", " ")
    states = []
    for loc in locations:
        if loc["city"] == city:
            states.append(loc["state"])
    if len(states) != 1:
        print(city, states)
    if len(states) == 0:
        print('  Possible matches:')
        for word in city.split(" "):
            for loc in locations:
                if word in loc["city"]:
                    print('  -', loc["city"], loc["state"])
