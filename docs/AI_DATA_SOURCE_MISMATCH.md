# AI Agent Data Source Mismatch Issue

## 🔍 **Problem Identified**

The AI agent cannot fetch the same flight data as the main search because **they use completely different databases**:

### **Main Flight Search (Listing Service)**
- **Database:** MySQL (`kayak` database)
- **Table:** `flights`
- **Service:** `listing-service` (port 8002)
- **Data Source:** Populated by `populate_booking_database.py` or direct MySQL inserts

### **AI Agent Search**
- **Database:** SQLite (`ai_recommendations.db`)
- **Table:** `flightdeal` (SQLModel)
- **Service:** `ai-recommendation` (port 8005)
- **Data Source:** Populated by Kafka pipeline or `populate_deals_direct.py`

---

## ❌ **Why They Don't Match**

1. **Separate Databases:**
   - Listing Service → MySQL
   - AI Service → SQLite
   - **No synchronization between them**

2. **Different Data Models:**
   - MySQL: `flights` table with columns like `flight_id`, `airline`, `origin`, `destination`, `price`, `departure_datetime`
   - SQLite: `flightdeal` table with columns like `id`, `airline`, `origin`, `destination`, `discounted_price`, `departure_time`

3. **Different Population Methods:**
   - Listing Service: Direct MySQL inserts
   - AI Service: Kafka pipeline or CSV imports

4. **Date Parsing Issues:**
   - User query: "12/15/20205" (typo: year 20205)
   - AI might not handle invalid dates correctly
   - Main search: "2025-12-15" (correct format)

---

## ✅ **Solutions (No Code Changes - Suggestions Only)**

### **Option 1: Sync Data Between Databases**
**Impact: High | Effort: Medium**

Create a sync job that:
- Reads from MySQL `flights` table
- Writes to SQLite `flightdeal` table
- Runs periodically (every 5-10 minutes)

**Benefits:**
- AI can access same flights as main search
- Real-time synchronization
- No changes to existing code

**Implementation:**
- Background worker in AI service
- Query MySQL, convert to FlightDeal model, insert to SQLite

---

### **Option 2: Make AI Service Query MySQL Directly**
**Impact: High | Effort: Medium**

Modify AI service to:
- Connect to MySQL database
- Query `flights` table directly
- Convert MySQL results to FlightDeal format

**Benefits:**
- Single source of truth
- Always up-to-date
- No sync needed

**Trade-offs:**
- AI service depends on MySQL
- Need MySQL connection in AI service

---

### **Option 3: Use API Gateway to Route AI Queries**
**Impact: High | Effort: Low**

Modify AI service to:
- Call Listing Service API (`/api/listings/flights/search`)
- Use same data source as main search
- Convert API response to bundles

**Benefits:**
- Reuses existing Listing Service
- No database duplication
- Always consistent

**Implementation:**
```python
# In deal_selector.py or concierge_agent.py
import httpx

async def get_flights_from_listing_service(origin, destination, date):
    async with httpx.AsyncClient() as client:
        response = await client.get(
            "http://localhost:8002/api/listings/flights/search",
            params={
                "origin": origin,
                "destination": destination,
                "departureDate": date
            }
        )
        return response.json()["flights"]
```

---

### **Option 4: Fix Date Parsing**
**Impact: Medium | Effort: Low**

Improve date parsing to:
- Handle typos (e.g., "20205" → "2025")
- Normalize date formats
- Validate dates before querying

**Benefits:**
- Better user experience
- Handles edge cases
- Prevents invalid queries

---

### **Option 5: Populate AI Database from MySQL**
**Impact: High | Effort: Low**

Create a one-time or periodic script:
- Read all flights from MySQL
- Convert to FlightDeal format
- Insert into SQLite

**Benefits:**
- Quick solution
- No code changes to services
- Can run on-demand

**Script Location:**
- `ai-recommendation/scripts/sync_flights_from_mysql.py`

---

## 📊 **Current Data Flow**

```
User Search (Frontend)
    ↓
Listing Service (8002)
    ↓
MySQL Database (flights table)
    ↓
Returns: SpiceJet BOM→DEL $2,281

---

User Chat (Frontend)
    ↓
AI Service (8005)
    ↓
SQLite Database (flightdeal table)
    ↓
Returns: Different flights (or none)
```

---

## 🎯 **Recommended Solution**

### **Best Approach: Option 3 (API Gateway Routing)**

**Why:**
- ✅ Single source of truth (MySQL)
- ✅ No data duplication
- ✅ Always consistent
- ✅ Minimal code changes
- ✅ No sync jobs needed

**Implementation Steps:**
1. Modify `DealSelector.get_best_flight_deals()` to call Listing Service API
2. Convert API response to FlightDeal format
3. Use same data for bundle creation

**Time to Implement:** 2-4 hours

---

## 🔧 **Quick Fix (Temporary)**

### **Populate AI Database from MySQL**

Create a sync script that:
1. Connects to MySQL
2. Reads flights table
3. Converts to FlightDeal
4. Inserts into SQLite

**Run periodically:**
```bash
python ai-recommendation/scripts/sync_flights_from_mysql.py
```

---

## 📝 **Additional Issues**

### **Date Parsing Problem**

User query: `"12/15/20205"` (typo)
- Year "20205" is invalid
- AI should normalize to "2025"
- Or ask for clarification

**Fix:**
- Improve date parsing in `NLUParser`
- Add date validation
- Handle common typos

---

## 🚀 **Implementation Priority**

1. **Immediate:** Create sync script (Option 5)
   - Quick fix to populate AI database
   - Run once or periodically

2. **Short-term:** Use Listing Service API (Option 3)
   - Best long-term solution
   - Single source of truth

3. **Long-term:** Unified data architecture
   - Consider consolidating databases
   - Or implement proper sync mechanism

---

## 📋 **Summary**

**Root Cause:**
- AI service uses SQLite (`ai_recommendations.db`)
- Listing service uses MySQL (`kayak` database)
- **No synchronization between them**

**Quick Fix:**
- Sync flights from MySQL to SQLite
- Run sync script periodically

**Best Solution:**
- Make AI service call Listing Service API
- Use same data source as main search
- Always consistent results

**Additional Fix:**
- Improve date parsing to handle typos
- Normalize "12/15/20205" → "2025-12-15"
