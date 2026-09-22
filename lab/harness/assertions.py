#!/usr/bin/env python3
"""Extract the assertions of a generated spec, one per `expect(` invocation.

Missed or spurious extractions change the denominator of the P0--P4 distribution, so this
module is purely mechanical and carries its own self-test. An assertion spans from `expect`
through its balanced parentheses and chained matchers to the end of the statement, including
a leading `await`.

Usage: python3 harness/assertions.py <spec.ts> [...]
       python3 harness/assertions.py --selftest
"""
import re
import sys
from pathlib import Path

# `expect(`, `expect.poll(`, and `expect.soft(` all count; a missed modifier would be
# indistinguishable from a test without assertions.
ASSERT_START = re.compile(r'\bexpect\s*(?:\.\s*\w+\s*)?\(')


def _strip_noncode(src):
    """Blank out strings and comments with equal-length spaces so offsets are preserved."""
    out = list(src)
    i, n = 0, len(src)
    while i < n:
        c = src[i]
        if c == '/' and i + 1 < n and src[i + 1] == '/':
            while i < n and src[i] != '\n':
                out[i] = ' '
                i += 1
        elif c == '/' and i + 1 < n and src[i + 1] == '*':
            while i < n and not (src[i] == '*' and i + 1 < n and src[i + 1] == '/'):
                out[i] = ' '
                i += 1
            for _ in range(2):
                if i < n:
                    out[i] = ' '
                    i += 1
        elif c in '\'"`':
            quote, out[i], i = c, ' ', i + 1
            while i < n and src[i] != quote:
                if src[i] == '\\':
                    out[i] = ' '
                    i += 1
                if i < n:
                    out[i] = ' '
                    i += 1
            if i < n:
                out[i] = ' '
                i += 1
        else:
            i += 1
    return ''.join(out)


def extract(src):
    """Return [{'text': source, 'line': lineno}] in order of appearance."""
    bare = _strip_noncode(src)
    found, pos = [], 0
    while True:
        m = ASSERT_START.search(bare, pos)
        if not m:
            return found
        start = m.start()
        # Include a leading `await`.
        head = bare.rfind('\n', 0, start) + 1
        prefix = src[head:start]
        if prefix.strip() in ('await', 'return await', 'return'):
            start = head + len(prefix) - len(prefix.lstrip())
        depth, i = 0, m.end() - 1
        while i < len(bare):
            if bare[i] == '(':
                depth += 1
            elif bare[i] == ')':
                depth -= 1
                if depth == 0:
                    break
            i += 1
        # Consume chained matchers up to the semicolon or line end.
        j = i + 1
        while j < len(bare) and bare[j] not in ';\n':
            if bare[j] == '(':
                d2 = 1
                j += 1
                while j < len(bare) and d2:
                    d2 += (bare[j] == '(') - (bare[j] == ')')
                    j += 1
                continue
            j += 1
        text = ' '.join(src[start:j].split())
        found.append({'text': text, 'line': src[:start].count('\n') + 1})
        pos = max(j, m.end())


SELFTEST = [
    ("await expect(a).toBeVisible();", 1, "await expect(a).toBeVisible()"),
    ("expect(a).toBe(1);\nexpect(b).toBe(2);", 2, None),
    # expect( inside a string
    ("const s = 'expect(fake)';\nawait expect(a).toBe(1);", 1, "await expect(a).toBe(1)"),
    # expect( inside a comment
    ("// expect(nope).toBe(1)\nexpect(a).toBe(1);", 1, "expect(a).toBe(1)"),
    # nested parentheses
    ("await expect(page.getByRole('button', { name: 'x' })).toBeVisible();", 1, None),
    # multi-line
    ("await expect(\n  page.locator('a')\n).toHaveText('b');", 1, None),
    # chained expect.poll
    ("await expect.poll(() => f()).toEqual([1, 2]);", 1, None),
    # two on one line
    ("expect(a).toBe(1); expect(b).toBe(2);", 2, None),
]


def selftest():
    bad = 0
    for src, want_n, want_first in SELFTEST:
        got = extract(src)
        ok = len(got) == want_n and (want_first is None or got[0]['text'] == want_first)
        print(f"{'ok  ' if ok else 'FAIL'} {src!r:70.70} → {len(got)} 條")
        if not ok:
            bad = 1
            for g in got:
                print(f"       {g}")
    # Negative check: disabling masking must fail.
    if len(extract("const s = 'expect(fake)';")) != 0:
        print("FAIL 字串遮蔽失效")
        bad = 1
    print("all passed" if not bad else "有失敗")
    return bad


if __name__ == "__main__":
    if "--selftest" in sys.argv[1:]:
        raise SystemExit(selftest())
    for f in sys.argv[1:]:
        src = Path(f).read_text()
        rows = extract(src)
        print(f"=== {f}（{len(rows)} 條）")
        for r in rows:
            print(f"  L{r['line']:>3}  {r['text']}")
