from PIL import Image, ImageDraw
from pathlib import Path

Path("icons").mkdir(exist_ok=True)

def lerp(a, b, t):
    return tuple(int(a[i] + (b[i] - a[i]) * t) for i in range(3))

def make(size, maskable=False):
    img = Image.new("RGB", (size, size), (5, 8, 26))
    d = ImageDraw.Draw(img)
    for y in range(size):
        d.line([(0, y), (size, y)], fill=lerp((20, 26, 68), (5, 8, 26), y / size))
    if not maskable:
        m = Image.new("L", (size, size), 0)
        ImageDraw.Draw(m).rounded_rectangle([0, 0, size-1, size-1], radius=int(size*.22), fill=255)
        bg = img.copy()
        img = Image.new("RGB", (size, size), (5, 8, 26))
        img.paste(bg, (0, 0), m)
        d = ImageDraw.Draw(img)
    sc = size / 100.0
    f = 0.60 if maskable else 1.0
    def P(pts):
        return [((50+(x-50)*f)*sc, (54+(y-56)*f)*sc) for x, y in pts]
    def B(x0, y0, x1, y1):
        return [(50+(x0-50)*f)*sc, (54+(y0-56)*f)*sc, (50+(x1-50)*f)*sc, (54+(y1-56)*f)*sc]
    for yy in (49, 57, 65):
        d.line([P([(3, yy)])[0], P([(17, yy)])[0]], fill=(0, 229, 255), width=max(1, int(sc*1.5)))
    d.polygon(P([(11,66),(13,57),(29,54),(36,46),(57,44),(73,54),(90,57),(92,66)]), fill=(255,45,85))
    d.polygon(P([(11,66),(13,57),(29,54),(36,46)]), fill=(255,122,24))
    d.polygon(P([(38,53),(45,47),(57,47),(65,53)]), fill=(20,45,66))
    d.polygon(P([(87,49),(95,47),(95,51),(88,53)]), fill=(139,21,56))
    d.polygon(P([(88,59),(93,60),(93,64),(88,63)]), fill=(255,243,176))
    for wx in (28, 73):
        d.ellipse(B(wx-9, 57, wx+9, 75), fill=(8,11,22))
        d.ellipse(B(wx-4.5, 61.5, wx+4.5, 70.5), fill=(159,178,200))
    d.rectangle(B(15, 70, 89, 72), fill=(0,229,255))
    return img

for s in (192, 512):
    make(s).save("icons/icon-%d.png" % s)
    make(s, True).save("icons/icon-%d-maskable.png" % s)
print("Icones OK")
