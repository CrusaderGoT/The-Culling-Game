c = [1, 2, 3, 5, 6]
pv = 4
vl = 1
e = vl - pv

b = e if e > 0 else 0

a = c[:b]

print(a, vl - pv, b)
