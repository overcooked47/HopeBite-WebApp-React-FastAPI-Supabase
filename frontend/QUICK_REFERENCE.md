# Quick Reference - HopeBite Frontend Changes

## What Changed?

### 🆕 New Features
1. **Real-time Notification Polling** - Every 7 seconds
2. **NGO/Individual Selector** - During contributor signup
3. **My Profile Pages** - For contributors and recipients
4. **Dynamic Leaderboard** - Auto-updates from API
5. **Auto-Refresh Portals** - Donations, requests, deliveries

### 🗑️ Removed Features
1. Hardcoded test data (leaderboard, donations, requests)
2. "Finalize" modal after registration
3. Admin ability to request food

### 📝 Modified Pages
- Register.jsx - Added NGO selector
- Dashboard.jsx - Dynamic stats
- DonateFood.jsx - Auto-refresh
- RecipientRequest.jsx - Auto-refresh
- Zakat.jsx - Dynamic recipients
- Leaderboard.jsx - Real-time data
- VolunteerDeliveries.jsx - Dynamic list

## New Routes

```
/profile/contributor     - Contributor profile
/profile/recipient       - Recipient profile
```

## New Components

```
src/context/NotificationContext.jsx  - Polling engine
src/pages/Profile/                   - Profile pages
```

## API Endpoints Required

```
GET /api/v1/notifications/
GET /api/v1/donations/
GET /api/v1/requests/
GET /api/v1/deliveries/
GET /api/v1/leaderboard/
```

## Key Files to Review

1. **Core Logic**: `src/context/NotificationContext.jsx`
2. **Auth Flow**: `src/pages/Auth/Register.jsx`
3. **API Integration**: Any page with `useNotifications()`
4. **Routing**: `src/App.jsx`
5. **Permissions**: `src/context/AuthContext.jsx`

## Testing Checklist

- [ ] NGO selector appears for contributors
- [ ] Profile pages show real data
- [ ] Lists auto-refresh every 10 seconds
- [ ] Admin cannot request food
- [ ] Leaderboard is dynamic
- [ ] Zakat recipient list updates
- [ ] All pages work on mobile

## Troubleshooting

**Pages show empty?**
→ Check if API endpoints return data

**NGO selector not showing?**
→ Only appears when selecting Contributor role

**Auto-refresh not working?**
→ Check browser console for API errors

**Admin can access restricted page?**
→ Clear cache and re-login

## Performance Tips

- Polling runs every 7s (configurable in NotificationContext.jsx)
- Each page refreshes independently every 10s
- Consider WebSockets for better performance
- Monitor memory usage during long sessions

## Deployment Checklist

```
✅ npm install
✅ npm run build
✅ npm run preview (test production build)
✅ Set up API endpoints
✅ Run cleanup script (first deployment)
✅ Deploy to hosting
✅ Test all features
✅ Monitor errors/performance
```

## Need More Info?

- **Technical Details**: See IMPLEMENTATION_NOTES.md
- **Deployment**: See DEPLOYMENT_GUIDE.md
- **Full Summary**: See SUMMARY.md

---

**Last Updated**: January 24, 2026
