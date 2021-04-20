"""
Generate a PROJ4 string for a local Albers projection.
"""

from osgeo.gdal import Warp, Open
from pathlib import Path
import json
import sys

input_name = sys.argv[1]
output_name = sys.argv[2]

# Get geographic extent (bbox)
fname_components = Path(input_name).stem.replace("_", " ").split("-")
try:
    int(fname_components[-1])
    city = "-".join(fname_components[:-1])
except:
    # Not a year
    city = "-".join(fname_components)

with open("city-bbox-index.json") as f:
    [xmin, ymin, xmax, ymax] = json.load(f)[city]

# Calculate standard parallels and central meridian
# https://desktop.arcgis.com/en/arcmap/10.3/guide-books/map-projections/albers-equal-area-conic.htm
one_sixth_range = (ymax - ymin) / 6
sp1 = ymin + one_sixth_range
sp2 = ymin - one_sixth_range
central_meridian = (xmin + xmax) / 2
latitude_of_origin = (ymin + ymax) / 2

# Make proj string
proj_string = (
    f"+proj=aea +lon_0={central_meridian} +lat_1={sp1} +lat_2={sp2} "
    f"+lat_0={latitude_of_origin} +datum=WGS84 +units=m +no_defs"
)

# Callback function for keeping track of progress
def progress_callback(complete, message, unknown):
    pct = round(complete * 100)
    if pct % 50 == 0:
        print(f"[{output_name}] {pct}%")


# Either just print the proj string, or complete the warp
if output_name == "--proj4":
    sys.stdout.write(proj_string)
else:
    Warp(
        output_name,
        input_name,
        width=sys.argv[3],
        height=0,
        dstSRS=proj_string,
        # resampleAlg="bilinear",
        callback=progress_callback,
    )
