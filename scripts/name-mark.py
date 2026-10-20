"""Draw Cordelia's lettered name from the Magic Story font as an SVG.

The font file is licensed and stays out of the repo (font-sources/ is
git-ignored), so the site uses this outlined SVG instead of loading the font.

    pip install fonttools
    python3 scripts/name-mark.py

Each line is a list of glyph names. Alternates are named like C.alt2 or
i.alt5; a number between glyphs adds that much extra space (font units).
"""

from pathlib import Path

from fontTools.pens.boundsPen import BoundsPen
from fontTools.pens.svgPathPen import SVGPathPen
from fontTools.ttLib import TTFont

ROOT = Path(__file__).resolve().parent.parent
FONT = ROOT / 'font-sources' / 'Magic Story.otf'
KERN_FONT = ROOT / 'font-sources' / 'Magic Story.ttf'
OUT = ROOT / 'src' / 'assets' / 'name-mark.svg'

LINES = [
    ['C.alt2', 'o', 'r', 'd.alt3', 'e', 'l', 'i.alt5', 'a.alt1'],
    ['M.alt3', 'o', 'o', 'r', 'e'],
]
LINE_GAP = 60
PAD = 10

font = TTFont(FONT)
glyphs = font.getGlyphSet()
advances = font['hmtx']
kerning = dict(TTFont(KERN_FONT)['kern'].kernTables[0].kernTable) if KERN_FONT.exists() else {}


def lay_out(tokens):
    names, extra = [], {}
    for token in tokens:
        if isinstance(token, (int, float)):
            extra[len(names) - 1] = extra.get(len(names) - 1, 0) + token
        else:
            names.append(token)

    x, paths = 0, []
    left = bottom = float('inf')
    right = top = float('-inf')
    for i, name in enumerate(names):
        pen = SVGPathPen(glyphs)
        glyphs[name].draw(pen)
        bounds_pen = BoundsPen(glyphs)
        glyphs[name].draw(bounds_pen)
        if bounds_pen.bounds:
            x0, y0, x1, y1 = bounds_pen.bounds
            paths.append(f'<path transform="translate({x} 0)" d="{pen.getCommands()}"/>')
            left, right = min(left, x + x0), max(right, x + x1)
            bottom, top = min(bottom, y0), max(top, y1)
        following = names[i + 1] if i + 1 < len(names) else None
        x += advances[name][0] + kerning.get((name, following), 0) + extra.get(i, 0)
    return paths, (left, bottom, right, top)


laid_out = [lay_out(line) for line in LINES]
width = max(b[2] - b[0] for _, b in laid_out)
groups, y = [], 0
for paths, (left, bottom, right, top) in laid_out:
    # Center each line, and flip it because font outlines are drawn y-up
    dx = (width - (right - left)) / 2 - left
    groups.append(f'<g transform="translate({dx:.0f} {y + top:.0f}) scale(1 -1)">{"".join(paths)}</g>')
    y += top - bottom + LINE_GAP
height = y - LINE_GAP

OUT.write_text(
    f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="{-PAD} {-PAD} {width + 2 * PAD:.0f} {height + 2 * PAD:.0f}" '
    f'fill="currentColor">{"".join(groups)}</svg>\n'
)
print(f'Wrote {OUT.relative_to(ROOT)}')
