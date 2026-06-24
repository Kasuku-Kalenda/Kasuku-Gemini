#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Recadre une image (optionnel) et la téléverse sur MinIO via l'API d'upload Kasuku.
Sert à fabriquer des COUVERTURES à partir de photos fournies (ex. panneaux d'exposition)
quand aucune image libre pertinente n'existe (cf. MISSION_JOJ_DAKAR_2026.md §6, SKILL.md §4).

Sécurité : ce script n'utilise JAMAIS le mot de passe. Il attend un **token admin** déjà obtenu,
fourni via la variable d'environnement KASUKU_TOKEN.

1) Obtenir un token (à faire par l'opérateur, le mot de passe ne transite pas par le script) :
   export KPW='<mot de passe admin>'   # INITIAL_ADMIN_PASSWORD
   export KASUKU_TOKEN=$(python3 -c "import os,json;print(json.dumps({'email':'kasukukalenda@gmail.com','password':os.environ['KPW']}))" \
       | curl -s https://staging.kasuku.afrikia.org/api/v1/auth/login -H 'Content-Type: application/json' --data @- \
       | python3 -c "import sys,json;print(json.load(sys.stdin)['accessToken'])")
   unset KPW

2) Recadrer + uploader :
   python3 recadrer_uploader.py --src panneau.jpg --box 0.45,0.03,0.99,0.85 --folder events
   # --box = fractions left,top,right,bottom (0..1). Omettre --box pour uploader l'image entière.
   # Affiche l'URL /storage/... à mettre dans la colonne imageUrl du CSV.
"""
import argparse, os, sys, urllib.request, mimetypes, io

API = os.environ.get("KASUKU_API", "https://staging.kasuku.afrikia.org/api/v1")

def crop(src, box, out):
    from PIL import Image
    im = Image.open(src); w, h = im.size
    if box:
        l, t, r, b = [float(x) for x in box.split(",")]
        # fractions (0..1) sinon pixels
        if max(l, t, r, b) <= 1.0:
            l, t, r, b = int(l*w), int(t*h), int(r*w), int(b*h)
        im = im.crop((int(l), int(t), int(r), int(b)))
    if im.mode != "RGB":
        im = im.convert("RGB")
    im.save(out, "JPEG", quality=88)
    return out, im.size

def upload(path, folder, token):
    boundary = "----kasuku" + os.urandom(8).hex()
    fn = os.path.basename(path)
    body = io.BytesIO()
    body.write(f"--{boundary}\r\n".encode())
    body.write(f'Content-Disposition: form-data; name="file"; filename="{fn}"\r\n'.encode())
    body.write(b"Content-Type: image/jpeg\r\n\r\n")
    body.write(open(path, "rb").read())
    body.write(f"\r\n--{boundary}--\r\n".encode())
    req = urllib.request.Request(
        f"{API}/upload?folder={folder}", data=body.getvalue(), method="POST",
        headers={"Authorization": f"Bearer {token}",
                 "Content-Type": f"multipart/form-data; boundary={boundary}"})
    with urllib.request.urlopen(req, timeout=60) as r:
        import json
        return json.load(r)

def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--src", required=True)
    ap.add_argument("--box", help="left,top,right,bottom (fractions 0..1 ou pixels)")
    ap.add_argument("--folder", default="events")
    ap.add_argument("--out", default="/tmp/_kasuku_crop.jpg")
    args = ap.parse_args()
    token = os.environ.get("KASUKU_TOKEN")
    if not token:
        sys.exit("❌ KASUKU_TOKEN manquant (voir l'en-tête du script pour l'obtenir).")
    out, size = crop(args.src, args.box, args.out)
    print(f"recadré → {out} {size}")
    res = upload(out, args.folder, token)
    print("✅ URL:", res.get("url") or res)

if __name__ == "__main__":
    main()
