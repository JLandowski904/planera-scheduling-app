# plandango - Construction Scheduling App

A whiteboard-style scheduling application for design and construction projects, built with React and TypeScript.

## Features

### Core Functionality
- **Infinite Canvas**: Pan, zoom, and snap-to-grid functionality
- **Node Types**: Milestones, Deliverables, Tasks, and People
- **Dependencies**: Visual connectors with different relationship types
- **Multiple Views**: Whiteboard, Timeline/Gantt, and Table views
- **Real-time Updates**: Automatic date propagation and conflict detection

### Node Management
- **Drag & Drop**: Move nodes freely on the canvas
- **Resize**: Adjust node dimensions
- **Context Menus**: Edit, duplicate, convert, and delete operations
- **Multi-select**: Select and manipulate multiple nodes
- **Marquee Selection**: Click and drag to select multiple items

### Scheduling Features
- **Date Management**: Start dates, due dates, and duration tracking
- **Progress Tracking**: Visual progress bars for tasks
- **Dependency Types**: Finish-to-Start, Start-to-Start, Finish-to-Finish
- **Conflict Detection**: Circular dependencies, over-allocation, date conflicts
- **Auto-propagation**: Changes to predecessors automatically update successors

### Construction-Specific Features
- **Disciplines**: Civil, Architecture, MEP, Structural, Landscape
- **Templates**: Pre-built project phases and workflows
- **Tags**: RFI, Submittal, Permit, Review, Survey, Utility, Stormwater
- **Workload Management**: Track person assignments and capacity

### Data Management
- **Local Storage**: Automatic project persistence
- **Import/Export**: JSON and CSV export capabilities
- **Undo/Redo**: Full history tracking
- **Project Management**: Multiple project support

## Keyboard Shortcuts

| Shortcut | Action |
|----------|--------|
| `N` | New Task |
| `M` | New Milestone |
| `D` | New Deliverable |
| `P` | New Person |
| `L` | Link Mode |
| `Delete` | Delete Selected |
| `Ctrl+Z` | Undo |
| `Ctrl+Shift+Z` | Redo |
| `1` | Whiteboard View |
| `2` | Timeline View |
| `3` | Table View |
| `Ctrl+F` | Focus Search |
| `Escape` | Close Modals |

## Getting Started

### Prerequisites
- Node.js 16+
- npm or yarn
- Supabase account (free)

### Quick Setup

1. Clone the repository:
```bash
git clone <repository-url>
cd plandango-scheduling-app
```

2. Install dependencies:
```bash
npm install
```

3. Set up Supabase (see [SUPABASE_SETUP.md](./SUPABASE_SETUP.md) for detailed instructions):
   - Create a Supabase project
   - Run the database schema from `supabase-schema.sql`
   - Get your API keys

4. Create environment file:
```bash
cp env.example .env
```

5. Add your Supabase credentials to `.env`:
```env
REACT_APP_SUPABASE_URL=your_supabase_project_url
REACT_APP_SUPABASE_ANON_KEY=your_supabase_anon_key
```

6. Start the development server:
```bash
npm start
```

7. Open [http://localhost:3000](http://localhost:3000) in your browser.

### Production Deployment

For production deployment with custom domain, see the [SUPABASE_SETUP.md](./SUPABASE_SETUP.md) guide which covers:
- Deploying to Vercel
- Setting up custom domains
- Configuring Supabase for production

### Building for Production

```bash
npm run build
```

This creates a `build` folder with optimized production files.

## Project Structure

```
src/
├── components/          # React components
│   ├── Canvas.tsx      # Main canvas component
│   ├── NodeComponent.tsx # Individual node rendering
│   ├── EdgeComponent.tsx # Dependency connectors
│   ├── Toolbar.tsx     # Top toolbar
│   ├── Sidebar.tsx     # Left sidebar with filters
│   ├── TimelineView.tsx # Gantt chart view
│   ├── TableView.tsx   # Spreadsheet view
│   ├── ContextMenu.tsx # Right-click menus
│   ├── PropertiesPanel.tsx # Node/edge properties
│   └── ConflictPanel.tsx # Conflict detection
├── hooks/              # Custom React hooks
│   ├── useKeyboardShortcuts.ts
│   ├── useUndoRedo.ts
│   └── useDataPersistence.ts
├── types/              # TypeScript type definitions
│   └── index.ts
├── utils/              # Utility functions
│   └── projectUtils.ts
├── App.tsx             # Main application component
├── App.css             # Application styles
├── index.tsx           # Application entry point
└── index.css           # Global styles
```

## Usage

### Creating a New Project
1. The app starts with a sample "Subdivision – Oak Ridge" project
2. Use the toolbar to add new nodes (Task, Milestone, Deliverable, Person)
3. Drag nodes to position them on the canvas
4. Use Link Mode (L key) to create dependencies between nodes

### Managing Tasks
1. **Create Tasks**: Click "Task" in toolbar or press `N`
2. **Set Dates**: Use the Properties Panel to set start/due dates
3. **Assign People**: Drag Person nodes onto Task nodes
4. **Track Progress**: Use the progress slider in Properties Panel
5. **Add Tags**: Use the Tags field for categorization

### Working with Dependencies
1. **Create Links**: Press `L` to enter Link Mode, then click source and target nodes
2. **Change Types**: Right-click edges to change dependency types
3. **Break Links**: Right-click edges and select "Break Dependency"
4. **View Conflicts**: Click the conflicts button in the toolbar

### Switching Views
- **Whiteboard** (1): Free-form canvas layout
- **Timeline** (2): Gantt chart with time-based layout
- **Table** (3): Spreadsheet view with sorting and filtering

### Filtering and Search
- Use the sidebar to filter by type, status, discipline, or tags
- Search across node titles and tags
- Save filter presets for common views

## Data Model

### Node Types
- **Milestone**: Key project dates (diamond shape)
- **Deliverable**: Major outputs (rounded rectangle)
- **Task**: Work items with progress tracking (rectangle with progress bar)
- **Person**: Team members (circular avatar)

### Edge Types
- **Finish-to-Start**: Task B starts when Task A finishes
- **Start-to-Start**: Task B starts when Task A starts
- **Finish-to-Finish**: Task B finishes when Task A finishes

### Data Persistence
- Projects are automatically saved to Supabase PostgreSQL database
- Real-time synchronization across devices
- User authentication and project sharing
- Export projects as JSON for backup
- CSV export available for task data

## Customization

### Adding New Node Types
1. Update the `NodeType` enum in `src/types/index.ts`
2. Add rendering logic in `NodeComponent.tsx`
3. Update the toolbar and context menus
4. Add appropriate icons and styling

### Custom Fields
1. Extend the `NodeData` interface in `src/types/index.ts`
2. Update the Properties Panel to include new fields
3. Add validation and default values in `projectUtils.ts`

### Styling
- Uses Tailwind CSS for styling
- Custom CSS classes in `src/App.css`
- Color scheme defined in `tailwind.config.js`

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## License

This project is licensed under the MIT License.

## Support

For issues and questions:
1. Check the existing issues on GitHub
2. Create a new issue with detailed description
3. Include steps to reproduce any bugs

## Roadmap

### Planned Features
- [ ] Critical path highlighting
- [ ] What-if scenario planning
- [ ] Resource capacity planning
- [ ] File attachments on nodes
- [ ] Comment threads
- [ ] Real-time collaboration
- [ ] Mobile responsive design
- [ ] Advanced reporting and analytics
