#!/bin/bash

# ZentinelOS Permanent Virtual Environment Setup
# This script creates a permanent venv that persists across IDE restarts

echo "Setting up permanent virtual environment for ZentinelOS..."

# Check if venv already exists
if [ -d "venv" ]; then
    echo " Virtual environment already exists"
    echo "Location: $(pwd)/venv"
    echo "🐍 Python: $(pwd)/venv/bin/python"
else
    echo "Creating new virtual environment..."
    python3 -m venv venv
    echo "Virtual environment created"
fi

# Activate the virtual environment
echo "Activating virtual environment..."
source venv/bin/activate

# Upgrade pip
echo "⬆Upgrading pip..."
pip install --upgrade pip

# Install core dependencies
echo "Installing core dependencies..."
pip install fastapi uvicorn websockets python-multipart
pip install opencv-python ultralytics numpy
pip install python-dotenv psutil

echo "Core dependencies installed"

# Create activation script for easy use
cat > activate_venv.sh << 'EOF'
#!/bin/bash
# Quick activation script
echo "Activating ZentinelOS virtual environment..."
source venv/bin/activate
echo "Virtual environment activated"
echo "Python: $(which python)"
echo "Pip: $(which pip)"
EOF

chmod +x activate_venv.sh

echo ""
echo "🎉 Permanent virtual environment setup complete!"
echo ""
echo "📋 USAGE INSTRUCTIONS:"
echo "1. To activate: source venv/bin/activate"
echo "2. Or use: ./activate_venv.sh"
echo "3. To deactivate: deactivate"
echo ""
echo "💡 TIPS:"
echo "- The venv folder should be added to your .gitignore"
echo "- This venv will persist across IDE restarts"
echo "- All packages are installed and ready to use"
echo ""
echo "🚀 To start the backend:"
echo "   source venv/bin/activate"
echo "   ./run_backend.sh"
