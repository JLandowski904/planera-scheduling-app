# Gantt Timeline Quick Start Guide

## 🎯 What's New

Your Timeline view is now a **professional Gantt-style construction schedule** with:

- ✅ **Phase headers** grouping related tasks
- ✅ **Discipline filtering** to focus on specific trades
- ✅ **Multi-level zoom** (month/week/day views)
- ✅ **Dependency arrows** showing task relationships
- ✅ **Complete metadata** (discipline, start/end dates)
- ✅ **Sorted by start date** within each phase

---

## 🚀 Quick Start

### Viewing Your Schedule

1. **Navigate to Timeline** from the top navigation bar
2. Your project will display organized by phases
3. Each phase shows:
   - Phase name and date range (colored header)
   - All tasks, deliverables, and milestones underneath
   - Items sorted by start date

### Using Zoom Controls

Located in the top-left toolbar:

| Button | Icon | View | Best For |
|--------|------|------|----------|
| Left | 🔍- | **Month** | Long-term planning (6+ months) |
| Middle | ⊡ | **Week** | Standard view (default) |
| Right | 🔍+ | **Day** | Detailed scheduling (1-2 months) |

**Tip:** The active zoom level is highlighted in blue.

### Filtering by Discipline

1. Click **"Disciplines"** button (top-right toolbar)
2. **Check** disciplines you want to see
3. **Uncheck** disciplines to hide
4. Click **"Clear All"** to reset

**Features:**
- Filter badge shows count of active filters
- Phases with no visible items are hidden
- Filter is per-view (doesn't affect Whiteboard or Table)

### Understanding the Layout

```
┌─────────────────────────────────────────────────────┐
│ [Name Column] [Discipline] [Start] [End] | Timeline │
├─────────────────────────────────────────────────────┤
│ Phase 1 (Blue Header)                    | [====]   │
│   Task A    | Arch    | Jan 1  | Jan 5  | [██]     │
│   Task B    | Struct  | Jan 6  | Jan 10 |    [██]  │
├─────────────────────────────────────────────────────┤
│ Phase 2 (Green Header)                   |   [====] │
│   Task C    | MEP     | Jan 11 | Jan 15 |     [██] │
└─────────────────────────────────────────────────────┘
```

### Reading Dependency Arrows

- **Gray arrows** = Normal dependencies
- **Red arrows** = Blocked dependencies
- Arrows connect from end of predecessor to start of successor
- **Click** an arrow to select it
- **Right-click** for context menu

### Visual Legend

**Node Types:**
- 📅 **Calendar icon** = Milestone
- ✓ **CheckCircle icon** = Deliverable
- 🕐 **Clock icon** = Task

**Bar Colors:**
- **Blue** = Task
- **Green** = Deliverable
- **Purple** = Milestone

**Discipline Colors:**
- Each discipline gets a consistent color from a 16-color palette
- Shown as colored badges in the Discipline column

---

## 💡 Tips & Tricks

### Scrolling
- **Vertical scroll** - Navigate through phases and tasks
- **Horizontal scroll** - See different time periods
- **Header stays fixed** while scrolling for easy reference

### Selection
- **Click a bar** to select that task
- **Selected items** show a blue ring
- **Click background** to deselect all

### Context Menus
- **Right-click a bar** for task options
- **Right-click an arrow** for dependency options
- **Right-click background** for canvas options

### Date Columns
- **Start Date** and **End Date** columns show formatted dates
- Hover over bars to see full details
- Dates update automatically when you change them in other views

---

## 🔍 Common Scenarios

### "I want to see only structural tasks"
1. Click **Disciplines** button
2. Check only **"Structural"**
3. All other disciplines are hidden

### "I want a high-level overview"
1. Click the **Month** zoom button (left)
2. See your entire project at a glance
3. Each column represents one month

### "I need to see day-by-day details"
1. Click the **Day** zoom button (right)
2. Each column is one day
3. Month grouping headers show at the top

### "I want to see all disciplines again"
1. Click **Disciplines** button
2. Click **"Clear All"**
3. All items are now visible

### "I want to see task dependencies"
- Dependency arrows are always visible
- They connect related tasks automatically
- Based on dependencies created in Whiteboard view

---

## 📋 Data Requirements

For the Timeline to work best, ensure your tasks have:

- ✅ **Start Date** - When the task begins
- ✅ **End Date** (Due Date) - When the task completes
- ✅ **Phase Assignment** - Which phase the task belongs to
- ✅ **Discipline** (optional) - For filtering and color coding
- ✅ **Dependencies** (optional) - For arrow visualization

**Note:** Tasks without dates won't appear in the Timeline view.

---

## 🎨 Customization

### Phase Colors
- Phase header colors come from the Whiteboard view
- To change a phase color:
  1. Go to Whiteboard view
  2. Select the phase
  3. Change its color
  4. Return to Timeline - color updates automatically

### Discipline Colors
- Automatically assigned based on discipline name
- Consistent across all views
- 16-color palette ensures good contrast

---

## ⚡ Keyboard Shortcuts

(If implemented in your app)

- **Esc** - Deselect all
- **Delete** - Delete selected item
- **Ctrl+Z** - Undo
- **Ctrl+Y** - Redo

---

## 🐛 Troubleshooting

### "I don't see any tasks"
- Check that tasks have start and end dates
- Check if discipline filter is active (clear it)
- Verify tasks are assigned to phases

### "Dependency arrows are missing"
- Dependencies must be created in Whiteboard view first
- Both source and target tasks must have dates
- Both tasks must be visible (not filtered out)

### "Phase is empty"
- Assign tasks to the phase in Whiteboard view
- Tasks need to be inside the phase boundary
- Or manually add to `phase.nodeIds`

### "Dates look wrong"
- Verify date format in your data
- Check browser timezone settings
- Dates should be JavaScript Date objects

---

## 📚 Related Documentation

- **Full Implementation Details:** See `GANTT_TIMELINE_IMPLEMENTATION_SUMMARY.md`
- **Original Plan:** See `gantt_timeline_enhancement_27d2f0c9.plan.md`
- **General Setup:** See `SETUP.md`

---

## ✨ What's Next?

Now that you have a professional Gantt timeline:

1. **Create phases** for your project stages
2. **Add tasks** with start and end dates
3. **Assign disciplines** to tasks
4. **Create dependencies** between tasks
5. **Use zoom** to see different time scales
6. **Filter by discipline** to focus on specific trades

**Enjoy your new construction scheduling tool!** 🎉

---

**Last Updated:** December 23, 2025

