# Troubleshooting Authentication - Guide de Diagnostic

## ✅ Corrections Appliquées

### 1. Clé Supabase Mise à Jour

**Problème:** La clé publishable moderne peut causer des problèmes avec certaines fonctionnalités Supabase Auth.

**Solution:** Utilisation de la clé anon legacy dans `.env.local`:
```env
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

### 2. Gestion d'Erreurs Améliorée

**Améliorations:**
- Messages d'erreur plus détaillés
- Vérification de chaque étape du processus d'authentification
- Gestion des erreurs spécifiques à chaque étape

### 3. Configuration Client Supabase

**Ajouté:**
- `flowType: "pkce"` pour une meilleure sécurité
- Validation des variables d'environnement au démarrage

## 🔍 Étapes de Diagnostic

### Étape 1: Vérifier les Variables d'Environnement

Assurez-vous que `.env.local` contient:
```env
NEXT_PUBLIC_SUPABASE_URL=https://bscjzwoppjhrzlxnrwol.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

**Important:** Redémarrez le serveur Next.js après modification de `.env.local`:
```bash
# Arrêter le serveur (Ctrl+C)
# Puis relancer
npm run dev
```

### Étape 2: Vérifier qu'un Utilisateur Existe dans Supabase

1. Aller dans **Supabase Dashboard** → **Authentication** → **Users**
2. Vérifier qu'au moins un utilisateur existe
3. Si aucun utilisateur, créer un utilisateur de test:
   - Cliquer sur **"Add user"** → **"Create new user"**
   - Entrer email et mot de passe
   - Noter l'ID de l'utilisateur créé

### Étape 3: Vérifier qu'un Profil Existe

Dans **Supabase SQL Editor**, exécuter:
```sql
SELECT * FROM profiles;
```

Si aucun profil n'existe pour votre utilisateur, créer un profil:
```sql
-- Remplacer USER_ID par l'ID de l'utilisateur créé à l'étape 2
INSERT INTO profiles (id, role)
VALUES ('USER_ID', 'admin');
-- ou 'analyst' ou 'seller'
```

### Étape 4: Vérifier les RLS Policies

Vérifier que les policies RLS permettent la lecture des profils:
```sql
SELECT * FROM pg_policies WHERE tablename = 'profiles';
```

Si nécessaire, créer une policy:
```sql
CREATE POLICY "Users can read own profile"
ON public.profiles
FOR SELECT
TO authenticated
USING (auth.uid() = id);
```

### Étape 5: Tester la Connexion

1. Aller sur `http://localhost:3000/login`
2. Entrer l'email et le mot de passe de l'utilisateur créé
3. Observer les messages d'erreur s'il y en a

## 🐛 Erreurs Courantes et Solutions

### Erreur: "Invalid login credentials"
**Cause:** Email ou mot de passe incorrect
**Solution:** Vérifier les identifiants dans Supabase Dashboard → Authentication → Users

### Erreur: "Profil non trouvé"
**Cause:** Aucun profil dans la table `profiles` pour cet utilisateur
**Solution:** Créer un profil avec l'ID de l'utilisateur

### Erreur: "Missing Supabase environment variables"
**Cause:** Variables d'environnement non chargées
**Solution:** 
- Vérifier que `.env.local` existe dans `lvmh-analytics/`
- Redémarrer le serveur Next.js

### Erreur: "Rôle utilisateur invalide"
**Cause:** Le rôle dans `profiles.role` n'est pas 'admin', 'analyst', ou 'seller'
**Solution:** Mettre à jour le rôle dans la table profiles:
```sql
UPDATE profiles SET role = 'admin' WHERE id = 'USER_ID';
```

### Erreur: Redirection en boucle
**Cause:** Middleware qui redirige constamment
**Solution:** Vérifier que le middleware ne bloque pas la route `/login`

## 🔧 Commandes Utiles

### Vérifier les utilisateurs dans Supabase
```sql
SELECT id, email, created_at FROM auth.users;
```

### Vérifier les profils
```sql
SELECT p.id, p.role, u.email 
FROM profiles p
LEFT JOIN auth.users u ON p.id = u.id;
```

### Créer un utilisateur de test complet
1. Créer l'utilisateur dans Supabase Dashboard → Authentication → Users
2. Créer le profil:
```sql
INSERT INTO profiles (id, role, created_at)
VALUES ('USER_ID_FROM_AUTH', 'admin', NOW());
```

## 📝 Checklist de Vérification

- [ ] Variables d'environnement configurées dans `.env.local`
- [ ] Serveur Next.js redémarré après modification de `.env.local`
- [ ] Au moins un utilisateur existe dans Supabase Auth
- [ ] Un profil existe dans la table `profiles` pour cet utilisateur
- [ ] Le rôle dans le profil est 'admin', 'analyst', ou 'seller'
- [ ] Les RLS policies permettent la lecture des profils
- [ ] Le serveur Next.js fonctionne sans erreurs

## 🚀 Test Rapide

Pour tester rapidement l'authentification:

1. Créer un utilisateur dans Supabase Dashboard
2. Créer son profil:
```sql
INSERT INTO profiles (id, role) 
VALUES ('USER_ID', 'admin');
```
3. Se connecter avec cet utilisateur sur `/login`
4. Vérifier la redirection vers `/dashboard/admin`

Si cela ne fonctionne toujours pas, vérifier la console du navigateur (F12) pour voir les erreurs JavaScript.
