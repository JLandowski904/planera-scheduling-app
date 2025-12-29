# Connector Controls - Your Visual Design

## What You'll See

When you select any connector on the whiteboard:

```
         🔴                          🔴
    [Task A] ──────🔵──────→ [Permit Issue]
```

- **2 Red Circles** - One at each connection point (where line meets boxes)
- **1 Blue Circle** - In the middle of the connector

## How to Use

### 🔴 Red Circles - Change Connection Side

**Purpose**: Drag these to connect to different sides of the boxes

**How**:
1. Click connector to select it
2. **Grab a red circle** at either end
3. **Drag it around the box** (up, down, left, right)
4. The connector **automatically snaps** to the nearest side:
   - Drag up → snaps to top
   - Drag right → snaps to right side
   - Drag down → snaps to bottom
   - Drag left → snaps to left side
5. Release - connector is now attached to that side

**Example**:
```
Before:
[Task] ─→ [Next]     (connects right to left)

After dragging red circle up on "Next":
[Task] ─┐
        └→ [Next]    (connects right to top)
```

### 🔵 Blue Circle - Bend the Connector

**Purpose**: Drag this to add a bend in the connector path

**How**:
1. Click connector to select it
2. **Grab the blue circle** in the middle
3. **Drag left/right/up/down** to bend the path
4. Connector bends while keeping 90° angles
5. Creates clean L-shape or Z-shape

**Example**:
```
Before:
[Task] ────→ [Next]     (straight line)

After dragging blue circle down:
[Task] ──┐
         └──→ [Next]    (bent with blue circle at corner)
```

## Tips & Tricks

💡 **To avoid overlapping connectors**: Use red circles to attach from different sides
   ```
   [Task A] ─→ [Next]    (from right side)
   [Task B] ─┘           (from bottom)
   ```

💡 **To route around obstacles**: 
   1. Use blue circle to bend the path
   2. Use red circles to change which sides connect

💡 **Clean diagrams**: Keep it simple - one bend per connector is usually enough

💡 **Quick reset**: Right-click connector → "Reset to Auto Route" to remove custom routing

## Colors

- **Red (🔴)**: Alert/Action - "grab me to change connection side"
- **Blue (🔵)**: Navigation - "grab me to bend the path"
- Both visible in light and dark modes

## What It Does Automatically

✅ Snaps red circles to nearest side as you drag
✅ Keeps all angles at 90° (no diagonal lines)
✅ Recalculates path when you move boxes
✅ Shows FS/SS label in middle where it's visible

## Common Questions

**Q: I don't see the circles**
→ Click the connector line to select it first

**Q: Can I add more bends?**
→ The system uses one bend for cleaner diagrams. Use red circles to change connection sides for complex routing.

**Q: The circles are too small**
→ They have invisible hover areas that are larger - just move your mouse near them

**Q: How do I make a connector straight again?**
→ Right-click → "Reset to Auto Route" OR drag blue circle back toward the middle

**Q: Can I connect to a specific point on the side?**
→ No, connections snap to the middle of each side for consistency. You can choose top/right/bottom/left.

## Your Design Implemented

This matches your screenshot exactly:
- Red circles where connectors meet boxes ✅
- Blue circle in the middle ✅
- Clean orthogonal paths ✅
- Simple, intuitive interaction ✅

Happy diagramming! 🎨


