#!/usr/bin/env python3
"""Rafraichit data/base-000.json depuis RappelConso (open data DGCCRF)."""
import json
import re
import time
import gzip
import urllib.request
import urllib.parse
from pathlib import Path
from datetime import datetime, timezone

DATA = Path(__file__).resolve().parents[1] / "data"
DATA.mkdir(exist_ok=True)
FIRE = re.compile(r"incendie|feu\b|flamme|embras|brulure|inflamm", re.I)
API = ("https://data.economie.gouv.fr/api/explore/v2.1/catalog/datasets/"
       "rappelconso-v2-gtin-espaces/records")
WHERE = 'categorie_produit="automobiles et moyens de déplacement"'


def fetch(url):
    req = urllib.request.Request(url, headers={
        "User-Agent": "KevTechFire/1.0", "Accept-Encoding": "gzip"})
    with urllib.request.urlopen(req, timeout=45) as r:
        d = r.read()
        if r.headers.get("Content-Encoding") == "gzip":
            d = gzip.decompress(d)
        return json.loads(d)


def main():
    out, offset = [], 0
    while offset < 4000:
        url = API + "?" + urllib.parse.urlencode({
            "where": WHERE, "limit": 100, "offset": offset,
            "order_by": "date_publication desc"})
        try:
            j = fetch(url)
        except Exception as ex:
            print("Arret reseau :", ex)
            break
        rows = j.get("results", [])
        if not rows:
            break
        for r in rows:
            text = " ".join(str(r.get(k) or "") for k in
                            ("motif_rappel", "risques_encourus",
                             "description_complementaire_risque"))
            fire = bool(FIRE.search(text))
            years = [int(y) for y in re.findall(
                r"(?:19|20)\d{2}", str(r.get("modeles_ou_references") or ""))]
            out.append({
                "id": "rc-" + str(r.get("numero_fiche") or len(out)),
                "themes": ["technique"] + (["incendie"] if fire else []),
                "type": "rappel", "source": "rappelconso",
                "make": (r.get("marque_produit") or "").title(),
                "model": r.get("modeles_ou_references") or "",
                "engine": "",
                "years": [min(years), max(years)] if years else None,
                "fuel": "", "sys": r.get("sous_categorie_produit") or "",
                "dtc": [], "sym": [],
                "title": (r.get("libelle") or r.get("motif_rappel") or "Rappel")[:300],
                "meca": r.get("motif_rappel") or "",
                "cons": [r.get("risques_encourus") or ""],
                "ind": [], "fire": fire,
                "chain": ("Rappel officiel : " + text[:240]) if fire else "",
                "grav": "critique" if fire else "eleve",
                "url": r.get("lien_vers_la_fiche_rappel") or "",
                "date": (r.get("date_publication") or "")[:10],
            })
        offset += 100
        if offset >= j.get("total_count", 0):
            break
        time.sleep(0.25)

    if not out:
        print("Aucune donnee recuperee - fichiers existants conserves.")
        return

    (DATA / "base-000.json").write_text(
        json.dumps(out, ensure_ascii=False), encoding="utf-8")
    version = datetime.now(timezone.utc).strftime("%Y%m%d-%H%M")
    (DATA / "index.json").write_text(json.dumps({
        "version": version, "chunks": ["base-000.json"],
        "stats": {"fiches": len(out),
                  "incendie": sum(1 for e in out if e["fire"])}
    }, ensure_ascii=False), encoding="utf-8")
    print("%d rappels publies - version %s" % (len(out), version))


if __name__ == "__main__":
    main()
