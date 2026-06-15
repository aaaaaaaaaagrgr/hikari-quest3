# -*- coding: utf-8 -*-
"""
ヒカリの伝説III 新素材切り出し（赤グリッド2x2シート → 透過PNG → hikari-quest3/assets/）
"""
import os
from collections import deque
import numpy as np
from PIL import Image

SRC = r"C:\Users\kaite\Documents\Codex\2026-06-11\create-one-1024x1024-png-image-style\outputs"
OUT = r"C:\Users\kaite\hikari-quest3\assets"
os.makedirs(OUT, exist_ok=True)

# (ファイル, 行, 列, [セル名], 最大辺)
SHEETS = [
  ("retro_jrpg_sprite_sheet.png", 2, 2,
   ["kota_front", "kota_back", "kota_side", "kirie"], 300),
  ("evil_monster_orchestra_boss_sheet.png", 2, 2,
   ["lyrica", "donga", "fagor", "bariton"], 340),
  ("conductor_dragon_goddess_emblem_sheet.png", 2, 2,
   ["nocturne", "nocturne2", "eden", "logo3"], 360),
]
FLIP_H = set()   # side素材は左向き指定どおり → 反転不要

def red_mask(arr):
    r,g,b = arr[...,0].astype(int), arr[...,1].astype(int), arr[...,2].astype(int)
    return (r>150) & (g<105) & (b<105)

def line_groups(frac, thresh=0.4):
    hot = frac > thresh
    groups, i, n = [], 0, len(hot)
    while i < n:
        if hot[i]:
            j = i
            while j < n and hot[j]: j += 1
            groups.append((i, j-1)); i = j
        else:
            i += 1
    return groups

def cell_bands(arr, axis, count):
    # 赤い線を「区切り」とみなし、その間（および両端）の非赤スパンをセルとする。
    # 外枠の赤が有っても無くても動く。
    rm = red_mask(arr)
    frac = rm.mean(axis=1) if axis==0 else rm.mean(axis=0)
    groups = line_groups(frac)
    L = arr.shape[0] if axis==0 else arr.shape[1]
    spans, prev = [], 0
    for (s,e) in groups:
        if s-1 - prev > 10: spans.append((prev, s-1))
        prev = e+1
    if L-1 - prev > 10: spans.append((prev, L-1))
    if len(spans) == count:
        return spans
    # フォールバック: 最初と最後の赤の内側を等分
    lo = 0 if (not groups or groups[0][0] > 20) else groups[0][1]+1
    hi = L-1 if (not groups or groups[-1][1] < L-20) else groups[-1][0]-1
    span = (hi-lo)/count
    return [(int(lo+span*k), int(lo+span*(k+1))-1) for k in range(count)]

def make_transparent(cell):
    arr = np.array(cell.convert("RGBA"))
    h, w = arr.shape[:2]
    r,g,b = arr[...,0].astype(int), arr[...,1].astype(int), arr[...,2].astype(int)
    whiteish = (r>=232) & (g>=232) & (b>=232)
    bg_candidate = whiteish | red_mask(arr)
    visited = np.zeros((h,w), bool)
    dq = deque()
    for x in range(w):
        for y in (0, h-1):
            if bg_candidate[y,x] and not visited[y,x]:
                visited[y,x]=True; dq.append((y,x))
    for y in range(h):
        for x in (0, w-1):
            if bg_candidate[y,x] and not visited[y,x]:
                visited[y,x]=True; dq.append((y,x))
    while dq:
        y,x = dq.popleft()
        for dy,dx in ((1,0),(-1,0),(0,1),(0,-1)):
            ny,nx = y+dy, x+dx
            if 0<=ny<h and 0<=nx<w and not visited[ny,nx] and bg_candidate[ny,nx]:
                visited[ny,nx]=True; dq.append((ny,nx))
    arr[visited, 3] = 0
    return Image.fromarray(arr, "RGBA")

def trim(img):
    arr = np.array(img)
    ys, xs = np.where(arr[...,3] > 8)
    if len(xs)==0: return img
    pad = 2
    x0,x1 = max(0,xs.min()-pad), min(arr.shape[1], xs.max()+pad+1)
    y0,y1 = max(0,ys.min()-pad), min(arr.shape[0], ys.max()+pad+1)
    return img.crop((x0,y0,x1,y1))

def cap(img, maxside):
    w,h = img.size
    m = max(w,h)
    if m > maxside:
        s = maxside/m
        img = img.resize((round(w*s), round(h*s)), Image.LANCZOS)
    return img

def save(img, name):
    img.save(os.path.join(OUT, name+".png"))
    print(f"  -> {name}.png  {img.size}")

for rel, rows, cols, names, maxside in SHEETS:
    src = os.path.join(SRC, rel)
    print(f"[sheet] {rel} -> {names}")
    im = Image.open(src).convert("RGB")
    arr = np.array(im)
    rb = cell_bands(arr, 0, rows)
    cb = cell_bands(arr, 1, cols)
    idx = 0
    for (ry0,ry1) in rb:
        for (cx0,cx1) in cb:
            if idx >= len(names): continue
            inset = 4
            cell = im.crop((cx0+inset, ry0+inset, cx1-inset, ry1-inset))
            t = cap(trim(make_transparent(cell)), maxside)
            if names[idx] in FLIP_H:
                t = t.transpose(Image.FLIP_LEFT_RIGHT)
            save(t, names[idx])
            idx += 1

print("DONE")
