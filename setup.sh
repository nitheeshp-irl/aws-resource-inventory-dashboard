#!/bin/bash

# AWS Resource Inventory Setup Script
echo "🚀 Setting up AWS Resource Inventory Dashboard..."

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    echo "❌ Node.js is not installed. Please install Node.js 18+ first."
    exit 1
fi

# Check Node.js version
NODE_VERSION=$(node -v | cut -d'v' -f2 | cut -d'.' -f1)
if [ "$NODE_VERSION" -lt 18 ]; then
    echo "❌ Node.js version 18+ is required. Current version: $(node -v)"
    exit 1
fi

echo "✅ Node.js version: $(node -v)"

# Install root dependencies
echo "📦 Installing root dependencies..."
npm install

# Install backend dependencies
echo "📦 Installing backend dependencies..."
cd backend
npm install

# Create .env file if it doesn't exist
if [ ! -f .env ]; then
    echo "📝 Creating .env file from template..."
    cp env.example .env
    echo "⚠️  Please edit backend/.env with your configuration"
fi

# Create data directory
mkdir -p data logs

cd ..

# Install frontend dependencies
echo "📦 Installing frontend dependencies..."
cd frontend
npm install

cd ..

echo ""
echo "✅ Setup complete!"
echo ""
echo "📋 Next steps:"
echo "1. Edit backend/.env with your configuration"
echo "2. Run 'npm run dev' to start both servers"
echo "3. Open http://localhost:3000 in your browser"
echo "4. Add your first AWS account in Account Management"
echo ""
echo "🔧 Development commands:"
echo "  npm run dev          - Start both frontend and backend"
echo "  npm run dev:backend  - Start only backend"
echo "  npm run dev:frontend - Start only frontend"
echo "  npm run build        - Build for production"
echo "  npm test            - Run tests"
echo ""
echo "📚 For more information, see README.md"
