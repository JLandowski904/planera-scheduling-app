# Quick Reference: Enhanced Edge Routing

## What's New?

Your whiteboard connections now have:
- **Edge-to-Edge**: Lines connect to the sides of nodes, not centers
- **Straight Lines**: Clean orthogonal (right-angle) paths instead of curves
- **Draggable Waypoints**: Bend paths around obstacles by adding and dragging waypoints
- **Adjustable Anchors**: Choose which side of nodes to connect to

## How to Use

### View Edges
- All edges automatically use the new orthogonal routing
- No action needed - existing connections work seamlessly

### Select an Edge
- Click on any edge line
- Waypoint handles (●) appear as circles
- Anchor handles (■) appear as squares on node edges
- Active connection sides are highlighted in blue

### Add a Waypoint
1. **Select** the edge (click on it)
2. **Click** anywhere on the edge path where you want to add a bend
3. A waypoint appears at that position
4. **Drag** the waypoint to adjust

### Drag a Waypoint
1. **Click and hold** on a waypoint handle (●)
2. **Drag** to new position
3. **Release** to finalize
- Waypoints snap to grid if enabled
- Redundant waypoints are automatically removed

### Change Connection Side
1. **Select** the edge
2. **Drag** an anchor handle (■) on either node
3. The edge re-routes to the closest side
4. **Release** to finalize

### Reset to Auto-Route
1. **Right-click** on an edge
2. Select **"Reset to Auto Route"** from menu
3. All custom waypoints and anchors are cleared
4. Edge returns to automatic optimal path

## Keyboard Shortcuts

- `Ctrl/Cmd + Z` - Undo edge changes
- `Ctrl/Cmd + Y` - Redo edge changes
- `Delete` - Remove selected edge
- `Esc` - Deselect edge

## Tips

✨ **Professional Diagrams**: Use waypoints to create organized, grid-aligned paths

✨ **Avoid Overlaps**: Route edges around nodes and phases for clarity

✨ **Grid Snap**: Enable grid snapping for perfectly aligned waypoints

✨ **Multiple Edges**: When multiple edges connect the same nodes, adjust anchor points so they don't overlap

✨ **Clean Up**: If a path becomes too complex, reset to auto-route and start fresh

## Visual Indicators

| Element | Appearance | Meaning |
|---------|-----------|----------|
| ● Circle | Small circle on path | Waypoint - drag to adjust |
| ■ Square (Blue) | Blue square on node edge | Active connection point |
| ■ Square (Gray) | Gray square on node edge | Available connection point |
| Thick Line | Thicker edge line | Edge is selected |
| Arrow | Directional arrow | Points to successor node |

## Dark Mode

All edge routing features work seamlessly in dark mode:
- Waypoints: Visible with light borders
- Anchors: Adapted colors for dark backgrounds
- Paths: Maintained visibility and contrast

## FAQs

**Q: Why do my edges look different?**
A: We've upgraded to professional orthogonal routing with straight lines and right angles.

**Q: Can I go back to curved edges?**
A: The orthogonal style is standard for technical diagrams. It provides better clarity and precision.

**Q: What happens to my existing edges?**
A: They automatically convert to the new style. No manual updates needed.

**Q: How many waypoints can I add?**
A: As many as needed! The system automatically simplifies to keep paths clean.

**Q: Can I move nodes with custom routing?**
A: Yes! Edges stay connected and maintain their waypoints as you move nodes.

**Q: What if I make a mistake?**
A: Use Ctrl/Cmd + Z to undo, or right-click and "Reset to Auto Route".

## Technical Details

**New Edge Properties** (optional, automatically managed):
- `sourceHandle`: 'top' | 'right' | 'bottom' | 'left'
- `targetHandle`: 'top' | 'right' | 'bottom' | 'left'  
- `waypoints`: Array of {x, y} positions

**Backward Compatible**: All existing edges work without any changes.

**Performance**: Optimized with memoization - handles hundreds of edges smoothly.

**Grid Snapping**: Respects your project's grid settings (if enabled).

## Support

For issues or questions:
1. Check that you're clicking on the edge path (not empty space)
2. Ensure edge is selected before adding waypoints
3. Try "Reset to Auto Route" if path becomes complex
4. Refresh page if handles don't appear after selection

---

*This enhanced routing system provides professional-grade control while maintaining ease of use through intelligent automatic routing.*


