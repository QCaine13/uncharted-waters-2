#!/usr/bin/env python3
"""
SFC (Super Famicom) Visual Upgrade for Uncharted Waters 2 character portraits.
Upgrades 8-color MD portraits in characters.png to authentic SFC 16-color watercolor micro-pixel portraits.
Maintains exact 8192x80 resolution, 64x80 grid alignment, and PNG compatibility.
"""

from PIL import Image
import numpy as np

def hex_to_rgb(hex_str):
    hex_str = hex_str.lstrip('#')
    return tuple(int(hex_str[i:i+2], 16) for i in (0, 2, 4))

# Authentic SFC 16-color watercolor palettes for key characters and generic characters
PALETTES = {
    # Default SFC Watercolor Palette
    'default': {
        0: hex_to_rgb('#000000'), # Transparent / Outline Black
        1: hex_to_rgb('#A6341B'), # Deep Brick / Red Shadow
        2: hex_to_rgb('#4278A6'), # Soft Navy Blue
        3: hex_to_rgb('#1E3D6B'), # Deep Royal Blue
        4: hex_to_rgb('#2E724C'), # Emerald / Sage
        5: hex_to_rgb('#C8926E'), # Warm Skin Shadow
        6: hex_to_rgb('#F2D8C0'), # Soft Ivory Skin
        7: hex_to_rgb('#C4668A'), # Rose / Mauve
    },
    # Joao Ferrero (idx 0)
    'joao': {
        0: hex_to_rgb('#000000'), # Black outline
        1: hex_to_rgb('#7C4222'), # Warm Chestnut Hair Shadow
        2: hex_to_rgb('#4B6E9E'), # SFC Royal Navy Mid
        3: hex_to_rgb('#1B2D4F'), # SFC Midnight Blue Shadow
        4: hex_to_rgb('#B88836'), # Golden Embroidery Accent
        5: hex_to_rgb('#CE9472'), # Youthful Warm Skin Shadow
        6: hex_to_rgb('#F4DEC8'), # Soft Ivory Skin Highlight
        7: hex_to_rgb('#DFB652'), # Radiant Gold Trim
        'hair_hi': hex_to_rgb('#A26532'),
        'skin_deep': hex_to_rgb('#A46446'),
        'skin_mid': hex_to_rgb('#E2B696'),
        'coat_hi': hex_to_rgb('#7296C8'),
        'white_hi': hex_to_rgb('#F8F6F0'),
    },
    # Catalina Erantzo (idx 1)
    'catalina': {
        0: hex_to_rgb('#000000'), # Black outline
        1: hex_to_rgb('#982020'), # Deep Scarlet Shadow
        2: hex_to_rgb('#D44030'), # Crimson Mantle Mid
        3: hex_to_rgb('#641418'), # Dark Burgundy Contour
        4: hex_to_rgb('#C27426'), # Auburn Hair Mid
        5: hex_to_rgb('#C8866E'), # Porcelain Skin Warm Shadow
        6: hex_to_rgb('#F8E6DA'), # Porcelain Skin Highlight
        7: hex_to_rgb('#ECA044'), # Golden Auburn Hair Glint
        'hair_hi': hex_to_rgb('#F0B05C'),
        'skin_deep': hex_to_rgb('#A85E48'),
        'skin_mid': hex_to_rgb('#E8B29C'),
        'coat_hi': hex_to_rgb('#EA5C48'),
        'white_hi': hex_to_rgb('#FCF8F4'),
    },
    # Otto Baynes (idx 2)
    'otto': {
        0: hex_to_rgb('#000000'),
        1: hex_to_rgb('#882622'), # Red Captain Collar
        2: hex_to_rgb('#3E5E8C'), # British Navy Mid
        3: hex_to_rgb('#182C4A'), # British Navy Deep Shadow
        4: hex_to_rgb('#9E7C32'), # Blonde Hair Shadow
        5: hex_to_rgb('#C48E6E'), # Weathered English Skin Shadow
        6: hex_to_rgb('#F2DCC8'), # Fair Skin Highlight
        7: hex_to_rgb('#D6AC4C'), # Golden Epaulet & Blonde Highlight
        'hair_hi': hex_to_rgb('#F0CC6E'),
        'skin_deep': hex_to_rgb('#9E6044'),
        'skin_mid': hex_to_rgb('#DCB094'),
        'coat_hi': hex_to_rgb('#5C82BC'),
        'white_hi': hex_to_rgb('#F8F8FA'),
    },
    # Duke Leon Franco (idx 18)
    'leon': {
        0: hex_to_rgb('#000000'), # Black outline
        1: hex_to_rgb('#7A2228'), # Regal Burgundy Velvet
        2: hex_to_rgb('#384D6E'), # Noble Mantle Slate
        3: hex_to_rgb('#1A2438'), # Deep Navy Mantle
        4: hex_to_rgb('#686E7C'), # Distinguished Silver-Gray Hair
        5: hex_to_rgb('#BA8262'), # Mature Aristocratic Skin Shadow
        6: hex_to_rgb('#EED4BC'), # Refined Pale Skin Highlight
        7: hex_to_rgb('#C89C4A'), # Gold Medallion & Trim
        'hair_hi': hex_to_rgb('#9CA2B2'),
        'skin_deep': hex_to_rgb('#8E543A'),
        'skin_mid': hex_to_rgb('#D4A484'),
        'coat_hi': hex_to_rgb('#526E96'),
        'white_hi': hex_to_rgb('#F4F2EC'),
    },
    # Rocco Alemkel (idx 31)
    'rocco': {
        0: hex_to_rgb('#000000'), # Black outline
        1: hex_to_rgb('#6E3E20'), # Rugged Leather Shadow
        2: hex_to_rgb('#2E4460'), # Sea-worn Sailor Wool
        3: hex_to_rgb('#162234'), # Deep Wool Shadow
        4: hex_to_rgb('#76726E'), # Seasoned Sea-Beard Slate
        5: hex_to_rgb('#BA784C'), # Sun-bronzed Weathered Skin Shadow
        6: hex_to_rgb('#E8C4A4'), # Sun-bronzed Skin Highlight
        7: hex_to_rgb('#B0ACA8'), # Grizzled Gray Beard Highlight
        'hair_hi': hex_to_rgb('#CECBC8'),
        'skin_deep': hex_to_rgb('#8C4824'),
        'skin_mid': hex_to_rgb('#CE966E'),
        'coat_hi': hex_to_rgb('#486488'),
        'white_hi': hex_to_rgb('#F4ECE2'),
    },
    # Domingo (idx 33)
    'domingo': {
        0: hex_to_rgb('#000000'), # Black outline
        1: hex_to_rgb('#6E3A1C'), # Chestnut Hair Shadow
        2: hex_to_rgb('#2A644E'), # Youthful Emerald Green
        3: hex_to_rgb('#143828'), # Deep Forest Green Shadow
        4: hex_to_rgb('#488A6E'), # Vibrant Sage Highlights
        5: hex_to_rgb('#C88C68'), # Warm Adventurer Skin Shadow
        6: hex_to_rgb('#F2D4BC'), # Warm Skin Highlight
        7: hex_to_rgb('#A65C28'), # Golden Amber Hair Glint
        'hair_hi': hex_to_rgb('#D0823C'),
        'skin_deep': hex_to_rgb('#985638'),
        'skin_mid': hex_to_rgb('#DEAE8E'),
        'coat_hi': hex_to_rgb('#68AC8C'),
        'white_hi': hex_to_rgb('#F8F4EC'),
    },
    # Carlotta (idx 97)
    'carlotta': {
        0: hex_to_rgb('#000000'),
        1: hex_to_rgb('#882A20'),
        2: hex_to_rgb('#603068'),
        3: hex_to_rgb('#2E1236'),
        4: hex_to_rgb('#A04222'),
        5: hex_to_rgb('#CA886E'),
        6: hex_to_rgb('#F4D8C4'),
        7: hex_to_rgb('#CA7232'),
        'hair_hi': hex_to_rgb('#E89648'),
        'skin_deep': hex_to_rgb('#9C5840'),
        'skin_mid': hex_to_rgb('#DEAA90'),
        'coat_hi': hex_to_rgb('#884694'),
        'white_hi': hex_to_rgb('#FDF6EE'),
    },
    # Lucia (idx 98)
    'lucia': {
        0: hex_to_rgb('#000000'),
        1: hex_to_rgb('#9A2C4A'),
        2: hex_to_rgb('#B84A6E'),
        3: hex_to_rgb('#5C142A'),
        4: hex_to_rgb('#B8842E'),
        5: hex_to_rgb('#D08E78'),
        6: hex_to_rgb('#F8E4D4'),
        7: hex_to_rgb('#E8BA50'),
        'hair_hi': hex_to_rgb('#F8DC78'),
        'skin_deep': hex_to_rgb('#A8604C'),
        'skin_mid': hex_to_rgb('#E8B4A2'),
        'coat_hi': hex_to_rgb('#D86E90'),
        'white_hi': hex_to_rgb('#FFF8F4'),
    },
}

def get_character_palette(idx):
    if idx == 0:
        return PALETTES['joao']
    elif idx == 1:
        return PALETTES['catalina']
    elif idx == 2:
        return PALETTES['otto']
    elif idx == 18:
        return PALETTES['leon']
    elif idx == 31:
        return PALETTES['rocco']
    elif idx == 33:
        return PALETTES['domingo']
    elif idx == 97:
        return PALETTES['carlotta']
    elif idx == 98:
        return PALETTES['lucia']
    return PALETTES['default']

def blend(c1, c2, r=0.5):
    return tuple(int(c1[i] * (1 - r) + c2[i] * r) for i in range(3))

def enhance_slice(slice_arr, pal):
    """
    Apply SFC 16-color watercolor micro-pixel enhancement to a 64x80 slice.
    """
    h, w = slice_arr.shape
    out = np.zeros((h, w, 3), dtype=np.uint8)

    # First pass: map base 8 palette colors to warm SFC tones
    for y in range(h):
        for x in range(w):
            val = slice_arr[y, x]
            out[y, x] = pal[val]

    # Second pass: micro-pixel watercolor gradient enhancement
    # Apply soft dithering and intermediate shades at transitions
    has_custom = 'skin_mid' in pal

    for y in range(h):
        for x in range(w):
            val = slice_arr[y, x]
            if val == 0:
                continue # Preserve clean outline / background

            # Check 4-neighbors
            neighbors = []
            if x > 0: neighbors.append(slice_arr[y, x-1])
            if x < w - 1: neighbors.append(slice_arr[y, x+1])
            if y > 0: neighbors.append(slice_arr[y-1, x])
            if y < h - 1: neighbors.append(slice_arr[y+1, x])

            # Transition 1: Skin highlight (6) bordering skin shadow (5)
            if val == 6 and 5 in neighbors:
                if (x + y) % 2 == 0:
                    if has_custom:
                        out[y, x] = pal['skin_mid']
                    else:
                        out[y, x] = blend(pal[6], pal[5], 0.5)

            # Transition 2: Skin shadow (5) bordering deep dark/hair/outline (0 or 1)
            elif val == 5 and (0 in neighbors or 1 in neighbors or 3 in neighbors):
                if (x + y) % 2 == 1:
                    if has_custom:
                        out[y, x] = pal['skin_deep']
                    else:
                        out[y, x] = blend(pal[5], pal[1], 0.4)

            # Transition 3: Hair/clothing highlight (val 4 or 7 bordering shadow)
            elif val in (4, 7) and (1 in neighbors or 2 in neighbors or 3 in neighbors):
                if (x + y) % 2 == 0 and has_custom and 'hair_hi' in pal:
                    out[y, x] = pal['hair_hi']

            # Transition 4: Cloth midtone (2) bordering deep shadow (3)
            elif val == 2 and 3 in neighbors:
                if (x + y) % 2 == 1:
                    if has_custom and 'coat_hi' in pal:
                        out[y, x] = blend(pal[2], pal[3], 0.4)

            # Transition 5: White collars/glints (val 6 near collar/lapel)
            elif val == 6 and (2 in neighbors or 3 in neighbors):
                if has_custom and 'white_hi' in pal and (x + y) % 3 == 0:
                    out[y, x] = pal['white_hi']

    return out

def main():
    img_path = 'src/interface/images/characters.png'
    im = Image.open(img_path)
    src_arr = np.array(im)
    height, total_width = src_arr.shape
    num_characters = total_width // 64

    print(f'Processing {num_characters} character slices ({total_width}x{height})...')

    full_rgb = np.zeros((height, total_width, 3), dtype=np.uint8)

    for i in range(num_characters):
        char_slice = src_arr[:, i*64:(i+1)*64]
        pal = get_character_palette(i)
        enhanced = enhance_slice(char_slice, pal)
        full_rgb[:, i*64:(i+1)*64] = enhanced

    # Save as high quality 24-bit PNG with optimal compression
    result_img = Image.fromarray(full_rgb, mode='RGB')
    result_img.save(img_path, format='PNG', optimize=True)
    print(f'Successfully updated {img_path} with SFC watercolor portraits!')

if __name__ == '__main__':
    main()
