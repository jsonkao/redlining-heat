"""
Creates a color configuration file for GDAL color relief generation.
Masks nv pixels and calculates min/mean/max.
"""

from osgeo.gdal import Warp
from pathlib import Path
import rasterio
import kmeans1d
import numpy as np
import sys
import os

script_name = sys.argv[0]  # Self
tif_name = sys.argv[1]  # Input TIF
out_file = sys.argv[2]  # Output text file name
label_file = sys.argv[3]  # Output labels PNG name

bin_arg = [a for a in sys.argv if "--bins" in a]

stem = Path(tif_name).stem
city = stem.replace("_", " ").rsplit("-", 1)[0]

# Cut temperature data according to city boundary
ds = Warp(
    "",
    tif_name,
    format="VRT",
    cutlineDSName="./city-boundaries.json",
    cutlineWhere=f"city = '{city}'",
    cropToCutline=True,
)

# Get temperature band
band = ds.GetRasterBand(1)

# Mask band according to NoData values
values = np.ma.masked_equal(band.ReadAsArray(), band.GetNoDataValue())
img_shape = values.shape
mask = values.mask

# Bins and percentiles
def hsv_to_rgb(h, s, v):
    """Source: stackoverflow.com/a/26856771"""
    if s == 0.0:
        v *= 255
        return (v, v, v)
    i = int(h * 6.0)  # XXX assume int() truncates!
    f = (h * 6.0) - i
    p, q, t = (
        int(255 * (v * (1.0 - s))),
        int(255 * (v * (1.0 - s * f))),
        int(255 * (v * (1.0 - s * (1.0 - f)))),
    )
    v *= 255
    i %= 6
    if i == 0:
        return (v, t, p)
    if i == 1:
        return (q, v, p)
    if i == 2:
        return (p, v, t)
    if i == 3:
        return (p, q, v)
    if i == 4:
        return (t, p, v)
    if i == 5:
        return (v, p, q)


def seq_colors(n, hue=0):
    """Generate n sequential colors (whitish to a saturated hue)"""
    # Initial (white) and final (saturated hue) values
    sat_i = 0.65
    sat_f = 0
    val_i = 0.84
    val_f = 0.98
    return [
        (
            hue,
            sat_i + i * (sat_f - sat_i) / (n - 1),
            val_i + i * (val_f - val_i) / (n - 1),
        )
        for i in range(n)
    ]


bins = int(bin_arg[0].split("=")[-1])

h1 = 1 / 2
h2 = 1 / 6
h3 = 5 / 6
if "--diverging" in sys.argv:
    if bins % 2 == 1:
        n_seq = int((bins + 1) / 2)
        colors = seq_colors(n_seq, hue=h1)[:-1] + seq_colors(n_seq, hue=h2)[::-1]
    else:
        n_seq = int(bins / 2) + 1
        colors = seq_colors(n_seq, hue=h1)[:-1] + seq_colors(n_seq, hue=h2)[:-1][::-1]
else:
    colors = seq_colors(bins, hue=h3)[::-1]

values = values.compressed()
bounds = []

# Get clusters
clusters, _ = kmeans1d.cluster(values, bins)
clusters = np.array(clusters)
for i in range(bins):
    cluster = values[clusters == i]
    bounds.append((np.min(cluster), np.max(cluster)))

# Generate labels
ci = 0;
labels = np.zeros(img_shape, dtype=np.uint8)
for r in range(img_shape[0]):
    for c in range(img_shape[1]):
        if mask[r, c]:
            labels[r, c] = bins
        else:
            labels[r, c] = clusters[ci]
            ci += 1
with open(label_file, "wb") as f:
    f.write(img_shape[0].to_bytes(2, sys.byteorder))
    f.write(img_shape[1].to_bytes(2, sys.byteorder))
    f.write(labels.tobytes())

# Output colors
with open(out_file, "w") as f:
    for i in range(bins):
        lwr, upr = bounds[i]
        color = " ".join(str(v) for v in hsv_to_rgb(*colors[i])) + " 255"
        if len(bin_arg) > 0:
            f.write(f"{lwr} {color}\n")
            f.write(f"{upr} {color}\n")
        else:
            f.write(f"{[ upr, lwr ][i > 0]} {color}\n")
    f.write("nv 236 236 236 255\n")
