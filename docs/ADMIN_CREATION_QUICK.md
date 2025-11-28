# 🔐 Quick Admin Creation Guide

## Default Admin (Already Exists)

```
Email: admin@kayak.com
Password: admin123
```

Login at: `http://localhost:3000/login`

---

## Create Additional Admin

### Copy-Paste Commands:

**Step 1: Connect to MySQL**
```bash
docker exec -it kayak-mysql mysql -u root -p kayak
```
*Password:* `password`

**Step 2: Insert New Admin**
```sql
INSERT INTO admin (admin_id, first_name, last_name, email, password_hash, role, access_level, status)
VALUES ('ADM002', 'Jane', 'Admin', 'jane@kayak.com', 
        '$2a$10$XqKzFsLJkWcYzmCqMh3.q.dCYXCN7JGZ1FzQWx0kvKdWGqAaGqhNS',
        'admin', 3, 'active');
```

**Step 3: Verify**
```sql
SELECT admin_id, email, role, access_level FROM admin;
```

**Step 4: Exit**
```sql
EXIT;
```

---

## New Admin Credentials

- **Email:** `jane@kayak.com`
- **Password:** `admin123`
- **Role:** `admin`
- **Access Level:** `3`

---

## Create More Admins

Just change these values:
- `admin_id`: ADM003, ADM004, etc.
- `first_name`: New first name
- `last_name`: New last name
- `email`: New unique email
- `password_hash`: Keep same for `admin123`, or generate new hash
- `role`: super_admin, admin, analyst, or support
- `access_level`: 1-5

---

## Admin Roles

| Role | Access Level | Description |
|------|--------------|-------------|
| super_admin | 5 | Full access to everything |
| admin | 3-4 | Manage listings, users, bookings, billing |
| analyst | 2 | View reports and analytics only |
| support | 1 | View users and bookings, limited edits |

---

## Generate New Password Hash

If you want a different password:

```javascript
// Run in Node.js
const bcrypt = require('bcryptjs');
const hash = bcrypt.hashSync('YourNewPassword', 10);
console.log(hash);
```

Or use online bcrypt generator (search "bcrypt generator online")

---

## One-Line Command (Alternative)

```bash
docker exec -it kayak-mysql mysql -u root -ppassword kayak -e "INSERT INTO admin (admin_id, first_name, last_name, email, password_hash, role, access_level, status) VALUES ('ADM002', 'Jane', 'Admin', 'jane@kayak.com', '\$2a\$10\$XqKzFsLJkWcYzmCqMh3.q.dCYXCN7JGZ1FzQWx0kvKdWGqAaGqhNS', 'admin', 3, 'active');"
```

---

## Troubleshooting

**Error: "Duplicate entry for key 'PRIMARY'"**
- Change `admin_id` to ADM003, ADM004, etc.

**Error: "Duplicate entry for key 'email'"**
- Use a different email address

**Error: "Access denied"**
- Make sure MySQL is running: `docker ps | grep kayak-mysql`
- Check password is correct: `password`

---

**For complete documentation, see:** [CREATE_ADMIN_GUIDE.md](./CREATE_ADMIN_GUIDE.md)

