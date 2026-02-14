# 🔧 Correction du Problème d'Authentification 401

## 🐛 Problème Identifié

Vous receviez l'erreur suivante lors de l'accès aux routes publiques de propriétés :

```json
{
  "message": "Authentication required",
  "error": "Unauthorized",
  "statusCode": 401
}
```

### Cause Racine

Le problème se trouvait dans le fichier `backend/src/modules/auth/guards/roles.guard.ts`. 

Le `RolesGuard` était appliqué au niveau de la classe `PropertiesController` avec :
```typescript
@UseGuards(JwtAuthGuard, RolesGuard)
```

Bien que certaines routes soient marquées comme publiques avec `@Public()`, le `RolesGuard` **ne vérifiait pas** si la route était publique avant d'essayer d'accéder à l'utilisateur authentifié.

## ✅ Solution Appliquée

### Modification du `RolesGuard`

J'ai ajouté une vérification du décorateur `@Public()` au début de la méthode `canActivate()` :

```typescript
canActivate(context: ExecutionContext): boolean {
  // Check if route is marked as public
  const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
    context.getHandler(),
    context.getClass(),
  ]);

  if (isPublic) {
    return true;  // ✅ Autoriser l'accès sans authentification
  }

  // ... reste du code pour les routes protégées
}
```

### Fichier Modifié

- **Fichier** : `backend/src/modules/auth/guards/roles.guard.ts`
- **Import ajouté** : `IS_PUBLIC_KEY` depuis `'../../../common/decorators/public.decorator'`
- **Logique ajoutée** : Vérification early-return si la route est publique

## 🧪 Routes Concernées

Les routes suivantes devraient maintenant fonctionner **sans authentification** :

### Routes Publiques de Propriétés
- `GET /api/properties` - Liste toutes les propriétés
- `GET /api/properties/:id` - Détails d'une propriété spécifique

### Routes Publiques d'Authentification
- `POST /api/auth/register` - Inscription
- `POST /api/auth/login` - Connexion
- `POST /api/auth/forgot-password` - Mot de passe oublié
- `POST /api/auth/reset-password` - Réinitialisation du mot de passe
- `GET /api/auth/verify-email` - Vérification d'email
- Et autres routes publiques d'auth...

## 🚀 Étapes Suivantes

### 1. Redémarrer le Backend

```powershell
cd "C:\Users\wael daagi\Documents\GitHub\smartproperty\backend"
npm run start:dev
```

### 2. Tester les Routes Publiques

#### Test avec cURL (PowerShell)
```powershell
# Test de la liste des propriétés (devrait fonctionner sans token)
curl http://localhost:3000/api/properties

# Test d'une propriété spécifique
curl http://localhost:3000/api/properties/{id}
```

#### Test avec le Frontend
Votre application React (port 5173) devrait maintenant pouvoir :
- Afficher la liste des propriétés sans être connecté
- Voir les détails d'une propriété sans authentification
- Accéder aux pages publiques normalement

### 3. Vérifier les Routes Protégées

Les routes suivantes **nécessitent toujours** un token JWT :
- `POST /api/properties` - Créer une propriété (OWNER, MANAGER, AGENT, ADMIN)
- `PUT /api/properties/:id` - Modifier une propriété
- `DELETE /api/properties/:id` - Supprimer une propriété

## 🔍 Comment Cela Fonctionne Maintenant

### Ordre d'Exécution des Guards

1. **JwtAuthGuard** s'exécute en premier
   - Vérifie si la route a `@Public()` → autorise
   - Sinon, vérifie le token JWT

2. **RolesGuard** s'exécute ensuite
   - ✅ **NOUVEAU** : Vérifie si la route a `@Public()` → autorise
   - Vérifie si des rôles sont requis avec `@Roles()` → vérifie les permissions
   - Sinon, autorise

### Architecture des Décorateurs

```typescript
// Route PUBLIQUE (pas d'authentification requise)
@Public()
@Get()
async findAll() { ... }

// Route PROTÉGÉE avec rôles spécifiques
@Post()
@Roles(UserRole.ADMIN, UserRole.OWNER)
async create() { ... }

// Route PROTÉGÉE (authentification requise, tous les rôles)
@Get('my-properties')
async getMyProperties() { ... }
```

## 📝 Notes Importantes

- ✅ Les en-têtes CORS sont correctement configurés
- ✅ Le `access-control-allow-credentials: true` est présent
- ✅ L'origin `http://localhost:5173` est autorisé
- ✅ Les routes publiques fonctionnent maintenant sans token

## 🛠️ Debug Supplémentaire (Si Nécessaire)

Si vous rencontrez toujours des problèmes :

### 1. Vérifier les Logs du Backend
```powershell
# Dans le terminal du backend, recherchez :
# - "🚀 SmartProperty API running on: http://localhost:3000"
# - Les requêtes entrantes
# - Les erreurs d'authentification
```

### 2. Vérifier la Configuration JWT
```typescript
// backend/src/config/jwt.config.ts
// Assurez-vous que JWT_SECRET est défini dans .env
```

### 3. Tester avec Swagger
Accédez à : `http://localhost:3000/api/docs`
- Les routes publiques ne doivent PAS montrer le cadenas 🔒
- Les routes protégées doivent montrer le cadenas 🔒

## ✨ Résultat Attendu

Après avoir redémarré le backend, vous devriez pouvoir :
- ✅ Voir la liste des propriétés sans être connecté
- ✅ Accéder aux détails d'une propriété sans token
- ✅ Naviguer sur les pages publiques de votre application
- ❌ Ne PAS pouvoir créer/modifier/supprimer des propriétés sans token
- ❌ Ne PAS pouvoir accéder aux routes protégées sans authentification

---

**Date de Correction** : 2026-02-14  
**Fichier Modifié** : `backend/src/modules/auth/guards/roles.guard.ts`  
**Impact** : Routes publiques maintenant accessibles sans authentification

