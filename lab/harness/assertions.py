#!/usr/bin/env python3
"""把生成的 spec 裡的斷言逐條抽出來。

為什麼要獨立一支並且自帶驗證：主結果是「每條斷言歸到 P0–P4」，
抽取器漏抓或多抓會直接改變分母。今天已經因為「拿文字比對當主張的代理」犯錯三次，
所以這支只做**機械抽取**，不做任何語意判斷。

一條斷言 = 一個 `expect(` 呼叫，從 `expect` 起算括號配對，再吃到該敘述的分號為止。
`await` 前綴會一併帶入（它是同一個敘述）。

用法：python3 harness/assertions.py <spec.ts> [...]
       python3 harness/assertions.py --selftest
"""
import re
import sys
from pathlib import Path

# `expect(`、`expect.poll(`、`expect.soft(` 都算。少了修飾詞那一段，
# `expect.poll` 會整條抓不到 —— 而抓不到跟「這支沒有斷言」在統計上長得一樣。
ASSERT_START = re.compile(r'\bexpect\s*(?:\.\s*\w+\s*)?\(')


def _strip_noncode(src):
    """把字串與註解換成等長空白，避免括號配對被它們騙到。位置保持不變。"""
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
    """回傳 [{'text': 原文, 'line': 行號}]，依出現順序。"""
    bare = _strip_noncode(src)
    found, pos = [], 0
    while True:
        m = ASSERT_START.search(bare, pos)
        if not m:
            return found
        start = m.start()
        # 敘述可能以 await 開頭，往前吃掉它
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
        # 括號收完之後還有鏈式 matcher，吃到分號或換行結尾
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
    # 字串裡的 expect( 不算
    ("const s = 'expect(fake)';\nawait expect(a).toBe(1);", 1, "await expect(a).toBe(1)"),
    # 註解裡的不算
    ("// expect(nope).toBe(1)\nexpect(a).toBe(1);", 1, "expect(a).toBe(1)"),
    # 巢狀括號
    ("await expect(page.getByRole('button', { name: 'x' })).toBeVisible();", 1, None),
    # 跨行
    ("await expect(\n  page.locator('a')\n).toHaveText('b');", 1, None),
    # expect.poll 這種鏈式
    ("await expect.poll(() => f()).toEqual([1, 2]);", 1, None),
    # 一行兩個
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
    # 反證：規則拿掉就要紅（確認不是恆真）
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
