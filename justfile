# Development Commands

# Display available commands
help:
    @just --list

# Run game server on port 8080
[working-directory: 'backend']
run savefile=`date +"saves/gamestate-%F.json"`:
    NODE_ENV=production PORT=8080 npm start {{savefile}} | tee $(date +"saves/server-%F.log")

# Build game frontend for production run
[working-directory: 'frontend']
build:
    npm run build

# Run game server connecting to a Vite frontend server at port 3000
[working-directory: 'backend']
dev_backend:
    npm start

# Run Vite frontend at port 8000, connect to backend on port 3000
[working-directory: 'frontend']
dev_frontend:
    npm run dev

# https://dash.cloudflare.com/?to=/:account/tunnels
# Run a cloudflare tunnel to serve the application
tunnel:
    @if [ ! -f token ]; then echo "Token file does not exist. Please create it"; exit 1; fi
    @cloudflared tunnel run --token $(cat token)
