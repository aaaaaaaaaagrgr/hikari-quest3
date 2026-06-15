# -*- coding: utf-8 -*-
# 町6つの新レイアウトを生成して JS リテラルを出力する（v2: 2作目と別デザイン）
WALK = set('.*_kKsS')

def blank(w, h, ground, border='T'):
    g = [[border if x == 0 or y == 0 or x == w-1 or y == h-1 else ground
          for x in range(w)] for y in range(h)]
    return g

def fill(g, x1, y1, x2, y2, ch):
    for y in range(y1, y2+1):
        for x in range(x1, x2+1):
            g[y][x] = ch

def house(g, x, y, roof):
    for i in range(4): g[y][x+i] = roof
    g[y+1][x] = 'W'; g[y+1][x+1] = 'n'; g[y+1][x+2] = 'n'; g[y+1][x+3] = 'W'
    g[y+2][x] = 'W'; g[y+2][x+1] = 'W'; g[y+2][x+2] = 'D'; g[y+2][x+3] = 'W'
    return (x+2, y+3)   # ドア前(立ち位置)

def exit2(g, x, y):
    g[y][x] = '>'; g[y][x+1] = '>'

def dump(name, g, npcs):
    rows = [''.join(r) for r in g]
    w = len(rows[0])
    assert all(len(r) == w for r in rows), name
    for nm, (x, y) in npcs.items():
        assert rows[y][x] in WALK, f"{name} npc {nm} ({x},{y}) on '{rows[y][x]}'"
    print(f'const {name} = [')
    for r in rows:
        print(f'"{r}",')
    print('];')
    for nm, (x, y) in npcs.items():
        print(f'// npc {nm}: ({x},{y})')
    print()

# ---- ミルテむら 22x14: 花の村の広場と池 ----
g = blank(22, 14, '.')
d_inn  = house(g, 2, 2, 'r')
d_shop = house(g, 16, 2, 'b')
fill(g, 9, 2, 11, 3, '~')                # 池
d_chur = house(g, 4, 8, 'r')
d_mont = house(g, 13, 8, 'r')
for (x, y) in [(8,5),(13,5),(7,6),(14,6),(10,6),(11,5),(2,11),(19,11),(9,10),(12,10)]:
    g[y][x] = '*'                        # 花
exit2(g, 10, 13)
dump('MILTE_TILES', g, {
  'inn': (4,5), 'shop': (18,5), 'church': (6,11), 'monta': (15,11),
  'oldwoman': (9,7), 'boy': (12,7), 'man': (8,11), 'woman': (16,7),
  'entry': (10,12),
})

# ---- 王都カンタービレ 28x18: 城＋じゅうたん大路＋庭園 ----
g = blank(28, 18, '.')
fill(g, 5, 1, 22, 6, 'B')                # 城壁
fill(g, 6, 2, 21, 5, '_')                # 城内
fill(g, 13, 2, 14, 16, 'k')              # じゅうたん大路（城内〜門〜出口）
g[6][13] = 'k'; g[6][14] = 'k'           # 門
fill(g, 2, 8, 4, 10, '*')                # 西庭園
fill(g, 23, 8, 25, 10, '*')              # 東庭園
fill(g, 9, 9, 10, 9, '~')                # 噴水
fill(g, 17, 9, 18, 9, '~')               # 噴水
d_inn  = house(g, 2, 12, 'r')
d_shop = house(g, 7, 12, 'r')
d_chur = house(g, 17, 12, 'b')
d_ranch= house(g, 22, 12, 'r')
exit2(g, 13, 17)
dump('CANTA_TILES', g, {
  'king': (13,3), 'ryuka': (11,3), 'mira': (16,3), 'sena': (18,3),
  'guardL': (12,7), 'guardR': (15,7), 'kirie1': (15,9),
  'inn': (4,15), 'shop': (9,15), 'church': (19,15), 'ranch': (24,15),
  'boy': (7,9), 'man': (20,10), 'entry': (13,16),
})

# ---- みなとまち ポルト 24x14: 南いちめんの海と桟橋 ----
g = blank(24, 14, '.')
d_inn  = house(g, 2, 2, 'r')
d_shop = house(g, 8, 2, 'b')
d_chur = house(g, 14, 2, 'r')
fill(g, 1, 9, 22, 12, '~')               # 海
fill(g, 11, 9, 12, 12, 'K')              # 中央桟橋
fill(g, 4, 9, 5, 10, 'K')                # 西桟橋
fill(g, 18, 9, 19, 10, 'K')              # 東桟橋
exit2(g, 11, 13)
dump('PORTO_TILES', g, {
  'inn': (4,5), 'shop': (10,5), 'church': (16,5), 'ranch': (3,7),
  'harbor': (11,8), 'kirie2': (16,6), 'old': (7,7), 'boy': (19,7), 'granny': (20,5),
  'entry': (11,12),
})

# ---- さばくのまち オアシア 20x13: 中央オアシス ----
g = blank(20, 13, 's')
d_inn  = house(g, 2, 2, 'r')
d_shop = house(g, 14, 2, 'b')
fill(g, 8, 5, 11, 7, '~')                # オアシス
d_chur = house(g, 2, 8, 'r')
d_ranch= house(g, 14, 8, 'r')
exit2(g, 9, 12)
dump('OASIA_TILES', g, {
  'inn': (4,5), 'shop': (16,5), 'church': (4,11), 'ranch': (16,11),
  'elder': (7,6), 'kirie3': (12,6), 'boy': (10,9), 'man': (6,9),
  'entry': (9,11),
})

# ---- ゆきのむら ユキネ 18x12: ちどり配置と氷の池 ----
g = blank(18, 12, 'S')
d_inn  = house(g, 2, 2, 'r')
d_shop = house(g, 12, 3, 'b')
fill(g, 6, 7, 8, 8, '~')                 # 凍った池
d_r    = house(g, 11, 7, 'r')
exit2(g, 8, 11)
dump('YUKINE_TILES', g, {
  'inn': (4,5), 'shop': (14,6), 'church': (2,9), 'ranch': (4,10),
  'old': (10,6), 'boy': (5,6), 'woman': (13,10),
  'entry': (8,10),
})

# ---- かくれざと トレモロ 18x12: 花畑と魔物が歩く里 ----
g = blank(18, 12, '.')
d_eld  = house(g, 2, 2, 'r')
d_shop = house(g, 12, 2, 'b')
fill(g, 7, 7, 9, 8, '~')                 # 泉
for (x, y) in [(7,5),(8,5),(9,5),(10,5),(2,6),(3,7),(14,6),(15,7),(11,9),(12,9),(5,9)]:
    g[y][x] = '*'                        # 花畑
exit2(g, 7, 11)
dump('TREMOLO_TILES', g, {
  'elder': (4,5), 'shop': (14,5), 'inn': (3,8), 'ranch': (13,8),
  'boy': (10,6), 'slime': (8,6), 'dragon': (15,9),
  'entry': (7,10),
})
