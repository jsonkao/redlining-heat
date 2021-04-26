"""
Aggregate frequency histogram to one value.
Currently only used for tree cover task export.
"""

import sys
import json

for line in sys.stdin:
    data = json.loads(line)
    pixel_count = 0  # Track total count of pixels in feature
    weighted_sum = 0  # Track weighted sum of percentages
    hist = data["histogram"]
    if len(hist) == 0:
        continue
    for pct in hist:
        pixel_count += hist[pct]
        weighted_sum += int(pct) * hist[pct]
    print(
        json.dumps({"id": data["id"], "prop_tree": round(weighted_sum / pixel_count / 100, 5)})
    )
