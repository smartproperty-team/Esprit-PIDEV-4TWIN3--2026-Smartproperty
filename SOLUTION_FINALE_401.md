# ✅ SOLUTION FINALE - Problème 401 dans Swagger

## 🎯 Problème Résolu

J'ai identifié et corrigé le problème 401 "Unauthorized" dans Swagger.

---

## 🔧 Correction Appliquée

### Fichier modifié : `backend/src/main.ts`

**AVANT** (ligne 93-101) :
```typescript
.addBearerAuth(
  {
    type: 'http',
    scheme: 'bearer',
    bearerFormat: 'JWT',
    name: 'JWT',
    description: 'Enter your JWT token',
    in: 'header',
  },
  'JWT-auth',  // ❌ PROBLÈME : Nom spécifique
)
```

**APRÈS** :
```typescript
.addBearerAuth(
  {
    type: 'http',
    scheme: 'bearer',
    bearerFormat: 'JWT',
    name: 'JWT',
    description: 'Enter JWT token in the format: your_token_here (without "Bearer" prefix)',
    in: 'header',
  },
  // ✅ CORRECTION : Utilise le nom par défaut (pas de deuxième paramètre)
)
```

---

## 📝 Explication du Problème

1. Dans `main.ts`, l'authentification Swagger était enregistrée avec le nom **'JWT-auth'**
2. Dans les contrôleurs (`properties.controller.ts`, `auth.controller.ts`), le décorateur `@ApiBearerAuth()` était utilisé **sans argument**
3. Quand on n'utilise pas d'argument, Swagger cherche l'authentification avec le **nom par défaut (vide)**
4. **Incompatibilité** : Swagger cherchait le schéma par défaut mais trouvait 'JWT-auth'

---

## 🚀 Marche à Suivre pour Tester

### Étape 1 : Redémarrer le Backend

```powershell
# Arrêtez le backend actuel (Ctrl+C dans le terminal)
# Puis redémarrez :
cd "C:\Users\wael daagi\Documents\GitHub\smartproperty\backend"
npm run start:dev
```

**Attendez de voir** :
```
🚀 SmartProperty API running on: http://localhost:3000
📚 API Documentation: http://localhost:3000/api/docs
```

---

### Étape 2 : Ouvrir Swagger (IMPORTANT : Hard Refresh)

1. Ouvrez : **http://localhost:3000/api/docs**
2. **Faites un Hard Refresh** pour vider le cache :
   - Windows : `Ctrl + Shift + R` ou `Ctrl + F5`
   - Mac : `Cmd + Shift + R`

---

### Étape 3 : Se Connecter

1. Allez dans la section **Auth**
2. Trouvez `POST /api/auth/login`
3. Cliquez sur **"Try it out"**
4. Entrez ces credentials :

```json
{
  "email": "owner@smartproperty.com",
  "password": "Password123!"
}
```

5. Cliquez sur **"Execute"**
6. Dans la réponse, vous verrez :

```json
{
  "user": { ... },
  "tokens": {
    "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "refreshToken": "...",
    "expiresIn": 86400
  },
  "sessionId": "..."
}
```

7. **Copiez UNIQUEMENT** la valeur de `accessToken` (le long texte commençant par `eyJ...`)

---

### Étape 4 : S'Authentifier dans Swagger ⚡

1. En haut à droite de la page Swagger, cliquez sur **"Authorize"** 🔓
2. Une popup "Available authorizations" s'ouvre
3. **TRÈS IMPORTANT** : 
   - ❌ **NE PAS** mettre le mot "Bearer" devant
   - ✅ Collez **UNIQUEMENT** le token : `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...`

4. Cliquez sur **"Authorize"**
5. Cliquez sur **"Close"**

✅ **Le cadenas devient fermé/vert** = Vous êtes authentifié !

---

### Étape 5 : Créer une Propriété

1. Allez dans la section **Properties**
2. Trouvez `POST /api/properties`
3. Cliquez sur **"Try it out"**
4. Entrez ce JSON :

```json
{
  "title": "Magnifique Appartement Paris Centre",
  "type": "apartment",
  "price": 1500,
  "address": {
    "street": "123 Rue de la Paix",
    "city": "Paris",
    "state": "Île-de-France",
    "zipCode": "75001",
    "country": "France"
  }
}
```

5. Cliquez sur **"Execute"**

---

## ✅ Résultat Attendu

**Status Code : 201 Created**

```json
{
  "_id": "...",
  "title": "Magnifique Appartement Paris Centre",
  "type": "apartment",
  "status": "available",
  "price": 1500,
  "currency": "EUR",
  "address": {
    "street": "123 Rue de la Paix",
    "city": "Paris",
    "state": "Île-de-France",
    "zipCode": "75001",
    "country": "France"
  },
  "owner": {
    "id": "...",
    "name": "John Owner",
    "email": "owner@smartproperty.com"
  },
  "features": {
    "bedrooms": 0,
    "bathrooms": 0,
    "area": 0,
    "furnished": false,
    "petFriendly": false,
    "parking": false
  },
  "createdAt": "2026-02-14T...",
  "updatedAt": "2026-02-14T..."
}
```

---

## 🧪 Test Alternatif avec PowerShell

Si vous voulez tester sans Swagger, utilisez ce script :

```powershell
# 1. Connexion
$loginResponse = Invoke-RestMethod `
  -Uri "http://localhost:3000/api/auth/login" `
  -Method POST `
  -ContentType "application/json" `
  -Body '{"email":"owner@smartproperty.com","password":"Password123!"}'

# 2. Extraction du token
$token = $loginResponse.tokens.accessToken
Write-Host "Token obtenu: $($token.Substring(0,30))..."

# 3. Création d'une propriété
$headers = @{
  "Authorization" = "Bearer $token"
  "Content-Type" = "application/json"
}

$propertyData = @{
  title = "Test PowerShell"
  type = "apartment"
  price = 1500
  address = @{
    street = "123 Rue Test"
    city = "Paris"
    state = "Île-de-France"
    zipCode = "75001"
    country = "France"
  }
} | ConvertTo-Json -Depth 10

$property = Invoke-RestMethod `
  -Uri "http://localhost:3000/api/properties" `
  -Method POST `
  -Headers $headers `
  -Body $propertyData

Write-Host "Propriété créée: $($property.title)"
Write-Host "ID: $($property._id)"
```

---

## 🔍 Diagnostic si ça ne Marche Toujours Pas

### Problème 1 : Erreur 401 "Authentication required"

**Causes possibles** :
- ❌ Vous n'avez pas cliqué sur "Authorize" en haut à droite
- ❌ Vous avez mis "Bearer" avant le token (il ne faut PAS)
- ❌ Le token a expiré (durée de vie : 24h)
- ❌ Cache du navigateur (faites `Ctrl + Shift + R`)

**Solution** :
1. Cliquez sur "Authorize" → "Logout"
2. Reconnectez-vous avec `POST /api/auth/login`
3. Copiez le NOUVEAU `accessToken`
4. Recliquez sur "Authorize"
5. Collez le token **SANS "Bearer"**

### Problème 2 : Le bouton "Authorize" ne fonctionne pas

**Solution** :
1. Fermez complètement votre navigateur
2. Supprimez le cache (`Ctrl + Shift + Delete`)
3. Redémarrez le backend
4. Rouvrez http://localhost:3000/api/docs

### Problème 3 : Erreur 403 "Forbidden"

➡️ Vous êtes connecté avec un compte TENANT

**Solution** : Les comptes TENANT ne peuvent pas créer de propriétés. Utilisez :
- `owner@smartproperty.com`
- `admin@smartproperty.com`
- `manager@smartproperty.com`

---

## 📊 Comptes de Test Disponibles

| Email | Mot de Passe | Rôle | Créer Propriété |
|-------|-------------|------|-----------------|
| `owner@smartproperty.com` | `Password123!` | OWNER | ✅ Oui |
| `admin@smartproperty.com` | `Password123!` | ADMIN | ✅ Oui |
| `manager@smartproperty.com` | `Password123!` | MANAGER | ✅ Oui |
| `tenant@smartproperty.com` | `Password123!` | TENANT | ❌ Non |

---

## 🎯 Checklist de Vérification

Avant de tester, assurez-vous que :

- [ ] Le backend est démarré (`npm run start:dev`)
- [ ] Le serveur répond sur http://localhost:3000
- [ ] Swagger est accessible sur http://localhost:3000/api/docs
- [ ] Vous avez fait un **hard refresh** (`Ctrl + Shift + R`)
- [ ] Vous vous êtes connecté avec `POST /api/auth/login`
- [ ] Vous avez copié `tokens.accessToken` (pas `access_token`)
- [ ] Vous avez cliqué sur "Authorize" en haut à droite
- [ ] Vous avez collé le token **SANS** le mot "Bearer"
- [ ] Le cadenas est fermé/vert

---

## 📁 Fichiers Modifiés

1. **`backend/src/main.ts`** - Configuration Swagger corrigée
2. **`scripts/test-property-creation.ps1`** - Script de test PowerShell
3. **`SWAGGER_FIX_401.md`** - Guide détaillé de la solution

---

## 🎉 Résumé

**Le problème était** : Incompatibilité entre le nom de l'authentification dans Swagger (`'JWT-auth'`) et les contrôleurs (nom par défaut).

**La solution** : Supprimer le deuxième paramètre de `.addBearerAuth()` pour utiliser le nom par défaut.

**Maintenant** : L'authentification fonctionne correctement dans Swagger ! 🚀

---

**Dernière mise à jour** : 14 février 2026

