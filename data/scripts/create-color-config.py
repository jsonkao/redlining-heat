"""
Creates a color configuration file for GDAL color relief generation.
Masks nv pixels and calculates min/mean/max.
"""

from osgeo.gdal import Warp
from pathlib import Path
import numpy as np
import sys
import os

script_name = sys.argv[0]  # Self
tif_name = sys.argv[1]
out_file = sys.argv[3]

if os.path.getmtime(out_file) > os.path.getmtime(tif_name):
    # We're here because we modified this script, not any temperature values,
    # so I'm probably just trying to change the color scheme.

stem = Path(tif_name).stem
[city, year] = stem.replace("_", " ").rsplit("-", 1)

# Cut temperature data according to city boundary
ds = Warp(
    "",
    tif_name,
    format="VRT",
    cutlineDSName=sys.argv[2],
    cutlineWhere=f"city = '{city}'",
    cropToCutline=True,
)

# Get temperature band
band = ds.GetRasterBand(1)

# Mask band according to NoData values
values = np.ma.masked_equal(band.ReadAsArray(), band.GetNoDataValue())

# Write out a color file based on valid values
with open(out_file, 'w') as f:
    f.write(f"{values.min()} 0 0 255 255\n")
    f.write(f"{values.mean()} 255 255 255 255\n")
    f.write(f"{values.max()} 255 0 0 255\n")
    f.write("nv 236 236 236 255\n")
