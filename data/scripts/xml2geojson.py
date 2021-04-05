"""
Convert OSM style XML into GeoJSON
"""

import json
import sys

with open(sys.argv[1]) as f:
    # Skip irrelevant metadata lines
    while "<way" not in next(f):
        pass

    geojson = {"type": "FeatureCollection", "features": []}
    coordinates = []
    is_highway = False

    for line in f:
        # If we close a way, flush it and reset
        if "</way" in line:
            is_polygon = coordinates[0] == coordinates[-1] and not is_highway
            if is_polygon:
                coordinates = [coordinates]
            geojson["features"].append(
                {
                    "type": ["LineString", "Polygon"][is_polygon],
                    "coordinates": coordinates,
                }
            )
            coordinates = []
            is_highway = False

        # Add node coordinates
        if "<nd" in line:
            split = line.split('"')
            coordinates.append([float(split[-2]), float(split[-4])])  # lon, lat

        # Check if highway, if not already
        elif not is_highway and '<tag k="highway"' in line:
            is_highway = True

    print(json.dumps(geojson))