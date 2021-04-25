"""
Creates a color configuration file for GDAL color relief generation.
Masks nv pixels and calculates min/mean/max.
"""

from osgeo.gdal import Warp
from pathlib import Path
import kmeans1d
import numpy as np
import sys
import os

script_name = sys.argv[0]  # Self
tif_name = sys.argv[1]
out_file = sys.argv[3]

bin_arg = [a for a in sys.argv if "--bins" in a]
if "--nocalc" in sys.argv:
    # We're here because we modified this script, not any temperature values,
    # so I'm probably just trying to change the color scheme.
    # Just rewrite the file with these new values:
    with open(out_file) as f:
        lines = f.readlines()
    colors = [
        "0   255 255 255",  # max is 180° (#00FFFF)
        "255 255 255 255",  # median is saturation 0 (white)
        "255 0   0   255",  # min is hue angle 0° (#FF0000)
    ]
    for i, c in enumerate(colors):
        lines[i] = lines[i].split(" ")[0] + f" {c}\n"
    with open(out_file, "w") as f:
        f.write("".join(lines))
    sys.exit(0)

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
    # TODO: variabilize this stuff
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


if len(bin_arg) > 0:
    bins = int(bin_arg[0].split("=")[-1])
    assert bins % 2 == 1
else:
    bins = 7

if "--diverging" in sys.argv:
    n_seq = int((bins + 1) / 2)
    colors = seq_colors(n_seq, hue=1 / 3)[:-1] + seq_colors(n_seq, hue=0)[::-1]
else:
    colors = seq_colors(bins)[::-1]
print(colors)
values = values.compressed()
bounds = []
if "--quantile" in sys.argv:
    percentiles = np.percentile(values, [b / bins * 100 for b in range(bins + 1)])
    for i in range(bins):
        bounds.append((percentiles[i], percentiles[i + 1] - 0.1))
else:
    clusters, _ = kmeans1d.cluster(values, bins)
    clusters = np.array(clusters)
    for i in range(bins):
        cluster = values[clusters == i]
        bounds.append((np.min(cluster), np.max(cluster)))

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
