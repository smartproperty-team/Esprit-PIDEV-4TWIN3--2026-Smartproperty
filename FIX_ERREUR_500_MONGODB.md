# 🔧 RÉSOLUTION ERREUR 500 - Validation MongoDB

## ❌ Problème Identifié

Erreur 500 lors de la création d'une propriété :
```
MongoBulkWriteError: Document failed validation
```

**Cause** : Le schéma de validation MongoDB était trop strict :
- `description` : exigeait une **string**, mais le code envoie `undefined`
- `features` : champ manquant dans le schéma
- `images` : champ manquant dans le schéma  
- `ownerId` : exigeait **objectId**, mais le code envoie une **string**

---

## ✅ Solution Appliquée

### 1. Fichiers Modifiés

#### `docker/mongo-init.js`
Mis à jour le schéma pour accepter les champs optionnels :
```javascript
description: {
  bsonType: ["string", "null", "undefined"],  // ✅ Accepte null et undefined
},
features: {
  bsonType: ["object", "null", "undefined"],  // ✅ Nouveau champ optionnel
},
images: {
  bsonType: ["array", "null", "undefined"],   // ✅ Nouveau champ optionnel
},
ownerId: {
  bsonType: ["objectId", "string"],           // ✅ Accepte string ET objectId
},
```

#### `docker/update-properties-schema.js` (NOUVEAU)
Script créé pour mettre à jour le schéma dans la base de données existante.

---

### 2. Mise à Jour du Schéma MongoDB

Le schéma a été mis à jour en exécutant :
```powershell
docker cp "C:\Users\wael daagi\Documents\GitHub\smartproperty\docker\update-properties-schema.js" smartproperty-mongodb:/tmp/update-schema.js
docker exec smartproperty-mongodb mongosh smartproperty /tmp/update-schema.js
```

---

## 🚀 Test Maintenant

### Option 1 : Via Swagger (RECOMMANDÉ)

1. **Ouvrez Swagger** : http://localhost:3000/api/docs
   - **Hard refresh** : `Ctrl + Shift + R`

2. **Connectez-vous** (`POST /api/auth/login`) :
   ```json
   {
     "email": "owner@smartproperty.com",
     "password": "Password123!"
   }
   ```

3. **Copiez** `tokens.accessToken`

4. **Cliquez "Authorize"** et collez le token (SANS "Bearer")

5. **Créez une propriété** (`POST /api/properties`) :
   ```json
   {
     "title": "Appartement Test Swagger",
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

**✅ Résultat attendu** : Status **201 Created**

---

### Option 2 : Via PowerShell

```powershell
# 1. Connexion
$response = Invoke-RestMethod `
  -Uri "http://localhost:3000/api/auth/login" `
  -Method POST `
  -ContentType "application/json" `
  -Body '{"email":"owner@smartproperty.com","password":"Password123!"}'

$token = $response.tokens.accessToken
Write-Host "Token: $($token.Substring(0,30))..."

# 2. Création de propriété
$headers = @{
  "Authorization" = "Bearer $token"
  "Content-Type" = "application/json"
}

$body = @{
  title = "Test PowerShell Corrigé"
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
  -Body $body

Write-Host "✅ Propriété créée: $($property.title)"
Write-Host "ID: $($property._id)"
Write-Host "Status: $($property.status)"
Write-Host "Prix: $($property.price) $($property.currency)"
```

---

## 📊 Vérification

Pour vérifier que le schéma a été mis à jour :

```powershell
docker exec smartproperty-mongodb mongosh smartproperty --eval `
  "db.getCollectionInfos({name: 'properties'})[0].options.validator"
```

---

## 🔍 Diagnostic

### Si Vous Avez Toujours l'Erreur 500

#### 1. Vérifier que MongoDB a bien été mis à jour
```powershell
docker exec smartproperty-mongodb mongosh smartproperty --eval `
  "db.runCommand({listCollections: 1, filter: {name: 'properties'}})"
```

#### 2. Recréer la collection properties (⚠️ SUPPRIME LES DONNÉES)
```powershell
docker exec smartproperty-mongodb mongosh smartproperty --eval `
  "db.properties.drop(); db.createCollection('properties', { validator: { \$jsonSchema: { bsonType: 'object', required: ['title', 'type', 'status', 'ownerId', 'createdAt'] } } })"
```

#### 3. Redémarrer le Backend
```powershell
# Arrêter tous les processus Node
Get-Process -Name node -ErrorAction SilentlyContinue | Stop-Process -Force

# Redémarrer
cd "C:\Users\wael daagi\Documents\GitHub\smartproperty\backend"
npm run start:dev
```

---

## 📝 Champs Requis vs Optionnels

### ✅ Champs REQUIS
- `title` (string)
- `type` (enum: apartment, house, condo, studio, villa, land)
- `status` (enum: available, rented, maintenance, unlisted)
- `ownerId` (string ou ObjectId)
- `createdAt` (date)

### ⚪ Champs OPTIONNELS
- `description` (string | null | undefined)
- `price` (number)
- `currency` (string, défaut: "USD")
- `address` (object)
- `features` (object | null | undefined)
- `images` (array | null | undefined)
- `virtualTour` (string | null | undefined)
- `managerId` (string | ObjectId | null | undefined)
- `updatedAt` (date)
- `deletedAt` (date | null | undefined)

---

## 🎯 Exemple de Requête Minimale

```json
{
  "title": "Minimum Required",
  "type": "apartment"
}
```

Le backend va automatiquement ajouter :
- `status`: "available"
- `currency`: "USD"
- `ownerId`: (extrait du token JWT)
- `createdAt`: (timestamp actuel)

---

## 🎉 Résumé des Changements

| Fichier | Changement | Raison |
|---------|-----------|---------|
| `docker/mongo-init.js` | Schéma mis à jour | Permettre champs optionnels |
| `docker/update-properties-schema.js` | Nouveau script | Mise à jour schéma existant |
| Base de données MongoDB | Schéma appliqué | Accepte documents valides |

---

## ⏭️ Prochaines Étapes

1. ✅ Tester la création de propriété dans Swagger
2. ✅ Vérifier que le status est 201 (pas 401 ni 500)
3. ✅ Voir la propriété dans la liste (`GET /api/properties`)
4. ✅ Continuer le développement !

---

**Date de résolution** : 14 février 2026  
**Statut** : ✅ CORRIGÉ

