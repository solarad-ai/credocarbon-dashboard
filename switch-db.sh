#!/bin/bash

# CredoCarbon Database Switcher
# Quick script to switch between local and production databases

echo "============================================"
echo "  CredoCarbon Database Switcher"
echo "============================================"
echo ""
echo "Select database environment:"
echo "1) Local Development (safe)"
echo "2) Production Supabase (⚠️  LIVE DATA)"
echo "3) Cancel"
echo ""
read -p "Enter choice [1-3]: " choice

case $choice in
    1)
        echo ""
        echo "✅ Switching to LOCAL database..."
        if [ -f ".env.local" ]; then
            cp .env.local .env
            echo "✅ Connected to: localhost:5432/credo_carbon"
            echo "✅ Environment: Development"
        else
            echo "❌ .env.local not found!"
            exit 1
        fi
        ;;
    2)
        echo ""
        echo "⚠️  WARNING: You are about to connect to PRODUCTION database!"
        read -p "Are you sure? (yes/no): " confirm
        if [ "$confirm" = "yes" ]; then
            if [ -f ".env.production" ]; then
                cp .env.production .env
                echo "✅ Connected to: Supabase Production"
                echo "⚠️  Environment: PRODUCTION - Be Careful!"
            else
                echo "❌ .env.production not found!"
                exit 1
            fi
        else
            echo "❌ Cancelled."
            exit 0
        fi
        ;;
    3)
        echo "❌ Cancelled."
        exit 0
        ;;
    *)
        echo "❌ Invalid choice!"
        exit 1
        ;;
esac

echo ""
echo "============================================"
echo "Next steps:"
echo "1. Restart your backend server"
echo "2. Check: uvicorn apps.api.main:app --reload"
echo "============================================"
