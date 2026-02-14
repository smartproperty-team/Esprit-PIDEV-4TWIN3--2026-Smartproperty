# 🔧 Solution au Problème 401 - Swagger Authentication

## ❗ Problème Identifié

Le problème était une **incompatibilité entre la configuration Swagger et les contrôleurs** :
- Dans `main.ts` : l'authentification était nommée `'JWT-auth'`
- Dans les contrôleurs : `@ApiBearerAuth()` utilisait le nom par défaut (vide)

## ✅ Solution Appliquée

J'ai modifié `backend/src/main.ts` pour utiliser le nom par défaut :

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
  // Supprimé: 'JWT-auth' - utilise maintenant le nom par défaut
)
```

---

## 🚀 Nouvelle Procédure de Test (CORRIGÉE)

### 1️⃣ Vérifier que le Backend est Démarré

```powershell
# Si ce n'est pas déjà fait
cd "C:\Users\wael daagi\Documents\GitHub\smartproperty\backend"
npm run start:dev
```

**Attendez de voir** : `🚀 SmartProperty API running on: http://localhost:3000`

---

### 2️⃣ Ouvrir Swagger

**URL** : http://localhost:3000/api/docs

**⚠️ IMPORTANT** : Faites un **hard refresh** pour vider le cache :
- Windows : `Ctrl + Shift + R` ou `Ctrl + F5`
- Mac : `Cmd + Shift + R`

---

### 3️⃣ Se Connecter

1. Trouvez la section **Auth**
2. Cliquez sur `POST /api/auth/login`
3. Cliquez sur **"Try it out"**
4. Utilisez ce JSON :

```json
{
  "email": "owner@smartproperty.com",
  "password": "Password123!"
}
```

5. Cliquez sur **"Execute"**
6. **Copiez UNIQUEMENT le token** de la réponse (le texte commençant par `eyJ...`)

**Exemple de réponse** :
```json
{
  "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOi...",
  "refresh_token": "...",
  "user": { ... }
}
```

➡️ **Copiez tout le texte après `"access_token": "`** (sans les guillemets)

---

### 4️⃣ S'Authentifier dans Swagger ⚡ CORRECTION ICI

1. En haut à droite, cliquez sur **"Authorize"** 🔓
2. Vous verrez une popup "Available authorizations"
3. **IMPORTANT** : Collez **UNIQUEMENT le token** (sans le mot "Bearer")
   
   ❌ **INCORRECT** : `Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...`
   
   ✅ **CORRECT** : `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...`

4. Cliquez sur **"Authorize"**
5. Cliquez sur **"Close"**

✅ **Le cadenas devient vert/fermé** = Authentifié !

---

### 5️⃣ Créer une Propriété

1. Allez à la section **Properties**
2. Cliquez sur `POST /api/properties`
3. Cliquez sur **"Try it out"**
4. Utilisez ce JSON :

```json
{
  "title": "Test Appartement Paris",
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

**Status : 201 Created**

```json
{
  "_id": "...",
  "title": "Test Appartement Paris",
  "type": "apartment",
  "status": "available",
  "price": 1500,
  "currency": "EUR",
  "address": { ... },
  "owner": {
    "id": "...",
    "name": "John Owner",
    "email": "owner@smartproperty.com"
  },
  "createdAt": "...",
  "updatedAt": "..."
}
```

---

## 🔍 Diagnostic si ça ne Marche Toujours Pas

### Test 1 : Vérifier que vous êtes authentifié

1. Cliquez sur le cadenas en haut à droite "Authorize"
2. Vous devriez voir **"Authorized"** avec des étoiles (******)
3. Si vous voyez un champ vide, vous n'êtes PAS authentifié

### Test 2 : Vérifier le token dans la requête

1. Après avoir cliqué sur "Execute", regardez la section **"Curl"**
2. Vous devriez voir :
```bash
-H 'Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...'
```

3. Si vous ne voyez PAS cette ligne, le token n'est pas envoyé

### Test 3 : Tester avec cURL directement

```powershell
# 1. D'abord, connectez-vous et récupérez le token
$response = Invoke-RestMethod -Uri "http://localhost:3000/api/auth/login" -Method POST -ContentType "application/json" -Body '{"email":"owner@smartproperty.com","password":"Password123!"}'

# 2. Affichez le token
$token = $response.access_token
Write-Host "Token: $token"

# 3. Créez une propriété avec ce token
$headers = @{
    "Authorization" = "Bearer $token"
    "Content-Type" = "application/json"
}

$body = @{
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
} | ConvertTo-Json

Invoke-RestMethod -Uri "http://localhost:3000/api/properties" -Method POST -Headers $headers -Body $body
```

Si ça marche avec PowerShell mais pas avec Swagger, c'est un problème de cache du navigateur.

---

## ⚠️ Erreurs Possibles

### Erreur 401 "Authentication required"
**Causes possibles** :
1. ❌ Vous n'avez pas cliqué sur "Authorize"
2. ❌ Vous avez mis "Bearer" avant le token
3. ❌ Le token est expiré (durée : 1 heure)
4. ❌ Cache du navigateur - faites `Ctrl + Shift + R`

**Solution** :
1. Cliquez sur "Authorize" en haut
2. Cliquez sur "Logout"
3. Reconnectez-vous avec `/api/auth/login`
4. Copiez le NOUVEAU token
5. Collez-le dans "Authorize" (sans "Bearer")

### Erreur 403 "Access denied"
➡️ Vous êtes connecté avec un compte TENANT

**Solution** : Utilisez un compte OWNER/ADMIN/MANAGER

### Erreur 400 "Validation failed"
➡️ Champs manquants ou invalides

**Vérifiez** :
- `title` : 3-200 caractères
- `type` : doit être un type valide (apartment, house, etc.)
- `price` : nombre positif
- `address` : tous les champs requis présents

---

## 📋 Comptes Disponibles

| Email | Mot de Passe | Rôle | Peut Créer ? |
|-------|-------------|------|--------------|
| `owner@smartproperty.com` | `Password123!` | OWNER | ✅ |
| `admin@smartproperty.com` | `Password123!` | ADMIN | ✅ |
| `manager@smartproperty.com` | `Password123!` | MANAGER | ✅ |
| `tenant@smartproperty.com` | `Password123!` | TENANT | ❌ |

---

## 🎯 Checklist de Dépannage

- [ ] Backend démarré et répond sur http://localhost:3000
- [ ] Swagger ouvert sur http://localhost:3000/api/docs
- [ ] Hard refresh fait (`Ctrl + Shift + R`)
- [ ] Connexion réussie avec `POST /api/auth/login`
- [ ] Token copié (commence par `eyJ...`)
- [ ] Cliqué sur "Authorize" en haut à droite
- [ ] Token collé **SANS** le mot "Bearer"
- [ ] Cliqué sur "Authorize" puis "Close"
- [ ] Le cadenas est vert/fermé
- [ ] Test de création de propriété lancé

---

## 🎉 Résumé de la Correction

**Avant** :
```typescript
// main.ts - ANCIEN CODE
.addBearerAuth({ ... }, 'JWT-auth')  // ❌ Nom spécifique

// properties.controller.ts
@ApiBearerAuth()  // ❌ Cherche le nom par défaut (vide)
```

**Après** :
```typescript
// main.ts - NOUVEAU CODE
.addBearerAuth({ ... })  // ✅ Nom par défaut

// properties.controller.ts
@ApiBearerAuth()  // ✅ Correspond au nom par défaut
```

---

**Maintenant ça devrait fonctionner !** 🚀

Si vous avez toujours le problème après avoir suivi ces étapes :
1. Fermez complètement le navigateur
2. Redémarrez le backend
3. Rouvrez Swagger
4. Réessayez

Bonne chance ! 🍀

