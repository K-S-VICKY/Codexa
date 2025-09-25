# Task Manager Setup Guide

## Quick Fix for "Project and user information required to load tasks"

The issue you're seeing is because the Task Manager needs both a `projectId` and `userId` to function. Here's how to fix it:

### Step 1: Make sure you're logged in
1. Go to the login page (`/login`)
2. Sign up for a new account or log in with existing credentials
3. This will store your authentication token and user info in localStorage

### Step 2: Start the backend services
Make sure both services are running:

```bash
# Terminal 1 - Backend API
cd Codexa/init-service
npm install
npm run dev

# Terminal 2 - Frontend
cd Codexa/frontend
npm install
npm run dev
```

### Step 3: Access a project
1. After logging in, go to `/projects`
2. Create a new project or select an existing one
3. This will take you to the coding page with a `replId` in the URL

### Step 4: Check the Tasks tab
1. In the coding page, click on the "Tasks" tab in the sidebar
2. You should now see the Task Manager interface

## Debug Information

If you're still seeing the "Project and user information required" message, check the debug info that now appears in the sidebar:

- **Project ID**: Should show your `replId` from the URL
- **User ID**: Should show your user ID from the login
- **Token**: Should show "Present" if you're logged in

## Manual Testing

If you want to test the Task Manager immediately, you can manually set the localStorage values:

1. Open browser DevTools (F12)
2. Go to Console tab
3. Run these commands:

```javascript
// Set a mock user ID
localStorage.setItem('codexa_user', JSON.stringify({ id: 'test-user-123', username: 'testuser' }));

// Set a mock token
localStorage.setItem('codexa_jwt', 'mock-token-for-testing');

// Refresh the page
window.location.reload();
```

## Creating Your First Task

Once the Task Manager is loaded:

1. Click the "New Task" button (or use `Ctrl+Shift+T`)
2. Fill in the task details:
   - **Title**: "Test Task"
   - **Description**: "This is my first task"
   - **Priority**: Select Medium
   - **Deadline**: Optional - set a date/time
3. Click "Create Task"
4. The task should appear in the "To Do" column
5. You can drag it to "In Progress" or "Completed" columns

## Features to Try

- **Drag & Drop**: Move tasks between columns
- **Edit Tasks**: Click on any task to edit it
- **Filters**: Use the filter options to sort by priority or status
- **Keyboard Shortcuts**: 
  - `Ctrl+Shift+T` to create new task
  - `Ctrl+R` to refresh
- **Notifications**: Set a deadline and wait for browser notifications

## Troubleshooting

### If tasks aren't loading:
1. Check browser console for errors
2. Verify backend is running on `http://localhost:3001`
3. Check network tab for failed API requests

### If drag & drop isn't working:
1. Make sure @dnd-kit packages are installed: `npm install @dnd-kit/core @dnd-kit/sortable @dnd-kit/utilities`
2. Check for JavaScript errors in console

### If you can't create tasks:
1. Verify you're logged in (check localStorage for `codexa_jwt`)
2. Check that the backend API is responding
3. Look for authentication errors in the network tab

## API Endpoints

The Task Manager uses these endpoints:
- `GET /projects/:projectId/tasks` - Get tasks
- `POST /projects/:projectId/tasks` - Create task
- `PUT /tasks/:taskId` - Update task
- `DELETE /tasks/:taskId` - Delete task
- `GET /projects/:projectId/tasks/stats` - Get statistics

All requests require authentication via Bearer token.

## Next Steps

Once the basic functionality is working:
1. Try creating multiple tasks with different priorities
2. Set deadlines and test notifications
3. Use the filtering and sorting features
4. Test drag & drop between columns
5. Try the keyboard shortcuts

The Task Manager is now fully integrated into your Codexa IDE! 🎉
