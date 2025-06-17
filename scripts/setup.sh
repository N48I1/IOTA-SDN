#!/bin/bash

# Create virtual environment
python3 -m venv venv
source venv/bin/activate

# Install dependencies
pip install -r requirements.txt

# Create necessary directories
mkdir -p logs
mkdir -p data

# Set up environment variables
if [ ! -f .env ]; then
    echo "Creating .env file..."
    cat > .env << EOL
# Blockchain Configuration
BLOCKCHAIN_URL=http://localhost:8545
CONTRACT_ADDRESS=0x1234567890123456789012345678901234567890

# API Configuration
API_HOST=127.0.0.1
API_PORT=5000

# Controller Configuration
CONTROLLER_HOST=127.0.0.1
CONTROLLER_PORT=6633
EOL
fi

echo "Setup completed successfully!" 