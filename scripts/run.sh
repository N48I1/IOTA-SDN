#!/bin/bash

# Activate virtual environment
source venv/bin/activate

# Start the API server
echo "Starting API server..."
python src/server/main.py &
API_PID=$!

# Wait for API server to start
sleep 5

# Start the RYU controller
echo "Starting RYU controller..."
ryu-manager src/controller/ryu_controller.py &
CONTROLLER_PID=$!

# Wait for controller to start
sleep 5

# Start the network
echo "Starting network..."
sudo python src/network/main.py &
NETWORK_PID=$!

# Function to handle cleanup
cleanup() {
    echo "Shutting down..."
    kill $API_PID
    kill $CONTROLLER_PID
    kill $NETWORK_PID
    exit 0
}

# Set up trap for cleanup
trap cleanup SIGINT SIGTERM

# Keep script running
while true; do
    sleep 1
done 