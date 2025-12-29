# Updated Connector Controls - Quick Guide

## What Changed

### ✨ Easier to Grab Red Circles
The red circles are now positioned slightly away from the boxes (12 pixels along the connector line), so you won't accidentally grab the task/milestone/deliverable instead.

### ✨ Drag Anywhere on Connector
No more blue circle! When you select a connector, you can **grab it anywhere along the line** to bend it - much easier!

### ✨ Label Doesn't Block Dragging
The FS/SS label sits on top but won't prevent you from dragging the connector underneath it.

---

## How to Use Now

### 🔴 Change Connection Side (Red Circles)

1. **Click a connector** to select it
2. **Two red circles appear** - one near each box (offset from the edges)
3. **Grab a red circle** and drag it around the box
4. **Release** - connector snaps to nearest side (top/right/bottom/left)

**Example**:
```
Before:
[Task A] ────→ [Task B]

Grab left red circle, drag down:
[Task A] ──┐
           └──→ [Task B]
```

---

### 🎯 Bend the Connector (Drag Anywhere)

1. **Click a connector** to select it
2. **Grab anywhere along the line** (not just a specific spot!)
3. **Drag left/right/up/down** to bend it
4. Connector stays orthogonal (90° angles only)
5. **Release** - bend stays in place

**Example**:
```
Selected connector:
[Task] ════ [Next]
        ↑ grab here

After dragging down:
[Task] ═══┐
          └══ [Next]
```

**No More Blue Circle**: The entire connector line is draggable when selected - way easier to grab!

---

## Tips

💡 **Red circles are offset**: They appear 12px away from the box edges so you can grab them easily without accidentally clicking the box

💡 **Drag anywhere**: When connector is selected, click and drag anywhere on the line to bend it - no need to aim for a specific spot

💡 **Label is transparent**: The FS/SS label won't block your clicks - you can drag right through it

💡 **Buttons still work**: The Edit and Delete buttons above the connector are still fully clickable

💡 **Visual feedback**: Selected connectors are thicker and blue-highlighted so you know they're draggable

---

## What You'll See

```
When NOT selected:
[Task A] ──────→ [Task B]
         ↑ thin line

When SELECTED:
[Task A] 🔴═══🔵══🔴→ [Task B]
          ↑    ↑   ↑
       Red   Drag Red
      circle here circle
      (offset)   (offset)
```

**Note**: There's no visible blue circle anymore - the `🔵` above just shows that the middle area is draggable!

---

## Quick Reference

| Action | How To |
|--------|--------|
| **Select connector** | Click on the line |
| **Change which side connects** | Drag red circle around node |
| **Bend the connector** | Drag anywhere on selected line |
| **Edit dependency** | Click Edit button (hover over connector) |
| **Delete connector** | Click Delete button (hover over connector) |
| **Reset to auto** | Right-click → "Reset to Auto Route" |

---

## Common Questions

**Q: I don't see the red circles**
→ Click the connector to select it first

**Q: Where's the blue circle?**
→ Removed! Now you can drag **anywhere** on the selected connector - much easier

**Q: The label is in the way**
→ It's not blocking anymore - drag right through/under it

**Q: Red circles are too close to the boxes**
→ They should now be offset by 12px along the connector. If still too close, this might be a very short connector

**Q: Can I still bend the connector?**
→ Yes! Select it and drag anywhere on the line - no need to find a specific handle

**Q: The connector won't bend**
→ Make sure the connector is selected (should be thicker/blue). Then click and drag the line itself.

---

## Benefits

✅ Red circles easier to grab (offset from nodes)
✅ No more aiming for tiny blue dot
✅ Drag anywhere on selected connector
✅ Label doesn't block interaction
✅ Cleaner visual (no blue circle)
✅ Same orthogonal, clean bending

Much more forgiving and intuitive! 🎉


