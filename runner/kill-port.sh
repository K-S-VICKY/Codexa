#!/bin/bash

# Kill process running on a specific port
if [ $# -eq 0 ]; then
    echo "Usage: ./kill-port.sh <port_number>"
    echo "Example: ./kill-port.sh 5174"
    exit 1
fi

PORT=$1

# Find process using the port
PID=$(lsof -t -i:$PORT 2>/dev/null)

if [ -z "$PID" ]; then
    echo "No process found running on port $PORT"
    exit 0
fi

echo "Found process $PID running on port $PORT"
echo "Killing process..."

# Try graceful termination first
kill $PID 2>/dev/null

# Wait a moment
sleep 2

# Check if still running
if kill -0 $PID 2>/dev/null; then
    echo "Process still running, force killing..."
    kill -9 $PID 2>/dev/null
fi

# Verify it's gone
if kill -0 $PID 2>/dev/null; then
    echo "Failed to kill process $PID"
    exit 1
else
    echo "Process $PID successfully terminated"
fi