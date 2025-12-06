# Flight Search Test Guide

## ✅ Guaranteed Working Test Cases

Based on the actual database, here are specific search criteria that **will return results**:

### 🎯 **Best Test Cases (High Flight Count)**

#### Test Case 1: Delhi to Mumbai (Most Flights - International)
- **From:** `DEL` (Delhi)
- **To:** `BOM` (Mumbai)
- **Departure Date:** `2025-12-25` (or any date from Dec 25, 2025 onwards)
- **Passengers:** `1`
- **Class:** `economy`
- **Expected:** 91 flights available, prices from $2,281

#### Test Case 2: Philadelphia to Houston
- **From:** `PHL` (Philadelphia)
- **To:** `IAH` (Houston)
- **Departure Date:** `2025-12-26` (or later)
- **Passengers:** `1`
- **Class:** `economy`
- **Expected:** 60 flights available, prices from $343.96

#### Test Case 3: Las Vegas to Miami
- **From:** `LAS` (Las Vegas)
- **To:** `MIA` (Miami)
- **Departure Date:** `2025-12-28` (or later)
- **Passengers:** `1`
- **Class:** `economy`
- **Expected:** 59 flights available, prices from $1,607.86

#### Test Case 4: Orlando to Miami (Cheapest Route)
- **From:** `MCO` (Orlando)
- **To:** `MIA` (Miami)
- **Departure Date:** `2025-12-28` (or later)
- **Passengers:** `1`
- **Class:** `economy`
- **Expected:** 58 flights, prices starting at $297.36

#### Test Case 5: Dallas to Miami
- **From:** `DFW` (Dallas/Fort Worth)
- **To:** `MIA` (Miami)
- **Departure Date:** `2025-12-25` (or later)
- **Passengers:** `1`
- **Class:** `economy`
- **Expected:** 58 flights available, prices from $1,526.09

#### Test Case 6: Boston to Buffalo
- **From:** `BOS` (Boston)
- **To:** `BUF` (Buffalo)
- **Departure Date:** `2026-01-03` (or later)
- **Passengers:** `1`
- **Class:** `economy`
- **Expected:** 58 flights available

### 📅 **Date Range Testing**

**Available Dates:** Flights are available from **December 25, 2025** onwards (6 months ahead).

**Best Test Dates:**
- `2025-12-25` - Christmas Day (flights available)
- `2025-12-26` - Day after Christmas
- `2026-01-01` - New Year's Day
- `2026-01-15` - Mid-January (good availability)
- Any date from Dec 25, 2025 to June 2026

### 💰 **Price Range Testing**

**Economy Class:**
- Min: $204.95
- Max: $2,409.00
- Avg: ~$1,093

**Business Class:**
- Min: $204.95
- Max: $1,996.56
- Avg: ~$1,090

**First Class:**
- Min: $221.09
- Max: $1,946.44
- Avg: ~$1,122

### 🔍 **Quick Test Checklist**

Use these to verify different features:

1. **Basic Search:**
   - From: `BOS` → To: `IAH` → Date: `2025-12-05`
   - ✅ Should return multiple results

2. **Class Filter:**
   - Same route, try: `economy`, `business`, `first`
   - ✅ Should show different prices/options

3. **Date Filter:**
   - Same route, try different dates (Dec 1-10)
   - ✅ Should show flights for selected date

4. **Passenger Count:**
   - Same route, try 1-9 passengers
   - ✅ Should filter by available seats

5. **Popular Routes:**
   - `SEA` → `MIA` (60 flights)
   - `LAX` → `MIA` (60 flights)
   - `DEN` → `DFW` (60 flights)
   - ✅ Should all return results

### ❌ **What Won't Work (No Results)**

- Dates before `2025-11-30`
- Routes that don't exist in database (e.g., `JFK` → `LHR` if not in DB)
- Very specific date/time combinations that don't match

### 🎯 **Recommended First Test**

**Start with this guaranteed working search:**
```
From: DEL (Delhi)
To: BOM (Mumbai)
Date: 2025-12-25 (or any date from Dec 25, 2025 onwards)
Passengers: 1
Class: economy
```

This should return **91 flights** and confirm the search is working!

**Alternative Quick Test (US Domestic):**
```
From: MCO (Orlando)
To: MIA (Miami)
Date: 2025-12-28 (or later)
Passengers: 1
Class: economy
```

This should return **58 flights** with prices from $297!

