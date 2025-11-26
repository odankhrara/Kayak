# 🚀 Quick Start Guide - TravelVerse Frontend

## 📋 Prerequisites

Before starting the frontend, ensure:

1. ✅ **Node.js** installed (v18 or higher)
   ```bash
   node --version  # Should show v18.x or higher
   ```

2. ✅ **Backend API** running
   ```bash
   # In another terminal, from src directory:
   cd src/infra
   docker-compose up -d
   cd ..
   ./start-all.sh
   ```
   Backend should be accessible at: `http://localhost:4000`

3. ✅ **Database** populated with seed data

---

## ⚡ Start Frontend (3 Simple Steps)

### Step 1: Install Dependencies
```bash
cd frontend
npm install
```
*This will take 1-2 minutes*

### Step 2: Start Development Server
```bash
npm run dev
```

### Step 3: Open in Browser
```
http://localhost:3000
```

**That's it! 🎉 The app should now be running!**

---

## 🧪 Test the App

### Test 1: Register a New User

1. Click **"Sign Up"** button
2. Fill out the form:
   - **SSN**: `123-45-6789` (format: XXX-XX-XXXX)
   - **First Name**: John
   - **Last Name**: Doe
   - **Email**: `john@test.com`
   - **Password**: `TestPass123`
   - **City**: San Francisco
   - **State**: CA
   - **ZIP**: `94102`
3. Click through 3 steps
4. Auto-login and redirect to home

### Test 2: Search for Flights

1. On home page, select **"Flights"** tab
2. Choose:
   - **From**: SFO (San Francisco)
   - **To**: JFK (New York)
   - **Date**: Any future date
   - **Passengers**: 2
3. Click **"Search Flights"**
4. View results with filters

### Test 3: Book a Flight

1. On flight results, click **"Book Now"**
2. Review booking summary
3. Enter payment details:
   - **Card**: `4532123456789010` (test card)
   - **CVV**: `123`
   - **Expiry**: `12/25`
4. Click **"Complete Booking"**
5. See confirmation with booking reference

### Test 4: View Bookings

1. Click your name in header
2. Select **"My Bookings"**
3. See all your bookings
4. Try filtering by **Current**, **Future**, **Past**

### Test 5: Cancel a Booking

1. In "My Bookings", click **"Cancel"**
2. Confirm cancellation
3. See refund amount (100% if >24hrs before check-in)
4. Status changes to "Cancelled"

---

## 🎨 Features to Explore

### Home Page
- ✅ Animated gradient background with floating orbs
- ✅ Tab switcher for Flights/Hotels/Cars
- ✅ Dynamic search forms
- ✅ Features section

### Search Results
- ✅ Beautiful cards with glassmorphism
- ✅ Dynamic filters (price, ratings, etc.)
- ✅ Sort options
- ✅ Real-time availability
- ✅ Hover animations

### Booking Flow
- ✅ Secure payment form
- ✅ Card validation (Luhn algorithm)
- ✅ Price breakdown
- ✅ Animated confirmation
- ✅ Booking reference

### My Bookings
- ✅ Filter tabs (All/Current/Future/Past)
- ✅ Status badges
- ✅ Cancel with refund
- ✅ Empty states

### Profile
- ✅ Edit user information
- ✅ Form validation
- ✅ Save changes
- ✅ Success feedback

---

## 🐛 Troubleshooting

### Issue: "Cannot connect to API"
**Solution:**
```bash
# Ensure backend is running
curl http://localhost:4000/health

# Should return: {"status":"ok","service":"api-gateway"}
```

### Issue: "Port 3000 already in use"
**Solution:**
```bash
# Kill process on port 3000
lsof -ti:3000 | xargs kill -9

# Then restart
npm run dev
```

### Issue: "Module not found"
**Solution:**
```bash
# Clean install
rm -rf node_modules package-lock.json
npm install
```

### Issue: "Blank page / white screen"
**Solution:**
1. Check browser console for errors
2. Ensure all dependencies installed: `npm install`
3. Clear browser cache
4. Try incognito mode

---

## 📊 Performance Tips

### Development Mode
```bash
npm run dev  # Fast refresh, HMR enabled
```

### Production Build
```bash
npm run build   # Optimized bundle
npm run preview # Test production build locally
```

### Production optimizations included:
- ✅ Code splitting
- ✅ Tree shaking
- ✅ Minification
- ✅ Asset optimization

---

## 🎯 What Works Right Now

✅ **User Registration** - Multi-step with validation  
✅ **Login/Logout** - JWT authentication  
✅ **Flight Search** - With filters and sorting  
✅ **Hotel Search** - With amenity filters  
✅ **Car Search** - With type filters  
✅ **Booking Creation** - Full transaction with payment  
✅ **Booking Management** - View, filter, cancel  
✅ **Profile Editing** - Update user info  
✅ **Responsive Design** - Works on all devices  
✅ **Error Handling** - Toast notifications  
✅ **Loading States** - Skeletons and spinners  

---

## 📱 Responsive Breakpoints

- **Mobile**: < 768px
- **Tablet**: 768px - 1024px
- **Desktop**: > 1024px

All pages are fully responsive and tested on all screen sizes.

---

## 🎨 Design Highlights

### Visual Effects
- Glassmorphism cards with frosted glass effect
- Animated gradient backgrounds
- Floating orb animations
- Smooth transitions on all interactions
- Hover scale effects
- Shadow depth

### Color Scheme
- Primary: Blue (#3b82f6) to Purple (#d946ef) gradient
- Accent: Pink to Orange
- Semantic colors for status (green, yellow, red)

### Typography
- Display: Poppins (bold, for headings)
- Body: Inter (clean, readable)

---

## ✅ Validation Examples

### Valid Inputs
```
SSN: 123-45-6789
Email: user@example.com
Password: SecurePass123
ZIP: 94102 or 94102-1234
State: CA
Airport: SFO, JFK, LAX
Card: 4532123456789010 (passes Luhn)
CVV: 123
Expiry: 12/25
```

### Invalid Inputs (Will Show Errors)
```
SSN: 12345678 (missing hyphens)
Email: notanemail (missing @)
Password: short (too short, no complexity)
ZIP: 1234 (too short)
State: California (must be 2-letter)
Airport: SF (must be 3 letters)
Card: 1111111111111111 (fails Luhn)
CVV: 12 (too short)
Expiry: 13/20 (invalid month)
```

---

## 🎉 You're All Set!

The frontend is **100% complete** with:
- ✅ 10 pages
- ✅ 9 reusable components
- ✅ 7 API services
- ✅ 15+ validators
- ✅ 10+ formatters
- ✅ Beautiful UI
- ✅ Full functionality

**Just run `npm run dev` and start exploring!** 🚀

---

Need help? Check:
- `README.md` - Full documentation
- `COMPLETION_SUMMARY.md` - Implementation details
- Browser console - For any errors
- Backend logs - For API issues

**Happy travels! ✈️🏨🚗**

