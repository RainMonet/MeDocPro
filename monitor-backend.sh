#!/bin/bash
# Simple backend monitor and restart script

LOG_FILE="backend-monitor.log"
BACKEND_LOG="backend.log"

log_message() {
    echo "$(date): $1" | tee -a "$LOG_FILE"
}

check_backend() {
    curl -s --max-time 5 http://localhost:5000/health > /dev/null 2>&1
    return $?
}

start_backend() {
    log_message "Starting backend..."
    # Kill any existing backend processes
    pkill -f "python3 app.py" > /dev/null 2>&1
    sleep 2
    
    # Start new backend process
    python3 app.py > "$BACKEND_LOG" 2>&1 &
    BACKEND_PID=$!
    
    # Wait a moment for startup
    sleep 5
    
    # Check if it started successfully
    if check_backend; then
        log_message "Backend started successfully (PID: $BACKEND_PID)"
        return 0
    else
        log_message "Backend failed to start"
        return 1
    fi
}

log_message "Backend monitor starting..."

# Initial start
if ! check_backend; then
    log_message "Backend not running, starting..."
    start_backend
fi

# Monitor loop
FAILURE_COUNT=0
while true do
    sleep 30  # Check every 30 seconds
    
    if check_backend; then
        FAILURE_COUNT=0
    else
        FAILURE_COUNT=$((FAILURE_COUNT + 1))
        log_message "Backend health check failed (attempt $FAILURE_COUNT)"
        
        if [ $FAILURE_COUNT -ge 2 ]; then
            log_message "Backend appears to be down, restarting..."
            if start_backend; then
                FAILURE_COUNT=0
            else
                log_message "Failed to restart backend, will try again..."
            fi
        fi
    fi
done