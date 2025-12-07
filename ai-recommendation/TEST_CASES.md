# AI Agent Test Cases - Requirements Compliance

This document outlines test cases to verify the AI agent meets all specified requirements.

## ✅ Test Case 1: Tell me what I should book

**User Input:**
```
"I've got Oct 25–27, SFO to anywhere warm, total budget $1,000 for two."
```

**Expected Outcome:**
- Service proposes 2–3 complete bundles
- Clear, comparable summaries (price, travel time, hotel neighborhood, cancellation terms)
- Short "why this pick works for you" (≤25 words)
- "What to watch" alert (≤12 words)

**Verification:**
- [ ] Returns 2-3 bundles
- [ ] Each bundle has: price, travel time, hotel neighborhood, cancellation terms
- [ ] "Why this" explanation is ≤25 words
- [ ] "What to watch" is ≤12 words

---

## ✅ Test Case 2: Refine without starting over

**User Input (after Test Case 1):**
```
"Make it pet-friendly and avoid red-eye flights."
```

**Expected Outcome:**
- Service preserves earlier context (origin, destination, budget, dates)
- Regenerates options that respect new constraints
- Highlights what changed (e.g., "+ $38, earlier departure, 20-minute longer connection")

**Verification:**
- [ ] Context preserved (SFO, warm destination, $1000 budget, Oct 25-27)
- [ ] New bundles include pet-friendly hotels
- [ ] New bundles exclude red-eye flights
- [ ] Changes highlighted: price difference, departure time, connection changes

---

## ✅ Test Case 3: Keep an eye on it

**User Input:**
```
"Track this Miami package; alert me if it dips below $850 or inventory drops under 5 rooms."
```

**Expected Outcome:**
- Watch created with price threshold ($850) and inventory threshold (5 rooms)
- Watch active and monitoring
- WebSocket notifications sent when conditions are met

**Verification:**
- [ ] Watch created successfully
- [ ] Price threshold: $850
- [ ] Inventory threshold: 5 rooms
- [ ] Watch active status: true
- [ ] WebSocket endpoint receives notifications when thresholds crossed

---

## ✅ Test Case 4: Decide with confidence

**User Input:**
```
"Is the Marriott rate actually good?"
```

**Expected Outcome:**
- Explanation: "This is 19% below its 60-day rolling average for these dates; similar 4 star options nearby are $25–$60 higher per night."

**Verification:**
- [ ] Rate comparison uses 60-day rolling average
- [ ] Explanation includes percentage below average
- [ ] Explanation includes similar alternatives with price differences
- [ ] Format matches specification exactly

---

## ✅ Test Case 5: Book or hand off cleanly

**User Input:**
```
"Get me a quote for this bundle."
```

**Expected Outcome:**
- Complete, validated quote returned
- Includes: fare class, baggage, fees, cancellation
- All fields from available dataset

**Verification:**
- [ ] Quote includes fare class
- [ ] Quote includes baggage information
- [ ] Quote includes fees breakdown
- [ ] Quote includes cancellation terms
- [ ] All data from dataset fields (not hardcoded)

---

## ✅ Test Case 6: Intent understanding (max 1 clarifying question)

**User Input:**
```
"I want to go somewhere warm."
```

**Expected Outcome:**
- At most 1 clarifying question asked
- Not multiple questions at once

**Verification:**
- [ ] Only 1 question asked (e.g., "Where are you departing from?" OR "What's your budget?")
- [ ] Not multiple questions in one response

---

## ✅ Test Case 7: Deal Score Calculation

**Verification:**
- [ ] Deal score is integer (0-100)
- [ ] Calculated based on: ≥15% below 30-day avg, limited inventory, promo end
- [ ] Only deals with score ≥60 are considered "good deals"

---

## ✅ Test Case 8: Offer Tagging

**Verification:**
- [ ] Deals tagged with: Refundable/Nonrefundable, Pet-friendly, Near transit, Breakfast
- [ ] Tags based on existing metadata (no geo/NLP)
- [ ] Tags published to `deals.tagged` Kafka topic

---

## ✅ Test Case 9: Kafka Pipeline

**Verification:**
- [ ] CSV feeds ingested to `raw_supplier_feeds` topic
- [ ] Normalized records in `deals.normalized` topic
- [ ] Scored deals in `deals.scored` topic
- [ ] Tagged offers in `deals.tagged` topic
- [ ] Events in `deal.events` topic

---

## ✅ Test Case 10: WebSocket Updates

**Verification:**
- [ ] WebSocket connection established at `/events/{user_id}`
- [ ] Real-time deal notifications pushed
- [ ] Watch alerts pushed when thresholds met
- [ ] Proactive recommendations pushed

---

## Implementation Checklist

### Deals Agent (Backend Worker)
- [x] Feed Ingestion: Kafka CSV ingestion
- [x] Deal Detector: Rules (≥15% below 30-day avg, limited inventory, promo end)
- [x] Deal Score: Integer (0-100)
- [x] Offer Tagger: Metadata-based tagging (Refundable, Pet-friendly, Near transit, Breakfast)
- [x] Event Emitter: Kafka topics (`deal.events`)

### Concierge Agent (Chat-facing)
- [x] Intent understanding: Max 1 clarifying question
- [x] Trip Planner: Flight+hotel bundles with Fit Score
- [x] Explanations: "Why this" ≤25 words, "What to watch" ≤12 words
- [x] Policy answers: Quote from listing metadata
- [x] Watches: Price/inventory thresholds, WebSocket notifications

### Primary User Journeys
- [x] Tell me what I should book: 2-3 bundles with summaries
- [x] Refine without starting over: Context preservation, change highlighting
- [x] Keep an eye on it: Price/inventory watches with alerts
- [x] Decide with confidence: Rate comparison with 60-day average
- [x] Book or hand off cleanly: Complete validated quote

---

## Running Tests

### Manual Testing
1. Start all services: `make start`
2. Connect to AI service WebSocket: `ws://localhost:8000/events/1`
3. Send chat messages via POST `/chat/message` or WebSocket `/chat/ws/1`
4. Verify responses match expected outcomes

### Automated Testing (Future)
- Unit tests for each agent component
- Integration tests for Kafka pipeline
- E2E tests for user journeys

---

## Notes

- All explanations must be ≤25 words for "Why this"
- All "What to watch" alerts must be ≤12 words
- Max 1 clarifying question per interaction
- Rate comparisons use 60-day rolling average
- Quotes include all required fields from dataset

