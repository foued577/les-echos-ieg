#!/bin/bash

# Script de déploiement pour Les Échos de IEG sur Render
echo "🚀 Préparation du déploiement Les Échos de IEG..."

# Vérifier que les fichiers essentiels existent
echo "📋 Vérification des fichiers..."

if [ ! -f "backend/server.js" ]; then
    echo "❌ backend/server.js manquant"
    exit 1
fi

if [ ! -f "backend/package.json" ]; then
    echo "❌ backend/package.json manquant"
    exit 1
fi

if [ ! -f "package.json" ]; then
    echo "❌ package.json frontend manquant"
    exit 1
fi

if [ ! -f "vite.config.js" ]; then
    echo "❌ vite.config.js manquant"
    exit 1
fi

echo "✅ Fichiers essentiels présents"

# Vérifier les configurations Render
echo "🔧 Vérification des configurations..."

# Vérifier server.js pour 0.0.0.0
if grep -q "app.listen.*0.0.0.0" backend/server.js; then
    echo "✅ Serveur configuré pour 0.0.0.0"
else
    echo "❌ Serveur non configuré pour 0.0.0.0"
    exit 1
fi

# Vérifier CORS avec FRONTEND_URL
if grep -q "FRONTEND_URL" backend/server.js; then
    echo "✅ CORS configuré avec FRONTEND_URL"
else
    echo "❌ CORS non configuré avec FRONTEND_URL"
    exit 1
fi

# Vérifier apiClient avec VITE_API_URL
if grep -q "VITE_API_URL" src/lib/apiClient.js; then
    echo "✅ apiClient configuré avec VITE_API_URL"
else
    echo "❌ apiClient non configuré avec VITE_API_URL"
    exit 1
fi

echo "✅ Configuration validée"

# Instructions de déploiement
echo ""
echo "📋 INSTRUCTIONS DE DÉPLOIEMENT RENDER"
echo "======================================"
echo ""
echo "1. Backend (Web Service) :"
echo "   - Type: Web Service"
echo "   - Root Directory: backend"
echo "   - Build Command: npm install"
echo "   - Start Command: npm start"
echo "   - Variables:"
echo "     MONGO_URI=votre_chaine_mongodb_atlas"
echo "     JWT_SECRET=votre_secret_jwt_32_caracteres"
echo "     FRONTEND_URL=https://les-echos-ieg.onrender.com"
echo "     NODE_ENV=production"
echo ""
echo "2. Frontend (Static Site) :"
echo "   - Type: Static Site"
echo "   - Root Directory: (vide)"
echo "   - Build Command: npm install && npm run build"
echo "   - Publish Directory: dist"
echo "   - Variables:"
echo "     VITE_API_URL=https://les-echos-ieg-api.onrender.com/api"
echo ""
echo "3. Rewrite Rule (Frontend) :"
echo "   - Source: /*"
echo "   - Destination: /index.html"
echo "   - Action: Rewrite"
echo ""
echo "🎉 Prêt pour le déploiement sur Render !"
