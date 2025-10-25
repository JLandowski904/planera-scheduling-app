# Testing Guide - Schedule Planner

Follow these tests to verify that all features are working correctly.

## Prerequisites

- Backend running on `http://localhost:5000`
- Frontend running on `http://localhost:3000`
- Both servers are healthy with no errors

## Test 1: User Registration & Login

### Test 1.1: Sign Up
1. Go to `http://localhost:3000`
2. Click "Don't have an account? Sign Up"
3. Enter:
   - Username: `testuser1`
   - Email: `testuser1@example.com`
   - Password: `password123`
   - Display Name: `Test User`
4. Click "Create Account"

**Expected Result:** You're logged in and see the Projects page

### Test 1.2: Login
1. Click the "Logout" button in the top right
2. You're redirected to the Login page
3. Enter:
   - Email: `testuser1@example.com`
   - Password: `password123`
4. Click "Sign In"

**Expected Result:** You're logged in and see your projects

## Test 2: Project Management

### Test 2.1: Create a Project
1. On the Projects page, click "New Project"
2. Enter:
   - Project Name: `Test Schedule`
   - Description: `This is a test project`
3. Click "Create Project"
4. Click "Open"

**Expected Result:** 
- Project appears in the list
- Opens the Whiteboard view

### Test 2.2: Switch Views
1. In the Whiteboard view, click the navigation buttons to switch between views
2. Try:
   - Timeline (Gantt chart)
   - Table (Spreadsheet)
   - Back to Whiteboard

**Expected Result:** 
- All views load without errors
- Navigation bar shows current view highlighted

### Test 2.3: Create Nodes
1. In the Whiteboard view
2. Right-click on empty space
3. Create:
   - New Task
   - New Milestone
   - New Deliverable
   - New Person

**Expected Result:** 
- Nodes appear on the canvas
- Each node has the correct color and icon

### Test 2.4: Switch Projects
1. Click the back arrow (top left)
2. You return to the Projects page
3. Create another project: `Project 2`
4. Open it

**Expected Result:** 
- You can navigate between projects
- Each project maintains its own data

## Test 3: Project Sharing & Collaboration

### Test 3.1: Share a Project
1. On the Projects page
2. Find "Test Schedule" project
3. Click the "Users" icon button
4. Enter another email: `colleague@example.com`
5. Click "Share"

**Expected Result:** 
- No error message
- Project is marked as shared

### Test 3.2: Create Another User
1. Logout (click Logout button)
2. Click "Don't have an account? Sign Up"
3. Create a new account:
   - Username: `colleague`
   - Email: `colleague@example.com`
   - Password: `password123`
4. You're logged in

**Expected Result:** 
- New user sees "Your Projects" page
- Initially empty

### Test 3.3: See Shared Project
1. Logged in as `colleague`
2. Wait a moment or refresh
3. Check if "Test Schedule" appears

**Expected Result:** 
- Shared project appears in the projects list
- Shows owner name
- Can be opened and edited

## Test 4: Data Persistence

### Test 4.1: Save and Reload
1. Open a project
2. Add several nodes (tasks, milestones, etc.)
3. Switch to Timeline view (saves data)
4. Close the browser tab
5. Reopen `http://localhost:3000`
6. Login again
7. Open the same project

**Expected Result:** 
- All nodes are still there
- Data is persisted to the server

### Test 4.2: Edit Node and Save
1. In the Whiteboard view
2. Right-click a node → Edit
3. Change the title and click Save
4. Refresh the page

**Expected Result:** 
- Node changes are saved
- Changes persist after refresh

## Test 5: Multiple Projects

### Test 5.1: Switching Between Projects
1. Create 3 different projects:
   - `Project A`
   - `Project B`
   - `Project C`
2. Add different nodes to each
3. Switch between them using the back button

**Expected Result:** 
- Each project keeps its own separate data
- No data mixing between projects

### Test 5.2: Delete a Project
1. On the Projects page
2. Find a project you own
3. Click the trash icon
4. Confirm deletion

**Expected Result:** 
- Project is removed from the list
- Deleted project no longer appears

## Test 6: Error Handling

### Test 6.1: Invalid Login
1. Go to login page
2. Enter:
   - Email: `wrongemail@example.com`
   - Password: `wrongpassword`
3. Click "Sign In"

**Expected Result:** 
- Error message appears
- Not logged in

### Test 6.2: Duplicate Email
1. Try to sign up with an email that already exists
2. Enter the email from Test 1

**Expected Result:** 
- Error message: "Email or username already exists"

### Test 6.3: Invalid Token
1. Logout
2. Open browser DevTools (F12)
3. Go to Console
4. Type: `localStorage.setItem('authToken', 'invalid-token')`
5. Refresh the page

**Expected Result:** 
- You're redirected to login
- Invalid token is handled gracefully

## Test 7: Browser Navigation

### Test 7.1: Back Button
1. From Projects page → Open a project
2. Click the back arrow
3. You return to Projects page

**Expected Result:** 
- Navigation works smoothly
- Project data is preserved

### Test 7.2: Browser Back Button
1. With a project open
2. Click browser back button
3. You go back to Projects page

**Expected Result:** 
- Browser navigation works
- Data is maintained

## Test 8: Responsive Design (Optional)

### Test 8.1: Resize Window
1. Open the app
2. Resize your browser window (make it smaller)
3. Resize it again (make it larger)

**Expected Result:** 
- UI adapts to different sizes
- No broken layouts

### Test 8.2: Mobile View
1. Open DevTools (F12)
2. Click device toggle (mobile icon)
3. Select iPhone or similar
4. Navigate through the app

**Expected Result:** 
- App is usable on mobile
- No horizontal scrolling needed

## Troubleshooting

### App Won't Load
- Check both servers are running
- Check browser console for errors (F12)
- Clear browser cache

### Can't Login
- Verify backend is running
- Check the `.env` file settings
- Check console for error messages

### Data Not Saving
- Verify backend is running
- Check network tab (F12) for failed requests
- Check backend console for errors

### Shared Projects Don't Show
- User must be logged out and back in
- Check the email address was entered correctly
- Both users must have accounts

## Success Checklist

- [x] User can sign up and login
- [x] User can create projects
- [x] User can switch between views (Whiteboard, Timeline, Table)
- [x] User can add nodes and edit them
- [x] User can share projects with other users
- [x] Data persists across sessions
- [x] Multiple users can access shared projects
- [x] Project data is isolated between projects
- [x] Error handling works
- [x] Navigation works smoothly

If all tests pass, your Schedule Planner is working correctly! 🎉

---

**Report Issues**

If you encounter any issues, note:
1. What you were doing
2. What happened
3. Error message (if any)
4. Browser and OS











