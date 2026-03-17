# 🧪 Scripts PowerShell de Test - API SmartProperty

## 🚀 Redémarrer le Backend

```powershell
# Arrêter tous les processus Node
Get-Process node -ErrorAction SilentlyContinue | Stop-Process -Force

# Redémarrer le backend
cd "C:\Users\wael daagi\Documents\GitHub\smartproperty\backend"
npm run start:dev
```

Attendez de voir : `🚀 SmartProperty API running on: http://localhost:3000`

---

## ✅ Test 1 : Route Publique (Sans Token)

```powershell
# Devrait retourner 200 OK avec la liste des propriétés (même vide)
$response = Invoke-RestMethod -Uri "http://localhost:3000/api/properties" -Method GET
Write-Host "✅ Route publique OK - Total propriétés: $($response.total)" -ForegroundColor Green
```

---

## ❌ Test 2 : Création Sans Authentification (Devrait Échouer)

```powershell
# Devrait retourner 401 Unauthorized
$propertyBody = @{
    title = "Test Sans Auth"
    type = "apartment"
    price = 1500
    address = @{
        street = "123 Test St"
        city = "Paris"
        state = "Île-de-France"
        zipCode = "75001"
        country = "France"
    }
} | ConvertTo-Json -Depth 10

try {
    Invoke-RestMethod -Uri "http://localhost:3000/api/properties" `
        -Method POST -Body $propertyBody -ContentType "application/json"
    Write-Host "❌ ERREUR : Devrait échouer sans token!" -ForegroundColor Red
} catch {
    if ($_.Exception.Response.StatusCode.Value__ -eq 401) {
        Write-Host "✅ Test réussi : 401 Unauthorized (comme attendu)" -ForegroundColor Green
    } else {
        Write-Host "❌ Code d'erreur inattendu: $($_.Exception.Response.StatusCode.Value__)" -ForegroundColor Red
    }
}
```

---

## ✅ Test 3 : Connexion et Création avec OWNER

```powershell
# 1. Se connecter avec le compte OWNER
Write-Host "`n=== CONNEXION OWNER ===" -ForegroundColor Cyan

$loginBody = @{
    email = "owner@smartproperty.com"
    password = "Password123!"
} | ConvertTo-Json

$loginResponse = Invoke-RestMethod -Uri "http://localhost:3000/api/auth/login" `
    -Method POST -Body $loginBody -ContentType "application/json"

Write-Host "✅ Connecté: $($loginResponse.user.email) ($($loginResponse.user.role))" -ForegroundColor Green
$token = $loginResponse.access_token
Write-Host "Token (50 premiers car.): $($token.Substring(0, 50))..." -ForegroundColor Yellow

# 2. Créer une propriété avec le token
Write-Host "`n=== CRÉATION DE PROPRIÉTÉ ===" -ForegroundColor Cyan

$propertyBody = @{
    title = "Magnifique Appartement Parisien"
    description = "Superbe appartement au coeur de Paris"
    type = "apartment"
    price = 2500
    currency = "EUR"
    address = @{
        street = "45 Avenue des Champs-Élysées"
        city = "Paris"
        state = "Île-de-France"
        zipCode = "75008"
        country = "France"
    }
    features = @{
        bedrooms = 3
        bathrooms = 2
        area = 120
        furnished = $true
        petFriendly = $false
        amenities = @("wifi", "climatisation", "balcon")
    }
} | ConvertTo-Json -Depth 10

$headers = @{
    "Authorization" = "Bearer $token"
    "Content-Type" = "application/json"
}

$property = Invoke-RestMethod -Uri "http://localhost:3000/api/properties" `
    -Method POST -Body $propertyBody -Headers $headers

Write-Host "✅ PROPRIÉTÉ CRÉÉE AVEC SUCCÈS!" -ForegroundColor Green
Write-Host "   ID: $($property._id)" -ForegroundColor Cyan
Write-Host "   Titre: $($property.title)" -ForegroundColor Cyan
Write-Host "   Prix: $($property.price) $($property.currency)" -ForegroundColor Cyan
Write-Host "   Propriétaire: $($property.owner.name)" -ForegroundColor Cyan
```

---

## ❌ Test 4 : Création avec TENANT (Devrait Échouer)

```powershell
# 1. Se connecter avec le compte TENANT
Write-Host "`n=== CONNEXION TENANT ===" -ForegroundColor Cyan

$loginBody = @{
    email = "tenant@smartproperty.com"
    password = "Password123!"
} | ConvertTo-Json

$loginResponse = Invoke-RestMethod -Uri "http://localhost:3000/api/auth/login" `
    -Method POST -Body $loginBody -ContentType "application/json"

Write-Host "✅ Connecté: $($loginResponse.user.email) ($($loginResponse.user.role))" -ForegroundColor Green
$tenantToken = $loginResponse.access_token

# 2. Essayer de créer une propriété (devrait échouer)
Write-Host "`n=== TENTATIVE DE CRÉATION (DEVRAIT ÉCHOUER) ===" -ForegroundColor Cyan

$propertyBody = @{
    title = "Test Tenant"
    type = "apartment"
    price = 1000
    address = @{
        street = "123 Test"
        city = "Paris"
        state = "IDF"
        zipCode = "75001"
        country = "France"
    }
} | ConvertTo-Json -Depth 10

$headers = @{
    "Authorization" = "Bearer $tenantToken"
    "Content-Type" = "application/json"
}

try {
    Invoke-RestMethod -Uri "http://localhost:3000/api/properties" `
        -Method POST -Body $propertyBody -Headers $headers
    Write-Host "❌ ERREUR : Le tenant ne devrait pas pouvoir créer!" -ForegroundColor Red
} catch {
    if ($_.Exception.Response.StatusCode.Value__ -eq 403) {
        Write-Host "✅ Test réussi : 403 Forbidden (comme attendu)" -ForegroundColor Green
        Write-Host "   Les tenants ne peuvent pas créer de propriétés" -ForegroundColor Yellow
    } else {
        Write-Host "❌ Code d'erreur inattendu: $($_.Exception.Response.StatusCode.Value__)" -ForegroundColor Red
    }
}
```

---

## 📊 Test Complet (Tous les Scénarios)

```powershell
# Script complet pour tester tous les scénarios

Write-Host "╔═══════════════════════════════════════════════════════════╗" -ForegroundColor Cyan
Write-Host "║   TESTS COMPLETS - API SMARTPROPERTY                     ║" -ForegroundColor Cyan
Write-Host "╚═══════════════════════════════════════════════════════════╝" -ForegroundColor Cyan

$testResults = @()

# Test 1 : Route publique
Write-Host "`n[1/4] Test route publique..." -ForegroundColor Yellow
try {
    $response = Invoke-RestMethod -Uri "http://localhost:3000/api/properties" -Method GET
    Write-Host "   ✅ PASS - Route publique accessible" -ForegroundColor Green
    $testResults += "✅ Route publique"
} catch {
    Write-Host "   ❌ FAIL - Route publique inaccessible" -ForegroundColor Red
    $testResults += "❌ Route publique"
}

# Test 2 : Création sans token
Write-Host "`n[2/4] Test création sans authentification..." -ForegroundColor Yellow
$body = @{title="Test";type="apartment";price=1500;address=@{street="Test";city="Paris";state="IDF";zipCode="75001";country="FR"}} | ConvertTo-Json -Depth 10
try {
    Invoke-RestMethod -Uri "http://localhost:3000/api/properties" -Method POST -Body $body -ContentType "application/json"
    Write-Host "   ❌ FAIL - Devrait retourner 401" -ForegroundColor Red
    $testResults += "❌ Refus sans auth"
} catch {
    if ($_.Exception.Response.StatusCode.Value__ -eq 401) {
        Write-Host "   ✅ PASS - 401 Unauthorized" -ForegroundColor Green
        $testResults += "✅ Refus sans auth"
    }
}

# Test 3 : Création avec OWNER
Write-Host "`n[3/4] Test création avec OWNER..." -ForegroundColor Yellow
try {
    $login = @{email="owner@smartproperty.com";password="Password123!"} | ConvertTo-Json
    $auth = Invoke-RestMethod -Uri "http://localhost:3000/api/auth/login" -Method POST -Body $login -ContentType "application/json"
    $headers = @{Authorization="Bearer $($auth.access_token)";ContentType="application/json"}
    $prop = Invoke-RestMethod -Uri "http://localhost:3000/api/properties" -Method POST -Body $body -Headers $headers
    Write-Host "   ✅ PASS - Propriété créée (ID: $($prop._id))" -ForegroundColor Green
    $testResults += "✅ Création OWNER"
} catch {
    Write-Host "   ❌ FAIL - Erreur: $($_.Exception.Message)" -ForegroundColor Red
    $testResults += "❌ Création OWNER"
}

# Test 4 : Création avec TENANT
Write-Host "`n[4/4] Test création avec TENANT..." -ForegroundColor Yellow
try {
    $login = @{email="tenant@smartproperty.com";password="Password123!"} | ConvertTo-Json
    $auth = Invoke-RestMethod -Uri "http://localhost:3000/api/auth/login" -Method POST -Body $login -ContentType "application/json"
    $headers = @{Authorization="Bearer $($auth.access_token)";ContentType="application/json"}
    Invoke-RestMethod -Uri "http://localhost:3000/api/properties" -Method POST -Body $body -Headers $headers
    Write-Host "   ❌ FAIL - Devrait retourner 403" -ForegroundColor Red
    $testResults += "❌ Refus TENANT"
} catch {
    if ($_.Exception.Response.StatusCode.Value__ -eq 403) {
        Write-Host "   ✅ PASS - 403 Forbidden" -ForegroundColor Green
        $testResults += "✅ Refus TENANT"
    }
}

# Résumé
Write-Host "`n╔═══════════════════════════════════════════════════════════╗" -ForegroundColor Cyan
Write-Host "║   RÉSUMÉ DES TESTS                                       ║" -ForegroundColor Cyan
Write-Host "╚═══════════════════════════════════════════════════════════╝" -ForegroundColor Cyan
$testResults | ForEach-Object { Write-Host "   $_" }

$passCount = ($testResults | Where-Object { $_ -like "✅*" }).Count
$totalCount = $testResults.Count
Write-Host "`n   Score: $passCount/$totalCount tests réussis" -ForegroundColor $(if($passCount -eq $totalCount){"Green"}else{"Yellow"})
```

---

## 🔍 Test Individuel d'un Compte

```powershell
# Testez n'importe quel compte rapidement
function Test-UserAuth {
    param(
        [string]$Email,
        [string]$Password = "Password123!"
    )
    
    $loginBody = @{
        email = $Email
        password = $Password
    } | ConvertTo-Json
    
    try {
        $response = Invoke-RestMethod -Uri "http://localhost:3000/api/auth/login" `
            -Method POST -Body $loginBody -ContentType "application/json"
        
        Write-Host "✅ Connexion réussie!" -ForegroundColor Green
        Write-Host "   Email: $($response.user.email)" -ForegroundColor Cyan
        Write-Host "   Rôle: $($response.user.role)" -ForegroundColor Cyan
        Write-Host "   Nom: $($response.user.firstName) $($response.user.lastName)" -ForegroundColor Cyan
        
        return $response.access_token
    } catch {
        Write-Host "❌ Échec de connexion: $($_.Exception.Message)" -ForegroundColor Red
        return $null
    }
}

# Utilisation
Test-UserAuth -Email "owner@smartproperty.com"
Test-UserAuth -Email "admin@smartproperty.com"
Test-UserAuth -Email "manager@smartproperty.com"
Test-UserAuth -Email "tenant@smartproperty.com"
```

---

## 📝 Notes d'Utilisation

### Copier-Coller Rapide

1. **Ouvrez PowerShell**
2. **Copiez** un des scripts ci-dessus
3. **Collez** dans PowerShell (Ctrl+V ou clic droit)
4. **Appuyez** sur Entrée

### Assurez-vous que :

- ✅ Le backend est démarré (`npm run start:dev`)
- ✅ MongoDB est accessible
- ✅ Les utilisateurs de test existent (seed exécuté)

### En Cas d'Erreur :

Si vous obtenez des erreurs de connexion :
```powershell
# Vérifier si le backend est accessible
Test-NetConnection localhost -Port 3000
```

---

**Date** : 2026-02-14  
**Testé avec** : PowerShell 5.1+  
**Backend** : http://localhost:3000

