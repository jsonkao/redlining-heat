"""
Convert OSM style XML into GeoJSON
"""

import json
import sys

sys.stdout.write('{"type":"FeatureCollection","features":[')

with open(sys.argv[1]) as f:
    # Skip irrelevant metadata lines
    while "<way" not in next(f):
        pass

    coords = ""  # Coordinates of each geometry
    is_highway = False  # Tracked for each way
    is_first_way = True  # Tracked for printing commas

    for line in f:
        # If we close a way, flush it and reset
        if "</way" in line:
            coords = "[" + coords[:-1] + "]"
            if not is_highway:
                coords = "[" + coords + "]"
            sys.stdout.write(
                [",", ""][is_first_way]
                + '{"type":"Feature","properties":null,"geometry":{"type":'
                + ['"Polygon"', '"LineString"'][is_highway]
                + ',"coordinates":'
                + coords
                + "}}"
            )
            is_first_way = False
            coords = ""
            is_highway = False

        # Add coordinates from node
        elif "<nd" in line:
            split = line.split('"')
            coords += "[" + split[-2] + "," + split[-4] + "],"

        # Check if highway, if not already
        elif not is_highway and '<tag k="highway"' in line:
            is_highway = True

    sys.stdout.write("]}")
