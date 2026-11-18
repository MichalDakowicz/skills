"""Flag common AI-UI tells in frontend files. Usage: scan.py <file-or-dir>... | --self-test

Prints path:line: rule — snippet. Exit 1 when anything is found. Heuristic: a hit is
a prompt to justify or fix, not proof of a problem.
"""
from __future__ import annotations

import re
import sys
from pathlib import Path

EXTS = {".html", ".htm", ".css", ".scss", ".jsx", ".tsx", ".js", ".ts", ".vue", ".svelte", ".astro"}
SKIP_DIRS = {"node_modules", ".git", "dist", "build", ".next", "out", "coverage"}

RULES: list[tuple[str, re.Pattern[str]]] = [
    ("default purple/indigo palette", re.compile(r"\b(?:indigo|violet|purple|fuchsia)-[4-7]00\b|#(?:6366f1|4f46e5|8b5cf6|7c3aed|a855f7|9333ea)\b", re.I)),
    # same colour at both stops is a drawing trick (lines, + markers), not a gradient
    ("gradient (only if it carries meaning)", re.compile(r"(?:linear|radial|conic)-gradient\((?!\s*(\w+)\s*,\s*\1\s*\))|\bbg-gradient-to-|\bbg-linear-to-")),
    ("gradient text", re.compile(r"background-clip:\s*text|\bbg-clip-text\b")),
    ("pulsing/pinging animation", re.compile(r"\banimate-(?:pulse|ping)\b|animation[^;\n]*\b(?:pulse|ping)\b", re.I)),
    ("transition: all", re.compile(r"transition(?:-property)?:\s*all\b|\btransition-all\b")),
    ("hover lift/scale", re.compile(r"\bhover:(?:scale-\d|-?translate-y)|:hover[^{]*\{[^}]*transform:\s*(?:translateY\(-|scale\(1\.)", re.S)),
    ("glassmorphism blur", re.compile(r"backdrop-filter:\s*blur|\bbackdrop-blur\b")),
    ("coloured glow shadow", re.compile(r"\bshadow-(?!black|white|none|sm|md|lg|xl|2xl|inner)[a-z]+-\d00\b")),
    ("heavy shadow", re.compile(r"\bshadow-(?:xl|2xl)\b")),
    ("left/top accent stripe", re.compile(r"\bborder-[lt]-(?:4|8)\b|border-(?:left|top):\s*[3-9]px\s+solid")),
    ("ALL-CAPS eyebrow", re.compile(r"\buppercase\b[^\"'\n]*\btracking-(?:wide|wider|widest)\b|\btracking-(?:wide|wider|widest)\b[^\"'\n]*\buppercase\b|text-transform:\s*uppercase")),
    ("generic marketing copy", re.compile(r"\b(?:supercharge|seamless(?:ly)?|unlock|empower|revolutioni[sz]e|game[- ]chang|next[- ]level|AI-powered)\b", re.I)),
    ("sparkle/new pill", re.compile(r"✨")),
    ("emoji used as icon", re.compile(r"[\U0001F300-\U0001FAFF☀-➿](?!︎)")),
    ("zoom disabled", re.compile(r"user-scalable\s*=\s*no|maximum-scale\s*=\s*1\b")),
]
SHADOW = re.compile(r"box-shadow:([^;}]+)", re.I)
RGB = re.compile(r"rgba?\(\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)")
SPACING = re.compile(r"\b(?:padding|margin|gap|row-gap|column-gap|inset)(?:-[a-z]+)?:\s*([^;}\n]+)")
PX = re.compile(r"(?<![\d.])(\d+(?:\.\d+)?)px")
MAX_FONT_SIZES = 6
FONT_SIZE = re.compile(r"font-size:\s*([\d.]+(?:px|rem|em))|\btext-(xs|sm|base|lg|[2-9]?xl|\[[^\]]+\])\b")


def scan_text(text: str) -> list[tuple[int, str, str]]:
    hits = []
    for n, line in enumerate(text.splitlines(), 1):
        for name, rx in RULES:
            if rx.search(line):
                hits.append((n, name, line.strip()[:100]))
        # a shadow is "coloured" when its channels differ noticeably; near-greys are neutral
        if any(max(map(int, c)) - min(map(int, c)) > 24 for m in SHADOW.finditer(line) for c in RGB.findall(m.group(1))):
            hits.append((n, "coloured glow shadow", line.strip()[:100]))
        # 0-2px allowed for hairline offsets; everything else sits on the 4px scale
        if any(float(px) > 2 and float(px) % 4 for m in SPACING.finditer(line) for px in PX.findall(m.group(1))):
            hits.append((n, "off-scale spacing (not a multiple of 4)", line.strip()[:100]))
    sizes = {m.group(1) or m.group(2) for m in FONT_SIZE.finditer(text)}
    if len(sizes) > MAX_FONT_SIZES:
        hits.append((0, f"{len(sizes)} font sizes (max {MAX_FONT_SIZES})", ", ".join(sorted(sizes))))
    return hits


def files(args: list[str]):
    for a in args:
        p = Path(a)
        if p.is_dir():
            for f in p.rglob("*"):
                if f.suffix in EXTS and not SKIP_DIRS & set(f.parts):
                    yield f
        elif p.is_file():
            yield p


def self_test() -> None:
    bad = scan_text(
        '<div class="bg-indigo-600 animate-pulse uppercase tracking-wider">🚀 Supercharge</div>\n'
        ".a{transition: all .2s; padding: 10px; box-shadow: 0 0 20px rgba(139,92,246,.6);}\n"
    )
    names = {h[1] for h in bad}
    for want in ("default purple/indigo palette", "pulsing/pinging animation", "ALL-CAPS eyebrow",
                 "emoji used as icon", "generic marketing copy", "transition: all",
                 "off-scale spacing (not a multiple of 4)", "coloured glow shadow"):
        assert want in names, want
    clean = (".a{padding: 16px 24px; margin-top: 4px; gap: 8px; row-gap: 4px; padding: 0 0 8px; "
             "transition: transform .2s; box-shadow: 0 1px 2px rgba(0,0,0,.06);}")
    assert scan_text(clean) == [], scan_text(clean)
    assert scan_text(".b{gap: 50px}")[0][1].startswith("off-scale")
    neutral = (".m{box-shadow:0 1px 2px rgba(20,20,20,.05),0 16px 40px rgba(20,22,24,.09)}\n"
               ".p{background:linear-gradient(currentColor,currentColor) center/100% 2px no-repeat}")
    assert scan_text(neutral) == [], scan_text(neutral)
    assert scan_text(".h{background:linear-gradient(#6366f1, #ec4899)}")
    print("self-test ok")


def main(argv: list[str]) -> int:
    sys.stdout.reconfigure(encoding="utf-8", errors="replace")  # Windows consoles default to cp125x
    if argv == ["--self-test"]:
        self_test()
        return 0
    if not argv:
        print(__doc__)
        return 2
    total = 0
    for f in files(argv):
        for n, name, snippet in scan_text(f.read_text(encoding="utf-8", errors="replace")):
            print(f"{f}:{n}: {name} — {snippet}")
            total += 1
    print(f"{total} finding(s)" if total else "clean")
    return 1 if total else 0


if __name__ == "__main__":
    sys.exit(main(sys.argv[1:]))
