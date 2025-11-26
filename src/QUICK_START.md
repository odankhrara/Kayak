# 🚀 Quick Start - Database Setup

## ⚡ 3-Minute Setup

```bash
# 1. Make script executable
chmod +x setup-database.sh

# 2. Run setup (will take ~2 minutes)
./setup-database.sh

# 3. Start services
./start-all.sh

# 4. Open browser
# http://localhost:3000 (Frontend)
# http://localhost:4000 (API Gateway)
```

---

## ✅ What You Just Got

- **1000 users** - Ready to login (password: `password123`)
- **500 flights** - Ready to search and book
- **200 hotels** - With 600 rooms
- **200 cars** - Ready to rent
- **1 admin** - `admin@kayak.com` / `admin123`

---

## 🔧 Common Commands

### View Data
```bash
# MySQL
docker exec -it kayak-mysql mysql -u root -ppassword kayak

# MongoDB  
docker exec -it kayak-mongodb mongosh kayak
```

### Reset Database
```bash
cd infra
docker-compose down -v
cd ..
./setup-database.sh
```

### Check Status
```bash
docker ps                    # All containers
docker-compose logs mysql    # MySQL logs
docker-compose logs mongodb  # MongoDB logs
```

---

## 📚 Full Documentation

- **`db/README.md`** - Complete database guide
- **`PHASE1_COMPLETE.md`** - What was created
- **`DATABASE_SCHEMA.md`** - Schema documentation
- **`ANALYSIS_SUMMARY.md`** - Project status

---

## 🆘 Troubleshooting

**Problem:** Script fails  
**Solution:** Check Docker is running, then try again

**Problem:** Not enough data  
**Solution:** Run `cd db && npm run seed` again (adds more)

**Problem:** Services can't connect  
**Solution:** Wait 60 seconds after setup, then restart services

---

## ✨ Next: Implement Business Logic

Your databases are ready! Now implement:
1. Repository queries (Phase 2)
2. Service business logic
3. Caching with Redis
4. Kafka event processing

**See `PHASE1_COMPLETE.md` for Phase 2 details.**

---

**🎉 You're ready to build!**

