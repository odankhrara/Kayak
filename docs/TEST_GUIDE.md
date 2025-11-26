# 🧪 Testing Guide - Kayak Travel Booking System

**Purpose:** Comprehensive testing instructions for verifying system functionality  
**Prerequisites:** Environment setup complete (see ENVIRONMENT_SETUP.md)  
**Time Required:** 15-20 minutes  
**Last Updated:** November 26, 2025

---

## 📋 **PRE-TESTING CHECKLIST**

Before starting tests, verify:

- [ ] All Docker containers are running (MySQL, MongoDB)
- [ ] All 5 backend services are running (ports 4000, 8001-8004)
- [ ] Frontend is running (port 3000)
- [ ] Database is seeded with test data
- [ ] Browser is open to http://localhost:3000

**Quick Verification:**
```bash
# Check all services
curl http://localhost:4000/health  # API Gateway
curl http://localhost:8001/health  # User Service
curl http://localhost:8002/health  # Listing Service
curl http://localhost:8003/health  # Booking Service
curl http://localhost:8004/health  # Analytics Service

# Check Docker
docker ps | grep kayak

# All should return OK status
```

---

## 🧪 **TESTING SEQUENCE**

### **Test Priority Levels:**
- 🔴 **CRITICAL** - Core functionality, must pass
- 🟡 **HIGH** - Important features
- 🟢 **MEDIUM** - Nice to have
- ⚪ **LOW** - Optional

---

## 🔴 **TEST 1: Frontend Loads** ⏱️ **30 seconds**

**Priority:** 🔴 CRITICAL  
**Goal:** Verify frontend application loads correctly

### **Steps:**
1. Open browser
2. Navigate to: http://localhost:3000
3. Wait for page to load (2-3 seconds)

### **Expected Results:**
- ✅ Page loads without errors
- ✅ Beautiful home page with animated gradient background
- ✅ Floating orb animations visible
- ✅ Header shows "TravelVerse" or logo
- ✅ Header has "Sign Up" and "Login" buttons
- ✅ Search form with tabs: "Flights", "Hotels", "Cars"
- ✅ Footer visible at bottom

### **If Test Fails:**
1. **Blank White Page:**
   - Open browser console (F12 → Console tab)
   - Look for JavaScript errors
   - Common issue: Wrong API URL
   - Fix: Check `frontend/src/services/api.ts` has `http://localhost:4000`

2. **Connection Refused:**
   - Verify frontend is running: `lsof -i :3000`
   - Restart frontend: `cd frontend && npm run dev`

3. **Styles Not Loading:**
   - Check Tailwind CSS compiled
   - Restart frontend with cache clear

### **Pass Criteria:**
- [ ] Home page visible
- [ ] No console errors
- [ ] Animations working
- [ ] Navigation buttons present

---

## 🔴 **TEST 2: User Registration** ⏱️ **2 minutes**

**Priority:** 🔴 CRITICAL  
**Goal:** Verify new user can register with validation

### **Steps:**
1. Click "Sign Up" button in header
2. **Step 1 - Account Details:**
   - SSN (User ID): `123-45-6789`
   - First Name: `Test`
   - Last Name: `User`
   - Email: `test@demo.com`
   - Password: `Test1234`
   - Click "Next"

3. **Step 2 - Personal Info:**
   - Phone: `(555) 123-4567` (optional)
   - Address: `123 Main Street` (optional)
   - City: `San Francisco`
   - State: Select `CA` from dropdown
   - ZIP Code: `94102`
   - Click "Review"

4. **Step 3 - Review:**
   - Verify all information is correct
   - Click "Create Account"

### **Expected Results:**
- ✅ Step 1: Form validates SSN format, email format, password strength
- ✅ Step 2: Form validates ZIP code format, state selection
- ✅ Step 3: Shows summary of entered data
- ✅ Success toast: "Account created successfully! Welcome aboard! 🎉"
- ✅ Auto-login after registration
- ✅ Redirect to home page
- ✅ Header now shows "Test User" instead of "Sign Up/Login"
- ✅ JWT token stored in browser (check Application → LocalStorage → authToken)

### **Validation Testing:**
Try these invalid inputs (should show errors):
- SSN: `12345678` → Error: "Invalid SSN format"
- Email: `notanemail` → Error: "Invalid email format"
- Password: `test` → Error: "Password must be at least 8 characters"
- ZIP: `123` → Error: "Invalid ZIP code"
- State: Leave empty → Should require selection

### **If Test Fails:**
1. **"User already exists" error:**
   - User with email `test@demo.com` already registered
   - Use different email: `test2@demo.com`, `test3@demo.com`, etc.

2. **"Invalid SSN format":**
   - Must be exactly: `XXX-XX-XXXX` (e.g., `123-45-6789`)
   - Include hyphens in correct positions

3. **Network Error:**
   - Check backend is running: `curl http://localhost:4000/health`
   - Check browser Network tab (F12 → Network)
   - Should POST to: `http://localhost:4000/api/users/register`
   - Response should be 201 Created

4. **Not auto-logging in:**
   - Check browser console for errors
   - Verify token in LocalStorage
   - Try manual login with same credentials

### **Pass Criteria:**
- [ ] All validation working
- [ ] Registration successful
- [ ] Auto-login working
- [ ] Token stored
- [ ] User name in header

---

## 🔴 **TEST 3: User Login** ⏱️ **1 minute**

**Priority:** 🔴 CRITICAL  
**Goal:** Verify registered user can login

### **Steps:**
1. If logged in, logout first (click name → Logout)
2. Click "Login" button in header
3. Fill login form:
   - Email: `test@demo.com`
   - Password: `Test1234`
4. Click "Login" button

### **Expected Results:**
- ✅ Success toast: "Login successful"
- ✅ Redirect to home page
- ✅ Header shows "Test User"
- ✅ JWT token stored in LocalStorage
- ✅ Authenticated state persists on page refresh

### **Test Invalid Credentials:**
- Wrong password → Error: "Invalid credentials"
- Wrong email → Error: "User not found" or "Invalid credentials"
- Empty fields → Error: "Email and password are required"

### **If Test Fails:**
1. **"Invalid credentials":**
   - Verify email is exact: `test@demo.com`
   - Verify password is exact: `Test1234`
   - Check Caps Lock is off

2. **"User not found":**
   - User wasn't created in Test 2
   - Re-register the user first

3. **No redirect after login:**
   - Check browser console for errors
   - Check Network tab for API response

### **Pass Criteria:**
- [ ] Login successful
- [ ] Token stored
- [ ] Redirect working
- [ ] Error messages for invalid credentials

---

## 🔴 **TEST 4: Search Flights** ⏱️ **2 minutes**

**Priority:** 🔴 CRITICAL  
**Goal:** Verify flight search with filters

### **Steps:**
1. Ensure you're on home page: http://localhost:3000
2. Click "Flights" tab (should be active by default)
3. Fill search form:
   - **From:** `SFO` (San Francisco)
   - **To:** `JFK` (New York)
   - **Date:** Select tomorrow or any future date
   - **Passengers:** `2`
   - **Class:** `economy`
4. Click "Search Flights"

### **Expected Results:**
- ✅ Redirect to: `/flights?origin=SFO&destination=JFK&departureDate=...`
- ✅ Page title: "SFO → JFK"
- ✅ Shows search criteria (date, passengers, class)
- ✅ Left sidebar with filters:
  - Sort By (Price, Departure Time, Duration, Rating)
  - Price Range (Min/Max sliders)
  - Airline filter
- ✅ Results display flight cards showing:
  - Airline name and flight number
  - Departure/arrival times and airports
  - Duration
  - Class type
  - Price per person
  - Available seats
  - "Book Now" button
- ✅ At least 1 flight result (depends on seed data)

### **Test Filters:**
1. **Sort By:** Change to "Duration" → Results should reorder
2. **Price Range:** Set max $500 → Only cheaper flights show
3. **Airline:** Type "American" → Filter to American Airlines only
4. **Clear Filters:** Should reset all filters

### **If Test Fails:**
1. **"No flights found":**
   - Check seed data loaded: `docker exec -it kayak-mysql mysql -uroot -ppassword -e "SELECT COUNT(*) FROM kayak.flights WHERE departure_airport='SFO' AND arrival_airport='JFK';"`
   - Try different airports: `LAX`, `ORD`, `ATL`, `DEN`
   - Check departure date is in future

2. **Blank results page:**
   - Check browser console for errors
   - Check Network tab: Should call `/api/listings/flights/search`
   - Verify backend listing-service is running

3. **Filters not working:**
   - This is a frontend issue
   - Check console for JavaScript errors
   - Try hard refresh: Ctrl+Shift+R

### **Pass Criteria:**
- [ ] Search results displayed
- [ ] Filters visible and functional
- [ ] Flight cards show all details
- [ ] "Book Now" buttons present

---

## 🔴 **TEST 5: Book a Flight** ⏱️ **3 minutes**

**Priority:** 🔴 CRITICAL  
**Goal:** Verify complete booking flow with payment

### **Steps:**
1. From flight search results (Test 4)
2. Click "Book Now" on any flight with enough available seats
3. Should redirect to: `/booking/checkout`
4. Review booking summary (left side):
   - Flight details
   - Dates
   - Passengers
   - Price breakdown
5. Fill payment form (right side):
   - **Payment Method:** `Credit Card` (default)
   - **Card Number:** `4532123456789010`
   - **CVV:** `123`
   - **Expiry Date:** `12/25`
6. Click "Complete Booking - $XXX.XX"

### **Expected Results:**
- ✅ Checkout page loads with summary
- ✅ Price calculation shows:
  - Subtotal (ticket price × passengers)
  - Tax (10% of subtotal)
  - Total
- ✅ Payment form validates:
  - Card number (Luhn algorithm)
  - CVV (3-4 digits)
  - Expiry date (MM/YY, not expired)
- ✅ Success toast: "Booking confirmed! 🎉"
- ✅ Redirect to: `/booking/confirmation/:bookingId`
- ✅ Confirmation page shows:
  - Green checkmark animation
  - "Booking Confirmed!" heading
  - Booking reference number
  - Flight details
  - Payment confirmation
  - Transaction ID
- ✅ Booking saved in database

### **Test Invalid Payment Data:**
- Card: `1111111111111111` → Error: "Invalid card number" (fails Luhn)
- CVV: `12` → Error: "Invalid CVV"
- Expiry: `01/20` → Error: "Card expired"
- Empty fields → Validation errors

### **If Test Fails:**
1. **"Insufficient seats available":**
   - Flight is fully booked
   - Try a different flight
   - Or reduce number of passengers

2. **"Booking failed":**
   - Check backend logs: `cat src/logs/booking-billing-service.log`
   - Verify MySQL is running: `docker ps | grep mysql`
   - Check database transaction rolled back properly

3. **Payment validation not working:**
   - Test card `4532123456789010` passes Luhn algorithm
   - Check validators in frontend: `frontend/src/utils/validators.ts`

4. **No redirect to confirmation:**
   - Check browser console errors
   - Check Network tab: POST to `/api/bookings/create` should return 201
   - Verify booking ID in response

### **Verify in Database:**
```bash
# Check booking was created
docker exec -it kayak-mysql mysql -uroot -ppassword -e "
  USE kayak;
  SELECT booking_id, user_id, status, total_amount 
  FROM bookings 
  ORDER BY created_at DESC 
  LIMIT 1;
"

# Should show your new booking with status 'confirmed'
```

### **Pass Criteria:**
- [ ] Checkout page displays correctly
- [ ] Payment validation working
- [ ] Booking creates successfully
- [ ] Confirmation page shows
- [ ] Data persisted in database

---

## 🟡 **TEST 6: View My Bookings** ⏱️ **1 minute**

**Priority:** 🟡 HIGH  
**Goal:** Verify user can view booking history

### **Steps:**
1. Click your name in header (top right)
2. Select "My Bookings" from dropdown
3. Should redirect to: `/my-bookings`

### **Expected Results:**
- ✅ Page title: "My Bookings"
- ✅ Filter tabs: All, Current, Future, Past
- ✅ At least one booking visible (from Test 5)
- ✅ Booking card shows:
  - Booking reference number
  - Status badge (Confirmed, Pending, Cancelled)
  - Booking type (Flight, Hotel, Car)
  - Dates (Booking date, Check-in, Check-out)
  - Total amount
  - "Cancel" button (if status = Confirmed/Pending)
- ✅ Can filter bookings by tabs

### **Test Filters:**
1. Click "Future" tab → Shows only future bookings
2. Click "Past" tab → Shows only past bookings
3. Click "Current" tab → Shows ongoing bookings
4. Click "All" tab → Shows all bookings

### **If Test Fails:**
1. **Empty page / "No bookings found":**
   - Check booking from Test 5 was created
   - Verify correct user is logged in
   - Check database: `SELECT * FROM bookings WHERE user_id='123-45-6789';`

2. **Bookings not loading:**
   - Check Network tab: GET to `/api/bookings/user/:userId`
   - Verify booking-service is running
   - Check JWT token is valid

### **Pass Criteria:**
- [ ] Bookings displayed
- [ ] Filters working
- [ ] All booking details visible
- [ ] Cancel button present

---

## 🟡 **TEST 7: Cancel Booking** ⏱️ **1 minute**

**Priority:** 🟡 HIGH  
**Goal:** Verify booking cancellation with refund

### **Steps:**
1. On "My Bookings" page
2. Find a booking with status "Confirmed"
3. Click "Cancel" button
4. Confirm cancellation in popup/dialog

### **Expected Results:**
- ✅ Confirmation dialog appears: "Are you sure you want to cancel?"
- ✅ After confirmation:
  - Success toast: "Booking cancelled. Refund: $XXX.XX"
  - Status badge changes to "Cancelled"
  - "Cancel" button disappears
  - Refund amount calculated based on cancellation policy
- ✅ Booking still visible in list (not deleted)
- ✅ Database updated with new status

### **Refund Policy:**
- >24 hours before check-in: 100% refund
- <24 hours before check-in: 50% refund
- After check-in: 0% refund

### **If Test Fails:**
1. **"Cancel" button not present:**
   - Only Confirmed/Pending bookings can be cancelled
   - Check booking status

2. **"Cancellation failed":**
   - Check backend logs
   - Verify database transaction
   - Check refund calculation logic

3. **Status not updating:**
   - Refresh page
   - Check database: `SELECT status FROM bookings WHERE booking_id='...';`

### **Verify in Database:**
```bash
docker exec -it kayak-mysql mysql -uroot -ppassword -e "
  USE kayak;
  SELECT booking_id, status, total_amount 
  FROM bookings 
  WHERE status='cancelled' 
  ORDER BY updated_at DESC 
  LIMIT 1;
"
```

### **Pass Criteria:**
- [ ] Cancellation succeeds
- [ ] Status updates to "Cancelled"
- [ ] Refund amount displayed
- [ ] Database reflects changes

---

## 🟡 **TEST 8: Search Hotels** ⏱️ **1 minute**

**Priority:** 🟡 HIGH  
**Goal:** Verify hotel search functionality

### **Steps:**
1. Navigate to home page
2. Click "Hotels" tab
3. Fill search form:
   - **City:** `San Francisco`
   - **Check-in:** Tomorrow
   - **Check-out:** Day after tomorrow
   - **Guests:** `2`
   - **Rooms:** `1`
4. Click "Search Hotels"

### **Expected Results:**
- ✅ Redirect to: `/hotels?city=San+Francisco&checkIn=...`
- ✅ Page shows hotel results
- ✅ Filters sidebar with:
  - Sort By (Price, Star Rating, Guest Rating)
  - Price Range
  - Star Rating (5★, 4★, 3★, 2★, 1★)
- ✅ Hotel cards show:
  - Hotel name
  - Location (City, State)
  - Star rating
  - Amenities badges (WiFi, Breakfast, Pool, etc.)
  - Guest rating
  - Price per night × number of nights
  - "Book Now" button

### **If Test Fails:**
- Try different cities: `New York`, `Los Angeles`, `Chicago`
- Check seed data: `SELECT COUNT(*) FROM kayak.hotels WHERE city='San Francisco';`

### **Pass Criteria:**
- [ ] Hotel results displayed
- [ ] Filters functional
- [ ] All details visible

---

## 🟡 **TEST 9: Search Cars** ⏱️ **1 minute**

**Priority:** 🟡 HIGH  
**Goal:** Verify car rental search functionality

### **Steps:**
1. Navigate to home page
2. Click "Cars" tab
3. Fill search form:
   - **Location:** `San Francisco`
   - **Pick-up Date:** Tomorrow
   - **Return Date:** 3 days later
4. Click "Search Cars"

### **Expected Results:**
- ✅ Redirect to: `/cars?location=San+Francisco&pickupDate=...`
- ✅ Car results displayed
- ✅ Filters: Car Type, Transmission
- ✅ Car cards show:
  - Model and year
  - Company name
  - Type (Compact, Sedan, SUV, Luxury)
  - Transmission (Automatic/Manual)
  - Seats
  - Daily rate
  - Total cost (daily × days)
  - "Book Now" button

### **Pass Criteria:**
- [ ] Car results displayed
- [ ] Filters working
- [ ] Pricing calculated correctly

---

## 🟢 **TEST 10: Edit Profile** ⏱️ **1 minute**

**Priority:** 🟢 MEDIUM  
**Goal:** Verify user can update profile information

### **Steps:**
1. Click your name in header
2. Select "My Profile"
3. Update any field (e.g., Phone: `(555) 999-8888`)
4. Click "Save Changes"

### **Expected Results:**
- ✅ Profile page shows current user data
- ✅ All fields editable
- ✅ Success toast: "Profile updated successfully! ✨"
- ✅ Changes persist after page refresh

### **Test Validation:**
- Invalid email → Error
- Invalid ZIP → Error
- Invalid state → Error

### **Pass Criteria:**
- [ ] Profile displays
- [ ] Updates save successfully
- [ ] Validation working

---

## 🟢 **TEST 11: Logout** ⏱️ **30 seconds**

**Priority:** 🟢 MEDIUM  
**Goal:** Verify logout functionality

### **Steps:**
1. Click your name in header
2. Click "Logout"

### **Expected Results:**
- ✅ Redirect to home page
- ✅ Header shows "Sign Up" and "Login" buttons again
- ✅ JWT token removed from LocalStorage
- ✅ User state cleared
- ✅ Protected routes redirect to login

### **Test Protected Route After Logout:**
- Try accessing: `/my-bookings`
- Should redirect to `/login`

### **Pass Criteria:**
- [ ] Logout successful
- [ ] Token cleared
- [ ] Protected routes blocked

---

## ✅ **SUCCESS CRITERIA**

### **Critical Tests (Must All Pass):**
- [x] Frontend loads (Test 1)
- [x] User registration (Test 2)
- [x] User login (Test 3)
- [x] Search flights (Test 4)
- [x] Book flight (Test 5)

**If all 5 critical tests pass:** ✅ **Core system is functional**

### **Full Success (All Tests Pass):**
- [x] All 11 tests completed successfully
- [x] No console errors
- [x] Data persists in database
- [x] All validations working
- [x] Authentication flow complete

**If all 11 tests pass:** 🎉 **System is 100% functional for implemented features**

---

## 📊 **FUNCTIONALITY COVERAGE**

Based on test results, here's what percentage of the system is working:

### **If All Tests Pass:**
- ✅ **Authentication:** 100% (Register, Login, Logout)
- ✅ **Search Functionality:** 100% (Flights, Hotels, Cars)
- ✅ **Booking Flow:** 100% (Search → Book → Pay → Confirm)
- ✅ **Booking Management:** 100% (View, Cancel, Refund)
- ✅ **Profile Management:** 100% (View, Edit)
- ✅ **Validation:** 100% (SSN, ZIP, State, Card, Email, etc.)
- ⚠️ **Admin Features:** 0% (Not implemented yet)
- ⚠️ **AI Recommendations:** 0% (Not implemented yet)
- ⚠️ **Real-time Notifications:** 0% (No Kafka yet)
- ⚠️ **Performance Optimization:** 0% (No Redis yet)

**Overall Functional Completion:** **~70%**

---

## 🐛 **COMMON ISSUES & FIXES**

### **Issue Category: Database**

#### **Problem: "Cannot connect to MySQL"**
**Symptoms:** Backend services fail to start, errors about database connection

**Solutions:**
```bash
# 1. Check MySQL is running and healthy
docker ps | grep mysql
# Should show: Up X minutes (healthy)

# 2. If not healthy, check logs
docker logs kayak-mysql

# 3. Wait for initialization (first time takes 2-3 minutes)
sleep 60
docker ps | grep mysql

# 4. Restart MySQL if needed
docker-compose restart mysql

# 5. Verify connection
docker exec -it kayak-mysql mysql -uroot -ppassword -e "SHOW DATABASES;"
# Should list 'kayak' database

# 6. Check credentials in code match docker-compose.yml
# Default: user=root, password=password, database=kayak
```

---

#### **Problem: "No data in database / Empty search results"**
**Symptoms:** Searches return no results, booking history is empty

**Solutions:**
```bash
# 1. Verify data exists
docker exec -it kayak-mysql mysql -uroot -ppassword -e "
  USE kayak;
  SELECT 'users' as table_name, COUNT(*) FROM users
  UNION SELECT 'flights', COUNT(*) FROM flights
  UNION SELECT 'hotels', COUNT(*) FROM hotels;
"

# 2. If counts are 0, re-run seed script
cd src/db
node seed-data.js

# 3. If seed script fails, check MySQL is ready
docker logs kayak-mysql | grep "ready for connections"

# 4. Clear and reseed (nuclear option)
docker-compose down -v
docker-compose up -d mysql mongodb
sleep 60
node seed-data.js
```

---

### **Issue Category: Backend Services**

#### **Problem: "Port already in use"**
**Symptoms:** Service won't start, error: "EADDRINUSE"

**Solutions:**
```bash
# 1. Find what's using the port
lsof -i :4000  # Replace with your port

# 2. Kill the process
kill -9 <PID>

# 3. Or kill all node processes (be careful!)
killall node

# 4. Start services again
./start-all.sh
```

---

#### **Problem: "Module not found" errors**
**Symptoms:** Services fail to start, import errors

**Solutions:**
```bash
# 1. Verify Node.js version
node --version
# Should be v18+

# 2. Reinstall dependencies
cd <service-directory>
rm -rf node_modules package-lock.json
npm install

# 3. Install common dependencies first
cd services/common
npm install
npm run build  # If needed

# 4. Then install service dependencies
cd ../user-service
npm install
```

---

#### **Problem: "Services start but health check fails"**
**Symptoms:** Service process runs but `/health` returns error

**Solutions:**
```bash
# 1. Check service logs
cd src/logs
cat user-service.log

# 2. Common issue: Database not ready
# Wait 30 seconds and retry
sleep 30
curl http://localhost:8001/health

# 3. Restart specific service
kill $(cat logs/user-service.pid)
cd services/user-service
npm run dev

# 4. Check port conflicts
lsof -i :8001
```

---

### **Issue Category: Frontend**

#### **Problem: "Blank white page"**
**Symptoms:** Frontend loads but shows nothing, or briefly flashes then goes blank

**Solutions:**
```bash
# 1. Check browser console (F12 → Console)
# Look for error messages

# 2. Common issue: API URL wrong
# Check frontend/src/services/api.ts
# BASE_URL should be: http://localhost:4000

# 3. Verify backend is responding
curl http://localhost:4000/health

# 4. Hard refresh browser
# Chrome: Ctrl+Shift+R (Windows) or Cmd+Shift+R (Mac)

# 5. Clear browser cache and storage
# Chrome: F12 → Application → Clear Storage → Clear site data

# 6. Restart frontend
cd frontend
npm run dev
```

---

#### **Problem: "Network Error" or "Failed to fetch"**
**Symptoms:** API calls fail, console shows network errors

**Solutions:**
```bash
# 1. Check browser Network tab (F12 → Network)
# Look for failed requests (red)

# 2. Verify API Gateway is running
curl http://localhost:4000/health

# 3. Check CORS configuration
# API Gateway should allow localhost:3000

# 4. Verify request URL
# Should be: http://localhost:4000/api/...
# NOT: http://localhost:8001/... (direct to service)

# 5. Check JWT token (for protected routes)
# F12 → Application → LocalStorage → authToken
# If missing, login again
```

---

#### **Problem: "Authentication required" on every request"**
**Symptoms:** Logged in but still getting 401 errors

**Solutions:**
```bash
# 1. Check JWT token in LocalStorage
# F12 → Application → LocalStorage → authToken
# Should see a long string

# 2. Verify token is being sent
# F12 → Network → Select any request → Headers
# Should see: Authorization: Bearer <token>

# 3. Token might be expired
# Logout and login again

# 4. Check JWT_SECRET matches between services
# All services should use same secret

# 5. Clear storage and re-login
localStorage.clear();
# Then login again
```

---

### **Issue Category: Validation**

#### **Problem: "Invalid SSN format" even with correct format**
**Symptoms:** Registration fails with SSN error

**Solution:**
- SSN must be exactly: `XXX-XX-XXXX`
- Example: `123-45-6789`
- Must include hyphens in correct positions
- All digits, no letters
- Don't use: `000-00-0000` (reserved)

---

#### **Problem: "Invalid credit card" with valid card**
**Symptoms:** Payment fails with card validation error

**Solutions:**
```bash
# Use this test card (passes Luhn algorithm):
Card: 4532123456789010
CVV: 123
Expiry: 12/25

# Other valid test cards:
# 5425233430109903 (Mastercard)
# 374245455400126 (Amex - 4 digit CVV)

# Check Luhn validation in console:
# F12 → Console:
validateCreditCard('4532123456789010')
# Should return true
```

---

#### **Problem: "Invalid ZIP code"**
**Symptoms:** Registration/profile update fails with ZIP error

**Solution:**
- Valid formats:
  - `94102` (5 digits)
  - `94102-1234` (5+4 digits with hyphen)
- Invalid:
  - `9410` (too short)
  - `94102-12` (incomplete extended)
  - `9410A` (contains letters)

---

### **Issue Category: Booking**

#### **Problem: "Insufficient seats available"**
**Symptoms:** Cannot book flight, error about seats

**Solutions:**
1. Try different flight (may be fully booked)
2. Reduce number of passengers
3. Check database seat count:
```bash
docker exec -it kayak-mysql mysql -uroot -ppassword -e "
  SELECT flight_id, available_seats 
  FROM kayak.flights 
  WHERE available_seats > 0 
  LIMIT 5;
"
```

---

#### **Problem: "Booking created but inventory not updated"**
**Symptoms:** Seats/rooms still showing as available after booking

**Solution:**
- This is a transaction issue
- Check backend logs for rollback messages
- Verify MySQL transaction support (InnoDB)
- Check bookingService.ts transaction logic

---

### **Issue Category: Performance**

#### **Problem: "Slow search results"**
**Symptoms:** Search takes >5 seconds to return results

**Solutions:**
1. **Expected:** No Redis caching yet, queries go to database
2. **Check database indexes:**
```bash
docker exec -it kayak-mysql mysql -uroot -ppassword -e "
  SHOW INDEX FROM kayak.flights;
"
```
3. **Database may be slow:** Restart Docker
4. **Too many records:** Current design handles 1000 users, 500 flights fine

---

#### **Problem: "Frontend is slow/laggy"**
**Symptoms:** UI animations stutter, interactions delayed

**Solutions:**
1. Check browser DevTools → Performance tab
2. Common issue: Development mode is slower
3. Try production build:
```bash
cd frontend
npm run build
npm run preview
```
4. Close other browser tabs
5. Check system resources (RAM, CPU)

---

## 🔍 **DEBUGGING TOOLS**

### **Browser DevTools (F12):**
- **Console:** JavaScript errors, log messages
- **Network:** API calls, responses, timings
- **Application:** LocalStorage, cookies, cache
- **Sources:** Set breakpoints in code

### **Backend Logs:**
```bash
# View live logs
cd src/logs
tail -f api-gateway.log
tail -f user-service.log
tail -f booking-billing-service.log

# Search for errors
grep -i error *.log
```

### **Database Inspection:**
```bash
# MySQL
docker exec -it kayak-mysql mysql -uroot -ppassword kayak

# Run queries
SELECT * FROM users LIMIT 5;
SELECT * FROM bookings ORDER BY created_at DESC LIMIT 10;

# MongoDB
docker exec -it kayak-mongodb mongosh

# Switch to kayak database
use kayak

# Query collections
db.reviews.find().limit(5);
```

### **API Testing:**
```bash
# Test endpoints directly with curl

# Health check
curl http://localhost:4000/health

# Register user
curl -X POST http://localhost:4000/api/users/register \
  -H "Content-Type: application/json" \
  -d '{"userId":"999-99-9999","firstName":"Test","lastName":"User","email":"curl@test.com","password":"Test1234"}'

# Search flights
curl "http://localhost:4000/api/listings/flights/search?origin=SFO&destination=JFK"
```

---

## 📊 **TEST REPORT TEMPLATE**

Use this template to document your test results:

```
# Test Report - Kayak Travel Booking System
Date: [Date]
Tester: [Name]
Environment: [Local/Production-like]

## Test Results Summary
- Total Tests: 11
- Passed: [X]
- Failed: [X]
- Pass Rate: [X]%

## Critical Tests (5)
- [ ] Test 1: Frontend Loads
- [ ] Test 2: User Registration
- [ ] Test 3: User Login
- [ ] Test 4: Search Flights
- [ ] Test 5: Book Flight

## High Priority Tests (4)
- [ ] Test 6: View Bookings
- [ ] Test 7: Cancel Booking
- [ ] Test 8: Search Hotels
- [ ] Test 9: Search Cars

## Medium Priority Tests (2)
- [ ] Test 10: Edit Profile
- [ ] Test 11: Logout

## Issues Found
1. [Issue description] - [Severity] - [Status]
2. ...

## Notes
[Any observations or comments]

## Sign-off
System Ready for: [ ] Development [ ] Testing [ ] Production
Tested By: [Name]
Date: [Date]
```

---

## ✅ **FINAL CHECKLIST**

Before considering testing complete:

### **Functional Testing:**
- [ ] All 5 critical tests passed
- [ ] All 11 tests attempted
- [ ] Pass rate ≥ 80%
- [ ] No blocker issues found

### **Data Validation:**
- [ ] User data persists in database
- [ ] Bookings saved correctly
- [ ] Inventory updates (seats decrease)
- [ ] Billing records created

### **Authentication:**
- [ ] Registration works
- [ ] Login works
- [ ] Logout clears session
- [ ] Protected routes enforce authentication
- [ ] JWT token stored and used

### **Edge Cases:**
- [ ] Invalid inputs show errors
- [ ] Empty results handled gracefully
- [ ] Error messages are user-friendly
- [ ] Validation prevents bad data

### **Performance:**
- [ ] Search results load in <5 seconds
- [ ] Booking completes in <3 seconds
- [ ] No memory leaks (leave running 10+ minutes)
- [ ] UI remains responsive

---

## 🎯 **NEXT STEPS AFTER TESTING**

Once all tests pass, you can proceed with:

1. **✅ Implement Redis Caching** (REQUIRED for project - 10% grade)
   - See: NEXT_STEPS_PLAN.md → Track 2, Task 2.1

2. **✅ Implement Kafka Messaging** (REQUIRED for project - 10% grade)
   - See: NEXT_STEPS_PLAN.md → Track 3

3. **✅ Build Admin Dashboard** (Required feature)
   - See: NEXT_STEPS_PLAN.md → Track 5, Task 5.1

4. **✅ Performance Testing** (Required for presentation)
   - See: NEXT_STEPS_PLAN.md → Performance Testing section
   - Generate 4 charts: B, B+S, B+S+K, B+S+K+O

5. **⚠️ AI Recommendation Service** (Optional - 15% of grade)
   - See: NEXT_STEPS_PLAN.md → Track 4

---

**Document Version:** 1.0  
**Created:** November 26, 2025  
**Last Updated:** November 26, 2025  
**Maintained By:** Development Team

