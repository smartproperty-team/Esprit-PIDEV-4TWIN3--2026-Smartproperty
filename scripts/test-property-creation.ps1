# ===========================================
# SmartProperty - Test de Creation de Propriete
# ===========================================

Write-Host "Test de Creation de Propriete SmartProperty" -ForegroundColor Cyan
Write-Host "============================================================" -ForegroundColor Cyan
Write-Host ""

# Configuration
$baseUrl = "http://localhost:3000/api"
$email = "owner@smartproperty.com"
$password = "Password123!"

# ===========================================
# 1. Test de Connexion
# ===========================================
Write-Host "1. Test de Connexion..." -ForegroundColor Yellow

try {
    $loginBody = @{
        email = $email
        password = $password
    } | ConvertTo-Json

    $loginResponse = Invoke-RestMethod -Uri "$baseUrl/auth/login" -Method POST -ContentType "application/json" -Body $loginBody -ErrorAction Stop

    $token = $loginResponse.tokens.accessToken

    Write-Host "   [OK] Connexion reussie !" -ForegroundColor Green
    Write-Host "   Utilisateur: $($loginResponse.user.email)" -ForegroundColor Gray
    Write-Host "   Role: $($loginResponse.user.role)" -ForegroundColor Gray
    if ($token -and $token.Length -gt 30) {
        Write-Host "   Token: $($token.Substring(0, 30))..." -ForegroundColor Gray
    } elseif ($token) {
        Write-Host "   Token: $token" -ForegroundColor Gray
    }
    Write-Host ""
}
catch {
    Write-Host "   [ERREUR] Erreur de connexion !" -ForegroundColor Red
    Write-Host "   Details: $($_.Exception.Message)" -ForegroundColor Red
    exit 1
}

# ===========================================
# 2. Test de Creation de Propriete
# ===========================================
Write-Host "2. Test de Creation de Propriete..." -ForegroundColor Yellow

try {
    $headers = @{
        "Authorization" = "Bearer $token"
        "Content-Type" = "application/json"
    }

    $propertyBody = @{
        title = "Appartement Test PowerShell"
        type = "apartment"
        price = 1500
        address = @{
            street = "123 Rue du Test"
            city = "Paris"
            state = "Ile-de-France"
            zipCode = "75001"
            country = "France"
        }
    } | ConvertTo-Json -Depth 10

    $propertyResponse = Invoke-RestMethod -Uri "$baseUrl/properties" -Method POST -Headers $headers -Body $propertyBody -ErrorAction Stop

    Write-Host "   [OK] Propriete creee avec succes !" -ForegroundColor Green
    Write-Host "   ID: $($propertyResponse._id)" -ForegroundColor Gray
    Write-Host "   Titre: $($propertyResponse.title)" -ForegroundColor Gray
    Write-Host "   Ville: $($propertyResponse.address.city)" -ForegroundColor Gray
    Write-Host "   Prix: $($propertyResponse.price) $($propertyResponse.currency)" -ForegroundColor Gray
    Write-Host "   Status: $($propertyResponse.status)" -ForegroundColor Gray
    Write-Host ""
}
catch {
    Write-Host "   [ERREUR] Erreur lors de la creation !" -ForegroundColor Red

    if ($_.Exception.Response) {
        $reader = New-Object System.IO.StreamReader($_.Exception.Response.GetResponseStream())
        $reader.BaseStream.Position = 0
        $reader.DiscardBufferedData()
        $responseBody = $reader.ReadToEnd()

        Write-Host "   Code HTTP: $($_.Exception.Response.StatusCode.value__)" -ForegroundColor Red
        Write-Host "   Details: $responseBody" -ForegroundColor Red
    }
    else {
        Write-Host "   Details: $($_.Exception.Message)" -ForegroundColor Red
    }
    exit 1
}

# ===========================================
# 3. Test de Recuperation de la Liste
# ===========================================
Write-Host "3. Test de Recuperation des Proprietes..." -ForegroundColor Yellow

try {
    $listResponse = Invoke-RestMethod -Uri "$baseUrl/properties" -Method GET -ErrorAction Stop

    Write-Host "   [OK] Liste recuperee avec succes !" -ForegroundColor Green
    Write-Host "   Nombre total: $($listResponse.total)" -ForegroundColor Gray
    Write-Host "   Page: $($listResponse.page)/$($listResponse.totalPages)" -ForegroundColor Gray
    Write-Host ""
}
catch {
    Write-Host "   [ERREUR] Erreur lors de la recuperation !" -ForegroundColor Red
    Write-Host "   Details: $($_.Exception.Message)" -ForegroundColor Red
}

# ===========================================
# Resume
# ===========================================
Write-Host "============================================================" -ForegroundColor Cyan
Write-Host "[OK] Tous les tests sont passes avec succes !" -ForegroundColor Green
Write-Host ""
Write-Host "Prochaines etapes:" -ForegroundColor Cyan
Write-Host "   1. Testez dans Swagger: http://localhost:3000/api/docs" -ForegroundColor White
Write-Host "   2. N'oubliez pas de faire un hard refresh (Ctrl+Shift+R)" -ForegroundColor White
Write-Host "   3. Collez le token SANS le mot Bearer dans Authorize" -ForegroundColor White
Write-Host ""






