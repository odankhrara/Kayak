# 🛡️ Admin Functionality Testing Guide

This guide will help you test all the admin features of the Kayak Travel Booking System.

---

## ✅ **Current Status**

Admin authentication is **FULLY IMPLEMENTED** and working!

### What's Available:
✅ Admin UI Components (Frontend)
✅ Admin API Endpoints (Backend)
✅ Admin User Authentication (Configured in DB)
✅ Role-based Access Control (Fully implemented)
✅ JWT with isAdmin claim
✅ Authorization middleware

---

## 🎉 **Admin Authentication Ready!**

Admin functionality is fully configured and ready to test!

### Admin Credentials

**Option 1: Admin User (Users Table)**
```
Email: admin@kayak.com
Password: password123
SSN: 999-99-9999
```

**Option 2: Test Admin (Users Table)**
```
Email: testadmin@kayak.com
Password: password123
SSN: 888-88-8888
```

**Option 3: Super Admin (Admin Table)**
```
Email: admin@kayak.com
Password: admin123
Admin ID: ADM001
```

### Quick Test

```bash
# Login as admin
curl -X POST http://localhost:4000/api/users/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@kayak.com","password":"password123"}'

# Response includes:
# "isAdmin": true
# "token": "eyJhbGciOiJI..."
```

### What's Working

✅ **Database**: `is_admin` column exists
✅ **Seed Data**: Admin users created
✅ **Authentication**: JWT includes `isAdmin` claim
✅ **Authorization**: `requireAdmin` middleware working
✅ **Login**: Both regular and admin users work

---

## 🧪 **Option 2: Test Admin APIs Directly (Without UI)**

You can test admin endpoints using curl or Postman without the UI.

### Admin Endpoints Available:

#### 1. **Get All Billings**
```bash
GET http://localhost:4000/api/billing
Authorization: Bearer <admin_token>
```

#### 2. **Get Revenue Analytics**
```bash
GET http://localhost:4000/api/billing/analytics/revenue?startDate=2025-01-01&endDate=2025-12-31
Authorization: Bearer <admin_token>
```

#### 3. **Get City Revenue**
```bash
GET http://localhost:4000/api/billing/analytics/city-revenue?year=2025
Authorization: Bearer <admin_token>
```

#### 4. **Get Top Properties**
```bash
GET http://localhost:4000/api/billing/analytics/top-properties?year=2025&limit=10
Authorization: Bearer <admin_token>
```

#### 5. **Search Billings**
```bash
GET http://localhost:4000/api/billing/search?startDate=2025-01-01&endDate=2025-12-31&status=completed
Authorization: Bearer <admin_token>
```

---

## 📊 **Admin Features Overview**

### **1. Admin Dashboard** (`/admin/dashboard`)

**Features:**
- Revenue statistics
- Booking statistics
- Charts and graphs
- Revenue by city
- Top properties

**Requirements:**
- User must have `role === 'admin'`
- Must be logged in

---

### **2. Admin Billings Page** (`/admin/billings`)

**Features:**
- View all billing records
- Filter by:
  - Date range
  - Booking type (flight/hotel/car)
  - Payment status
  - User ID
- Download invoices
- View payment details

**API Endpoints Used:**
- `GET /api/billing` - Get all billings
- `GET /api/billing/search` - Search with filters
- `GET /api/billing/:id/invoice` - Download invoice

---

### **3. Admin Listings Page** (`/admin/listings`)

**Features:**
- View all flights, hotels, cars
- Add new listings
- Edit existing listings
- Delete listings
- Manage availability

**Status:** ⚠️ Partially implemented (UI exists, backend needs work)

---

## 🚀 **Quick Test without Admin Role**

If you want to test admin functionality **without** setting up admin users:

### 1. **Temporarily Disable Admin Check in Middleware**

**File:** `src/services/common/src/middleware/auth.ts`

Comment out the admin check:
```typescript
export const requireAdmin = (req: Request, res: Response, next: NextFunction) => {
  requireAuth(req, res, () => {
    // Temporarily disabled for testing
    // if (!(req as any).user.isAdmin) {
    //   return res.status(403).json({ error: 'Admin access required' });
    // }
    next();
  });
};
```

### 2. **Update Frontend to Show Admin Links**

**File:** `frontend/src/components/layout/Header.tsx`

Temporarily show admin links for all users:
```typescript
{/* Show admin links for testing */}
{isAuthenticated && (
  <>
    <Link to="/admin/billings">Admin Billings</Link>
  </>
)}
```

### 3. **Restart Services**

```bash
# Restart booking-billing service
cd src/services/booking-billing-service
pkill -f "booking-billing"
npm run dev > /tmp/booking-service.log 2>&1 &

# Restart frontend (if needed)
cd frontend
npm run dev
```

---

## 📝 **Testing Checklist**

### Admin Billing Page Tests:

- [ ] Navigate to `/admin/billings`
- [ ] View list of all billing records
- [ ] Filter by date range
- [ ] Filter by booking type (flight/hotel/car)
- [ ] Filter by payment status
- [ ] Click "View Invoice" button
- [ ] Download invoice PDF
- [ ] Check pagination works
- [ ] Verify total revenue calculation

### Admin Analytics Tests:

- [ ] Get revenue for last 30 days
- [ ] Get revenue by city
- [ ] Get top 10 revenue-generating properties
- [ ] Check revenue breakdown by booking type
- [ ] Verify all charts render correctly

### Admin Dashboard Tests:

- [ ] View total revenue
- [ ] View total bookings
- [ ] See booking breakdown (flights/hotels/cars)
- [ ] View revenue trends chart
- [ ] Check city-wise revenue chart

---

## 🧪 **Sample cURL Commands for Testing**

### 1. Get All Billings (Admin)
```bash
curl -X GET "http://localhost:4000/api/billing" \
  -H "Authorization: Bearer <your_token>" \
  -H "Content-Type: application/json"
```

### 2. Get Revenue Analytics
```bash
curl -X GET "http://localhost:4000/api/billing/analytics/revenue?startDate=2025-01-01&endDate=2025-12-31" \
  -H "Authorization: Bearer <your_token>"
```

### 3. Search Billings
```bash
curl -X GET "http://localhost:4000/api/billing/search?bookingType=car&status=completed" \
  -H "Authorization: Bearer <your_token>"
```

### 4. Get Top Properties
```bash
curl -X GET "http://localhost:4000/api/billing/analytics/top-properties?year=2025&limit=5" \
  -H "Authorization: Bearer <your_token>"
```

---

## 🔐 **Getting Your Auth Token**

After logging in, you can get your token from:

1. **Browser DevTools:**
   - Open DevTools (F12)
   - Go to Application → Local Storage
   - Find `auth_token` key

2. **Or check the Network tab:**
   - Login
   - Check the login response
   - Copy the `token` value

---

## 📊 **Expected Test Data**

Based on your current bookings:

```
Total Billings: Should have at least 1 (your car booking)
Total Revenue: $49 (Ford Fusion for 1 day)
Booking Types: 1 car booking
Payment Status: 1 completed
```

---

## 🐛 **Common Issues & Solutions**

### Issue 1: "Access denied. Admin access required"
**Solution:** You don't have admin role. Follow Option 1 to add admin column.

### Issue 2: "403 Forbidden" on admin endpoints
**Solution:** The `requireAdmin` middleware is blocking you. Either:
- Add admin role to your user (Option 1)
- Temporarily disable the check (Option 2)

### Issue 3: Admin pages show blank/empty
**Solution:** 
- Check browser console for errors
- Verify API endpoints are responding
- Check if user object has `role` field

### Issue 4: Charts not showing
**Solution:**
- Check if recharts library is installed: `cd frontend && npm install recharts`
- Restart frontend dev server

---

## 🎯 **Next Steps**

1. **Choose an option** (Add admin role OR test APIs directly)
2. **Follow the steps** for your chosen option
3. **Test each feature** using the checklist
4. **Report any issues** you find

---

## 📞 **Need Help?**

If you encounter any issues while testing admin functionality:
1. Check the console logs (both frontend and backend)
2. Verify your user token is valid
3. Make sure all services are running
4. Check that the database has proper data

---

**Good luck with admin testing!** 🚀

**Last Updated:** November 28, 2025

