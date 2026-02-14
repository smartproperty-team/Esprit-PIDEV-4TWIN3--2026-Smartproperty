# 🧪 Guide de Test avec Swagger - SmartProperty API

## 📋 Table des Matières
1. [Accès à Swagger](#accès-à-swagger)
2. [Comptes de Test Disponibles](#comptes-de-test-disponibles)
3. [Test d'Authentification](#test-dauthentification)
4. [Test de Création de Propriété](#test-de-création-de-propriété)
5. [Résolution des Problèmes](#résolution-des-problèmes)

---

## 🌐 Accès à Swagger

### URL de Swagger UI
```
http://localhost:3000/api/docs
```

Ouvrez cette URL dans votre navigateur pour accéder à l'interface Swagger.

---

## 👥 Comptes de Test Disponibles

Tous les comptes utilisent le même mot de passe : **`Password123!`**

| Email | Rôle | Peut Créer des Propriétés? |
|-------|------|---------------------------|
| `admin@smartproperty.com` | ADMIN | ✅ Oui |
| `owner@smartproperty.com` | OWNER | ✅ Oui |
| `manager@smartproperty.com` | MANAGER | ✅ Oui |
| `tenant@smartproperty.com` | TENANT | ❌ Non (erreur 403) |

> **Note**: Seuls les rôles ADMIN, OWNER, MANAGER et AGENT peuvent créer des propriétés.

---

## 🔐 Test d'Authentification

### Étape 1 : Se Connecter

1. Dans Swagger UI, cherchez la section **Auth**
2. Cliquez sur `POST /api/auth/login`
3. Cliquez sur **"Try it out"**
4. Utilisez ce JSON de connexion :

```json
{
  "email": "owner@smartproperty.com",
  "password": "Password123!"
}
```

5. Cliquez sur **"Execute"**

### Étape 2 : Copier le Token

Vous recevrez une réponse comme celle-ci :

```json
{
  "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "refresh_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": "...",
    "email": "owner@smartproperty.com",
    "role": "owner",
    ...
  }
}
```

**COPIEZ** la valeur de `access_token` (le long texte JWT).

### Étape 3 : Autoriser dans Swagger

1. En haut à droite de Swagger UI, cliquez sur le bouton **"Authorize"** 🔓
2. Dans le champ "Value", collez votre `access_token`
3. Cliquez sur **"Authorize"**
4. Cliquez sur **"Close"**

🎉 Vous êtes maintenant authentifié ! Le cadenas 🔒 devient vert.

---

## 🏠 Test de Création de Propriété

### Étape 1 : Ouvrir l'Endpoint

1. Cherchez la section **Properties**
2. Cliquez sur `POST /api/properties`
3. Cliquez sur **"Try it out"**

### Étape 2 : Utiliser ce JSON de Test

#### Exemple Minimal (Requis Seulement)

```json
{
  "title": "Appartement Moderne Centre-Ville",
  "type": "apartment",
  "price": 1500,
  "address": {
    "street": "123 Rue de la République",
    "city": "Paris",
    "state": "Île-de-France",
    "zipCode": "75001",
    "country": "France"
  }
}
```

#### Exemple Complet (Avec Toutes les Options)

```json
{
  "title": "Luxueux Appartement 3 Chambres avec Vue",
  "description": "Magnifique appartement situé au cœur de Paris, avec une vue imprenable sur la Seine. Entièrement rénové, meublé avec goût.",
  "type": "apartment",
  "status": "available",
  "price": 2500,
  "currency": "EUR",
  "address": {
    "street": "45 Avenue des Champs-Élysées",
    "city": "Paris",
    "state": "Île-de-France",
    "zipCode": "75008",
    "country": "France",
    "coordinates": {
      "lat": 48.8698,
      "lng": 2.3078
    }
  },
  "features": {
    "bedrooms": 3,
    "bathrooms": 2,
    "area": 120,
    "parkingSpaces": 1,
    "furnished": true,
    "petFriendly": false,
    "amenities": [
      "wifi",
      "climatisation",
      "balcon",
      "ascenseur",
      "sécurité 24/7"
    ]
  },
  "images": [
    {
      "url": "https://images.unsplash.com/photo-1522708323590-d24dbb6b0267",
      "caption": "Salon principal",
      "isPrimary": true
    },
    {
      "url": "https://images.unsplash.com/photo-1560448204-e02f11c3d0e2",
      "caption": "Chambre principale"
    }
  ],
  "virtualTour": "https://example.com/virtual-tour/123"
}
```

### Étape 3 : Exécuter la Requête

1. Collez l'un des JSON ci-dessus dans le champ "Request body"
2. Cliquez sur **"Execute"**

### Étape 4 : Vérifier le Résultat

#### ✅ Succès (Status 201)

```json
{
  "_id": "65f1234567890abcdef12345",
  "title": "Appartement Moderne Centre-Ville",
  "type": "apartment",
  "status": "available",
  "price": 1500,
  "currency": "EUR",
  "address": {
    "street": "123 Rue de la République",
    "city": "Paris",
    ...
  },
  "owner": {
    "id": "...",
    "name": "John Owner",
    "email": "owner@smartproperty.com"
  },
  "createdAt": "2026-02-14T23:30:00.000Z",
  "updatedAt": "2026-02-14T23:30:00.000Z"
}
```

#### ❌ Erreur 401 (Non Authentifié)

```json
{
  "message": "Authentication required",
  "error": "Unauthorized",
  "statusCode": 401
}
```

**Solution** : Vous n'êtes pas authentifié. Retournez à [Test d'Authentification](#test-dauthentification).

#### ❌ Erreur 403 (Permissions Insuffisantes)

```json
{
  "message": "Access denied. Required roles: admin, owner, manager, agent",
  "error": "Forbidden",
  "statusCode": 403
}
```

**Solution** : Vous êtes connecté avec un compte TENANT. Utilisez un compte OWNER, MANAGER, ou ADMIN.

---

## 🧪 Scénarios de Test Recommandés

### Test 1 : Utilisateur Non Connecté ❌

1. **NE PAS** s'authentifier
2. Essayer de créer une propriété
3. **Résultat attendu** : Erreur 401 "Authentication required"

### Test 2 : Utilisateur OWNER ✅

1. Se connecter avec `owner@smartproperty.com`
2. Créer une propriété
3. **Résultat attendu** : Propriété créée (201)

### Test 3 : Utilisateur TENANT ❌

1. Se connecter avec `tenant@smartproperty.com`
2. Essayer de créer une propriété
3. **Résultat attendu** : Erreur 403 "Access denied"

### Test 4 : Utilisateur ADMIN ✅

1. Se connecter avec `admin@smartproperty.com`
2. Créer une propriété
3. **Résultat attendu** : Propriété créée (201)

---

## 🔍 Tester Toutes les Routes

### Routes Publiques (Pas de Token Requis)

#### 📄 Liste des Propriétés
```http
GET /api/properties
```
**Test** : Cliquez sur "Try it out" → "Execute" (sans authentification)

#### 📄 Détails d'une Propriété
```http
GET /api/properties/{id}
```
**Test** : Utilisez un ID de propriété existant

### Routes Protégées (Token JWT Requis)

#### ➕ Créer une Propriété
```http
POST /api/properties
```
**Rôles autorisés** : ADMIN, OWNER, MANAGER, AGENT

#### ✏️ Modifier une Propriété
```http
PUT /api/properties/{id}
```
**Rôles autorisés** : ADMIN, OWNER, MANAGER, AGENT

#### 🗑️ Supprimer une Propriété
```http
DELETE /api/properties/{id}
```
**Rôles autorisés** : ADMIN, OWNER, MANAGER, AGENT

---

## 📊 Types de Propriétés Disponibles

Utilisez l'une de ces valeurs pour le champ `type` :

- `apartment` - Appartement
- `house` - Maison
- `condo` - Condominium
- `townhouse` - Maison de ville
- `villa` - Villa
- `studio` - Studio
- `loft` - Loft
- `duplex` - Duplex
- `penthouse` - Penthouse
- `commercial` - Commercial
- `land` - Terrain
- `other` - Autre

## 📊 Statuts de Propriétés Disponibles

Utilisez l'une de ces valeurs pour le champ `status` :

- `available` - Disponible (par défaut)
- `rented` - Loué
- `unavailable` - Non disponible
- `pending` - En attente

---

## ⚠️ Résolution des Problèmes

### Problème : "Authentication required" même après connexion

**Solutions** :
1. Vérifiez que vous avez cliqué sur **"Authorize"** en haut à droite
2. Assurez-vous d'avoir copié **TOUT** le token (il est très long)
3. Le token ne doit **PAS** inclure de guillemets ni le mot "Bearer"
4. Essayez de vous reconnecter et obtenir un nouveau token

### Problème : "Token expired"

**Solution** : Reconnectez-vous pour obtenir un nouveau token (les tokens expirent après 1 heure par défaut).

### Problème : "User not found"

**Solution** : Exécutez le script de seed pour créer les utilisateurs :
```powershell
cd backend
npx ts-node src/seeds/seed-users.ts
```

### Problème : Le backend ne répond pas

**Solution** : Vérifiez que le backend est démarré :
```powershell
cd backend
npm run start:dev
```

### Problème : Erreurs de validation

**Solution** : Vérifiez que votre JSON respecte les règles :
- `title` : 3-200 caractères (obligatoire)
- `type` : doit être l'une des valeurs de la liste ci-dessus (obligatoire)
- `price` : nombre positif (obligatoire)
- `address` : tous les champs sont obligatoires (street, city, state, zipCode, country)

---

## 🎯 Résumé : Étapes Rapides

### Pour Tester la Création de Propriété :

1. ✅ Aller sur `http://localhost:3000/api/docs`
2. ✅ POST `/api/auth/login` avec `owner@smartproperty.com` / `Password123!`
3. ✅ Copier le `access_token`
4. ✅ Cliquer sur **"Authorize"** 🔓 et coller le token
5. ✅ POST `/api/properties` avec le JSON d'exemple
6. ✅ Vérifier le status 201 et la propriété créée

### Pour Tester le Refus d'Accès :

1. ✅ POST `/api/properties` **SANS** authentification → Erreur 401
2. ✅ Se connecter avec `tenant@smartproperty.com` → Créer une propriété → Erreur 403

---

## 📝 Notes Importantes

- ✅ Les routes GET (liste et détails) sont **publiques** - pas besoin d'authentification
- ✅ Les routes POST, PUT, DELETE nécessitent un **token JWT valide**
- ✅ Seuls les rôles **ADMIN, OWNER, MANAGER, AGENT** peuvent créer/modifier/supprimer
- ✅ Les tokens JWT expirent après **1 heure** (configurable)
- ✅ Swagger persiste votre authentification tant que vous ne fermez pas le navigateur

---

**Date** : 2026-02-14  
**Version API** : 1.0.0  
**Backend** : http://localhost:3000  
**Swagger UI** : http://localhost:3000/api/docs

