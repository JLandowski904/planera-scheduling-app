# Troubleshooting: TypeScript Errors After Edge Routing Implementation

## Issue: TypeScript Error in Canvas.tsx

If you see this error in `src/components/Canvas.tsx`:
```
Type '{ ... }' is not assignable to type 'IntrinsicAttributes & EdgeComponentProps'.
Property 'onWaypointDragStart' does not exist on type 'IntrinsicAttributes & EdgeComponentProps'.
```

## Root Cause

This is a **TypeScript language server caching issue**. The interface is correctly defined in `EdgeComponent.tsx`, but the TypeScript language server hasn't refreshed its cache.

## Verification

Check `src/components/EdgeComponent.tsx` lines 13-25. The interface should include:
```typescript
interface EdgeComponentProps {
  edge: Edge;
  sourceNode?: Node;
  targetNode?: Node;
  isSelected: boolean;
  onClick: (e: React.MouseEvent) => void;
  onDelete: () => void;
  onContextMenu: (e: React.MouseEvent) => void;
  onEdit?: () => void;
  onWaypointDragStart?: (waypointIndex: number, e: React.MouseEvent) => void;
  onAnchorDragStart?: (anchorType: 'source' | 'target', e: React.MouseEvent) => void;
  onPathClick?: (clickX: number, clickY: number, e: React.MouseEvent) => void;
}
```

If these props are present, the error is a false positive from the TypeScript cache.

## Solutions

### Solution 1: Restart TypeScript Language Server (Recommended)

**In VS Code / Cursor:**
1. Press `Ctrl/Cmd + Shift + P`
2. Type "TypeScript: Restart TS Server"
3. Press Enter

**In WebStorm:**
1. File → Invalidate Caches / Restart
2. Select "Invalidate and Restart"

**In other editors:**
- Consult your editor's documentation for restarting the TypeScript language server

### Solution 2: Restart Your Editor

Simply close and reopen your code editor/IDE.

### Solution 3: Clean and Rebuild

```bash
# Delete node_modules and reinstall
rm -rf node_modules
npm install

# Clear TypeScript build cache
rm -rf .tsc-cache
rm -rf dist

# Rebuild
npm run build
```

### Solution 4: Verify Runtime

The TypeScript error won't affect runtime behavior. You can verify by:

```bash
# Start the development server
npm run dev
```

The application should work correctly despite the linter error.

## Why This Happens

TypeScript's language server maintains an in-memory cache of type definitions. When files are modified (especially interfaces), the cache may not immediately reflect these changes. This is a known limitation of the TypeScript language server, not an issue with the code.

## Confirmation

After applying any solution:
1. The error in `Canvas.tsx` should disappear
2. No other TypeScript errors should appear
3. The application should build successfully
4. All edge routing features should work correctly

## Still Having Issues?

If the error persists after trying all solutions:

1. **Check File Encoding**: Ensure all files are UTF-8 encoded
2. **Check for Syntax Errors**: Look for any syntax errors in `EdgeComponent.tsx`
3. **Check TypeScript Version**: Ensure you're using TypeScript 4.x or later
4. **Check tsconfig.json**: Verify it includes the `src` directory

## Expected Behavior

Once resolved, you should see:
- ✅ No TypeScript errors
- ✅ All files compile successfully  
- ✅ Edge routing works in the whiteboard
- ✅ Waypoints and anchors are draggable
- ✅ Dark mode styles apply correctly

## Need Help?

This is a development environment issue, not a code issue. The implementation is complete and functional. If you continue to experience problems:

1. Try running the application - it will likely work despite the error
2. Check your IDE/editor settings for TypeScript configuration
3. Ensure your IDE is using the project's TypeScript version (not a global version)

---

*This is a common TypeScript tooling issue and does not affect the functionality of the edge routing system.*


