# Questionnaire OAEDC

Projet complet du questionnaire de cadrage pour la stratégie de communication et l’identité visuelle de l’OAEDC, en arabe et en français.

## Contenu

* Huit rubriques bilingues, avec les chiffres 0 à 9 dans les deux langues.
* Validation des champs obligatoires et des choix multiples.
* Enregistrement des réponses via une API et une base Cloudflare D1.
* Confirmation après enregistrement, gestion des erreurs et prévention des doublons lors d’une nouvelle tentative d’envoi.
* Présentation adaptée au mobile et visuel de bannière inclus.

## Structure

| Emplacement | Rôle |
| --- | --- |
| `app/document.ts` | Document HTML, styles et JavaScript du questionnaire |
| `app/route.ts` | Page principale |
| `app/api/responses/route.ts` | API de validation et d’enregistrement |
| `app/api/responses/fields.json` | Règles des champs |
| `db/schema.ts` | Structure de la table des réponses |
| `drizzle/` | Migration de la base |
| `public/banner.png` | Visuel fourni avec le questionnaire |
| `questionnaire.html` | Copie lisible du document HTML actuel |
| `.openai/hosting.json` | Identité du site Sites et liaison logique D1 `DB` |

## Lancement

Prérequis : Node.js 22.13 ou ultérieur et npm. Les scripts de construction fournis utilisent Bash et des utilitaires GNU ; Linux ou WSL convient.

```bash
npm ci
npm run dev
```

Pour construire l’application :

```bash
npm run build
```

La collecte exige une base D1 liée sous le nom `DB`, avec la migration `drizzle/0000_high_hemingway.sql` appliquée. L’identité de base utilisée par Vite en développement est un identifiant local de simulation ; elle ne donne pas accès à la base du site publié. Sites assure la configuration de la base et les migrations à la publication. Un hébergement Cloudflare indépendant exige sa propre configuration Worker et D1.

## Hébergement


Ce dépôt contient le code source et les ressources. Il ne contient ni réponses collectées, ni clés d’accès. Copier le dépôt ne copie pas la base de données. Aucune synchronisation automatique avec le site publié n’est configurée par ce transfert.

GitHub Pages seul ne peut pas exécuter l’API ou enregistrer les réponses dans D1. Le fichier `questionnaire.html` est une copie de consultation du code de la page ; l’application complète doit être servie avec son API pour recueillir des réponses.
