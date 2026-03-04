# RAPPORT D'ANALYSE DES DUPLICATIONS DE CODE (Principe DRY)

## Introduction
Projet Django (`plant_shop` app + seed custom). Les vues fonctionnelles couvrent à la fois l’espace public et l’admin.

---

## Violations DRY

### 1. Vues admin/public dupliquées - 🔴 Critique
Dans `plant_shop/views.py`, les fonctions `plant_index`/`plant_show` et `admin_plants_*` manipulent toutes `Plant.objects...` avec les mêmes tris `unidecode(...)`. Même duplication pour les utilisateurs (`profile_view` vs `admin_users_*`). Toute règle métier (tri, validations) doit être modifiée à plusieurs endroits. **Action** : déplacer la logique dans des services ou viewsets (class-based views), et partager les templates (composants) pour éviter ces copies.

### 2. Formulaires générés à la volée répétés - 🟠 Haute
`admin_plants_new/edit` et `admin_users_new/edit` appellent chacun `modelform_factory(...)` pour recréer les mêmes forms à chaque requête. Cette duplication rend difficile l’ajout de règles personnalisées (widgets, validations). **Action** : définir des `PlantAdminForm` et `UserAdminForm` dédiés (fichiers `forms.py`), importés par toutes les vues.

### 3. Seed : génération admins/users quasi identique - 🟠 Haute
Dans `management/commands/seed.py`, `creer_admins` et `creer_users` ne diffèrent que par deux champs (`admin=True/False` et l’email). Idem pour `creer_plantes` et `creer_commandes` qui manipulent deux fois la même liste `NOMS_PLANTES`. **Action** : factoriser ces boucles (`create_fake_users(role, count)`, `generate_plants(names, nb)`) afin qu’un changement (ex. générer des mots de passe aléatoires) soit effectué en un seul endroit.

---

## Impact estimé

| Refactoring proposé                              | Lignes supprimées | Complexité |
|--------------------------------------------------|-------------------|------------|
| Services / CBV partagés pour plantes & users     | ~120              | Moyenne    |
| Formulaires dédiés (au lieu de modelform_factory)| ~40               | Faible     |
| Helpers de seed (création users/plantes)         | ~50               | Faible     |

---

## Conclusion
L’approche actuelle multiplie les vues et formulaires quasi identiques (public vs admin, créations vs éditions). Centraliser la logique métier (services, forms) et la génération de données permettra de rester aligné avec le principe DRY.***
