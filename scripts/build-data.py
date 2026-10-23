#!/usr/bin/env python3
"""从 Atlas Academy 导出生成羁绊加成礼装查询用的 src/data/bond.json。

用法:
  python3 scripts/build-data.py            # 有缓存就用缓存，没有就下载
  python3 scripts/build-data.py --refresh  # 强制重新下载日服 / 国服数据

只收录「通关羁绊提升」且带从者条件的礼装。全体通用（午茶 / 午餐 / 晚餐等）
以及没有从者条件的活动自用礼装会排除。

条件解析（与游戏数据一致，已对照 api.atlasacademy.io 的样本礼装核对过）:
  - 函数类型 servantFriendshipUp。RateCount 是千分比（40 = 4%），AddCount 是固定点数。
  - 满破取同一技能 num 下 condLimitCount 最大的那一档。
  - functvals 里多个特性是「或」；overWriteTvalsList 组内是「且」、组间是「或」。
  - 特性 id 等于某从者 id 时，只表示该从者本人，不表示带有这个特性的其他人。
  - 从者按灵基 0–4 与灵衣各自的特性判定。某一形态才满足时记为部分满足（mask），
    全部形态都满足时 mask 为 -1。组合查询用 mask 按位与，判断有没有同一个形态同时满足。
"""
from __future__ import annotations

import datetime
import json
import os
import re
import sys
import time
import urllib.request

BASE = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.dirname(BASE)
CACHE = os.path.join(BASE, ".cache")
OUT = os.path.join(ROOT, "src", "data", "bond.json")
API = "https://api.atlasacademy.io"
FACE = "https://static.atlasacademy.io/JP/Faces/f_{}0.png"
BOND_FUNC = "servantFriendshipUp"
REFRESH = "--refresh" in sys.argv
NOW = time.time()

CLASS_CN = {
    "saber": "剑阶",
    "archer": "弓阶",
    "lancer": "枪阶",
    "rider": "骑阶",
    "caster": "术阶",
    "assassin": "杀阶",
    "berserker": "狂阶",
    "shielder": "盾阶",
    "ruler": "裁定者",
    "alterEgo": "Alterego",
    "avenger": "复仇者",
    "moonCancer": "月癌",
    "foreigner": "降临者",
    "pretender": "伪装者",
    "beast": "兽阶",
    "beastEresh": "兽阶·埃列",
    "unBeastOlgaMarie": "非兽",
    "grandSaber": "冠位剑阶",
    "grandArcher": "冠位弓阶",
    "grandLancer": "冠位枪阶",
    "grandRider": "冠位骑阶",
    "grandCaster": "冠位术阶",
    "grandAssassin": "冠位杀阶",
    "grandBerserker": "冠位狂阶",
}

TRAIT_CN = {
    1: "男性",
    2: "女性",
    3: "性别不明",
    100: "剑阶",
    101: "枪阶",
    102: "弓阶",
    103: "骑阶",
    104: "术阶",
    105: "杀阶",
    106: "狂阶",
    107: "盾阶",
    108: "裁定者",
    109: "Alterego",
    110: "复仇者",
    115: "月癌",
    117: "降临者",
    120: "伪装者",
    200: "天",
    201: "地",
    202: "人",
    203: "星",
    204: "兽",
    300: "秩序",
    301: "混沌",
    302: "中立",
    303: "善",
    304: "恶",
    305: "中庸",
    308: "夏",
    2000: "神性",
    2654: "现存人类",
    2780: "拥有灵衣",
    2821: "兽科",
    2858: "七骑士职阶",
    2883: "Fate/stay night",
}

OBTAIN_CN = {
    "svtEquipManaExchange": "魔力棱镜兑换",
    "svtEquipEvent": "活动礼装",
    "svtEquipEventReward": "活动奖励",
    "svtEquipCampaign": "活动赠送",
    "normal": "召唤",
    "svtEquipExp": "经验礼装",
}

EXPORTS = {
    "JP_nice_servant.json": f"{API}/export/JP/nice_servant.json",
    "CN_nice_servant.json": f"{API}/export/CN/nice_servant.json",
    "JP_nice_equip.json": f"{API}/export/JP/nice_equip.json",
    "CN_nice_equip.json": f"{API}/export/CN/nice_equip.json",
}


def download(url: str, path: str) -> None:
    if not REFRESH and os.path.exists(path) and os.path.getsize(path) > 0:
        return
    os.makedirs(os.path.dirname(path), exist_ok=True)
    print(f"download {url}", flush=True)
    last = None
    for attempt in range(3):
        try:
            req = urllib.request.Request(url, headers={"User-Agent": "fgo-tools-data/1.0"})
            with urllib.request.urlopen(req, timeout=300) as resp, open(path + ".tmp", "wb") as out:
                while True:
                    chunk = resp.read(1024 * 256)
                    if not chunk:
                        break
                    out.write(chunk)
            os.replace(path + ".tmp", path)
            return
        except Exception as exc:  # noqa: BLE001 - retry any transport error
            last = exc
            time.sleep(2 * (attempt + 1))
    raise SystemExit(f"下载失败 {url}: {last}")


def load_exports() -> dict:
    os.makedirs(CACHE, exist_ok=True)
    data = {}
    for name, url in EXPORTS.items():
        path = os.path.join(CACHE, name)
        download(url, path)
        print(f"load {name}", flush=True)
        with open(path, encoding="utf-8") as fh:
            data[name] = json.load(fh)
    return data


def load_translations() -> dict[int, str]:
    path = os.path.join(BASE, "translations_cn.json")
    if not os.path.exists(path):
        return {}
    with open(path, encoding="utf-8") as fh:
        raw = json.load(fh)
    out = {}
    for key, value in raw.items():
        if isinstance(key, str) and key.isdigit() and isinstance(value, str):
            out[int(key)] = value.strip()
    return out


def num(value) -> int | float:
    value = round(float(value), 4)
    if abs(value - round(value)) < 1e-6:
        return int(round(value))
    return value


def active_trait_adds(servant: dict) -> list[dict]:
    adds = []
    for item in servant.get("traitAdd") or []:
        if item.get("condType") not in (None, "none", 0):
            continue
        started = item.get("startedAt") or 0
        ended = item.get("endedAt") or 0
        if started and started > NOW:
            continue
        if ended and ended <= NOW:
            continue
        adds.append(item)
    return adds


def apply_adds(trait_ids: set[int], adds: list[dict], limit: int) -> set[int]:
    merged = set(trait_ids)
    for item in adds:
        limit_count = item.get("limitCount", -1)
        if limit_count == -1 or limit_count == limit:
            merged.update(t["id"] for t in item.get("trait") or [])
    return merged


def servant_forms(servant: dict) -> list[set[int]]:
    """每个可上场形态的特性集合。灵基 0–4 必有；灵衣只在数据给出整表特性时单列。"""
    base = {t["id"] for t in servant.get("traits") or []}
    adds = active_trait_adds(servant)
    individuality = (servant.get("ascensionAdd") or {}).get("individuality") or {}
    ascension = individuality.get("ascension") or {}
    forms: list[set[int]] = []
    for limit in range(5):
        listed = ascension.get(str(limit)) or []
        traits = {t["id"] for t in listed} if listed else set(base)
        forms.append(apply_adds(traits, adds, limit))
    for key, listed in ascension.items():
        if key in {str(i) for i in range(5)} or not listed:
            continue
        try:
            limit = int(key)
        except ValueError:
            limit = -999
        forms.append(apply_adds({t["id"] for t in listed}, adds, limit))
    for index, listed in enumerate((individuality.get("costume") or {}).values()):
        if not listed:
            continue
        forms.append(apply_adds({t["id"] for t in listed}, adds, 11 + index))
    return forms


def match_mask(forms: list[set[int]], servant_id: int, traits: list[list[int]], servant_ids: set[int]) -> int | None:
    def holds(form: set[int], trait: int) -> bool:
        if trait in servant_ids:
            return trait == servant_id
        return trait in form

    hits = [
        any(all(holds(form, trait) for trait in clause) for clause in traits)
        for form in forms
    ]
    if not any(hits):
        return None
    if all(hits):
        return -1
    return sum(1 << index for index, hit in enumerate(hits) if hit)


def clean_detail(text: str) -> str:
    text = re.sub(r"\[(?:最大解放|Max Limit Break)\]", "", text or "")
    return re.sub(r"\s+", " ", text).strip()


def skill_levels(equip: dict) -> dict:
    grouped: dict = {}
    for skill in equip.get("skills") or []:
        grouped.setdefault(skill.get("num"), []).append(skill)
    for skills in grouped.values():
        skills.sort(key=lambda skill: (skill.get("condLimitCount") or 0, skill.get("priority") or 0))
    return grouped


def official_bond_text(equip: dict) -> str:
    lines = []
    for skills in skill_levels(equip).values():
        top = skills[-1]
        if any(func.get("funcType") == BOND_FUNC for func in top.get("functions") or []):
            detail = clean_detail(top.get("detail") or "")
            if detail:
                lines.append(detail)
    return "／".join(lines)


def support_rates(low: dict, high: dict) -> list[int | float] | None:
    patterns = (
        r"サポート時は(\d+(?:\.\d+)?)%",
        r"助战时(?:为|是)?(\d+(?:\.\d+)?)%",
    )
    found = []
    for skill in (low, high):
        detail = skill.get("detail") or ""
        value = None
        for pattern in patterns:
            match = re.search(pattern, detail)
            if match:
                value = num(match.group(1))
                break
        found.append(value)
    if found[0] is None or found[1] is None:
        return None
    return found


def event_name(value: dict, equip: dict, cn_equip: dict | None) -> str:
    if "EventId" not in value:
        return ""
    source = cn_equip or equip
    blob = " ".join((skill.get("detail") or "") for skill in source.get("skills") or [])
    match = re.search(r"『([^』]+)』", blob) or re.search(r"「([^」]+)」", blob)
    if match:
        return match.group(1)
    return f"活动 {value['EventId']}"


def bond_parts(equip: dict, cn_equip: dict | None) -> list[dict]:
    by_num: dict = {}
    for skill in equip.get("skills") or []:
        for func in skill.get("functions") or []:
            if func.get("funcType") == BOND_FUNC:
                by_num.setdefault(skill.get("num"), []).append((skill, func))
    parts = []
    for entries in by_num.values():
        entries.sort(key=lambda item: (item[0].get("condLimitCount") or 0, item[0].get("priority") or 0))
        skill_low, func_low = entries[0]
        skill_high, func_high = entries[-1]
        low = (func_low.get("svals") or [{}])[0]
        high = (func_high.get("svals") or [{}])[0]
        if "RateCount" in low or "RateCount" in high:
            flat = False
            base = num(low.get("RateCount", 0) / 10)
            mlb = num(high.get("RateCount", 0) / 10)
        else:
            flat = True
            base = num(low.get("AddCount", 0))
            mlb = num(high.get("AddCount", 0))
        if func_low.get("functvals"):
            traits = [[trait["id"]] for trait in sorted(func_low["functvals"], key=lambda trait: trait["id"])]
            # 去重并保持 id 序
            seen = set()
            uniq = []
            for clause in traits:
                if clause[0] in seen:
                    continue
                seen.add(clause[0])
                uniq.append(clause)
            traits = uniq
        else:
            traits = [
                [trait["id"] for trait in clause]
                for clause in (func_low.get("overWriteTvalsList") or [])
                if clause
            ]
        if not traits:
            continue
        scope = "self" if func_low.get("funcTargetType") == "self" or low.get("Target") == 1 else "party"
        notes = []
        if low.get("ApplySupportSvt") == 0:
            notes.append("助战位无效")
        actors = skill_low.get("actIndividuality") or []
        if actors:
            notes.append("act:" + ",".join(str(actor.get("id")) for actor in actors))
        parts.append({
            "flat": flat,
            "base": base,
            "mlb": mlb,
            "traits": traits,
            "scope": scope,
            "notes_raw": notes,
            "actors": actors,
            "support": support_rates(skill_low, skill_high),
            "event": event_name(low, equip, cn_equip),
            "eventId": low.get("EventId"),
        })
    return parts


def build() -> dict:
    exports = load_exports()
    translations = load_translations()
    jp_servants = exports["JP_nice_servant.json"]
    cn_servants = exports["CN_nice_servant.json"]
    jp_equips = exports["JP_nice_equip.json"]
    cn_equips = exports["CN_nice_equip.json"]

    def playable(rows):
        return [row for row in rows if row.get("type") in ("normal", "heroine") and row.get("collectionNo", 0) > 0]

    cn_servant_by_id = {row["id"]: row for row in playable(cn_servants)}
    servants = playable(jp_servants)
    servants.sort(key=lambda row: row["collectionNo"])
    servant_by_id = {row["id"]: row for row in servants}
    servant_ids = set(servant_by_id)
    forms = {row["id"]: servant_forms(row) for row in servants}
    max_forms = max(len(items) for items in forms.values())
    if max_forms > 31:
        raise SystemExit(f"形态数 {max_forms} 超过 31，mask 装不下，需要改存储")

    unknown_classes = sorted({row["className"] for row in servants if row["className"] not in CLASS_CN})
    if unknown_classes:
        print("warning: 未翻译职阶", ", ".join(unknown_classes))

    def display_name(servant_id: int) -> str:
        cn_row = cn_servant_by_id.get(servant_id)
        if cn_row and cn_row.get("name"):
            return cn_row["name"]
        return servant_by_id[servant_id]["name"]

    servant_rows = []
    for row in servants:
        cn_row = cn_servant_by_id.get(row["id"])
        on_cn = cn_row is not None
        servant_rows.append({
            "id": row["id"],
            "no": row["collectionNo"],
            "name": cn_row["name"] if on_cn and cn_row.get("name") else row["name"],
            "nameJp": row["name"],
            "cn": on_cn,
            "classId": row["className"],
            "className": CLASS_CN.get(row["className"], row["className"]),
            "rarity": row.get("rarity") or 0,
            "face": FACE.format(row["id"]),
        })
    order = {row["id"]: index for index, row in enumerate(servant_rows)}

    cn_equip_by_id = {row["id"]: row for row in cn_equips}
    ces = []
    dropped = []
    unknown_traits = set()
    for equip in jp_equips:
        if equip.get("collectionNo", 0) <= 0:
            continue
        cn_equip = cn_equip_by_id.get(equip["id"])
        parts = bond_parts(equip, cn_equip)
        has_bond = any(
            func.get("funcType") == BOND_FUNC
            for skill in equip.get("skills") or []
            for func in skill.get("functions") or []
        )
        if not has_bond:
            continue
        if not parts:
            dropped.append(equip)
            continue
        if cn_equip:
            text = official_bond_text(cn_equip) or official_bond_text(equip)
            text_from = "cn"
        elif equip["id"] in translations:
            text = translations[equip["id"]]
            text_from = "translation"
        else:
            text = official_bond_text(equip)
            text_from = "jp"
        ces.append({
            "id": equip["id"],
            "no": equip["collectionNo"],
            "name": cn_equip["name"] if cn_equip and cn_equip.get("name") else equip["name"],
            "nameJp": equip["name"],
            "cn": bool(cn_equip),
            "rarity": equip.get("rarity") or 0,
            "obtain": OBTAIN_CN.get(equip.get("flag"), equip.get("flag") or ""),
            "face": FACE.format(equip["id"]),
            "text": text,
            "textFrom": text_from,
            "textJp": official_bond_text(equip),
            "parts": parts,
        })

    def trait_name(trait: int) -> str:
        if trait in TRAIT_CN:
            return TRAIT_CN[trait]
        if trait in servant_by_id:
            return display_name(trait) + "本人"
        unknown_traits.add(trait)
        return f"特性{trait}"

    def cond_label(traits: list[list[int]]) -> str:
        clauses = ["·".join(trait_name(trait) for trait in clause) for clause in traits]
        if len(clauses) == 1:
            return clauses[0]
        if all("·" not in clause for clause in clauses):
            return "或".join(clauses)
        return "或".join(f"「{clause}」" for clause in clauses)

    groups: dict[str, dict] = {}
    for ce in ces:
        for part in ce["parts"]:
            key = "|".join(",".join(str(trait) for trait in clause) for clause in part["traits"])
            if key not in groups:
                members = []
                for servant in servant_rows:
                    mask = match_mask(forms[servant["id"]], servant["id"], part["traits"], servant_ids)
                    if mask is None:
                        continue
                    members.append({"id": servant["id"], "mask": mask})
                groups[key] = {
                    "id": key,
                    "label": cond_label(part["traits"]),
                    "ceIds": [],
                    "members": members,
                }
            if ce["id"] not in groups[key]["ceIds"]:
                groups[key]["ceIds"].append(ce["id"])
            label = groups[key]["label"]
            notes = []
            for note in part.pop("notes_raw"):
                if note.startswith("act:"):
                    names = []
                    for actor in part["actors"]:
                        actor_id = actor.get("id")
                        if actor_id in servant_by_id:
                            names.append(display_name(actor_id))
                        else:
                            names.append(str(actor_id))
                    notes.append("仅" + "、".join(names) + "装备时生效")
                else:
                    notes.append(note)
            part.pop("actors", None)
            part["groupId"] = key
            part["notes"] = notes
            support = part["support"]
            part["effect"] = effect_text(part, label, support)
            part.pop("traits", None)
            part.pop("eventId", None)

    ces.sort(key=lambda ce: ce["no"])
    group_rows = [groups[key] for key in sorted(groups)]
    for group in group_rows:
        group["members"].sort(key=lambda member: order[member["id"]])
        group["ceIds"].sort()

    cn_playable = playable(cn_servants)
    cn_latest = max(cn_playable, key=lambda row: row["collectionNo"])
    jp_latest = servants[-1]
    sample_nos = {910, 330, 1121, 99, 2512}
    excluded_sample = []
    for equip in sorted(dropped, key=lambda row: row["collectionNo"]):
        if equip["collectionNo"] not in sample_nos:
            continue
        cn_equip = cn_equip_by_id.get(equip["id"])
        excluded_sample.append(cn_equip["name"] if cn_equip and cn_equip.get("name") else equip["name"])

    payload = {
        "meta": {
            "updated": "",
            "servantCount": len(servant_rows),
            "cnServantCount": len(cn_playable),
            "jpLatest": {"no": jp_latest["collectionNo"], "name": jp_latest["name"], "id": jp_latest["id"]},
            "cnLatest": {"no": cn_latest["collectionNo"], "name": cn_latest["name"], "id": cn_latest["id"]},
            "conditionalCeCount": len(ces),
            "cnCeCount": sum(1 for ce in ces if ce["cn"]),
            "excludedCount": len(dropped),
            "excludedSample": excluded_sample,
            "notes": [
                "只收录带从者条件的通关羁绊加成礼装。全体通用（午茶、午餐、晚餐时光等）和没有从者条件的活动自用礼装已排除。",
                "百分比来自 RateCount，按千分比换算；满破取该技能的最高强化档。固定点数来自 AddCount。",
                "多张礼装、同一张的多份加成按直接相加估算，游戏内是否完全如此以实装为准。助战位若另有数值，会写在该礼装说明里。",
                "带 * 的从者只在部分灵基或灵衣下满足条件。组合结果要求存在同一个灵基同时满足已选的全部条件。",
            ],
        },
        "servants": servant_rows,
        "ces": ces,
        "groups": group_rows,
    }
    verify(payload, unknown_traits)
    print_summary(payload, dropped, cn_equip_by_id)
    return payload


def effect_text(part: dict, label: str, support) -> str:
    who = "装备者自身" if part["scope"] == "self" else "我方全体（含替补）"
    unit = "点" if part["flat"] else "%"
    shown = label if "「" in label else f"「{label}」"
    text = f"{who}中，符合{shown}的从者通关羁绊 +{part['base']}{unit}"
    if part["mlb"] != part["base"]:
        text += f"（满破 +{part['mlb']}{unit}）"
    if support:
        text += f"；助战位 +{support[0]}%（满破 +{support[1]}%）"
    if part["event"]:
        text += f"；仅活动「{part['event']}」期间"
    if part["notes"]:
        text += "；" + "，".join(part["notes"])
    return text


def group_by_label(payload: dict, label: str) -> dict:
    found = [group for group in payload["groups"] if group["label"] == label]
    if len(found) != 1:
        raise SystemExit(f"条件组「{label}」数量不是 1：{len(found)}")
    return found[0]


def member_mask(group: dict, servant_id: int) -> int | None:
    for member in group["members"]:
        if member["id"] == servant_id:
            return member["mask"]
    return None


def verify(payload: dict, unknown_traits: set[int]) -> None:
    errors = []
    meta = payload["meta"]
    if meta["jpLatest"]["no"] < 482:
        errors.append(f"日服最新编号 {meta['jpLatest']['no']} 早于 482")
    if meta["servantCount"] < 470:
        errors.append(f"从者数量 {meta['servantCount']} 少于 470")
    by_no = {ce["no"]: ce for ce in payload["ces"]}
    by_svt = {row["no"]: row for row in payload["servants"]}
    mash = by_svt.get(1)
    if not mash or mash["name"] != "玛修·基列莱特" or mash["id"] != 800100:
        errors.append("玛修数据不对")
    else:
        for label in ("秩序·女性", "秩序·善"):
            mask = member_mask(group_by_label(payload, label), mash["id"])
            if mask != -1:
                errors.append(f"玛修应完全满足「{label}」，实际 mask={mask}")
    expect = {
        2233: ("献给幸福的新娘", 4, 20, "秩序·女性"),
        2052: ("检查报告", 4, 20, "秩序·善"),
        2437: ("异星之神", 4, 20, "星或恶"),
        1949: ("来自ＮＦＦ的爱", 4, 20, "兽科"),
        2607: ("流転の剣聖", 4, 20, "剑阶"),
        2701: ("ガン・ディーラー", 4, 20, "杀阶"),
    }
    for no, (name, base, mlb, label) in expect.items():
        ce = by_no.get(no)
        if not ce:
            errors.append(f"缺少礼装 No.{no}")
            continue
        if ce["name"] != name:
            errors.append(f"No.{no} 名称是 {ce['name']}，期望 {name}")
        part = ce["parts"][0]
        if part["base"] != base or part["mlb"] != mlb:
            errors.append(f"No.{no} 数值 {part['base']}/{part['mlb']}，期望 {base}/{mlb}")
        group = next(group for group in payload["groups"] if group["id"] == part["groupId"])
        if group["label"] != label:
            errors.append(f"No.{no} 条件是 {group['label']}，期望 {label}")
    ce_2509 = by_no.get(2509)
    if not ce_2509:
        errors.append("缺少 No.2509 カルデアの者")
    else:
        group = next(group for group in payload["groups"] if group["id"] == ce_2509["parts"][0]["groupId"])
        if "2858" not in group["id"] or "2801200" not in group["id"] or "301" not in group["id"]:
            errors.append(f"No.2509 条件组异常：{group['id']} {group['label']}")
    fsn = None
    for no in range(1973, 1980):
        ce = by_no.get(no)
        if not ce:
            errors.append(f"缺少英灵逢魔 No.{no}")
            continue
        if ce["parts"][0]["base"] != 10 or ce["parts"][0]["mlb"] != 10:
            errors.append(f"英灵逢魔 No.{no} 不是 +10%")
        group_id = ce["parts"][0]["groupId"]
        fsn = fsn or group_id
        if group_id != fsn:
            errors.append("英灵逢魔系列条件不一致")
    if fsn != "2883":
        errors.append(f"Fate/stay night 条件组 id 是 {fsn}")
    for no in (330, 910, 1121, 2512, 99):
        if no in by_no:
            errors.append(f"不应收录 No.{no} {by_no[no]['name']}")
    hibiki = by_svt.get(416)
    if hibiki:
        mask = member_mask(group_by_label(payload, "秩序·女性"), hibiki["id"])
        if mask in (None, -1):
            errors.append(f"响希＆千键应只在部分灵基满足秩序·女性，mask={mask}")
    daedalus = by_svt.get(meta["jpLatest"]["no"])
    if not daedalus:
        errors.append("最新从者不在列表里")
    if unknown_traits:
        print("warning: 未翻译特性", ", ".join(map(str, sorted(unknown_traits))))
    if errors:
        raise SystemExit("数据校验失败:\n- " + "\n- ".join(errors))
    print("spot checks ok", flush=True)


def print_summary(payload: dict, dropped: list, cn_equip_by_id: dict) -> None:
    meta = payload["meta"]
    print(
        f"从者 {meta['servantCount']}（日服最新 No.{meta['jpLatest']['no']} {meta['jpLatest']['name']}；"
        f"国服最新 No.{meta['cnLatest']['no']} {meta['cnLatest']['name']}）"
    )
    print(
        f"有条件羁绊礼装 {meta['conditionalCeCount']}（国服 {meta['cnCeCount']}），"
        f"排除 {meta['excludedCount']}"
    )
    for group in payload["groups"]:
        partial = sum(1 for member in group["members"] if member["mask"] != -1)
        print(f"  {group['label']}: 从者 {len(group['members'])}（部分灵基 {partial}），礼装 {len(group['ceIds'])}")
    print("排除示例:", "、".join(meta["excludedSample"]))
    for ce in payload["ces"]:
        print(f"  [{ce['no']}] {ce['name']}: " + " | ".join(part["effect"] for part in ce["parts"]))


def canonical(payload: dict) -> str:
    clone = json.loads(json.dumps(payload, ensure_ascii=False))
    clone.get("meta", {}).pop("updated", None)
    return json.dumps(clone, ensure_ascii=False, sort_keys=True, separators=(",", ":"))


def main() -> None:
    payload = build()
    os.makedirs(os.path.dirname(OUT), exist_ok=True)
    if os.path.exists(OUT):
        with open(OUT, encoding="utf-8") as fh:
            previous = json.load(fh)
        if canonical(previous) == canonical(payload):
            print(f"unchanged {OUT}")
            return
        payload["meta"]["updated"] = previous.get("meta", {}).get("updated") or ""
    payload["meta"]["updated"] = datetime.datetime.now(datetime.timezone.utc).strftime("%Y-%m-%d %H:%M UTC")
    tmp = OUT + ".tmp"
    with open(tmp, "w", encoding="utf-8") as fh:
        json.dump(payload, fh, ensure_ascii=False, indent=2)
        fh.write("\n")
    os.replace(tmp, OUT)
    print(f"wrote {OUT}")


if __name__ == "__main__":
    main()
