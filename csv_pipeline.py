import os
import json
import uuid
import re
from pathlib import Path
from typing import Dict, Any, List

import pandas as pd
from dotenv import load_dotenv
from supabase import create_client, Client


BASE_DIR = Path(__file__).parent
PRIVACY_CONFIG_PATH = BASE_DIR / "privacy_config.json"
TAXONOMY_CONFIG_PATH = BASE_DIR / "taxonomy_config.json"


def load_json_config(path: Path, default: Dict[str, Any]) -> Dict[str, Any]:
    if not path.exists():
        return default
    try:
        with path.open("r", encoding="utf-8") as f:
            return json.load(f)
    except Exception:
        return default


def init_supabase() -> Client:
    load_dotenv()
    url = os.getenv("SUPABASE_URL")
    key = os.getenv("SUPABASE_PUBLISHABLE_KEY")
    if not url or not key:
        raise RuntimeError("SUPABASE_URL ou SUPABASE_PUBLISHABLE_KEY manquant dans .env")
    return create_client(url, key)


def basic_clean_row(row: Dict[str, Any]) -> Dict[str, Any]:
    """Nettoyage générique : trim des chaînes, suppression des champs vides."""
    cleaned = {}
    for k, v in row.items():
        if isinstance(v, str):
            v2 = v.strip()
            if v2 == "":
                continue
            cleaned[k] = v2
        else:
            if v is None:
                continue
            cleaned[k] = v
    return cleaned


def apply_rgpd(row: Dict[str, Any], privacy_cfg: Dict[str, Any]) -> Dict[str, Any]:
    """
    Applique des règles RGPD simples en fonction d'une config JSON.
    Exemple de config (privacy_config.json) :
    {
      "personal_fields": ["email", "name", "phone"],
      "drop_fields": ["phone"],
      "hash_fields": ["email"]
    }
    """
    import hashlib

    drop_fields = set(privacy_cfg.get("drop_fields", []))
    hash_fields = set(privacy_cfg.get("hash_fields", []))

    processed = {}
    for k, v in row.items():
        # Si ce champ doit être supprimé
        if k in drop_fields:
            continue

        # Si ce champ doit être haché
        if k in hash_fields and isinstance(v, str):
            h = hashlib.sha256(v.encode("utf-8")).hexdigest()
            processed[k] = h
            continue

        # Sinon, garder la valeur telle quelle
        processed[k] = v

    # Optionnel : marquer qu'un traitement RGPD a été appliqué
    processed["_rgpd_processed"] = True
    return processed


def clean_transcription(text: str, language: str | None = None) -> str:
    """
    Nettoie une transcription textuelle (FR/EN/IT) :
    - supprime des tics de langage / mots parasites courants,
    - normalise les espaces,
    - laisse la ponctuation utile.
    """
    if not isinstance(text, str):
        return ""

    original = text

    # Liste simple de mots / expressions parasites multilingues
    filler_phrases = [
        # FR
        "euh", "bah", "ben", "du coup", "en fait", "voilà", "quoi", "genre",
        "tu vois", "tu sais", "hein",
        # EN
        "uh", "um", "you know", "i mean", "like", "kind of", "sort of",
        "basically", "so yeah",
        # IT
        "allora", "diciamo", "tipo"
    ]

    cleaned = text
    for phrase in filler_phrases:
        pattern = r"\b" + re.escape(phrase) + r"\b"
        cleaned = re.sub(pattern, " ", cleaned, flags=re.IGNORECASE)

    # Normalisation des espaces
    cleaned = re.sub(r"\s+", " ", cleaned)
    # Espace avant la ponctuation : enlever les espaces avant . , ; : ! ?
    cleaned = re.sub(r"\s+([.,;:!?])", r"\1", cleaned)

    cleaned = cleaned.strip()

    # Si on a trop "cassé" le texte, on garde l'original en fallback
    return cleaned or original


def ingest_csv_local(csv_path: str) -> List[Dict[str, Any]]:
    """
    Lit un CSV (colonnes dynamiques) et renvoie une liste de dicts nettoyés + RGPD-ready.
    Pour l'instant, cette fonction ne pousse pas encore vers Supabase : elle prépare les données.
    """
    privacy_cfg = load_json_config(
        PRIVACY_CONFIG_PATH,
        default={
            "personal_fields": [],
            "drop_fields": [],
            "hash_fields": [],
        },
    )

    df = pd.read_csv(csv_path)
    records: List[Dict[str, Any]] = []

    for _, row in df.iterrows():
        row_dict = row.to_dict()
        cleaned = basic_clean_row(row_dict)
        rgpd_row = apply_rgpd(cleaned, privacy_cfg)
        records.append(rgpd_row)

    return records


def upload_csv_to_storage(client: Client, csv_path: str, bucket: str = "datasets") -> str:
    """
    Upload le fichier CSV dans Supabase Storage et renvoie le chemin (key) dans le bucket.
    Nécessite que le bucket existe déjà dans Supabase.
    """
    csv_path_obj = Path(csv_path)
    file_key = f"{uuid.uuid4()}_{csv_path_obj.name}"
    with csv_path_obj.open("rb") as f:
        res = client.storage.from_(bucket).upload(file_key, f.read(), {"content-type": "text/csv"})
    if isinstance(res, dict) and res.get("error"):
        raise RuntimeError(f"Erreur upload Storage: {res['error']}")
    return file_key


def import_lvmh_transcripts_to_supabase(csv_path: str) -> None:
    """
    Pipeline spécifique pour ton CSV LVMH_Realistic_Merged_CA001-100 :
    - crée un enregistrement dans datasets
    - insère chaque ligne dans client_notes avec transcription nettoyée
    """
    client = init_supabase()

    df = pd.read_csv(csv_path)
    row_count = len(df)

    # 1) Créer un dataset
    dataset_name = Path(csv_path).name
    dataset_response = client.table("datasets").insert(
        {
            "name": dataset_name,
            "source": "csv_upload",
            "row_count": row_count,
            "status": "uploaded",
        }
    ).execute()

    if not dataset_response.data or len(dataset_response.data) == 0:
        raise RuntimeError(f"Erreur insertion datasets: {dataset_response}")

    dataset_id = dataset_response.data[0]["id"]

    # 2) Préparer les notes
    notes: List[Dict[str, Any]] = []
    for _, row in df.iterrows():
        row_dict = row.to_dict()
        external_id = str(row_dict.get("ID") or "")
        language = str(row_dict.get("Language") or "").upper() or None
        transcription_raw = str(row_dict.get("Transcription") or "")
        transcription_clean = clean_transcription(transcription_raw, language)

        notes.append(
            {
                "dataset_id": dataset_id,
                "external_id": external_id,
                "note_text": transcription_clean,
                "language": language,
            }
        )

    # 3) Insérer dans client_notes (en une ou plusieurs fois selon la taille)
    if notes:
        # Insérer par batch de 100 pour éviter les timeouts
        batch_size = 100
        for i in range(0, len(notes), batch_size):
            batch = notes[i : i + batch_size]
            insert_res = client.table("client_notes").insert(batch).execute()
            if not insert_res.data:
                raise RuntimeError(f"Erreur insertion client_notes batch {i}: {insert_res}")

    print(f"Import terminé : {row_count} lignes insérées dans client_notes pour le dataset {dataset_id}.")


def main_demo(csv_path: str):
    """
    Démo : upload du CSV dans Storage + création du dataset + insertion
    des transcriptions nettoyées dans client_notes.
    """
    client = init_supabase()

    print(f"Upload du CSV dans Storage : {csv_path}")
    try:
        storage_key = upload_csv_to_storage(client, csv_path, bucket="datasets")
        print(f"Fichier CSV uploadé dans Storage, key = {storage_key}")
    except Exception as e:
        print("Erreur lors de l'upload dans Storage (bucket 'datasets') :")
        print(e)

    print("Import des transcriptions dans Supabase (datasets + client_notes)...")
    import_lvmh_transcripts_to_supabase(csv_path)


if __name__ == "__main__":
    # Exemple d'utilisation : ton CSV LVMH réel
    example_csv = "LVMH_Realistic_Merged_CA001-100 (2).csv"
    if Path(example_csv).exists():
        main_demo(example_csv)
    else:
        print("Modifie csv_pipeline.py pour mettre le chemin réel de ton CSV dans 'example_csv'.")

