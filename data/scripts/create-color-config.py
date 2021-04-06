"""
Creates a color configuration file for GDAL color relief generation.
Masks nv pixels and calculates min/mean/max.
"""

from osgeo.gdal import Warp
from pathlib import Path
import numpy as np
import sys

tempTifName = sys.argv[1]
stem = Path(tempTifName).stem
[city, year] = stem.replace('_', ' ').split('-')

# Cut temperature data according to city boundary
ds = Warp(
    "",
    tempTifName,
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
print(f'{values.min()} 0 0 255 255')
print(f'{values.mean()} 255 255 255 255')
print(f'{values.max()} 255 0 0 255')
print('nv 236 236 236 255')