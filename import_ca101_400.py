"""Script pour importer LVMH_Notes_CA101-400 dans Supabase"""
import sys
from pathlib import Path

# Ajouter le répertoire parent au path pour importer csv_pipeline
sys.path.insert(0, str(Path(__file__).parent))

from csv_pipeline import import_lvmh_transcripts_to_supabase

if __name__ == "__main__":
    csv_file = Path(__file__).parent / "LVMH_Notes_CA101-400 (1).csv"
    
    if not csv_file.exists():
        print(f"Erreur: Fichier {csv_file} introuvable")
        sys.exit(1)
    
    print(f"Import du fichier: {csv_file.name}")
    try:
        import_lvmh_transcripts_to_supabase(str(csv_file))
        print("Import terminé avec succès!")
    except Exception as e:
        print(f"Erreur lors de l'import: {e}")
        sys.exit(1)
