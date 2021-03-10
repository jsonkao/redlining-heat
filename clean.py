import sys

print(
    sys.stdin.readlines()[1][3:-3].replace("id=", '"id":').replace("mean=", '"mean":')
)
