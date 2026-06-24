#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Vérifie un CSV d'événements Kasuku AVANT import en masse.
- Valide les champs (titre, resume>=40, date présente, dateISO, codePays, thèmes, sources).
- Teste chaque imageUrl : HTTP 200 (suit les redirections) + blocklist (cartes/drapeaux/svg/tif).
- Recommande une longue description (contenu) substantielle.

Usage : python3 verifier_csv.py mon_lot.csv
Sortie : rapport par ligne + résumé. Code de sortie ≠ 0 s'il reste des ERREURS bloquantes.
"""
import csv, sys, urllib.request, urllib.error
from urllib.parse import urlsplit, urlunsplit, quote

UA = "KasukuCuration/1.0 (https://kasuku.afrikia.org)"
VALID_THEMES = {"histoire","politique","culture","personnages","geographie","science","spiritualite","sport"}
IMG_REJECT = ("in_its_region","locator","orthographic","location_map","map_of","_map.","flag_of",
              "coat_of_arms","blank_map","world_map","ll-q")
REQUIRED_HEADERS = ["titre","resume"]

def norm(u):
    s = urlsplit(u)
    return urlunsplit((s.scheme, s.netloc, quote(s.path, safe="/()%:@-._~"), s.query, ""))

def http_ok(url):
    try:
        req = urllib.request.Request(norm(url), headers={"User-Agent": UA})
        with urllib.request.urlopen(req, timeout=30) as r:
            r.read(1)
            return r.status
    except urllib.error.HTTPError as e:
        return e.code
    except Exception:
        return -1

def check_row(row, n):
    errs, warns = [], []
    g = lambda k: (row.get(k) or "").strip()
    titre, resume, contenu = g("titre"), g("resume"), g("contenu")
    if len(titre) < 3: errs.append("titre manquant (<3 car.)")
    if len(resume) < 40: errs.append(f"resume trop court ({len(resume)}/40 car.)")
    if not (g("dateiso") or g("annee") or g("periode")):
        errs.append("aucune date (renseigner dateISO, annee ou periode)")
    di = g("dateiso")
    if di:
        import re
        if not re.match(r"^\d{4}-\d{2}-\d{2}$", di): errs.append(f"dateISO invalide '{di}' (AAAA-MM-JJ)")
    cc = g("codepays")
    if cc and len(cc) != 2: errs.append(f"codePays invalide '{cc}' (2 lettres ISO)")
    # thèmes
    themes = [t.strip() for t in g("slugsthemes").split(",") if t.strip()]
    if not themes: warns.append("aucun thème (slugsThemes vide)")
    for t in themes:
        if t not in VALID_THEMES: warns.append(f"thème inconnu '{t}' (sera ignoré à l'import)")
    # contenu (longue description)
    if not contenu: warns.append("contenu (longue description) vide — fortement recommandé")
    elif len(contenu) < 300: warns.append(f"contenu court ({len(contenu)} car.) — viser 600–1200")
    # sources
    if bool(g("sourcelabel")) != bool(g("sourceurl")):
        warns.append("source incomplète (sourceLabel ET sourceUrl requis ensemble)")
    elif not g("sourcelabel"):
        warns.append("aucune source")
    # image
    img = g("imageurl")
    if img:
        low = img.lower().split("/")[-1]
        if low.endswith((".svg",".tif",".tiff")):
            errs.append(f"imageUrl format non rendu ({low[-5:]}) — préférer .jpg/.png")
        elif any(b in low for b in IMG_REJECT):
            errs.append(f"imageUrl suspecte (carte/drapeau/LL) : {low[:50]}")
        else:
            st = http_ok(img)
            if st != 200: errs.append(f"imageUrl HTTP {st} (doit être 200) : {low[:50]}")
    else:
        warns.append("imageUrl vide — une image de couverture vérifiée est recommandée")
    return errs, warns

def main():
    if len(sys.argv) < 2:
        print("Usage: python3 verifier_csv.py mon_lot.csv"); sys.exit(2)
    path = sys.argv[1]
    with open(path, newline="", encoding="utf-8-sig") as f:
        reader = csv.DictReader(f)
        headers = [h.strip().lower() for h in (reader.fieldnames or [])]
        reader.fieldnames = headers
        rows = list(reader)
    missing = [h for h in REQUIRED_HEADERS if h not in headers]
    if missing:
        print(f"❌ En-têtes manquants : {missing}"); sys.exit(2)

    total_err = total_warn = 0
    slugs = {}
    print(f"== Vérification de {len(rows)} ligne(s) : {path} ==\n")
    for i, row in enumerate(rows, 1):
        errs, warns = check_row(row, i)
        # doublon de slug dans le fichier
        sl = (row.get("slug") or "").strip()
        if sl:
            if sl in slugs: errs.append(f"slug en doublon (déjà ligne {slugs[sl]})")
            else: slugs[sl] = i
        total_err += len(errs); total_warn += len(warns)
        if errs or warns:
            print(f"Ligne {i} — {(row.get('titre') or '?')[:50]}")
            for e in errs:  print(f"   ❌ {e}")
            for w in warns: print(f"   ⚠️  {w}")
    print(f"\n== Résumé : {len(rows)} lignes · {total_err} erreur(s) · {total_warn} avertissement(s) ==")
    if total_err:
        print("❌ Corriger les ERREURS avant d'importer.")
        sys.exit(1)
    print("✅ Aucune erreur bloquante. (Vérifier tout de même la PERTINENCE des images : un 200 ne garantit pas le bon sujet.)")

if __name__ == "__main__":
    main()
