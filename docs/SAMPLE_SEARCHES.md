# 🔍 Sample Searches - Working Dataset Guide

This guide shows **actual search values** that will return results based on your seeded database.

---

## ✈️ **Flight Searches**

### Most Common Routes (Many Results)

**Popular Airports:**
- SFO (San Francisco)
- LAX (Los Angeles)
- JFK (New York)
- ORD (Chicago)
- DFW (Dallas)
- ATL (Atlanta)
- DEN (Denver)
- MIA (Miami)
- PHX (Phoenix)
- SEA (Seattle)
- LAS (Las Vegas)
- BOS (Boston)
- MCO (Orlando)
- EWR (Newark)
- MSP (Minneapolis)

### ✅ **Suggested Flight Searches:**

```
1. SFO → JFK  (San Francisco to New York)
   Date: Any future date
   Expected: Multiple flights

2. LAX → MIA  (Los Angeles to Miami)
   Date: Any future date
   Expected: Multiple flights

3. ORD → DFW  (Chicago to Dallas)
   Date: Any future date
   Expected: Multiple flights

4. DEN → SEA  (Denver to Seattle)
   Date: Any future date
   Expected: Multiple flights

5. JFK → LAX  (New York to Los Angeles)
   Date: Any future date
   Expected: Multiple flights
```

**Classes Available:**
- Economy (most common)
- Business
- First Class

---

## 🏨 **Hotel Searches**

### Cities with Hotels (200 hotels total)

#### **California**
- San Jose (multiple hotels)
- San Francisco (multiple hotels)
- Los Angeles (multiple hotels)
- San Diego (multiple hotels)
- Sacramento (multiple hotels)

#### **New York**
- New York (multiple hotels)
- Buffalo
- Rochester
- Albany
- Syracuse

#### **Texas**
- Houston (multiple hotels)
- Dallas (multiple hotels)
- Austin (multiple hotels)
- San Antonio (multiple hotels)
- Fort Worth (multiple hotels)

#### **Florida**
- Miami (multiple hotels)
- Orlando (multiple hotels)
- Tampa (multiple hotels)
- Jacksonville (multiple hotels)
- Tallahassee

#### **Illinois**
- Chicago (multiple hotels)
- Aurora
- Naperville
- Joliet
- Rockford

### ✅ **Suggested Hotel Searches:**

```
1. City: San Francisco, CA
   State: California
   Check-in: Any future date
   Check-out: 1-7 days later
   Expected: Multiple hotels (3-5 stars)

2. City: Miami, FL  
   State: Florida
   Check-in: Any future date
   Check-out: 1-7 days later
   Expected: Multiple hotels

3. City: New York, NY
   State: New York
   Check-in: Any future date
   Check-out: 1-7 days later
   Expected: Multiple hotels

4. City: Chicago, IL
   State: Illinois
   Check-in: Any future date
   Check-out: 1-7 days later
   Expected: Multiple hotels

5. City: Los Angeles, CA
   State: California
   Check-in: Any future date
   Check-out: 1-7 days later
   Expected: Multiple hotels
```

---

## 🚗 **Car Rentals**

### Locations with Cars (200 cars total)

#### **🏆 Top Locations (Most Cars):**

1. **Syracuse, NY** - 9 cars ⭐
2. **Tampa, FL** - 5 cars
3. **Dallas, TX** - 4 cars
4. **Miami, FL** - 4 cars
5. **San Antonio, TX** - 4 cars

#### **California**
- Los Angeles
- San Diego
- San Francisco
- San Jose

#### **Florida**
- Miami (4 cars)
- Orlando (1 car)
- Tampa (5 cars)
- Tallahassee (3 cars)

#### **Texas**
- Austin (3 cars)
- Dallas (4 cars)
- Fort Worth
- Houston
- San Antonio (4 cars)

#### **New York**
- Albany (2 cars)
- New York (2 cars)
- Rochester (3 cars)
- Syracuse (9 cars) ⭐ **BEST OPTION!**

#### **Illinois**
- Naperville (2 cars)
- Rockford (3 cars)

### ✅ **Suggested Car Searches:**

```
1. Location: Syracuse, NY  ⭐ BEST
   Pickup: 2025-11-29
   Return: 2025-11-30
   Expected: 9 cars

2. Location: Tampa, FL
   Pickup: 2025-11-29
   Return: 2025-11-30
   Expected: 5 cars

3. Location: Miami, FL
   Pickup: 2025-11-29
   Return: 2025-11-30
   Expected: 4 cars

4. Location: Dallas, TX
   Pickup: 2025-11-29
   Return: 2025-11-30
   Expected: 4 cars

5. Location: San Francisco, CA
   Pickup: 2025-11-29
   Return: 2025-11-30
   Expected: 2 cars
```

**Car Types Available:**
- Compact (Honda Civic, Toyota Corolla, etc.)
- Sedan (Toyota Camry, Honda Accord, etc.)
- SUV (Toyota RAV4, Honda CR-V, etc.)
- Luxury (BMW 5 Series, Mercedes E-Class, etc.)

**Rental Companies:**
- Enterprise
- Hertz
- Budget
- Avis
- National
- Alamo
- Dollar
- Thrifty

---

## ⚠️ **Locations WITHOUT Data**

### Won't Work (No Results):
- ❌ Las Vegas (LAS) - **No cars** (only flights)
- ❌ Portland
- ❌ Seattle (flights only, no cars in dataset)
- ❌ Boston (flights only, no cars in dataset)

---

## 💡 **Pro Tips**

### For Flights:
- Use **3-letter airport codes** (SFO, LAX, JFK)
- Any date in the future works
- Try different classes: economy, business, first
- Filter by airline if needed

### For Hotels:
- Use **full city names** (San Francisco, not SF)
- Include **state** for better results
- Try 1-7 day stays
- Filter by star rating (3-5 stars available)

### For Cars:
- Use **city, STATE format** (e.g., "Syracuse, NY")
- **Syracuse, NY has the most cars** (9 total)
- Shorter rentals work better (1-7 days)
- All cars are automatic transmission

---

## 🎯 **Quick Test Searches**

### Best Guaranteed Results:

**Flight:**
```
From: SFO
To: JFK
Date: 2025-12-10
Passengers: 1
Class: Economy
```

**Hotel:**
```
City: San Francisco
State: California
Check-in: 2025-12-10
Check-out: 2025-12-12
Guests: 2
Rooms: 1
```

**Car:**
```
Location: Syracuse, NY  ⭐
Pickup: 2025-11-29
Return: 2025-11-30
```

---

## 📊 **Dataset Summary**

| Type | Total Count | Key Info |
|------|-------------|----------|
| **Flights** | 500+ | 15 airports, 7 airlines |
| **Hotels** | 200+ | 5 states, ~34 cities |
| **Cars** | 200+ | ~34 locations, 8 companies |
| **Users** | 1000+ | For testing bookings |

---

## 🐛 **If You See No Results:**

1. ✅ Check **backend services are running**
   ```bash
   lsof -ti:4000,8001,8002,8003,8004
   ```
   Should show 5 processes

2. ✅ Use **exact location names** from this guide

3. ✅ Check **browser console** for API errors (F12)

4. ✅ Try a **known-good search** from this guide

---

## 🔧 **Backend Service Status**

Run this to check if services are running:

```bash
cd /Users/pankakumar/Desktop/MyWorkspace/personal/arpana/Project_KayakSimulation/Kayak
./src/start-all.sh
```

**Required Ports:**
- 3000 - Frontend ✅ (Running)
- 4000 - API Gateway (Routes all requests)
- 8001 - User Service
- 8002 - Listing Service (Needed for cars/flights/hotels)
- 8003 - Booking/Billing Service
- 8004 - Analytics Service

---

**Use this guide to test your application with searches that are guaranteed to work!** 🎯

---

**Last Updated:** November 28, 2025

