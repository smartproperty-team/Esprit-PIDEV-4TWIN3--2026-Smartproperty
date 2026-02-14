# ===========================================
# Test Creation de Propriete
# ===========================================

Write-Host "==========================================="
Write-Host "TEST CREATION DE PROPRIETE"
Write-Host "==========================================="
Write-Host ""

# 1. Connexion
Write-Host "[1/3] Connexion..." -ForegroundColor Yellow
try {
    $loginResponse = Invoke-RestMethod `
        -Uri "http://localhost:3000/api/auth/login" `
        -Method POST `
        -ContentType "application/json" `
        -Body '{"email":"owner@smartproperty.com","password":"Password123!"}'

    $token = $loginResponse.tokens.accessToken
    Write-Host "[OK] Connecte: $($loginResponse.user.email) ($($loginResponse.user.role))" -ForegroundColor Green
}
catch {
    Write-Host "[ERREUR] $($_.Exception.Message)" -ForegroundColor Red
    Write-Host ""
    Write-Host "Assurez-vous que le backend tourne:"
    Write-Host "  cd backend && npm run start:dev"
    exit 1
}
Write-Host ""

# 2. Creation
Write-Host "[2/3] Creation de propriete..." -ForegroundColor Yellow
try {
    $headers = @{
        "Authorization" = "Bearer $token"
        "Content-Type" = "application/json"
    }

    $timestamp = Get-Date -Format "HHmmss"
    $body = @{
        title = "Appartement Test $timestamp"
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
        -Body $body

    Write-Host "[OK] Propriete creee !" -ForegroundColor Green
    Write-Host "  ID:     $($property._id)" -ForegroundColor Cyan
    Write-Host "  Titre:  $($property.title)"
    Write-Host "  Type:   $($property.type)"
    Write-Host "  Status: $($property.status)"
    Write-Host "  Prix:   $($property.price) $($property.currency)"
}
catch {
    Write-Host "[ERREUR] $($_.Exception.Message)" -ForegroundColor Red
    if ($_.ErrorDetails) {
        Write-Host "Details: $($_.ErrorDetails.Message)" -ForegroundColor Yellow
    }
    Write-Host ""
    Write-Host "Si erreur 500 'Document failed validation':"
    Write-Host "  Executez: & `"$PSScriptRoot\fix-mongodb-validation.ps1`""
    exit 1
}
Write-Host ""

# 3. Liste
Write-Host "[3/3] Verification de la liste..." -ForegroundColor Yellow
try {
    $list = Invoke-RestMethod -Uri "http://localhost:3000/api/properties" -Method GET
    Write-Host "[OK] Total: $($list.total) propriete(s)" -ForegroundColor Green
}
catch {
    Write-Host "[ERREUR] $($_.Exception.Message)" -ForegroundColor Red
}

Write-Host ""
Write-Host "==========================================="
Write-Host "SUCCES !"
Write-Host "==========================================="

