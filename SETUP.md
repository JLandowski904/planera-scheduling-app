# Complete Setup Guide - Multi-User Schedule Planner

This guide will help you set up and run the complete Schedule Planner application with user authentication, project management, and collaboration features.

## System Requirements

- **Node.js** v14 or higher ([Download](https://nodejs.org/))
- **npm** (comes with Node.js)
- Two terminal windows/tabs
- Internet connection for first-time setup

## Quick Start (5 minutes)

### Step 1: Backend Setup

**Terminal 1:**

```bash
cd backend
npm install
```

Then create a `.env` file in the `backend` folder:

```
PORT=5000
NODE_ENV=development
JWT_SECRET=your_super_secret_jwt_key_change_this_in_production
DATABASE_URL=./data/schedule.db
CORS_ORIGIN=http://localhost:3000
```

Start the backend server:

```bash
npm start
```

You should see:
```
Server running on http://localhost:5000
Connected to SQLite database
Database schema initialized
```

**Keep this terminal running!**

### Step 2: Frontend Setup

**Terminal 2:**

```bash
npm install
npm start
```

The app will automatically open in your browser at `http://localhost:3000`.

## You're All Set! 🎉

Your app is now running with:
- ✅ User authentication
- ✅ Multi-user projects
- ✅ Project sharing and collaboration
- ✅ Persistent data storage
- ✅ All three views: Whiteboard, Timeline, Table

## Using the App

### 1. Create Your Account

Go to `http://localhost:3000` and click "Sign Up":
- Enter a username
- Enter your email
- Create a password
- Click "Create Account"

### 2. Create Your First Project

After logging in:
- Click the "New Project" button
- Enter a project name and optional description
- Click "Create Project"
- Click "Open" to start working

### 3. Share with Colleagues

- Click the "Share" button on a project card
- Enter your colleague's email address
- They can now see and edit the project

### 4. Switch Between Views

Use the navigation bar to switch between:
- **Whiteboard** - Visual drag-and-drop editor
- **Timeline** - Gantt chart view
- **Table** - Spreadsheet view

## Project Structure

```
schedule-test/
├── backend/                    # Node.js API server
│   ├── server.js              # Main server file
│   ├── database.js            # SQLite setup
│   ├── middleware/
│   │   └── auth.js            # JWT authentication
│   ├── routes/
│   │   ├── auth.js            # Login/signup routes
│   │   └── projects.js        # Project CRUD routes
│   ├── data/                  # SQLite database (auto-created)
│   ├── package.json
│   └── .env                   # Configuration file
│
├── src/                        # React frontend
│   ├── pages/
│   │   ├── Login.tsx          # Login/signup page
│   │   ├── Projects.tsx       # Projects dashboard
│   │   └── ProjectView.tsx    # Individual project editor
│   ├── services/
│   │   └── api.ts             # API client
│   ├── components/            # React components
│   ├── utils/                 # Utility functions
│   ├── App.tsx                # Main routing
│   └── index.tsx
│
└── package.json               # Frontend dependencies
```

## Features

### User Management
- ✅ Secure signup/login with password hashing
- ✅ JWT token-based authentication
- ✅ Auto-login if session is active

### Project Management
- ✅ Create, read, update, delete projects
- ✅ Each project stores complete schedule data
- ✅ Automatic data persistence to server

### Collaboration
- ✅ Share projects with other users by email
- ✅ View project members
- ✅ Role-based access (owner/viewer)
- ✅ Real-time project updates

### Views
- ✅ **Whiteboard**: Drag-and-drop visual editor
- ✅ **Timeline**: Gantt chart for scheduling
- ✅ **Table**: Spreadsheet-style data view
- ✅ **Phases**: Group nodes into project phases

## Common Issues & Fixes

### "Port 5000 is already in use"

Edit `backend/.env` and change:
```
PORT=5001
```

### "Cannot find module" errors

Run `npm install` again in the affected directory (backend or root).

### Backend not connecting

Check that:
1. Backend is running (`npm start` in `backend` folder)
2. `.env` file exists in `backend` folder
3. No firewall is blocking port 5000

### Database errors

Delete `backend/data/schedule.db` and restart the backend. A new database will be created automatically.

## Stopping the App

To stop either service:
- Press `Ctrl+C` in the terminal

To stop both services completely, press `Ctrl+C` in both terminal windows.

## Development Tips

### Making Changes

**Frontend changes**: Changes are automatically reloaded
**Backend changes**: Restart the server with `npm start`

### Accessing the Database

The SQLite database is stored at `backend/data/schedule.db`. You can view it with:
- [DB Browser for SQLite](https://sqlitebrowser.org/) (free, GUI)
- SQLite CLI (command line)

### Testing the API

Use a tool like [Postman](https://www.postman.com/) or [Insomnia](https://insomnia.rest/) to test API endpoints.

Example request:
```
POST http://localhost:5000/api/auth/login
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "password"
}
```

## Next Steps

### Production Deployment

To deploy this application:

1. **Frontend**: Build and deploy to Vercel, Netlify, or similar
   ```bash
   npm run build
   ```

2. **Backend**: Deploy to Heroku, AWS, DigitalOcean, or similar
   - Use environment variables for configuration
   - Use a production database (PostgreSQL recommended)

### Customization

You can customize:
- Colors and branding in `src/App.css`
- Backend configuration in `backend/.env`
- Database schema in `backend/database.js`
- API endpoints in `src/services/api.ts`

## Support

For detailed information:
- Backend setup: See `backend/README.md`
- Frontend code: Check individual component files
- API documentation: See `backend/README.md`

## License

This project is available for use and modification.

---

**Happy Planning! 📅**









