#!/usr/bin/env node

/**
 * Admin User Creation Script
 * 
 * Creates new admin users in the admin table (NOT users table)
 * Requires MySQL connection to kayak database
 * 
 * Usage: node create-admin.js
 */

const mysql = require('mysql2/promise');
const bcrypt = require('bcryptjs');
const readline = require('readline');

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

const question = (query) => new Promise((resolve) => rl.question(query, resolve));

// Database configuration
const DB_CONFIG = {
  host: process.env.MYSQL_HOST || 'localhost',
  port: parseInt(process.env.MYSQL_PORT || '3306'),
  user: process.env.MYSQL_USER || 'root',
  password: process.env.MYSQL_PASSWORD || 'password',
  database: process.env.MYSQL_DATABASE || 'kayak'
};

async function createAdmin() {
  let connection;

  try {
    console.log('\n🔐 CREATE NEW ADMIN USER');
    console.log('════════════════════════════════════════\n');
    console.log('ℹ️  Admin users are stored separately from regular users');
    console.log('ℹ️  They cannot book flights/hotels/cars');
    console.log('ℹ️  They can only access admin features\n');

    // Get admin details
    const firstName = await question('First Name: ');
    const lastName = await question('Last Name: ');
    const email = await question('Email: ');
    const password = await question('Password: ');
    const phone = await question('Phone (optional, press Enter to skip): ');
    
    console.log('\nRoles:');
    console.log('  1. super_admin - Full access, can create other admins');
    console.log('  2. admin       - Manage listings, users, bookings, billing');
    console.log('  3. analyst     - View reports and analytics only');
    console.log('  4. support     - View users and bookings, limited edits');
    
    const roleChoice = await question('\nSelect role (1-4): ');
    const roleMap = {
      '1': 'super_admin',
      '2': 'admin',
      '3': 'analyst',
      '4': 'support'
    };
    const role = roleMap[roleChoice] || 'admin';

    console.log('\nAccess Levels:');
    console.log('  5 - Full access (super_admin)');
    console.log('  3-4 - Standard admin access');
    console.log('  2 - Read-only analyst');
    console.log('  1 - Basic support');

    const accessLevel = await question('\nAccess Level (1-5): ');

    // Validation
    if (!firstName || !lastName || !email || !password) {
      throw new Error('First name, last name, email, and password are required');
    }

    if (!email.includes('@')) {
      throw new Error('Invalid email format');
    }

    if (password.length < 6) {
      throw new Error('Password must be at least 6 characters');
    }

    const accessLevelNum = parseInt(accessLevel);
    if (isNaN(accessLevelNum) || accessLevelNum < 1 || accessLevelNum > 5) {
      throw new Error('Access level must be between 1 and 5');
    }

    console.log('\n⏳ Connecting to database...');
    
    // Connect to database
    connection = await mysql.createConnection(DB_CONFIG);
    console.log('✅ Connected to database');

    // Check if email already exists
    const [existingAdmins] = await connection.execute(
      'SELECT email FROM admin WHERE email = ?',
      [email]
    );

    if (existingAdmins.length > 0) {
      throw new Error(`Admin with email ${email} already exists`);
    }

    // Hash password
    console.log('🔒 Hashing password...');
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
    console.log('💾 Creating admin user...');
    await connection.execute(
      `INSERT INTO admin (
        admin_id, 
        first_name, 
        last_name, 
        email, 
        password_hash, 
        phone, 
        role, 
        access_level, 
        status,
        created_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'active', NOW())`,
      [
        adminId, 
        firstName, 
        lastName, 
        email, 
        hashedPassword, 
        phone || null, 
        role, 
        accessLevelNum
      ]
    );

    console.log('\n✅ Admin created successfully!');
    console.log('════════════════════════════════════════');
    console.log(`Admin ID:      ${adminId}`);
    console.log(`Name:          ${firstName} ${lastName}`);
    console.log(`Email:         ${email}`);
    console.log(`Password:      ${password}`);
    console.log(`Role:          ${role}`);
    console.log(`Access Level:  ${accessLevelNum}`);
    console.log('════════════════════════════════════════\n');
    console.log('⚠️  IMPORTANT: Save these credentials securely!');
    console.log('⚠️  The password cannot be retrieved later.\n');
    console.log(`🌐 Login at: http://localhost:3000/login\n`);

  } catch (error) {
    console.error('\n❌ Error creating admin:', error.message);
    console.error('\nTroubleshooting:');
    console.error('  • Make sure MySQL is running (docker-compose up -d)');
    console.error('  • Verify database credentials in DB_CONFIG');
    console.error('  • Check that the email is not already in use\n');
    process.exit(1);
  } finally {
    if (connection) {
      await connection.end();
    }
    rl.close();
  }
}

// Run the script
console.log('\n📋 TravelVerse - Admin User Creation Script\n');
createAdmin().catch(error => {
  console.error('Fatal error:', error);
  process.exit(1);
});

