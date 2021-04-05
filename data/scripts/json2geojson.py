"""
Convert OSM style JSON into GeoJSON
"""

import json
import sys

with open(sys.argv[1]) as f:
    elements = json.load(f)["elements"]


def get_geom(way):
    is_polygon = way["geometry"][0] == way["geometry"][-1]
    coordinates = [[d["lon"], d["lat"]] for d in way["geometry"]]
    if is_polygon:
        coordinates = [coordinates]
    return {"type": ["LineString", "Polygon"][is_polygon], "coordinates": coordinates}


geojson = {
    "type": "FeatureCollection",
    "features": [
        {
            "type": "Feature",
            "geometry": get_geom(way),
            "properties": way["tags"],
        }
        for way in elements
    ],
}

print(json.dumps(geojson))