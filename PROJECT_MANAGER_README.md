# Codexa Project Manager Feature

## Overview

The Project Manager feature provides an integrated task management system within the Codexa IDE, allowing developers to plan and track their work without leaving the coding environment. This feature was implemented as described in Week 9 of the development log.

## Features Implemented

### ✅ Core Task Management
- **Create and Edit Tasks**: Full CRUD operations for tasks
- **Priority Levels**: Low, Medium, High priority with color-coded indicators
- **Status Management**: To-do, In Progress, Completed status tracking
- **Deadline Management**: Set and track task deadlines with visual cues

### ✅ Kanban-Style Interface
- **Drag-and-Drop**: Move tasks between status columns seamlessly
- **Visual Columns**: Three-column layout (To Do, In Progress, Completed)
- **Task Cards**: Rich task cards with priority badges and deadline indicators

### ✅ Real-Time Collaboration
- **Socket.io Integration**: Real-time task updates across sessions
- **Live Synchronization**: Task changes are immediately reflected for all users

### ✅ Advanced Filtering & Sorting
- **Status Filtering**: Filter tasks by completion status
- **Priority Filtering**: Filter tasks by priority level
- **Smart Sorting**: Sort by deadline, priority, or creation date
- **Clear Filters**: Easy filter reset functionality

### ✅ Keyboard Shortcuts
- **Ctrl/Cmd + Shift + T**: Create new task quickly
- **Ctrl/Cmd + R**: Refresh task list
- **Escape**: Close modal dialogs

### ✅ Notifications & Visual Cues
- **Deadline Alerts**: Browser notifications for approaching deadlines
- **Overdue Indicators**: Visual indicators for overdue tasks
- **Completion Celebrations**: Notifications when tasks are completed
- **Progress Tracking**: Visual progress bar and statistics

### ✅ IDE Integration
- **Sidebar Integration**: Task manager accessible via sidebar tabs
- **Seamless Workflow**: Switch between file explorer and task manager
- **Context Preservation**: Maintains coding context while managing tasks

## Technical Implementation

### Backend Architecture

#### Database Schema (MongoDB)
```typescript
interface ITask {
  projectId: ObjectId;      // Links to project
  userId: ObjectId;         // Task owner
  title: string;           // Task title
  description?: string;    // Optional description
  priority: 'low' | 'medium' | 'high';
  status: 'todo' | 'in-progress' | 'completed';
  deadline?: Date;         // Optional deadline
  createdAt: Date;
  updatedAt: Date;
}
```

#### API Endpoints
- `GET /projects/:projectId/tasks` - Get all tasks for a project
- `POST /projects/:projectId/tasks` - Create new task
- `PUT /tasks/:taskId` - Update existing task
- `DELETE /tasks/:taskId` - Delete task
- `GET /projects/:projectId/tasks/stats` - Get task statistics

#### Real-Time Updates
- Socket.io events: `taskCreated`, `taskUpdated`, `taskDeleted`
- Project-based room management for collaborative updates

### Frontend Architecture

#### Component Structure
```
TaskManager (Main Container)
├── TaskStats (Progress & Statistics)
├── TaskFilters (Filtering & Sorting)
├── KanbanBoard (Drag & Drop Layout)
│   └── TaskColumn (Status Columns)
│       └── TaskCard (Individual Tasks)
└── TaskForm (Create/Edit Modal)
```

#### Key Technologies
- **React + TypeScript**: Type-safe component development
- **@dnd-kit**: Modern drag-and-drop functionality
- **Emotion**: Styled components for consistent theming
- **Socket.io Client**: Real-time communication
- **Axios**: HTTP client for API communication

#### Custom Hooks
- `useTasks`: Task CRUD operations and state management
- `useKeyboardShortcuts`: Global keyboard shortcut handling
- `useNotifications`: Browser notification management

## File Structure

### Backend Files
```
Codexa/init-service/src/
├── models.ts          # Task schema definition
├── tasks.ts           # Task API routes
└── index.ts           # Main server setup
```

### Frontend Files
```
Codexa/frontend/src/
├── components/
│   ├── TaskManager.tsx           # Main task manager component
│   ├── TaskColumn.tsx            # Kanban column component
│   ├── TaskCard.tsx              # Individual task card
│   ├── TaskForm.tsx              # Create/edit task modal
│   ├── TaskFilters.tsx           # Filtering and sorting
│   ├── TaskStats.tsx             # Progress statistics
│   └── external/editor/components/
│       └── enhanced-sidebar.tsx  # Sidebar with task manager
├── hooks/
│   ├── useTasks.ts               # Task management logic
│   ├── useKeyboardShortcuts.ts   # Keyboard shortcuts
│   └── useNotifications.ts       # Browser notifications
└── types/
    └── task.ts                   # TypeScript interfaces
```

## Usage Instructions

### Accessing Task Manager
1. Open a project in Codexa IDE
2. Look for the "Tasks" tab in the left sidebar
3. Click to switch from File Explorer to Task Manager

### Creating Tasks
1. Click the "New Task" button or use `Ctrl+Shift+T`
2. Fill in task details:
   - **Title** (required)
   - **Description** (optional)
   - **Priority** (Low/Medium/High)
   - **Deadline** (optional)
3. Click "Create Task"

### Managing Tasks
- **Drag & Drop**: Move tasks between columns to change status
- **Edit**: Click on any task to edit details
- **Quick Actions**: Hover over tasks for quick complete/delete options
- **Filter**: Use filters to focus on specific tasks

### Keyboard Shortcuts
- `Ctrl+Shift+T`: Create new task
- `Ctrl+R`: Refresh task list
- `Escape`: Close modal dialogs

## Configuration

### Environment Variables
Set the following environment variable for API connection:
```
REACT_APP_API_URL=http://localhost:3001
```

### Dependencies Added
```json
{
  "@dnd-kit/core": "^6.0.8",
  "@dnd-kit/sortable": "^7.0.2",
  "@dnd-kit/utilities": "^3.2.1"
}
```

## Future Enhancements

### Planned Features
- **Team Collaboration**: Shared task boards for team projects
- **Time Tracking**: Built-in time tracking for tasks
- **Task Templates**: Pre-defined task templates for common workflows
- **Advanced Reporting**: Detailed project progress reports
- **Integration**: Connect with external project management tools

### Scalability Considerations
- **Database Indexing**: Optimized queries for large task lists
- **Pagination**: Handle projects with hundreds of tasks
- **Caching**: Redis integration for improved performance
- **Offline Support**: Local storage for offline task management

## Troubleshooting

### Common Issues

1. **Tasks not loading**
   - Check API connection (default: http://localhost:3001)
   - Verify user authentication token
   - Check browser console for errors

2. **Drag and drop not working**
   - Ensure @dnd-kit packages are installed
   - Check for JavaScript errors in console
   - Verify browser supports modern drag-and-drop

3. **Notifications not appearing**
   - Grant browser notification permissions
   - Check if notifications are blocked by browser
   - Verify notification API is supported

### Development Setup

1. **Backend Setup**
   ```bash
   cd Codexa/init-service
   npm install
   npm run dev
   ```

2. **Frontend Setup**
   ```bash
   cd Codexa/frontend
   npm install
   npm run dev
   ```

3. **Database Setup**
   - Ensure MongoDB is running
   - Set MONGO_URI environment variable
   - Database will auto-create task collections

## Contributing

When extending the Project Manager feature:

1. **Follow TypeScript**: Maintain type safety throughout
2. **Test Components**: Add tests for new components
3. **Update Documentation**: Keep this README current
4. **Consider Performance**: Optimize for large task lists
5. **Maintain UX**: Keep the interface lightweight and intuitive

## Conclusion

The Project Manager feature successfully integrates task management into the Codexa IDE, providing developers with a seamless workflow for planning and tracking their work. The implementation follows modern React patterns, provides real-time collaboration, and maintains the lightweight, developer-focused experience that Codexa is known for.

This feature lays the groundwork for future collaborative features and demonstrates how external tools can be seamlessly integrated into the IDE experience without disrupting the coding workflow.
