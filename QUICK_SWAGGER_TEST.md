# 🚀 Guide Rapide - Test Swagger pour Création de Propriété

## ⚡ Démarrage Rapide (5 minutes)

### 1️⃣ Redémarrer le Backend

```powershell
cd "C:\Users\wael daagi\Documents\GitHub\smartproperty\backend"
npm run start:dev
```

Attendez de voir : `🚀 SmartProperty API running on: http://localhost:3000`

---

### 2️⃣ Ouvrir Swagger

**URL** : http://localhost:3000/api/docs

---

### 3️⃣ Se Connecter (POST /api/auth/login)

1. Cherchez la section **Auth** dans Swagger
2. Cliquez sur `POST /api/auth/login`
3. Cliquez sur **"Try it out"**
4. **Remplacez** le JSON par celui-ci :

```json
{
  "email": "owner@smartproperty.com",
  "password": "Password123!"
}
```

5. Cliquez sur **"Execute"**
6. Dans la réponse, **copiez** le `access_token` (tout le texte long commençant par `eyJ...`)

---

### 4️⃣ S'Authentifier dans Swagger

1. En haut à droite, cliquez sur **"Authorize"** 🔓
2. Collez votre token dans le champ "Value"
3. Cliquez sur **"Authorize"**
4. Cliquez sur **"Close"**

✅ Le cadenas devient vert !

---

### 5️⃣ Créer une Propriété (POST /api/properties)

1. Cherchez la section **Properties**
2. Cliquez sur `POST /api/properties`
3. Cliquez sur **"Try it out"**
4. **Remplacez** le JSON par celui-ci :

```json
{
  "title": "Mon Premier Appartement",
  "type": "apartment",
  "price": 1500,
  "address": {
    "street": "123 Rue Test",
    "city": "Paris",
    "state": "Île-de-France",
    "zipCode": "75001",
    "country": "France"
  }
}
```

5. Cliquez sur **"Execute"**

---

### ✅ Résultat Attendu

**Status : 201 Created**

```json
{
  "_id": "65f1234567890abcdef12345",
  "title": "Mon Premier Appartement",
  "type": "apartment",
  "status": "available",
  "price": 1500,
  "currency": "EUR",
  "address": {
    "street": "123 Rue Test",
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
  "createdAt": "2026-02-14T...",
  "updatedAt": "2026-02-14T..."
}
```

---

## 🧪 Tests Supplémentaires

### Test 1 : Sans Authentification (Devrait Échouer)

1. Cliquez sur **"Authorize"** → **"Logout"**
2. Essayez de créer une propriété
3. **Résultat attendu** : `401 Unauthorized`

### Test 2 : Avec un Tenant (Devrait Échouer)

1. Déconnectez-vous
2. Connectez-vous avec :
```json
{
  "email": "tenant@smartproperty.com",
  "password": "Password123!"
}
```
3. Essayez de créer une propriété
4. **Résultat attendu** : `403 Forbidden - Access denied`

### Test 3 : Voir la Liste des Propriétés (Public)

1. Déconnectez-vous complètement
2. Allez sur `GET /api/properties`
3. Cliquez sur **"Try it out"** → **"Execute"**
4. **Résultat attendu** : `200 OK` avec la liste (même sans être connecté)

---

## 📋 Comptes Disponibles

| Email | Mot de Passe | Rôle | Peut Créer ? |
|-------|-------------|------|--------------|
| `owner@smartproperty.com` | `Password123!` | OWNER | ✅ |
| `admin@smartproperty.com` | `Password123!` | ADMIN | ✅ |
| `manager@smartproperty.com` | `Password123!` | MANAGER | ✅ |
| `tenant@smartproperty.com` | `Password123!` | TENANT | ❌ |

---

## 🔧 Types de Propriétés Valides

```
apartment, house, condo, townhouse, villa, 
studio, loft, duplex, penthouse, commercial, 
land, other
```

---

## ⚠️ Problèmes Fréquents

### Erreur 401 "Authentication required"
➡️ Vous n'avez pas cliqué sur "Authorize" ou le token est expiré

### Erreur 403 "Access denied"
➡️ Vous êtes connecté avec un compte TENANT (utilisez OWNER/ADMIN/MANAGER)

### Erreur 400 "Validation failed"
➡️ Vérifiez que tous les champs obligatoires sont présents :
- `title` (3-200 caractères)
- `type` (doit être dans la liste ci-dessus)
- `price` (nombre positif)
- `address` avec tous les champs (street, city, state, zipCode, country)

---

## 🎯 Checklist Rapide

- [ ] Backend démarré sur http://localhost:3000
- [ ] Swagger ouvert http://localhost:3000/api/docs
- [ ] Connexion avec owner@smartproperty.com
- [ ] Token copié et collé dans "Authorize"
- [ ] Propriété créée avec succès (201)
- [ ] Test sans auth échoue bien (401)
- [ ] Test avec tenant échoue bien (403)

---

**C'est tout !** Vous pouvez maintenant tester votre API avec Swagger avant d'implémenter le frontend.

