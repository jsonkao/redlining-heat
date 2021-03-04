import json
import sys

str_data = (
    sys.stdin.readlines()[1][3:-3]
    .replace("id=", '"id":')
    .replace("mean=", '"mean":')
)
print(str_data)
