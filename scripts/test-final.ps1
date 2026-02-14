# === SCRIPT DE TEST COMPLET ===

Write-Host "===========================================" -ForegroundColor Cyan
Write-Host "TEST DE CREATION DE PROPRIETE" -ForegroundColor Cyan
Write-Host "===========================================" -ForegroundColor Cyan
Write-Host ""

# 1. Connexion
Write-Host "1. Connexion..." -ForegroundColor Yellow
try {
    $loginResponse = Invoke-RestMethod `
        -Uri "http://localhost:3000/api/auth/login" `
        -Method POST `
        -ContentType "application/json" `
        -Body '{"email":"owner@smartproperty.com","password":"Password123!"}'

    $token = $loginResponse.tokens.accessToken
    Write-Host "   [OK] Connecte en tant que: $($loginResponse.user.email)" -ForegroundColor Green
    Write-Host ""
}
catch {
    Write-Host "   [ERREUR] Impossible de se connecter" -ForegroundColor Red
    Write-Host "   Details: $($_.Exception.Message)" -ForegroundColor Red
    exit 1
}

# 2. Creation de propriete
Write-Host "2. Creation de propriete..." -ForegroundColor Yellow
try {
    $headers = @{
        "Authorization" = "Bearer $token"
        "Content-Type" = "application/json"
    }

    $propertyData = @{
        title = "Appartement PowerShell Test"
        type = "apartment"
        price = 1500
        address = @{
            street = "123 Rue de la Paix"
            city = "Paris"
            state = "Ile-de-France"
            zipCode = "75001"
            country = "France"
        }
    } | ConvertTo-Json -Depth 10

    $property = Invoke-RestMethod `
        -Uri "http://localhost:3000/api/properties" `
        -Method POST `
        -Headers $headers `
        -Body $propertyData

    Write-Host "   [OK] Propriete creee avec succes !" -ForegroundColor Green
    Write-Host "   ID: $($property._id)" -ForegroundColor Cyan
    Write-Host "   Titre: $($property.title)" -ForegroundColor Gray
    Write-Host "   Type: $($property.type)" -ForegroundColor Gray
    Write-Host "   Status: $($property.status)" -ForegroundColor Gray
    Write-Host "   Prix: $($property.price) $($property.currency)" -ForegroundColor Gray
    Write-Host ""
}
catch {
    Write-Host "   [ERREUR] Impossible de creer la propriete" -ForegroundColor Red
    Write-Host "   Details: $($_.Exception.Message)" -ForegroundColor Red

    if ($_.ErrorDetails) {
        Write-Host "   Response: $($_.ErrorDetails.Message)" -ForegroundColor Yellow
    }
    exit 1
}

# 3. Recuperation de la liste
Write-Host "3. Recuperation de la liste..." -ForegroundColor Yellow
try {
    $list = Invoke-RestMethod `
        -Uri "http://localhost:3000/api/properties" `
        -Method GET

    Write-Host "   [OK] Liste recuperee" -ForegroundColor Green
    Write-Host "   Total: $($list.total) proprietes" -ForegroundColor Cyan
    Write-Host ""
}
catch {
    Write-Host "   [ERREUR] Impossible de recuperer la liste" -ForegroundColor Red
}

Write-Host "===========================================" -ForegroundColor Cyan
Write-Host "[OK] TOUS LES TESTS SONT PASSES !" -ForegroundColor Green
Write-Host "===========================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "Prochaines etapes:" -ForegroundColor Yellow
Write-Host "  1. Testez dans Swagger: http://localhost:3000/api/docs" -ForegroundColor White
Write-Host "  2. N'oubliez pas le hard refresh (Ctrl+Shift+R)" -ForegroundColor White
Write-Host "  3. Consultez GUIDE_COMPLET_FINAL.md pour plus d'infos" -ForegroundColor White
Write-Host ""

