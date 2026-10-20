"""MoneyBall: actualiza data.json con datos públicos de futbolfantasy.com.

Lo corre GitHub Actions varias veces al día. Si una sección falla, se conserva
la versión anterior de esa sección en lugar de dejar la página vacía.
"""
import json
import math
import re
import sys
import time
import traceback
import unicodedata
from datetime import datetime, timedelta, timezone
from pathlib import Path
from zoneinfo import ZoneInfo

import requests
from bs4 import BeautifulSoup

ROOT = Path(__file__).resolve().parent.parent
DATA = ROOT / "data.json"
HIST = ROOT / "scraper" / "history.json"
IDS = ROOT / "scraper" / "ids.json"
LOG = ROOT / "scraper" / "last_run.txt"

BASE = "https://www.futbolfantasy.com"
MADRID = ZoneInfo("Europe/Madrid")
MEXICO = ZoneInfo("America/Mexico_City")
NOW = datetime.now(timezone.utc)
TODAY_MX = NOW.astimezone(MEXICO).date().isoformat()

S = requests.Session()
S.headers.update({
    "User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 "
                  "(KHTML, like Gecko) Chrome/129.0 Safari/537.36",
    "Accept-Language": "es-ES,es;q=0.9",
})

LOGLINES = []


def log(*a):
    msg = " ".join(str(x) for x in a)
    print(msg, flush=True)
    LOGLINES.append(msg)


def norm(s):
    s = unicodedata.normalize("NFD", str(s or "")).encode("ascii", "ignore").decode()
    return re.sub(r"\s+", " ", s.lower()).strip()


def slug(s):
    return re.sub(r"[^a-z0-9]+", "-", norm(s)).strip("-")


TEAMS = {
    "ALA": ("Alavés", ["alaves"]),
    "ATH": ("Athletic Club", ["athletic", "athletic club", "athletic bilbao"]),
    "ATM": ("Atlético de Madrid", ["atletico", "atletico de madrid", "atletico madrid", "atleti"]),
    "BAR": ("FC Barcelona", ["barcelona", "fc barcelona", "barca"]),
    "RBB": ("Real Betis", ["betis", "real betis"]),
    "RCC": ("Celta de Vigo", ["celta", "celta de vigo"]),
    "DEP": ("Deportivo", ["deportivo", "depor", "deportivo de la coruna", "rc deportivo"]),
    "ELC": ("Elche", ["elche"]),
    "ESP": ("Espanyol", ["espanyol"]),
    "GET": ("Getafe", ["getafe"]),
    "LEV": ("Levante", ["levante"]),
    "MCF": ("Málaga", ["malaga", "malaga cf"]),
    "OSA": ("Osasuna", ["osasuna"]),
    "RAC": ("Racing", ["racing", "racing de santander", "racing santander"]),
    "RVC": ("Rayo Vallecano", ["rayo", "rayo vallecano"]),
    "RMA": ("Real Madrid", ["real madrid", "madrid"]),
    "RSO": ("Real Sociedad", ["real sociedad", "la real"]),
    "SEV": ("Sevilla", ["sevilla"]),
    "VCF": ("Valencia", ["valencia"]),
    "VIL": ("Villarreal", ["villarreal"]),
}
ALIAS = {}
for ab, (_, names) in TEAMS.items():
    for n in names:
        ALIAS[n] = ab
        ALIAS[n.replace(" ", "-")] = ab


def team_abbr(name):
    n = norm(name).replace("-", " ").strip()
    if n in ALIAS:
        return ALIAS[n]
    n2 = n.replace(" ", "-")
    return ALIAS.get(n2)


def team_in_text(text):
    t = " " + norm(text) + " "
    found = []
    # longer aliases first so "real madrid" wins over "madrid"
    for alias in sorted(ALIAS, key=len, reverse=True):
        if "-" in alias or len(alias) < 4:
            continue
        if re.search(r"\b" + re.escape(alias) + r"\b", t):
            ab = ALIAS[alias]
            if ab not in found:
                found.append(ab)
            t = t.replace(alias, " ")
    return found[0] if found else None


def get(path, tries=3):
    url = path if path.startswith("http") else BASE + path
    for i in range(tries):
        try:
            r = S.get(url, timeout=60)
            if r.status_code == 200 and len(r.text) > 5000:
                return r.text
            log(f"  {url} -> {r.status_code} ({len(r.text)} bytes)")
        except Exception as e:  # noqa: BLE001
            log(f"  {url} -> {e}")
        time.sleep(3 + 4 * i)
    raise RuntimeError(f"no se pudo descargar {url}")


def soup(html):
    return BeautifulSoup(html, "lxml")


def num(x, default=None):
    try:
        if x is None or x == "":
            return default
        return float(str(x).replace(",", "."))
    except ValueError:
        return default


def load_json(p, default):
    try:
        return json.loads(Path(p).read_text())
    except Exception:  # noqa: BLE001
        return default


# --------------------------------------------------------------- mercado
POS = {"POR": "POR", "DEF": "DEF", "MED": "MED", "DEL": "DEL"}


def parse_mercado():
    sp = soup(get("/analytics/laliga-fantasy/mercado"))
    out = {}
    team_ids = {}
    for tr in sp.select("tr.elemento_jugador"):
        ffid = tr.get("data-id")
        if not ffid:
            continue
        a = tr.select_one(".player-foto-container a")
        pos = None
        for c in (a.get("class") if a else []) or []:
            if c.startswith("icon-") and c[5:] in POS:
                pos = POS[c[5:]]
        if not pos:
            continue
        nm = tr.select_one(".player-name .d-md-inline") or tr.select_one(".player-name")
        name = nm.get_text(" ", strip=True) if nm else tr.get("data-nombre", "").title()
        tm = tr.select_one(".player-equipo span")
        team = team_abbr(tm.get_text(strip=True)) if tm else None
        if not team:
            continue
        team_ids[tr.get("data-equipo")] = team
        vals = [int(num(tr.get(k), 0)) for k in
                ("data-valor30", "data-valor14", "data-valor7", "data-valor3", "data-valor1", "data-valor")]
        if vals[-1] <= 0:
            continue
        tds = tr.find_all("td", recursive=False)
        prob, home, rival = None, None, None
        rc = tr.select_one("td.rival-cell")
        if rc is None and len(tds) >= 6:
            rc = tds[5]
        if rc is not None:
            m = re.search(r"(\d+)\s*%", rc.get_text(" ", strip=True))
            prob = int(m.group(1)) if m else None
            home = ("🏠" in rc.get_text()) or bool(rc.select_one('[aria-label="Casa"]'))
            tnode = rc.select_one("[title]")
            ttl = tnode.get("title", "") if tnode else ""
            m2 = re.search(r"rival:\s*(.+?)\s*\((Casa|Fuera)\)", ttl)
            if m2:
                rival = team_abbr(m2.group(1))
                home = m2.group(2) == "Casa"
        out[ffid] = {
            "ffid": ffid, "name": name, "pos": pos, "team": team,
            "hist": vals, "value": vals[-1], "change": vals[-1] - vals[-2],
            "prob": prob, "home": bool(home), "rival": rival,
        }
    log(f"mercado: {len(out)} jugadores")
    if len(out) < 300:
        raise RuntimeError("mercado con muy pocos jugadores")
    return out


def parse_puntos():
    sp = soup(get("/analytics/laliga-fantasy/puntos"))
    out = {}
    for tr in sp.select("tr.elemento_jugador"):
        m = re.search(r"openPlayerPointsStats\((\d+)", tr.get("onclick", ""))
        if not m:
            continue
        g = tr.get
        out[m.group(1)] = {
            "points": int(num(g("data-puntostemporada"), 0)),
            "pj": int(num(g("data-temporada"), 0)),
            "avg": num(g("data-mediatemporada"), 0.0),
            "p5": int(num(g("data-puntos5"), 0)),
            "j5": int(num(g("data-jugados5"), 0)),
            "p3": int(num(g("data-puntos3"), 0)),
            "p1": int(num(g("data-puntos1"), 0)),
            "j1": int(num(g("data-jugados1"), 0)),
        }
    log(f"puntos: {len(out)} jugadores")
    if len(out) < 200:
        raise RuntimeError("puntos con muy pocos jugadores")
    return out


# --------------------------------------------------------------- bajas
def section_team(el):
    sec = el.find_parent("section")
    if not sec:
        return None
    h = sec.select_one("header .v3-widget-header__label a, header a, header")
    if not h:
        return None
    href = h.get("href", "") if h.name == "a" else ""
    m = re.search(r"/equipos/([a-z0-9-]+)", href)
    return team_abbr(m.group(1)) if m else team_abbr(h.get_text(strip=True))


def parse_bajas():
    out = []
    sp = soup(get("/laliga/lesionados"))
    for el in sp.select(".elemento.lesionado"):
        team = section_team(el)
        a = el.select_one("a.jugador")
        if not team or not a:
            continue
        pr = el.select_one(".probabilidad-widget")
        m = re.search(r"(\d+)\s*%", pr.get_text() if pr else "")
        prob = int(m.group(1)) if m else 0
        typ = el.select_one(".comentario .lesion")
        ret = el.select_one(".rounded-card__status")
        out.append({
            "id": slug(a.get_text()) + "-" + team.lower(),
            "player": a.get_text(" ", strip=True), "team": team,
            "type": typ.get_text(" ", strip=True) if typ else "Lesión",
            "ret": ret.get_text(" ", strip=True) if ret else "",
            "status": "baja" if prob <= 10 else "duda",
            "prob": prob,
        })
    n_les = len(out)
    sp = soup(get("/laliga/sancionados"))
    for el in sp.select(".elemento.sancionado"):
        team = section_team(el)
        a = el.select_one("a.jugador")
        if not team or not a:
            continue
        typ = el.select_one(".sancion")
        out.append({
            "id": slug(a.get_text()) + "-" + team.lower(),
            "player": a.get_text(" ", strip=True), "team": team,
            "type": "Sanción: " + (typ.get_text(" ", strip=True) if typ else ""),
            "ret": "", "status": "sancion", "prob": 0,
        })
    log(f"bajas: {n_les} lesionados/dudas, {len(out) - n_les} sancionados")
    return out


# --------------------------------------------------------------- clasificación
def parse_clasificacion():
    sp = soup(get("/laliga/clasificacion"))
    tabs = sp.select("table.clasi-comp")
    names_tab = next((t for t in tabs if t.find_parent(class_="clasi-nombre")), None)
    stat_tabs = [t for t in tabs if [th.get_text(strip=True) for th in t.select("thead th")][:2] == ["Pt", "PJ"]]
    if not names_tab or len(stat_tabs) < 3:
        raise RuntimeError("tabla de clasificación no encontrada")
    names = []
    for tr in names_tab.select("tbody tr"):
        a = tr.select_one("a[href*='/equipos/']")
        m = re.search(r"/equipos/([a-z0-9-]+)", a.get("href", "")) if a else None
        names.append(team_abbr(m.group(1)) if m else None)

    def rows(t):
        return [[c.get_text(strip=True) for c in tr.select("td")] for tr in t.select("tbody tr")]

    tot, hom, awa = rows(stat_tabs[0]), rows(stat_tabs[1]), rows(stat_tabs[2])
    teams = []
    for i, ab in enumerate(names):
        if not ab:
            continue

        def st(r):
            return {"pts": int(r[0]), "pj": int(r[1]), "w": int(r[2]), "d": int(r[3]), "l": int(r[4]),
                    "gf": int(r[5]), "gc": int(r[6])}
        t, h, a = st(tot[i]), st(hom[i]), st(awa[i])
        teams.append({"id": ab, "name": TEAMS[ab][0], "rank": i + 1, "w": t["w"], "d": t["d"], "l": t["l"],
                      "pts": t["pts"], "pj": t["pj"], "gf": t["gf"], "gc": t["gc"], "home": h, "away": a})
    log(f"clasificación: {len(teams)} equipos")
    if len(teams) < 18:
        raise RuntimeError("clasificación incompleta")
    return teams


def poisson_probs(teams, home, away):
    T = {t["id"]: t for t in teams}
    if home not in T or away not in T:
        return None
    h, a = T[home], T[away]
    league = sum(t["gf"] for t in teams) / max(1, sum(t["pj"] for t in teams))  # goles por equipo y partido

    def rate(gf, pj):
        k = pj / (pj + 6.0)
        return k * (gf / pj if pj else league) + (1 - k) * league

    att_h = rate(h["home"]["gf"], h["home"]["pj"]) / league
    def_a = rate(a["away"]["gc"], a["away"]["pj"]) / league
    att_a = rate(a["away"]["gf"], a["away"]["pj"]) / league
    def_h = rate(h["home"]["gc"], h["home"]["pj"]) / league
    lh = max(0.2, league * 1.12 * att_h * def_a)
    la = max(0.2, league * 0.90 * att_a * def_h)
    ph = pd = pa = 0.0
    for i in range(11):
        for j in range(11):
            p = math.exp(-lh) * lh ** i / math.factorial(i) * math.exp(-la) * la ** j / math.factorial(j)
            if i > j:
                ph += p
            elif i == j:
                pd += p
            else:
                pa += p
    s = ph + pd + pa
    # mezcla con un reparto base de LaLiga para no exagerar con pocos partidos
    ph, pd, pa = (0.75 * ph / s + 0.25 * 0.45, 0.75 * pd / s + 0.25 * 0.27, 0.75 * pa / s + 0.25 * 0.28)
    return round(100 * ph, 1), round(100 * pd, 1), round(100 * pa, 1)


# --------------------------------------------------------------- jornada y onces
def parse_fecha(txt):
    m = re.search(r"(\d{1,2})/(\d{1,2})\D+(\d{1,2}):(\d{2})", txt or "")
    if not m:
        m2 = re.search(r"(\d{1,2})/(\d{1,2})", txt or "")
        if not m2:
            return None
        d, mo, hh, mi = int(m2.group(1)), int(m2.group(2)), 12, 0
    else:
        d, mo, hh, mi = (int(x) for x in m.groups())
    local_now = NOW.astimezone(MADRID)
    year = local_now.year
    if mo < local_now.month - 6:
        year += 1
    elif mo > local_now.month + 6:
        year -= 1
    dt = datetime(year, mo, d, hh, mi, tzinfo=MADRID)
    return dt.astimezone(timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ")


def parse_jornada(market, ids):
    html = get("/laliga/posibles-alineaciones")
    sp = soup(html)
    m = re.search(r"Jornada\s+(\d+)", sp.get_text(" "))
    jornada = int(m.group(1)) if m else None
    links = sp.select("section.proxjornada a.partido")
    matches, seen = [], set()
    for a in links:
        href = a.get("href", "")
        mm = re.search(r"/partidos/(\d+)-([a-z0-9-]+)", href)
        if not mm or mm.group(1) in seen:
            continue
        tip = a.get("data-tooltip", "")
        if " - " not in tip:
            continue
        h, w = (team_abbr(x) for x in tip.split(" - ", 1))
        if not h or not w:
            continue
        # la jornada son los primeros 10 partidos con equipos distintos
        if any(h in (x["home"], x["away"]) or w in (x["home"], x["away"]) for x in matches):
            break
        seen.add(mm.group(1))
        fecha = a.select_one(".fecha")
        matches.append({"id": mm.group(1) + "-" + mm.group(2), "home": h, "away": w,
                        "date": parse_fecha(fecha.get_text(" ", strip=True) if fecha else ""),
                        "url": href if href.startswith("http") else BASE + href})
        if len(matches) >= 10:
            break
    # partidos aplazados que se juegan antes de la jornada
    first = min((m["date"] for m in matches if m["date"]), default=None)
    now_s = NOW.strftime("%Y-%m-%dT%H:%M:%SZ")
    for a in links:
        href = a.get("href", "")
        mm = re.search(r"/partidos/(\d+)-([a-z0-9-]+)", href)
        tip = a.get("data-tooltip", "")
        if not mm or mm.group(1) in seen or " - " not in tip:
            continue
        fecha = a.select_one(".fecha")
        dt = parse_fecha(fecha.get_text(" ", strip=True) if fecha else "")
        h, w = (team_abbr(x) for x in tip.split(" - ", 1))
        if h and w and dt and first and now_s < dt < first:
            seen.add(mm.group(1))
            matches.append({"id": mm.group(1) + "-" + mm.group(2), "home": h, "away": w, "date": dt,
                            "url": href if href.startswith("http") else BASE + href, "aplazado": True})
    log(f"jornada {jornada}: {len(matches)} partidos")
    if len(matches) < 5:
        raise RuntimeError("no encontré los partidos de la jornada")

    by_ffid = market
    lineups = []
    for mt in matches:
        if mt.get("aplazado"):
            continue
        try:
            sp2 = soup(get(mt["url"]))
        except Exception as e:  # noqa: BLE001
            log(f"  partido {mt['id']}: {e}")
            continue
        xis = {}
        for side, sel in (("homeXI", ".campo-wrapper.local"), ("awayXI", ".campo-wrapper.visitante")):
            wrap = sp2.select_one(sel)
            xi = []
            for c in (wrap.select(".camiseta-wrapper") if wrap else []):
                mid = next((re.match(r"jugador_(\d+)", k) for k in c.get("class", []) if k.startswith("jugador_")), None)
                if not mid:
                    continue
                ffid = mid.group(1)
                img = c.select_one("img.fotozoom")
                name = (img.get("alt") if img else "") or ""
                if not name or "info" in name.lower():
                    name = by_ffid.get(ffid, {}).get("name", "")
                x = num((c.get("data-onceff-x") or "").rstrip("%"), 50)
                y = num((c.get("data-onceff-y") or "").rstrip("%"), 50)
                cam = c.select_one("a.camiseta")
                pr = num(((cam.get("data-probabilidad") if cam else None) or "").rstrip("%"), None)
                xi.append([ffid, name, x, y, int(pr) if pr is not None else None, ids.get(ffid, "ff-" + ffid)])
            xis[side] = xi
        lineups.append({"id": mt["id"], "home": mt["home"], "away": mt["away"], "date": mt["date"],
                        "jornada": jornada, "homeXI": xis.get("homeXI", []), "awayXI": xis.get("awayXI", []),
                        "source": "futbolfantasy.com", "url": mt["url"]})
        time.sleep(1.5)
    log(f"onces: {len(lineups)} partidos, {sum(1 for l in lineups if l['homeXI'] or l['awayXI'])} con once")
    return jornada, matches, lineups


# --------------------------------------------------------------- noticias
SKIP_ICONS = ("futbolfantasy2", "creadores", "cabecera/")


def parse_noticias():
    sp = soup(get("/laliga/noticias"))
    out = []
    for n in sp.select(".list_noticias_wrapper .noticia"):
        a = n.select_one("a.link")
        if not a:
            continue
        href = a.get("href", "")
        m = re.search(r"/noticias/(\d+)-([a-z0-9-]+)", href)
        if not m:
            continue
        img = n.select_one("img")
        icon = (img.get("src") or img.get("data-src") or "") if img else ""
        if any(s in icon for s in SKIP_ICONS):
            continue
        title = a.get_text(" ", strip=True)
        dm = re.match(r"(\d{1,2})/(\d{1,2})", (n.select_one(".date").get_text(strip=True) if n.select_one(".date") else ""))
        date = None
        if dm:
            d, mo = int(dm.group(1)), int(dm.group(2))
            y = NOW.year if mo <= NOW.month + 1 else NOW.year - 1
            try:
                date = datetime(y, mo, d).date().isoformat()
            except ValueError:
                date = None
        if not date or (NOW.date() - datetime.fromisoformat(date).date()).days > 6:
            continue
        typ = "lesion" if re.search(r"lesion|nodisponible|baja|enfermo|sancion", icon) or \
            re.search(r"lesi[oó]n|baja|molestias|duda|sanci[oó]n|roja", title, re.I) else "noticia"
        out.append({"id": m.group(1) + "-" + m.group(2)[:40], "date": date, "type": typ,
                    "team": team_in_text(title), "title": title, "summary": "",
                    "url": href, "source": "FútbolFantasy"})
    out.sort(key=lambda x: (x["date"], x["id"]), reverse=True)
    out = out[:24]
    log(f"noticias: {len(out)}")
    return out


# --------------------------------------------------------------- armado
def main():
    old = load_json(DATA, {})
    old_misc = old.get("misc", {})
    hist = load_json(HIST, {})
    ids = load_json(IDS, {})
    ok = {}

    market = parse_mercado()
    puntos = parse_puntos()

    try:
        bajas = parse_bajas(); ok["bajas"] = True
    except Exception:  # noqa: BLE001
        log("ERROR bajas\n" + traceback.format_exc()); bajas = old_misc.get("injuries", [])
    inj = {}
    for b in bajas:
        inj[(norm(b["player"]), b["team"])] = b

    def find_inj(name, team):
        k = (norm(name), team)
        if k in inj:
            return inj[k]
        n = norm(name)
        for (pn, t), b in inj.items():
            if t == team and (pn in n or n in pn or pn.split(" ")[-1] == n.split(" ")[-1] and len(n.split(" ")) > 1):
                return b
        return None

    main_list, extra = [], []
    stamp = NOW.strftime("%Y-%m-%dT%H:%M:%SZ")
    for ffid, p in market.items():
        pt = puntos.get(ffid)
        st = find_inj(p["name"], p["team"])
        status = st["status"] if st else "ok"
        note = (st["type"] + (" · " + st["ret"] if st.get("ret") else "")) if st else None
        # historial diario
        h = hist.get(ffid, [])
        if not h or h[-1][0] != TODAY_MX:
            h.append([TODAY_MX, p["value"]])
        else:
            h[-1][1] = p["value"]
        hist[ffid] = h[-120:]
        is_main = (pt and pt["pj"] >= 4 and pt["avg"] >= 3.5) or p["value"] >= 8_000_000 or ffid in ids
        if is_main:
            pid = ids.get(ffid) or ("ff-" + ffid)
            ids[ffid] = pid
            rec = {"id": pid, "ffid": ffid, "name": p["name"], "team": p["team"], "pos": p["pos"],
                   "value": p["value"], "change": p["change"], "hist": p["hist"], "prob": p["prob"],
                   "home": p["home"], "status": status, "source": "futbolfantasy.com (Fantasy Analytics)",
                   "updatedAt": stamp, "daily": [{"d": d, "v": v} for d, v in hist[ffid]]}
            if note:
                rec["statusNote"] = note
            if pt:
                rec.update({k: pt[k] for k in ("points", "pj", "avg", "p5", "j5", "p3")})
            main_list.append(rec)
        else:
            stats = [pt["points"], pt["pj"], pt["avg"], pt["p5"], pt["j5"], pt["p3"]] if pt else None
            extra.append([ffid, p["name"], p["pos"], p["team"], [round(v / 1e4) for v in p["hist"]],
                          p["prob"], 1 if p["home"] else 0, stats])
    log(f"jugadores: {len(main_list)} principales, {len(extra)} extra")

    try:
        teams = parse_clasificacion(); ok["clasificacion"] = True
    except Exception:  # noqa: BLE001
        log("ERROR clasificación\n" + traceback.format_exc()); teams = None

    jornada = old_misc.get("meta", {}).get("jornada")
    fixtures, lineups = old_misc.get("fixtures", []), old_misc.get("lineups", [])
    try:
        jornada, matches, lineups = parse_jornada(market, ids); ok["jornada"] = True
        fixtures = []
        for mt in matches:
            f = {"id": f"j{jornada}-{mt['home'].lower()}-{mt['away'].lower()}" + ("-aplazado" if mt.get("aplazado") else ""),
                 "home": mt["home"], "away": mt["away"], "date": mt["date"]}
            pr = poisson_probs(teams, mt["home"], mt["away"]) if teams else None
            if pr:
                f["pHome"], f["pDraw"], f["pAway"] = pr
                f["note"] = "Probabilidad estimada con goles a favor y en contra (local/visitante)."
            fixtures.append(f)
    except Exception:  # noqa: BLE001
        log("ERROR jornada/onces\n" + traceback.format_exc())

    try:
        news = parse_noticias(); ok["noticias"] = True
    except Exception:  # noqa: BLE001
        log("ERROR noticias\n" + traceback.format_exc()); news = old_misc.get("news", [])

    # MVP de la última jornada jugada
    mvps = old_misc.get("mvps", [])
    try:
        played = [(ffid, puntos[ffid]["p1"]) for ffid in market if ffid in puntos and puntos[ffid]["j1"] > 0]
        played.sort(key=lambda x: -x[1])
        if played and jornada:
            lst = [[market[f]["name"], market[f]["team"], market[f]["pos"], p, ids.get(f, "ff-" + f)]
                   for f, p in played[:15]]
            mvps = [{"id": f"j{jornada - 1}", "jornada": jornada - 1, "list": lst,
                     "source": "futbolfantasy.com (puntos LaLiga Fantasy)"}]
            ok["mvps"] = True
    except Exception:  # noqa: BLE001
        log("ERROR mvps\n" + traceback.format_exc())

    if teams is None:
        teams = old_misc.get("teams", [])
    teams_out = [{k: t[k] for k in ("id", "name", "rank", "w", "d", "l", "pts")} for t in teams]

    data = {
        "players": {"list": main_list},
        "roster": {"list": extra, "updatedAt": stamp, "note": "Resto de jugadores del mercado"},
        "misc": {
            "teams": teams_out, "fixtures": fixtures, "injuries": bajas, "lineups": lineups,
            "news": news, "mvps": mvps,
            "meta": {"updatedAt": stamp, "jornada": jornada,
                     "tiers": {"caro": 40_000_000, "medio": 10_000_000},
                     "sources": ["futbolfantasy.com (mercado, puntos, lesionados, sancionados, "
                                 "alineaciones probables, noticias, clasificación)"]},
        },
    }
    DATA.write_text(json.dumps(data, ensure_ascii=False, separators=(",", ":")))
    HIST.write_text(json.dumps(hist, separators=(",", ":")))
    IDS.write_text(json.dumps(ids, ensure_ascii=False, indent=0, sort_keys=True))
    log(f"OK {stamp} secciones: {', '.join(ok)}")


if __name__ == "__main__":
    try:
        main()
    except Exception:  # noqa: BLE001
        log("FALLO GENERAL (data.json no se tocó)\n" + traceback.format_exc())
        LOG.write_text("\n".join(LOGLINES) + "\n")
        sys.exit(1)
    LOG.write_text("\n".join(LOGLINES) + "\n")
