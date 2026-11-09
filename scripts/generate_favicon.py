import os
from PIL import Image, ImageDraw

os.makedirs('frontend/public', exist_ok=True)
os.makedirs('frontend/app', exist_ok=True)

svg_content = """<svg width="36" height="36" viewBox="0 0 36 36" fill="none" xmlns="http://www.w3.org/2000/svg">
  <rect width="36" height="36" rx="9" fill="#111111" />
  <path d="M25 11C25 11 20 10 16 13C12 16 13 20 18 21C23 22 24 25 20 27C16 29 11 27 11 27" stroke="#FFFFFF" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" />
  <circle cx="25" cy="11" r="2.75" fill="#FFDF00" />
  <circle cx="11" cy="27" r="2.75" fill="#FFDF00" />
  <circle cx="18" cy="19" r="1.5" fill="#FFDF00" />
</svg>"""

with open('frontend/app/icon.svg', 'w', encoding='utf-8') as f:
    f.write(svg_content)
with open('frontend/public/icon.svg', 'w', encoding='utf-8') as f:
    f.write(svg_content)

sizes = [(16, 16), (32, 32), (48, 48), (64, 64)]
images = []
for w, h in sizes:
    img = Image.new('RGBA', (w, h), (0, 0, 0, 0))
    draw = ImageDraw.Draw(img)
    draw.rounded_rectangle([0, 0, w - 1, h - 1], radius=max(2, w // 4), fill='#111111')
    
    s = w / 36.0
    points = [
        (25*s, 11*s), (20*s, 10.5*s), (16*s, 13*s),
        (13*s, 16*s), (14*s, 19*s), (18*s, 21*s),
        (22*s, 22.5*s), (23*s, 25*s), (20*s, 27*s),
        (16*s, 28*s), (11*s, 27*s)
    ]
    draw.line(points, fill='#FFFFFF', width=max(1, int(2.5 * s)), joint='curve')
    draw.ellipse([25*s - 2.5*s, 11*s - 2.5*s, 25*s + 2.5*s, 11*s + 2.5*s], fill='#FFDF00')
    draw.ellipse([11*s - 2.5*s, 27*s - 2.5*s, 11*s + 2.5*s, 27*s + 2.5*s], fill='#FFDF00')
    draw.ellipse([18*s - 1.5*s, 19*s - 1.5*s, 18*s + 1.5*s, 19*s + 1.5*s], fill='#FFDF00')
    images.append(img)

images[0].save('frontend/public/favicon.ico', format='ICO', sizes=[(img.width, img.height) for img in images], append_images=images[1:])
images[0].save('frontend/app/favicon.ico', format='ICO', sizes=[(img.width, img.height) for img in images], append_images=images[1:])
print('Successfully generated icon files!')

