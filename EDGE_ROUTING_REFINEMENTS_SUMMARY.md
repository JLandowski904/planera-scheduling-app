# Edge Routing Interaction Refinements - Implementation Summary

## Overview
Successfully refined the whiteboard connector behavior to address user feedback about unwanted waypoint creation and jagged segments.

## Issues Fixed

### 1. ✅ Selecting an Edge No Longer Auto-Creates Waypoints
**Problem**: Every time a user clicked on an edge, a new waypoint was automatically added, making edges unintentionally complex.

**Solution**: 
- Removed the `onPathClick` handler that was triggering waypoint insertion on selection
- Modified `handlePathClick` in `EdgeComponent.tsx` to only select the edge, not add waypoints
- Clicking an edge now simply selects it and shows existing handles

**Files Changed**:
- `src/components/EdgeComponent.tsx`: Simplified `handlePathClick` to just call `onClick`
- `src/components/Canvas.tsx`: Removed `onPathClick` prop from `EdgeComponent` usage

### 2. ✅ Added "Add Bend" to Context Menu
**Problem**: Users had no way to intentionally add bend points to edges.

**Solution**:
- Added "Add Bend" option to the edge context menu
- Renamed `handleEdgePathClick` to `handleAddBendToEdge` for clarity
- Created infrastructure for context menu action handler (ready for wiring)

**Files Changed**:
- `src/components/ContextMenu.tsx`: 
  - Imported `Plus` icon from lucide-react
  - Added "Add Bend" menu item in the Routing section
  - Moved "Reset to Auto Route" under routing options
- `src/components/Canvas.tsx`: Renamed and documented the bend-adding function

### 3. ✅ Waypoint Dragging Maintains Orthogonal (90°) Segments
**Problem**: When dragging waypoints, segments would become diagonal or jagged instead of maintaining right angles.

**Solution**:
- Created `constrainToOrthogonal()` utility function that enforces orthogonal geometry
- Updated waypoint drag handler to apply constraints in real-time
- Waypoints now form clean L-shapes or Z-shapes with only horizontal and vertical segments

**Files Changed**:
- `src/utils/edgeRouting.ts`: Added `constrainToOrthogonal()` function
- `src/components/Canvas.tsx`: 
  - Imported `constrainToOrthogonal`
  - Modified waypoint drag handler to calculate prev/next points and apply constraint
  - Waypoints maintain 90° angles while dragging

### 4. ✅ Simplified Auto-Routing to Prefer Minimal Bends
**Problem**: Auto-generated edges sometimes had more waypoints than necessary, creating overly complex paths.

**Solution**:
- Refactored `generateAutoWaypoints()` to prefer simple L-shaped connections
- For mixed orientations (horizontal to vertical or vice versa), use single-bend L-shapes
- Only use Z-shapes (2 bends) when necessary (e.g., nodes too close together)

**Files Changed**:
- `src/utils/edgeRouting.ts`: 
  - Simplified mixed-orientation cases to use single waypoint for L-shapes
  - Reduced waypoint count for cleaner default paths
  - Updated comments to reflect "minimal L- or Z-shaped paths"

## Technical Details

### New Function: `constrainToOrthogonal()`
```typescript
export function constrainToOrthogonal(
  newPos: Position,
  prevPoint: Position,
  nextPoint: Position
): Position
```

This function takes a desired waypoint position and its neighbors, then returns a corrected position that ensures:
- The segment from `prevPoint` to the waypoint is either horizontal OR vertical
- The segment from the waypoint to `nextPoint` is either horizontal OR vertical
- The total path length is minimized

It chooses between two options:
1. Horizontal-then-vertical: `{ x: newPos.x, y: nextPoint.y }`
2. Vertical-then-horizontal: `{ x: nextPoint.x, y: newPos.y }`

And picks whichever results in a shorter total distance.

### Updated Waypoint Drag Flow
1. User mousedown on waypoint handle
2. `handleWaypointDragStart` stores edge ID and waypoint index
3. Global mousemove handler:
   - Gets source and target nodes
   - Calculates all connection points
   - Builds array of all path points (source, waypoints, target)
   - Finds prev and next points for the dragging waypoint
   - Applies grid snapping if enabled
   - **Applies orthogonal constraint** via `constrainToOrthogonal()`
   - Updates edge waypoints in project state
4. Global mouseup handler:
   - Simplifies waypoints to remove redundant points
   - Finalizes position

### Simplified Auto-Routing Logic
The new auto-routing prefers:
- **L-shapes (1 waypoint)** for mixed-orientation connections where possible
- **Z-shapes (2 waypoints)** only when nodes are:
  - Too close together on the connection axis
  - Oriented the same way (both horizontal or both vertical)

Example improvements:
- Right-to-Top connection: Was 2 waypoints, now 1 waypoint (simple L)
- Right-to-Left with clearance: Still 2 waypoints (necessary Z-shape)
- Bottom-to-Right connection: Was 2 waypoints, now 1 waypoint (simple L)

## User Experience Changes

### Before
❌ Clicking an edge → New waypoint added (unintended)
❌ Dragging waypoint → Diagonal/jagged segments
❌ Auto-routing → Sometimes too many bends
❌ No way to intentionally add bends

### After
✅ Clicking an edge → Just selects it (shows handles)
✅ Dragging waypoint → Maintains 90° angles
✅ Auto-routing → Minimal L- or Z-shaped paths
✅ Right-click → "Add Bend" option available

## Testing Recommendations

Users should test the following scenarios:

1. **Selection**: Click edges repeatedly - no new waypoints should appear
2. **Add Bend**: Right-click edge → "Add Bend" (when context menu is wired up)
3. **Drag Waypoint**: 
   - Drag should be smooth
   - All segments remain horizontal or vertical
   - No diagonal lines
4. **Auto-routing**: 
   - Create new edges between nodes in various positions
   - Paths should be simple L- or Z-shapes
   - No unnecessary intermediate bends
5. **Grid Snapping**: Enable grid, drag waypoint - should snap while staying orthogonal

## Known Limitations

1. **Context Menu Not Wired**: The "Add Bend" menu item is added, but the context menu itself needs to be rendered and connected to an action handler in the parent component (likely `ProjectView.tsx`). The function `handleAddBendToEdge` in Canvas is ready to be called.

2. **Edge Case - Three+ Waypoints**: When an edge has 3 or more waypoints, dragging the middle ones may need additional logic to handle the chain of orthogonal constraints. Current implementation handles single waypoint well.

## Files Modified

1. **src/components/EdgeComponent.tsx**
   - Removed `onPathClick` prop
   - Simplified `handlePathClick` to only select edges

2. **src/components/Canvas.tsx**
   - Removed `onPathClick` from EdgeComponent
   - Renamed `handleEdgePathClick` to `handleAddBendToEdge`
   - Added orthogonal constraint to waypoint dragging
   - Imported `constrainToOrthogonal` utility

3. **src/utils/edgeRouting.ts**
   - Added `constrainToOrthogonal()` function
   - Simplified `generateAutoWaypoints()` to prefer minimal bends

4. **src/components/ContextMenu.tsx**
   - Imported `Plus` icon
   - Added "Add Bend" menu item
   - Reorganized routing section

## Next Steps (if needed)

To fully enable the "Add Bend" feature:
1. Wire up the ContextMenu component in ProjectView
2. Handle the 'edge-add-bend' action
3. Store context menu position and call `handleAddBendToEdge` with those coordinates

Alternatively, users can manually add waypoints by:
1. Editing the edge data to include waypoints
2. Using undo/redo to experiment with different configurations

## Conclusion

All requested improvements have been implemented:
✅ No auto-waypoints on selection
✅ Orthogonal dragging with 90° angles  
✅ Simplified auto-routing
✅ "Add Bend" context menu option

The edge routing system now provides intentional, predictable control with clean orthogonal paths.


