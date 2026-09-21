#!/usr/bin/env python3
"""跑一格 (條件 × 情境 × seed)：讓受測 agent 產一支測試，然後量它。

量什麼：
  valid        產出的檔案跑得起來
  clean_pass   在乾淨站台上通過（dry-run）
  detected     在對應的注入缺陷上失敗（＝真的抓到了）
  tokens/秒    受測 agent 花的預算（totalTokenCount，含 thinking）
  gate_rounds  被 gate 退回修正幾次
  improvised_probe / wanted_walk   它有沒有想用另一個管道

用法：
  python3 harness/run.py --cond C2 --scenario S10 --seed 1
  python3 harness/run.py --cond C0 --scenario S10 --seed 1 --no-measure   # 只產不量
"""
import argparse
import json
import re
import time

import common
import conditions
import gates
import sandbox


def checkpoint(stage, budget, log):
    """每次模型／工具回合落盤，整格 timeout 時仍能診斷原因。"""
    common.RUNS.mkdir(exist_ok=True)
    path = common.RUNS / f"{CURRENT_SPEC['name']}.progress.json"
    tmp = path.with_suffix(".tmp")
    tmp.write_text(json.dumps({"stage": stage, "budget": budget.asdict(), "log": log},
                              ensure_ascii=False, indent=2))
    tmp.replace(path)

# 情境 → (需求敘述, 對應的注入缺陷)
SCENARIOS = {
    "S02": ("以已被註冊的 email 再次註冊時，畫面要出現錯誤訊息，而且不會變成登入狀態。", "F07"),
    "S03": ("登入時密碼錯誤，要停留在登入頁並顯示錯誤訊息，不會進入首頁。", "F08"),
    "S04": ("建立文章時填了三個標籤，發佈後的文章頁上這三個標籤都要出現。", "F10"),
    "S05": ("文章頁上，只有作者本人看得到編輯與刪除的按鈕；不是作者就看不到，也不能改。", "F12"),
    "S06": ("編輯一篇文章的標題並送出後，文章頁顯示的標題要變成新的標題。", "F06"),
    "S07": ("作者刪除自己的文章後，該文章不會再出現在文章列表裡。", "F11"),
    "S08": ("在文章頁送出一則留言後，不需要重新整理就要看得到這則留言。", "F04"),
    "S09": ("留言的刪除按鈕只有留言作者看得到；不是留言作者就不該看到。", "F05"),
    "S10": ("對一篇還沒被收藏的文章按 favorite，收藏計數要從 0 變成 1。", "F01"),
    "S10b": ("對一篇文章按 favorite 再按一次取消，收藏計數要回到原本的數字。", "F02"),
    "S11": ("追蹤某位作者之後再取消追蹤，追蹤關係要真的解除。", "F09"),
    "S12": ("文章列表換到第二頁時，顯示的是下一批文章，不會重複第一頁已經出現過的文章。", "F03"),
}

# 契約只有 OPEN <route> [--as-user]；舊的 --click 已移除，留著會讓模型用到不被執行的語法。
OPEN_RE = re.compile(r'^\s*OPEN\s+(\S+)(\s+--as-user)?\s*$', re.M)
FIND_RE = re.compile(r'^\s*FIND\s+"([^"]+)"\s*$', re.M)
LOCATOR_RE = re.compile(r'^\s*LOCATOR\s+(\S+)\s*$', re.M)
RUN_RE = re.compile(r"^\s*RUN\s*\n```(?:js|javascript)?\n(.*?)```", re.M | re.S)
FINAL_RE = re.compile(r"FINAL\s*\n```(?:ts|typescript)?\n(.*?)```", re.S)


def extract_final(text: str):
    m = FINAL_RE.search(text)
    return m.group(1).strip() if m else None


def agent_loop(cond: str, scenario_text: str, budget: common.Budget, log: list,
               model: str | None = None):
    """model 省略時用 common.MODEL；指定時只換下游生成器，走查工具與量測不變。"""
    cfg = conditions.CONDITIONS[cond]
    prompt = conditions.build_prompt(cond, scenario_text, str(common.LAB))
    messages = [{"role": "user", "text": prompt}]
    counters = {"probe_steps": 0, "improvised_probe": 0, "wanted_walk": 0}
    try:
        return _agent_steps(cfg, messages, budget, log, counters, model)
    finally:
        # 不管是正常結束、沒收斂還是丟例外，具名 session 都要關；否則 browser 會留下來。
        if cfg["explore"] == "walk" and counters["probe_steps"]:
            common.close_probe_session(CURRENT_SPEC["name"])


def _agent_steps(cfg, messages, budget, log, counters, model=None):
    for _ in range(cfg["max_steps"] + 2):
        checkpoint("awaiting_agent_model", budget, log)
        reply = common.generate(messages, budget, model=model)
        log.append({"role": "model", "text": reply[:4000]})
        checkpoint("agent_reply", budget, log)
        messages.append({"role": "model", "text": reply})

        code = extract_final(reply)
        if code:
            return code, counters

        if cfg["explore"] == "walk":
            m = OPEN_RE.search(reply)
            if m and counters["probe_steps"] < cfg["max_steps"]:
                counters["probe_steps"] += 1
                ok, result = common.open_probe_session(
                    CURRENT_SPEC["name"], m.group(1), as_user=bool(m.group(2)))
                feed = (f"Playwright CLI 已開啟：{result}\n請用 FIND 查需要的元素。"
                        if ok else f"Playwright CLI OPEN 失敗：{result[-1000:]}")
            elif FIND_RE.search(reply) and counters["probe_steps"] < cfg["max_steps"]:
                counters["probe_steps"] += 1
                query = FIND_RE.search(reply).group(1)
                ok, result = common.playwright_cli(
                    CURRENT_SPEC["name"], ["find", "--regex", query], 60)
                feed = ("FIND 結果：\n" + result[-1800:]) if ok else ("FIND 失敗：\n" + result[-1000:])
            elif LOCATOR_RE.search(reply) and counters["probe_steps"] < cfg["max_steps"]:
                counters["probe_steps"] += 1
                ref = LOCATOR_RE.search(reply).group(1)
                ok, result = common.playwright_cli(
                    CURRENT_SPEC["name"], ["generate-locator", ref], 60)
                feed = ("已驗證 locator：\n" + result[-800:]) if ok else ("LOCATOR 失敗：\n" + result[-1000:])
            elif RUN_RE.search(reply):
                counters["improvised_probe"] += 1
                feed = "這裡沒有執行腳本的管道。要看畫面請用 OPEN <route>；不然就直接輸出 FINAL。"
            else:
                feed = "請用 OPEN／FIND／LOCATOR 走查，或直接輸出 FINAL 區塊。"
        else:
            m = RUN_RE.search(reply)
            if m and counters["probe_steps"] < cfg["max_steps"]:
                counters["probe_steps"] += 1
                ok, out = sandbox.run_script(m.group(1))
                feed = f"腳本執行{'成功' if ok else '失敗'}，輸出：\n\n{out}"
            elif OPEN_RE.search(reply):
                counters["wanted_walk"] += 1
                feed = "這裡沒有 OPEN 這個工具。要看畫面請自己寫 RUN 腳本；不然就直接輸出 FINAL。"
            else:
                feed = "請用 RUN 腳本探查，或直接輸出 FINAL 區塊。"

        log.append({"role": "user", "text": feed[:2000]})
        messages.append({"role": "user", "text": feed})
        checkpoint("exploration_feedback", budget, log)

    return None, counters


def gate_loop(cond, code, scenario_text, budget, log, messages_tail, max_rounds=3):
    """C2 系列：靜態 gate ＋ dry-run，沒過就退回要求修正。"""
    rounds = 0
    rejections = []
    while True:
        problems = gates.check_static(code, scenario_text)
        if conditions.CONDITIONS[cond]["gates"] == "form":
            problems = [p for p in problems if p[0] == "form"]
        if not problems:
            ok, out = run_clean(code)
            if ok:
                return code, rounds, rejections, True
            problems = [("runtime", f"這支測試在乾淨的站台上就沒通過（dry-run 失敗）。輸出：\n{out[-1200:]}")]

        if rounds >= max_rounds:
            checkpoint("gate_exhausted", budget, log)
            return code, rounds, rejections, False
        rounds += 1
        rejections.append([p[0] for p in problems])
        msg = ("你產出的測試沒有通過檢查，以下是原因。請修正後**重新輸出完整的 FINAL 區塊**：\n"
               + gates.describe(problems))
        log.append({"role": "user", "text": msg[:2000]})
        checkpoint("awaiting_gate_revision", budget, log)
        reply = common.generate(messages_tail + [{"role": "user", "text": msg}], budget)
        log.append({"role": "model", "text": reply[:4000]})
        checkpoint("gate_reply", budget, log)
        new_code = extract_final(reply)
        if new_code:
            code = new_code
            messages_tail = [{"role": "user", "text": f"需求：{scenario_text}\n上一輪測試：\n{code}"}]


def self_review(code, scenario_text, budget, log, target_tokens, max_rounds=5):
    """C1S：只給需求／規範／自身程式碼，不給測試執行結果。"""
    rounds = 0
    while rounds < max_rounds and (rounds == 0 or budget.total_tokens < target_tokens):
        prompt = (f"需求：{scenario_text}\n\n規範：\n{conditions.RULES}\n"
                  f"目前測試：\n```ts\n{code}\n```\n\n{conditions.SELF_CHECK}")
        checkpoint("awaiting_self_review", budget, log)
        reply = common.generate([{"role": "user", "text": prompt}], budget)
        log.append({"role": "self_review", "text": reply[:4000]})
        checkpoint("self_review_reply", budget, log)
        revised = extract_final(reply)
        if revised:
            code = revised
        rounds += 1
    return code, rounds


def write_spec(code: str, name: str):
    path = common.LAB / "generated" / f"{name}.spec.ts"
    path.parent.mkdir(exist_ok=True)
    path.write_text(code)
    return path


CURRENT_SPEC = {"path": None}


def run_clean(code: str):
    path = write_spec(code, CURRENT_SPEC["name"])
    with common.app_lock():
        ok, out = common.fault("revert")
        if not ok:
            raise RuntimeError(f"無法還原乾淨版：{out}")
        return common.run_playwright(path)


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--cond", required=True, choices=list(conditions.CONDITIONS))
    ap.add_argument("--scenario", required=True, choices=list(SCENARIOS))
    ap.add_argument("--seed", type=int, default=1,
                    help="重複執行編號；模型 API 未設定隨機 seed")
    ap.add_argument("--no-measure", action="store_true")
    ap.add_argument("--review-target-tokens", type=int,
                    help="C1S 的 totalTokenCount 目標；從 C2 pilot 中位數決定")
    args = ap.parse_args()
    if args.cond == "C1S" and (args.review_target_tokens is None or args.review_target_tokens <= 0):
        ap.error("C1S 必須給 --review-target-tokens（用 C2 pilot 中位數）")

    scenario_text, fid = SCENARIOS[args.scenario]
    run_id = f"{args.cond}_{args.scenario}_s{args.seed}"
    CURRENT_SPEC["name"] = run_id
    budget, log = common.Budget(), []
    t0 = time.time()

    code, counters = agent_loop(args.cond, scenario_text, budget, log)
    result = {
        "run_id": run_id, "cond": args.cond, "scenario": args.scenario, "fault": fid,
        "replicate": args.seed, "model": common.MODEL,
        "protocol_version": 3, "thinking_budget": common.THINKING_BUDGET,
        "gate_protocol_version": 1 if conditions.CONDITIONS[args.cond]["gates"] else None,
        **counters,
    }

    if not code:
        result.update({"valid": False, "accepted": False, "note": "沒有產出 FINAL 區塊"})
    else:
        gate_rounds, rejections, accepted = 0, [], True
        review_rounds = 0
        if conditions.CONDITIONS[args.cond]["self_check"]:
            code, review_rounds = self_review(
                code, scenario_text, budget, log, args.review_target_tokens)
        if conditions.CONDITIONS[args.cond]["gates"]:
            code, gate_rounds, rejections, accepted = gate_loop(
                args.cond, code, scenario_text, budget, log,
                [{"role": "user", "text":
                  f"需求：{scenario_text}\n規範：\n{conditions.RULES}\n目前測試：\n```ts\n{code}\n```"}],
            )
        spec = write_spec(code, run_id)
        result.update({"valid": True, "accepted": accepted,
                       "gate_rounds": gate_rounds, "gate_rejections": rejections,
                       "review_rounds": review_rounds,
                       "review_target_tokens": args.review_target_tokens if review_rounds else None,
                       "spec": str(spec.relative_to(common.LAB))})

        if not args.no_measure and accepted:
            with common.app_lock():
                try:
                    ok, out = common.fault("revert")
                    if not ok:
                        raise RuntimeError(out)
                    clean_pass, clean_out = common.run_playwright(spec)
                    ok, out = common.fault("apply", fid)
                    if not ok:
                        raise RuntimeError(out)
                    fault_pass, fault_out = common.run_playwright(spec)
                finally:
                    ok, out = common.fault("revert")
                    if not ok:
                        raise RuntimeError(f"量測後無法還原：{out}")
            result.update({
                "clean_pass": clean_pass,
                "detected": clean_pass and not fault_pass,
                "clean_tail": clean_out[-600:] if not clean_pass else "",
                "fault_tail": fault_out[-600:] if fault_pass else "",
            })

    result["budget"] = budget.asdict()
    result["wall_seconds"] = round(time.time() - t0, 1)

    common.RUNS.mkdir(exist_ok=True)
    # 只產不量時寫 .gen.json，measure.py 會把它補成 .json
    # 未接受／未產出的 run 已是最終結果，必須進分析分母；只有待量測者留 .gen.json。
    suffix = ".gen.json" if args.no_measure and result.get("accepted", False) else ".json"
    (common.RUNS / f"{run_id}{suffix}").write_text(json.dumps(result, ensure_ascii=False, indent=2))
    (common.RUNS / f"{run_id}.log.json").write_text(json.dumps(log, ensure_ascii=False, indent=2))
    (common.RUNS / f"{run_id}.progress.json").unlink(missing_ok=True)
    if suffix == ".json":
        with (common.RUNS / "all.jsonl").open("a") as f:
            f.write(json.dumps(result, ensure_ascii=False) + "\n")
    print(json.dumps({k: v for k, v in result.items() if k not in ("clean_tail", "fault_tail", "gate_rejections")},
                     ensure_ascii=False))


if __name__ == "__main__":
    main()
