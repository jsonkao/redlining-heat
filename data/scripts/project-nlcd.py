"""
NLCD files require strict projection to dst transform and dst CRS.
First, I will project to WGS84 and then run the normal project.
Later, I will see if the steps can be combined.
"""

from pathlib import Path
import numpy as np
import rasterio
from rasterio.warp import reproject
import sys

input_name = sys.argv[1]
output_name = sys.argv[2]

fname_components = Path(input_name).stem.replace("_", " ").split("-")
try:
    assert "," in fname_components[-1]
    int(fname_components[-1].split(",")[0])  # CITY-1,10
    city = "-".join(fname_components[:-1])
except:  # CITY
    city = "-".join(fname_components)

temp_name = f"./gee-temperatures/{city}-2000.tif"

def combine_meta(f1, f2):
    """Combine metadata of two files but keep count of input"""
    count = f1.meta['count']
    output = f1.meta | f2.meta
    output['count'] = count
    return output

with rasterio.open(temp_name) as temp_file, rasterio.open(
    input_name
) as nlcd_file, rasterio.open(
    output_name, "w", **combine_meta(nlcd_file, temp_file)
) as out_file:
    for i in range(1, nlcd_file.count + 1):
        reproject(
            source=rasterio.band(nlcd_file, i),
            destination=rasterio.band(out_file, i),
            src_transform=nlcd_file.transform,
            src_crs=nlcd_file.crs,
            dst_transform=temp_file.transform,
            dst_crs=temp_file.crs,
            dst_resolution=temp_file.shape,
        )
