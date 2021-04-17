"""
Runs a statistical test comparing impervious surfaces with temperature
in a particular city.
"""

from osgeo.gdal import Warp
from pathlib import Path
import numpy as np
import sys

temp_file = sys.argv[1]
[city, year] = Path(temp_file).stem.replace("_", " ").split("-")
imp_file = sys.argv[2]

# Cut temperature data according to city boundary
ds_temp = Warp(
    "",
    temp_file,
    format="VRT",
    cutlineDSName=sys.argv[3],
    cutlineWhere=f"city = '{city}'",
    cropToCutline=True,
)

# Cut impervious surfaces data according to city boundary
ds_imp = Warp(
    "",
    imp_file,
    format="VRT",
    cutlineDSName=sys.argv[3],
    cutlineWhere=f"city = '{city}'",
    cropToCutline=True,
    dstNodata=0
)

# Get bands. For temperature data, mask band according to NoData values
temp_band = ds_temp.GetRasterBand(1)
temp_values = np.ma.masked_equal(temp_band.ReadAsArray(), temp_band.GetNoDataValue())
imp_band = ds_imp.GetRasterBand(1)
imp_values = np.ma.masked_equal(imp_band.ReadAsArray(), imp_band.GetNoDataValue())

temp_values.mask = np.ma.mask_or(temp_values.mask, imp_values.mask)
print(temp_values.mask[100])
temp_values.mask = np.ma.mask_or(temp_values.mask, ~imp_values.mask)
print(temp_values.mask[100])
# why is the second mask still all masked
