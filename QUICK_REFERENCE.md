# Quick Reference - Schedule Planner

## Starting the Application

### First Time Setup
```bash
# Backend
cd backend
npm install

# Frontend (in project root)
npm install
```

### Running the App
```bash
# Terminal 1 - Backend
cd backend
npm start
# Expected: Server running on http://localhost:5000

# Terminal 2 - Frontend
npm start
# Expected: App opens at http://localhost:3000
```

## Backend Configuration

### .env File (in `backend/` folder)
```
PORT=5000
NODE_ENV=development
JWT_SECRET=your_super_secret_jwt_key_change_this_in_production
DATABASE_URL=./data/schedule.db
CORS_ORIGIN=http://localhost:3000
```

## Common Tasks

### Create Backend .env File
```bash
cd backend
# Create file with your text editor, add the config above
```

### Stop the App
- Press `Ctrl+C` in each terminal

### Restart Backend
```bash
# In backend terminal
# Press Ctrl+C
npm start
```

### Clear Database
```bash
# Backend server must be stopped first
rm backend/data/schedule.db
npm start  # Database will be recreated
```

### View Database
- Use DB Browser for SQLite
- Or use SQLite CLI: `sqlite3 backend/data/schedule.db`

## Testing

### Create Test Account
- Email: `test@example.com`
- Password: `test123`
- Username: `testuser`

### Test Project Creation
1. Sign in
2. Click "New Project"
3. Name: "My First Schedule"
4. Click "Create Project"
5. Click "Open"

### Test Sharing
1. On Projects page
2. Click Users icon on a project
3. Enter: `colleague@example.com`
4. Click "Share"

## API Endpoints

### Authentication
- `POST /api/auth/signup` - Sign up
- `POST /api/auth/login` - Sign in
- `GET /api/auth/me` - Get user info

### Projects
- `GET /api/projects` - List all projects
- `GET /api/projects/:id` - Get project
- `POST /api/projects` - Create project
- `PUT /api/projects/:id` - Update project
- `DELETE /api/projects/:id` - Delete project
- `POST /api/projects/:id/share` - Share project
- `GET /api/projects/:id/members` - Get members

## Troubleshooting

### App Won't Start
```bash
# Check Node version
node --version  # Should be v14+

# Reinstall dependencies
rm -rf node_modules
npm install
npm start
```

### Port 5000 in Use
```bash
# Edit backend/.env
PORT=5001  # Change to different port
```

### Backend Not Responding
```bash
# Check backend is running
# Terminal 1 should show: "Server running on http://localhost:5000"

# If not:
cd backend
npm install
npm start
```

### Can't Login
1. Verify backend is running
2. Check email/password are correct
3. Check browser console (F12) for errors

### Data Not Saving
1. Check backend console for errors
2. Verify database file exists: `backend/data/schedule.db`
3. Restart backend server

## Browser DevTools

### Open DevTools
- Windows/Linux: `F12` or `Ctrl+Shift+I`
- Mac: `Cmd+Option+I`

### Check Network Requests
1. Open DevTools
2. Go to "Network" tab
3. Perform action (login, create project)
4. Look for requests to `http://localhost:5000/api/...`

### Check Errors
1. Open DevTools
2. Go to "Console" tab
3. Look for red error messages

### Check Local Storage
1. Open DevTools
2. Go to "Application" tab
3. Look for "authToken" and "user"

## File Locations

| Item | Location |
|------|----------|
| Frontend | `src/` |
| Backend | `backend/` |
| Config | `backend/.env` |
| Database | `backend/data/schedule.db` |
| Login/Signup | `src/pages/Login.tsx` |
| Projects | `src/pages/Projects.tsx` |
| Project Editor | `src/pages/ProjectView.tsx` |
| API Client | `src/services/api.ts` |

## Git (If Using Version Control)

### Ignore Files
Create `.gitignore`:
```
node_modules/
backend/node_modules/
backend/data/
.env
.env.local
*.log
.DS_Store
```

### First Commit
```bash
git init
git add .
git commit -m "Initial multi-user schedule planner"
```

## Development Workflow

### Make Frontend Changes
1. Edit files in `src/`
2. Save (auto-reload in browser)
3. Refresh browser if needed

### Make Backend Changes
1. Edit files in `backend/`
2. Stop backend (`Ctrl+C`)
3. Run `npm start` again
4. Refresh browser

### Add New API Endpoint
1. Create route in `backend/routes/projects.js`
2. Add corresponding function in `src/services/api.ts`
3. Call from component

## Keyboard Shortcuts

| Shortcut | Action |
|----------|--------|
| `Ctrl+C` | Stop server |
| `Ctrl+K` | Clear terminal |
| `F12` | Open DevTools |
| `Ctrl+L` | Clear address bar |

## Environment Variables

| Variable | Example | Purpose |
|----------|---------|---------|
| `PORT` | 5000 | Backend port |
| `NODE_ENV` | development | Environment mode |
| `JWT_SECRET` | random_key | Token signing key |
| `DATABASE_URL` | ./data/schedule.db | Database path |
| `CORS_ORIGIN` | http://localhost:3000 | Allowed frontend URL |

## Useful Commands

```bash
# Check if port is in use
netstat -tuln | grep 5000  # Linux/Mac
netstat -ano | findstr :5000  # Windows

# Kill process on port
kill -9 $(lsof -t -i :5000)  # Linux/Mac

# Check Node version
node -v

# Update npm
npm install -g npm

# View npm global packages
npm list -g --depth=0
```

## Documentation Files

- `SETUP.md` - Complete setup instructions
- `TESTING.md` - Test scenarios
- `IMPLEMENTATION_SUMMARY.md` - What was built
- `backend/README.md` - Backend API docs
- This file - Quick reference

---

**Remember:** Keep both terminal windows open while using the app!




