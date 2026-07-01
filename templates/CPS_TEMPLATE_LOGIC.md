# CPS_TEMPLATE_LOGIC.md — Logique conditionnelle du modèle CPS TMPA

> Référence extraite de `250305_model_CPS_type travaux.docx`.
> Indique quels champs `XXX` remplir et quels blocs de texte écrire selon chaque cas.
> Claude Code doit reproduire ces textes FIDÈLEMENT, sans les réinventer.
> Les champs de saisie correspondent à ceux de generate_cps_module.js (déjà analysé).

---

## CHAMPS XXX À REMPLIR (substitution directe)

| Emplacement | Champ questionnaire | Remplace |
|-------------|--------------------|----------|
| Titre couverture | ao_title | `xxxxxxxxxxxx` (P17) |
| Référence DCE | dce_ref (auto-généré) | `25XXXX_DCE_CPS_TMPA_DTT_XXXXX` (P34) |
| Art. 2.6 délai ferme | delai_ferme_mois | `(XXX) mois` (P583) |
| Art. 2.6 délai partiel | (délai global) | `Le délai global d'exécution est XXX` (P592) |
| Art. 2.6 tranche | tf_mois + maintien offre | `duré de XXX` (P602) |
| Art. 2.7 garantie | delai_garantie | `fixé à XXXX` (P605) |
| Art. 2.8 pénalité | penalite_taux | `(X/1000)` (P614) |
| Art. 2.8 plafond | penalite_plafond | `(10%)` par défaut (P626) |

---

## BLOCS CONDITIONNELS (choisir le paragraphe selon le cas)

### 1. Identité Maître d'ouvrage (Préambule)
Question : type de soumissionnaire (à ajouter si absent : personne morale / groupement).
- **Cas personne morale** (P57) : bloc P59-P67 (M…, capital, patente, RC, RIB, "ENTREPRENEUR").
- **Cas groupement** (P79) : bloc P81-P100 (membres 1..n, mandataire).
> Garder UN SEUL des deux blocs selon le cas.

### 2. Art. 2.5 — Cautionnement définitif — pivot `caut_prov`
- **caut_prov = oui** (P565 "Cas où le cautionnement provisoire est exigé") : bloc P566-P570.
  Point clé P567 : le cautionnement provisoire reste acquis en cas de non-réalisation.
- **caut_prov = non** (P572) : bloc P573-P577.
  Point clé P574 : application d'une pénalité de 1% (pas de cautionnement provisoire acquis).
> Garder UN SEUL bloc.

### 3. Art. 2.6 — Délai d'exécution — pivot `delai_type`
- **ferme** (P581) : P583 (durée XXX mois) + P584-P587.
- **partiel** (P590) : P592 (délai global XXX) + P593 (tableau délais partiels) + P594-P595.
- **tranche** (P597) : P599 (tableau délais) + P600-P601 + P602 (maintien offre XXX) + P603.
> Garder UN SEUL bloc selon delai_type.

### 4. Art. 2.7 — Délai de garantie
- Toujours présent : P605 (fixé à XXXX = delai_garantie) + P606.

### 5. Art. 2.8 — Pénalités pour retard — pivot `delai_type` (même pivot)
- **ferme** (P611) : bloc P613-P626 (pénalité X/1000, plafond 10%).
- **partiel** (P628) : bloc P629-P643 (+ P643 restitution si délai global respecté).
- **tranche** (P644) : bloc P646-P661.
- Sous-bloc "D'autres pénalités applicables" (P616-P618) — pivot `penalite_autres` :
  - oui → lister penalite_autres_detail
  - non → omettre ou laisser les tirets vides
> Le bloc pénalités suit le MÊME delai_type que l'article 2.6.

### 6. Art. 2.9 — Révision des prix — pivot `revision_prix`
- **ferme** (P663-P664) : "Les prix du marché sont fermes et non révisables."
- **revisable** (P665-P681) : bloc complet avec la formule
  `P = Po [k + a(I/Io) + b(..) + c(..)]` (P668) + définitions P669-P681
  + plafond variation 5% (P679).
> Garder UN SEUL cas.

### 7. Art. 2.10 — Sous-traitance
- Toujours présent : P683-P689. Lister st_exclus dans P685-P688 (travaux exclus).

### 8. Art. 2.11 — Approvisionnements — pivot `approvi`
- **approvi = oui** (P692) : bloc P693-P697 (acomptes prévus).
- **approvi = non** (P698) : P699 (pas d'acompte prévu).
> Garder UN SEUL cas.

### 9. Art. 2.12 — Force majeure
- Toujours présent, inchangé : P702-P717. Aucun champ variable.

### 10. Art. 2.13 — Conditions et exécution de la variante — pivot `variante`
- **variante = non** (P720) : "Dispositions Non Applicables" (P722).
- **variante = oui** (P724) : bloc P726-P733 (value engineering + règles quantités,
  formules P732-P733).
> Article TOUJOURS présent (jamais omis), seul le contenu change.

### 11. Art. 2.14 — Réceptions — pivot `delai_type`
- **ferme** (P737) : "cet article n'aura pas lieu, on garde uniquement les articles déjà
  prévus au niveau des clauses communes."
- **partiel** (P740) : bloc réceptions par délais partiels.
- **tranche** (P742-P745) : bloc réceptions tranche ferme/optionnelle + P745.
> Garder UN SEUL cas selon delai_type.

---

## STRUCTURE GÉNÉRALE DU DOCUMENT
1. Couverture (ao_title, dce_ref)
2. Préambule (identité MO : personne morale OU groupement ; "IL A ÉTÉ CONVENU…")
3. Chapitre I — Clauses communes
4. Chapitre II — Articles 2.1 à 2.14 (voir blocs conditionnels ci-dessus)
5. Chapitre III — Clauses techniques (P746)
6. Chapitre IV — Définition des prix (P748 : Prix 001..00n avec Unité, depuis cdp_prix)
7. Chapitre V — Bordereau des prix / détail estimatif (P759)
8. Dernière page (P765 : marché n°, objet, montant en chiffres et lettres)

---

## RÈGLES IMPÉRATIVES POUR CLAUDE CODE
- Reproduire les textes du modèle À L'IDENTIQUE (clauses contractuelles, ne pas paraphraser).
- Pour chaque pivot, n'inclure QUE le bloc correspondant au choix (supprimer les autres cas
  et les titres surlignés "Cas où…" qui ne servent qu'à guider la sélection).
- Les titres surlignés en jaune du modèle ("CAS DE…", "Cas où…") ne doivent PAS apparaître
  dans le document final : ce sont des instructions de sélection, pas du contenu.
- Remplacer chaque XXX / pointillés par la valeur du questionnaire, ou laisser les pointillés
  si le champ est vide (champs à compléter à la main).
