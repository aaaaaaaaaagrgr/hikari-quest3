# ヒカリの伝説III 画像生成リクエスト一覧

このファイルは、画像生成AIにそのまま貼って使えるプロンプト集です。
各プロンプトは共有ルールを省略せず、単体で成立するように書いてあります。

生成したPNGができたら「切り出して組み込んで」と言ってください。
（rpg-kit/tools/slice_quest2_example.py を流用したスライサーで切り出し→ assets/ に配置
　→ assets.js の自動差し替え機構で、コード編集ゼロで反映されます）

現在のプレースホルダ:
- 主人公ニコ → 1作目の勇者画像 / キリエ → 衛兵
- リリカ → ダークエルフ / ドンガ → サンドゴーレム / ファゴル → ヒノトリ / バリトン → アイスデーモン
- ノクターン → アークデーモン / めつぼうのノクターン → ブラックドラゴン / エデン → ドラゴン
- ロゴ → 2作目ロゴ

## 1. 主人公ニコ3ポーズ＋キリエ 2x2シート

切り出し後のファイル名:
`kota_front`, `kota_back`, `kota_side`, `kirie`

```text
Create one 1024x1024 PNG image.
Style: 16-bit retro JRPG pixel art, inspired by classic Dragon Quest and SNES fantasy RPG character sprites.

Canvas layout:
- Divide the image into a 2x2 grid of equal square cells.
- Draw thick bright red (#FF0000) grid lines between the cells.
- Every cell must have a pure white background.
- Each cell must contain exactly one full-body chibi character sprite.
- The character must be centered, fully visible, and fully inside the cell.
- Do not let any character touch or overlap the red grid lines.
- No text, no labels, no shadows, no transparent background.

Cells in order, left to right, top to bottom:
1. A cheerful young monster-tamer boy with messy brown hair, an orange bandana, a blue short-sleeved tunic, shorts, sturdy boots, and a small drum-shaped backpack with a meat bone strapped to it, seen from the front.
2. The same monster-tamer boy, seen from behind (backpack visible).
3. The same monster-tamer boy, side view walking, facing left.
4. A confident young monster-hunter girl with a silver-white ponytail, a dark green hooded cloak, leather armor, and a large bow on her back, seen from the front.

Important:
- Keep the same boy design consistent across his front, back, and side views.
- The side-view sprite must face left.
- Make the sprites clean, readable, cute, and game-ready.
```

## 2. やみの楽団カルテット（中ボス4体） 2x2シート

切り出し後のファイル名:
`lyrica`, `donga`, `fagor`, `bariton`

```text
Create one 1024x1024 PNG image.
Style: 16-bit retro JRPG pixel art, inspired by classic Dragon Quest and SNES fantasy RPG boss monster sprites.

Canvas layout:
- Divide the image into a 2x2 grid of equal square cells.
- Draw thick bright red (#FF0000) grid lines between the cells.
- Every cell must have a pure white background.
- Each cell must contain exactly one large impressive boss monster sprite.
- The monster must be centered, fully visible, and fully inside the cell.
- Do not let any monster touch or overlap the red grid lines.
- No text, no labels, no shadows, no transparent background.

Cells in order, left to right, top to bottom:
1. A beautiful sinister dark-elf diva with long flowing violet hair, a black-and-purple evening dress, playing a large bone harp with glowing dark strings.
2. A massive rock golem drummer with lava cracks on its body, pounding two huge stone drums with club-like drumsticks, mouth open in a battle roar.
3. A blazing phoenix-like fire bird playing a burning bone flute held in one claw, wings spread wide, feathers like flames.
4. A tall elegant ice demon opera singer with deep blue skin, frost-covered tuxedo-like chest plating, icy horns, mouth open singing, with visible freezing sound waves.

Important:
- They are four members of an evil monster orchestra, so give them a shared dark-concert theme.
- Make each boss visually distinct and readable at game size.
- Use strong silhouettes and classic fantasy RPG monster design.
```

## 3. ラスボス2形態＋裏ボス＋ロゴ 2x2シート

切り出し後のファイル名:
`nocturne`, `nocturne2`, `eden`, `logo3`

```text
Create one 1024x1024 PNG image.
Style: 16-bit retro JRPG pixel art, inspired by classic Dragon Quest and SNES fantasy RPG boss monster sprites.

Canvas layout:
- Divide the image into a 2x2 grid of equal square cells.
- Draw thick bright red (#FF0000) grid lines between the cells.
- Every cell must have a pure white background.
- Each cell must contain exactly one large impressive sprite.
- The subject must be centered, fully visible, and fully inside the cell.
- Do not let any subject touch or overlap the red grid lines.
- No text, no letters, no labels, no shadows, no transparent background.

Cells in order, left to right, top to bottom:
1. A sinister demonic orchestra conductor in a tattered black tailcoat with a high collar, a pale mask-like face, glowing purple eyes, holding a long dark conductor's baton, with musical notes made of shadow swirling around him.
2. The same conductor transformed into a monstrous final form: a huge shadow dragon-demon fused with a pipe organ, organ pipes rising like wings from its back, the conductor's broken mask on its chest, radiating dark flames.
3. A majestic holy white dragon goddess with flowing aurora-colored mane, gentle golden eyes, pearl-white scales that shimmer with rainbow light, and faint glowing musical notes floating around her, both divine and kind.
4. A fantasy RPG game logo emblem WITHOUT any text: a crossed silver sword and a golden conductor's baton in front of a shining musical note, with a tiny cute blue slime sitting on top, framed by a laurel of light.

Important:
- Cell 1 and cell 2 are the same villain before and after transformation; keep his color scheme (black, purple, pale silver) consistent.
- Make each subject visually distinct and readable at game size.
- Use strong silhouettes and classic fantasy RPG design.
```
