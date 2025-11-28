# 🔐 Creating Admin Users - Complete Guide

## Overview

Admin users are stored in a **separate `admin` table** and CANNOT be created through the regular signup process. This ensures security and proper access control.

---

## 🎯 Admin Creation Methods

### Method 1: Default Admin (Automatic)

The initial super admin is created automatically during database setup.

**Credentials:**
```
Email: admin@kayak.com
Password: admin123
Role: super_admin
Access Level: 5
```

**How it's created:**
- Runs when MySQL container initializes
- Defined in `src/db/mysql/docker-init.sql`
- Password is bcrypt hashed

---

### Method 2: Manual Database Insert ⭐ **RECOMMENDED**

For creating additional admins manually using SQL:

**Step 1: Connect to MySQL**
```bash
docker exec -it kayak-mysql mysql -u root -p kayak
```

When prompted, enter password: `password`

**Step 2: Insert New Admin (Simple)**
```sql
INSERT INTO admin (admin_id, first_name, last_name, email, password_hash, role, access_level, status)
VALUES ('ADM002', 'Jane', 'Admin', 'jane@kayak.com', 
        '$2a$10$XqKzFsLJkWcYzmCqMh3.q.dCYXCN7JGZ1FzQWx0kvKdWGqAaGqhNS',
        'admin', 3, 'active');
```

**Default password for this hash: `admin123`**

---

**Step 2 (Alternative): Insert Admin with Full Details**
```sql
-- Create a new admin with all fields
INSERT INTO admin (
    admin_id, 
    first_name, 
    last_name, 
    email, 
    password_hash, 
    phone,
    address,
    city,
    state,
    zip_code,
    role, 
    access_level, 
    status
) VALUES (
    'ADM002',                                              -- Unique admin ID
    'Jane',                                                -- First name
    'Admin',                                               -- Last name
    'jane.admin@kayak.com',                               -- Email (unique)
    '$2a$10$XqKzFsLJkWcYzmCqMh3.q.dCYXCN7JGZ1FzQWx0kvKdWGqAaGqhNS',  -- Password: admin123
    '408-555-1234',                                       -- Phone
    '123 Admin St',                                       -- Address
    'San Jose',                                           -- City
    'CA',                                                 -- State
    '95123',                                              -- Zip code
    'admin',                                              -- Role
    3,                                                    -- Access level
    'active'                                              -- Status
);
```

**Step 3: Verify Admin Created**
```sql
SELECT admin_id, first_name, last_name, email, role, access_level 
FROM admin;
```

**Step 4: Exit MySQL**
```sql
EXIT;
```

---

**Quick Copy-Paste Script** (One Command):
```bash
# Connect and create admin in one go
docker exec -it kayak-mysql mysql -u root -ppassword kayak -e "
INSERT INTO admin (admin_id, first_name, last_name, email, password_hash, role, access_level, status)
VALUES ('ADM002', 'Jane', 'Admin', 'jane@kayak.com', 
        '\$2a\$10\$XqKzFsLJkWcYzmCqMh3.q.dCYXCN7JGZ1FzQWx0kvKdWGqAaGqhNS',
        'admin', 3, 'active');
"
```

**Password Hashing:**
```javascript
const bcrypt = require('bcryptjs');
const password = 'yourpassword';
const hash = await bcrypt.hash(password, 10);
console.log(hash);
```

---

### Method 3: Admin Creation Script

Create a helper script to add admins:

**File**: `src/db/create-admin.js`

```javascript
const mysql = require('mysql2/promise');
const bcrypt = require('bcryptjs');
const readline = require('readline');

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

const question = (query) => new Promise((resolve) => rl.question(query, resolve));

async function createAdmin() {
  try {
    // Get admin details from user
    console.log('\n🔐 Create New Admin User\n');
    
    const firstName = await question('First Name: ');
    const lastName = await question('Last Name: ');
    const email = await question('Email: ');
    const password = await question('Password: ');
    const phone = await question('Phone (optional): ');
    const role = await question('Role (super_admin/admin/analyst/support): ');
    const accessLevel = await question('Access Level (1-5): ');

    // Connect to database
    const connection = await mysql.createConnection({
      host: 'localhost',
      port: 3306,
      user: 'root',
      password: 'password',
      database: 'kayak'
    });

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Generate admin ID
    const [rows] = await connection.execute(
      'SELECT admin_id FROM admin ORDER BY admin_id DESC LIMIT 1'
    );
    
    let adminNum = 1;
    if (rows.length > 0) {
      const lastId = rows[0].admin_id;
      adminNum = parseInt(lastId.replace('ADM', '')) + 1;
    }
    const adminId = `ADM${String(adminNum).padStart(3, '0')}`;

    // Insert admin
    await connection.execute(
      `INSERT INTO admin (
        admin_id, first_name, last_name, email, password_hash, 
        phone, role, access_level, status
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'active')`,
      [adminId, firstName, lastName, email, hashedPassword, phone || null, role, accessLevel]
    );

    console.log(`\n✅ Admin created successfully!`);
    console.log(`Admin ID: ${adminId}`);
    console.log(`Email: ${email}`);
    console.log(`Password: ${password}`);
    console.log(`Role: ${role}`);
    console.log(`Access Level: ${accessLevel}\n`);

    await connection.end();
    rl.close();
  } catch (error) {
    console.error('❌ Error creating admin:', error.message);
    rl.close();
    process.exit(1);
  }
}

createAdmin();
```

**Usage:**
```bash
cd src/db
npm install
node create-admin.js
```

---

## 👥 Admin Roles & Access Levels

| Role | Access Level | Permissions |
|------|--------------|-------------|
| **super_admin** | 5 | Full system access, can create other admins |
| **admin** | 3-4 | Manage listings, users, bookings, billing |
| **analyst** | 2 | View reports, analytics, billing records |
| **support** | 1 | View users, bookings, limited modifications |

---

## 🔒 Security Considerations

### Why Separate Tables?

1. **Security Isolation**
   - Admin credentials separate from user credentials
   - Prevents privilege escalation attacks
   - Different authentication flow

2. **Access Control**
   - Admin-specific roles and permissions
   - Fine-grained access levels
   - Audit trail for admin actions

3. **Data Integrity**
   - Admin-specific fields (role, access_level)
   - Cannot accidentally delete admin via user endpoints
   - Clear separation of concerns

### Best Practices

✅ **DO:**
- Use strong passwords for admin accounts
- Limit super_admin roles (only 1-2)
- Regularly audit admin access logs
- Use 2FA for admin accounts (future enhancement)
- Create admins with minimum required access level

❌ **DON'T:**
- Never expose admin creation via public API
- Don't share admin credentials
- Don't use default passwords in production
- Don't give all admins super_admin role

---

## 🔐 Admin vs User Table Comparison

| Feature | `users` Table | `admin` Table |
|---------|---------------|---------------|
| **Creation** | `/register` endpoint | Manual/Script only |
| **Purpose** | Customer accounts | System administration |
| **Can Book** | ✅ Yes | ❌ No (different table) |
| **Admin Access** | ❌ No | ✅ Yes |
| **Role Field** | ❌ No | ✅ Yes |
| **Access Level** | ❌ No | ✅ Yes (1-5) |
| **ID Format** | `XXX-XX-XXXX` (SSN) | `ADM001`, `ADM002` |

---

## 🚀 Quick Reference

### Create New Admin (Copy-Paste Ready)

```bash
# Step 1: Connect to MySQL
docker exec -it kayak-mysql mysql -u root -p kayak
# Password: password

# Step 2: Insert admin (in MySQL shell)
INSERT INTO admin (admin_id, first_name, last_name, email, password_hash, role, access_level, status)
VALUES ('ADM002', 'Jane', 'Admin', 'jane@kayak.com', 
        '$2a$10$XqKzFsLJkWcYzmCqMh3.q.dCYXCN7JGZ1FzQWx0kvKdWGqAaGqhNS',
        'admin', 3, 'active');

# Step 3: Exit
EXIT;
```

**Login Credentials for New Admin:**
- Email: `jane@kayak.com`
- Password: `admin123`

---

### Check Existing Admins

```sql
SELECT admin_id, first_name, last_name, email, role, access_level, status 
FROM admin;
```

### Update Admin Role

```sql
UPDATE admin 
SET role = 'super_admin', access_level = 5 
WHERE email = 'jane.admin@kayak.com';
```

### Deactivate Admin

```sql
UPDATE admin 
SET status = 'inactive' 
WHERE admin_id = 'ADM002';
```

### Change Admin Password

```javascript
// Hash new password
const bcrypt = require('bcryptjs');
const newHash = await bcrypt.hash('newpassword', 10);

// Update in database
UPDATE admin 
SET password_hash = '${newHash}' 
WHERE admin_id = 'ADM002';
```

---

## 📋 Checklist for Creating Admins

- [ ] Determine role and access level needed
- [ ] Generate strong password
- [ ] Hash password using bcrypt
- [ ] Insert into `admin` table (not `users`!)
- [ ] Verify admin can login
- [ ] Test admin permissions
- [ ] Document admin credentials securely
- [ ] Remove default admin password in production

---

## 🐛 Troubleshooting

### "Admin access required" error

**Problem**: User trying to access admin features  
**Solution**: Check they're in `admin` table, not `users` table

### Can't login with admin credentials

**Problem**: Wrong table or incorrect password hash  
**Solution**: Verify email exists in `admin` table with correct hash

### New admin has no permissions

**Problem**: Access level too low  
**Solution**: Set `access_level` to at least 3 for full admin access

---

## 📚 Related

- [Admin Module Guide](./ADMIN_MODULE_GUIDE.md)
- [Database Schema](./DATABASE_SCHEMA.md)
- [Security Best Practices](./SECURITY.md)

---

**Remember**: Admin users are created outside the normal signup flow for security!

