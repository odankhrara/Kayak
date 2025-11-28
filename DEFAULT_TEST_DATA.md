# 🧪 DEFAULT TEST DATA FOR KAYAK APPLICATION

> **Universal test credentials and payment data for development/testing**  
> Use this data regardless of your specific seeded flights/hotels/cars

---

## 👤 **TEST USER ACCOUNTS**

### Regular Users (All with password: `password123`)

| Email | Name | Purpose |
|-------|------|---------|
| `john.smith346@example.com` | John Smith | Primary test user |
| `emily.davis801@outlook.com` | Emily Davis | Alternative test user |
| `david.garcia797@example.com` | David Garcia | Alternative test user |
| `james.brown429@example.com` | James Brown | Alternative test user |
| `olivia.smith811@example.com` | Olivia Smith | Alternative test user |

**Note:** The seeding script creates 1,000 users total. All have password: `password123`

### Admin Account

| Email | Password | Role | Access Level |
|-------|----------|------|--------------|
| `admin@kayak.com` | `admin123` | Super Admin | Full Access |

---

## 💳 **TEST CREDIT CARDS**

### ✅ **Recommended Test Cards**

#### **VISA (Most Reliable)**
```
Card Number: 4111111111111111
Expiry Date: 12/27
CVV: 123
```

#### **Mastercard**
```
Card Number: 5555555555554444
Expiry Date: 12/27
CVV: 123
```

---

### Additional Valid Test Cards (All Pass Luhn Algorithm)

#### Visa Cards
| Card Number | Expiry | CVV |
|-------------|--------|-----|
| `4532015112830366` | `12/27` | `123` |
| `4916338506082832` | `12/27` | `456` |
| `4024007198964305` | `01/28` | `789` |

#### Mastercard
| Card Number | Expiry | CVV |
|-------------|--------|-----|
| `5425233430109903` | `12/27` | `456` |
| `5105105105105100` | `01/28` | `789` |

#### American Express (4-digit CVV)
| Card Number | Expiry | CVV |
|-------------|--------|-----|
| `378282246310005` | `12/27` | `1234` |
| `371449635398431` | `12/27` | `5678` |

#### Discover
| Card Number | Expiry | CVV |
|-------------|--------|-----|
| `6011111111111117` | `12/27` | `123` |
| `6011000990139424` | `01/28` | `456` |

---

## 🧪 **QUICK TEST WORKFLOW**

### Step 1: Login
```
Email: john.smith346@example.com
Password: password123
```

### Step 2: Search & Book
- Search for any available flights/hotels/cars in your database
- Proceed to booking checkout

### Step 3: Payment
```
Card Number: 4111111111111111
Expiry: 12/27
CVV: 123
```

### Step 4: Verify
- Check booking confirmation page
- Verify booking appears in "My Bookings"
- (Admin) Check booking in admin dashboard

---

## 🔐 **SECURITY NOTES**

⚠️ **IMPORTANT:**
- All test data is for **DEVELOPMENT/TESTING ONLY**
- Do NOT use these credentials in production
- All passwords are intentionally simple for testing
- Credit card numbers are standard test cards (not real accounts)
- Change all passwords before deploying to production

---

## 🛠️ **TROUBLESHOOTING**

### If Login Fails:
- ✅ Check if User Service is running on port **8001**
- ✅ Verify password is exactly: `password123` (lowercase)
- ✅ Ensure database has been seeded

### If Payment Fails:
- ✅ Check if Booking-Billing Service is running on port **8003**
- ✅ Use card number: `4111111111111111` (most reliable)
- ✅ Ensure expiry date is in the future: `12/27`
- ✅ Check API Gateway is running on port **4000**

### If Search Returns No Results:
- ✅ Verify your database has been seeded with listings
- ✅ Check Listing Service is running on port **8002**
- ✅ Try different search criteria (dates, locations)

---

## 📋 **NOTES FOR TEAM MEMBERS**

- **Seeded Data Varies:** Flight routes, hotel cities, and car locations will differ based on your seed script
- **Universal Credentials:** User accounts and credit cards are the same for everyone
- **Query Your Database:** Use SQL queries or the search UI to find available listings in your specific instance

---

## 📞 **ADDITIONAL RESOURCES**

- **Service Ports:** See `PORT_DETAILS.md`
- **Setup Guide:** See `ENVIRONMENT_SETUP.md`
- **Service Logs:** Check `/tmp/` directory for service logs

---

**Last Updated:** November 28, 2025  
**Version:** 1.0  
**Environment:** Development/Testing Only

