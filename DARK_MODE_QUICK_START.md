# Dark Mode Quick Start Guide

## 🌓 What You Have Now

Your app now supports **dark mode** and **normal (light) mode** with a manual toggle!

---

## ⚡ How to Use

### Toggle Between Themes

Look for the **sun/moon icon** in the top-right corner of the app header:

- **🌙 Moon Icon** = Currently in light mode (click to switch to dark)
- **☀️ Sun Icon** = Currently in dark mode (click to switch to light)

Click the icon to instantly switch themes!

---

## 🔧 Setup Required (One-Time)

To enable theme persistence across sessions, run this SQL in your **Supabase SQL Editor**:

```sql
-- Add theme column to profiles table
ALTER TABLE profiles 
ADD COLUMN IF NOT EXISTS theme TEXT CHECK (theme IN ('light', 'dark'));

-- Set default theme to 'light' for existing users
UPDATE profiles 
SET theme = 'light' 
WHERE theme IS NULL;
```

**Where to run this:**
1. Go to https://app.supabase.com
2. Select your project
3. Navigate to **SQL Editor** (left sidebar)
4. Create a new query
5. Paste the SQL above
6. Click **Run**

---

## 💡 How It Works

### For Logged-In Users
- Your theme preference is **saved to your profile**
- It **persists across page reloads**
- It **follows you across devices**
- Changes save automatically when you toggle

### For Visitors (Not Logged In)
- Theme defaults to **light mode**
- Theme **resets on page reload** (not saved)
- Once they log in, theme will be saved

---

## 🎨 What's Themed

Every part of your app adapts to the selected theme:

✅ Login page  
✅ Projects list  
✅ Whiteboard view  
✅ Timeline view (Gantt chart)  
✅ Calendar view  
✅ Table view  
✅ Sidebar navigation  
✅ Headers and toolbars  
✅ Forms and inputs  
✅ Modals and dropdowns  

---

## 🧪 Testing

### Quick Test
1. Click the theme toggle in the header
2. Watch the app instantly switch themes
3. Navigate between different views
4. Refresh the page - theme should persist (if logged in)

### Full Test (After Supabase Setup)
1. **Create an account** or log in
2. **Toggle to dark mode**
3. **Refresh the page** - should stay in dark mode
4. **Log out and back in** - should remember your choice
5. **Try on another device** - theme follows you

---

## 🎯 Benefits

### Light Mode (Default)
- **Bright and clean**
- **Great for well-lit environments**
- **Professional look**

### Dark Mode
- **Reduces eye strain** in low light
- **Saves battery** on OLED screens
- **Modern and stylish**
- **Better for night work**

---

## ⌨️ Keyboard Access

The theme toggle is fully keyboard accessible:

1. **Tab** to focus the sun/moon button
2. **Enter** or **Space** to toggle
3. **Screen readers** will announce "Switch to dark mode" or "Switch to light mode"

---

## 🐛 Troubleshooting

### "Theme doesn't persist after reload"
- **Cause:** Supabase migration not run yet
- **Fix:** Run the SQL migration (see Setup section above)

### "Theme resets when I log out"
- **This is expected** - theme is tied to your user profile
- When you log back in, your saved theme will load

### "Some parts aren't themed"
- **Let us know!** Most components are themed, but we may have missed a few
- Check the `DARK_MODE_IMPLEMENTATION_SUMMARY.md` for details

### "Toggle button not showing"
- **Check:** Are you logged in to a project?
- **Check:** The toggle is in the top-right of the header
- **Try:** Refreshing the page

---

## 📱 Mobile & Responsive

The theme toggle and dark mode work great on:
- **Desktop** browsers
- **Tablet** devices
- **Mobile** phones

The sun/moon button adapts to smaller screens!

---

## 🔮 Technical Details

For developers or curious users:

- **Technology:** Tailwind CSS dark mode (`dark:` variants)
- **State:** React Context API
- **Persistence:** Supabase `profiles.theme` column
- **Toggle:** Manual only (doesn't follow system theme)
- **Default:** Light mode
- **Transition:** Instant (no animation lag)

---

## 📚 More Information

See the complete implementation details in:
- **`DARK_MODE_IMPLEMENTATION_SUMMARY.md`** - Full technical documentation
- **`SUPABASE_THEME_MIGRATION.sql`** - Database migration script

---

## 🎉 Enjoy!

That's it! You now have a professional dark/light mode toggle in your app.

**Happy planning in your preferred theme!** 🌓

---

**Last Updated:** December 23, 2025

