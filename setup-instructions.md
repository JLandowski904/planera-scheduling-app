# Setup Instructions for plandango Scheduling App

## Prerequisites

You need to install Node.js to run this React application. You have several options:

## Option 1: Install Node.js Directly

### 1. Install Node.js

1. Go to [https://nodejs.org/](https://nodejs.org/)
2. Download the LTS version (recommended for most users)
3. Run the installer and follow the setup wizard
4. Restart your command prompt/terminal after installation

## Option 2: Use Docker (Recommended for Development)

### 1. Install Docker

Docker has specific installation instructions for each operating system. Please refer to the official documentation at [https://docker.com/get-started/](https://docker.com/get-started/)

### 2. Pull the Node.js Docker Image

```bash
docker pull node:22-alpine
```

### 3. Run the Application with Docker

```bash
# Build the Docker image
docker build -t plandango-app .

# Run the container
docker run -p 3000:3000 -v $(pwd):/app plandango-app
```

Or use the provided docker-compose file:

```bash
docker-compose up
```

## Option 3: Use Docker for Development (Interactive)

### 1. Create a Node.js Container and Start a Shell Session

```bash
docker run -it --rm --entrypoint sh node:22-alpine
```

### 2. Verify the Node.js Version

```bash
node -v # Should print "v22.20.0"
npm -v  # Should print "10.9.3"
```

### 3. Mount Your Project Directory

```bash
# Exit the container first, then run with volume mount
docker run -it --rm -v $(pwd):/app -w /app node:22-alpine sh
```

## Quick Start (Choose Your Method)

### Method A: Direct Node.js Installation

1. **Verify Installation** (if you installed Node.js directly):
   ```bash
   node --version
   npm --version
   ```

2. **Install Dependencies**:
   ```bash
   npm install
   ```

3. **Start the Application**:
   ```bash
   npm start
   ```

### Method B: Docker (No Local Node.js Required)

1. **Build and Run with Docker Compose**:
   ```bash
   docker-compose up
   ```

2. **Or Build and Run Manually**:
   ```bash
   docker build -t plandango-app .
   docker run -p 3000:3000 plandango-app
   ```

### Method C: Interactive Docker Development

1. **Start Interactive Container**:
   ```bash
   docker run -it --rm -v $(pwd):/app -w /app node:22-alpine sh
   ```

2. **Inside the container, run**:
   ```bash
   npm install
   npm start
   ```

The application will open in your browser at `http://localhost:3000`.

## Alternative: Using Yarn

If you prefer Yarn over npm:

1. Install Yarn: `npm install -g yarn`
2. Install dependencies: `yarn install`
3. Start the app: `yarn start`

## Troubleshooting

### Common Issues

1. **"npm is not recognized"**: Node.js is not installed or not in PATH
   - Solution: Install Node.js from nodejs.org or use Docker

2. **Permission errors on Windows**: Run command prompt as Administrator

3. **Port 3000 already in use**: 
   - Solution: The app will automatically try port 3001, 3002, etc.

4. **Dependencies fail to install**:
   - Solution: Clear npm cache: `npm cache clean --force`
   - Then try: `npm install` again

### Docker-Specific Issues

1. **"docker command not found"**: Docker is not installed
   - Solution: Install Docker from [docker.com/get-started](https://docker.com/get-started/)

2. **Permission denied on Docker commands**:
   - Solution: Add your user to the docker group or run with `sudo`

3. **Container won't start**:
   - Solution: Check if port 3000 is available: `docker ps`
   - Try a different port: `docker run -p 3001:3000 plandango-app`

4. **File changes not reflected in container**:
   - Solution: Use the docker-compose.yml file which includes volume mounting
   - Or ensure you're using volume mounts: `-v $(pwd):/app`

### Getting Help

- Check the README.md for detailed documentation
- Review the console for any error messages
- Ensure you have a stable internet connection for downloading packages

## What's Included

This application includes:

✅ **Complete React Application** with TypeScript
✅ **All Core Components** (Canvas, Nodes, Edges, Toolbar, Sidebar)
✅ **Three Views** (Whiteboard, Timeline, Table)
✅ **Keyboard Shortcuts** (N, M, D, P, L, Delete, etc.)
✅ **Data Persistence** (Local Storage + Import/Export)
✅ **Conflict Detection** (Circular dependencies, over-allocation)
✅ **Construction Templates** (Sample project included)
✅ **Responsive Design** with Tailwind CSS
✅ **Context Menus** and Properties Panel
✅ **Undo/Redo** functionality

## Sample Project

The app starts with a sample "Subdivision – Oak Ridge" project that includes:
- Project milestones (30%, 60%, 90% Design, Permit Issued)
- Deliverables (Site Plan, Utility Plan, Stormwater Report)
- Tasks (Topo Survey, Geotech Report, Utility Coordination, etc.)
- People (PM, Civil Engineer, Stormwater Engineer, Surveyor)
- Dependencies between all items

## Next Steps

Once you have the app running:

1. **Explore the sample project** - try different views and interactions
2. **Create new nodes** - use the toolbar or keyboard shortcuts
3. **Add dependencies** - press L to enter link mode
4. **Switch views** - try Whiteboard (1), Timeline (2), Table (3)
5. **Check conflicts** - look for the conflicts panel
6. **Export your work** - save projects as JSON files

Enjoy building your construction schedules!
