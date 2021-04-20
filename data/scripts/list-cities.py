"""List all cities"""

import sys, json

geojson = json.loads("".join(sys.stdin.readlines()))
locations = [f["properties"] for f in geojson["features"]]

groups = ["Manhattan,Bronx,Queens,Brooklyn", "St. Louis,East St. Louis"]
cities = groups + [loc["city"] for loc in locations if loc["city"] not in ''.join(groups)]

for i, city in enumerate(cities):
    # Ignore intentional groupings
    if "," in city:
        continue
    states = []
    for loc in locations:
        if loc["city"] == city:
            states.append(loc["state"])
    if len(states) != 1:
        print(city, states, file=sys.stderr)
        if len(states) == 0:
            print("  Possible matches:")
            for word in city.split(" "):
                for loc in locations:
                    if word in loc["city"]:
                        print("  -", loc["city"], loc["state"], file=sys.stderr)

print(" ".join(c.replace(" ", "_") for c in cities))
print(len(cities))
