import mysqlPool from '@kayak/common/src/db/mysqlPool'
import { User, Admin } from '../models/User'

export class UserRepository {
  async create(user: Omit<User, 'userId' | 'createdAt' | 'updatedAt'>): Promise<User> {
    const [result] = await mysqlPool.execute(
      `INSERT INTO users (ssn, name, address, city, state, zip, phone, email, hashed_password, profile_image)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [user.ssn, user.name, user.address, user.city, user.state, user.zip, user.phone, user.email, user.hashedPassword, user.profileImage || null]
    )
    const insertId = (result as any).insertId
    return this.getById(insertId.toString())
  }

  async getById(userId: string): Promise<User | null> {
    const [rows] = await mysqlPool.execute(
      'SELECT * FROM users WHERE user_id = ?',
      [userId]
    )
    const users = rows as any[]
    if (users.length === 0) return null
    return this.mapRowToUser(users[0])
  }

  async getByEmail(email: string): Promise<User | null> {
    const [rows] = await mysqlPool.execute(
      'SELECT * FROM users WHERE email = ?',
      [email]
    )
    const users = rows as any[]
    if (users.length === 0) return null
    return this.mapRowToUser(users[0])
  }

  async update(userId: string, updates: Partial<User>): Promise<User> {
    const fields: string[] = []
    const values: any[] = []
    
    Object.entries(updates).forEach(([key, value]) => {
      if (key !== 'userId' && value !== undefined) {
        const dbKey = key.replace(/([A-Z])/g, '_$1').toLowerCase()
        fields.push(`${dbKey} = ?`)
        values.push(value)
      }
    })
    
    if (fields.length === 0) {
      return this.getById(userId) as Promise<User>
    }
    
    values.push(userId)
    await mysqlPool.execute(
      `UPDATE users SET ${fields.join(', ')}, updated_at = NOW() WHERE user_id = ?`,
      values
    )
    return this.getById(userId) as Promise<User>
  }

  async delete(userId: string): Promise<void> {
    await mysqlPool.execute('DELETE FROM users WHERE user_id = ?', [userId])
  }

  async getAllUsers(): Promise<User[]> {
    const [rows] = await mysqlPool.execute('SELECT * FROM users')
    return (rows as any[]).map(row => this.mapRowToUser(row))
  }

  async searchUsers(query: string): Promise<User[]> {
    const searchTerm = `%${query}%`
    const [rows] = await mysqlPool.execute(
      `SELECT * FROM users WHERE name LIKE ? OR email LIKE ? OR phone LIKE ?`,
      [searchTerm, searchTerm, searchTerm]
    )
    return (rows as any[]).map(row => this.mapRowToUser(row))
  }

  private mapRowToUser(row: any): User {
    return {
      userId: row.user_id.toString(),
      ssn: row.ssn,
      name: row.name,
      address: row.address,
      city: row.city,
      state: row.state,
      zip: row.zip,
      phone: row.phone,
      email: row.email,
      hashedPassword: row.hashed_password,
      profileImage: row.profile_image,
      createdAt: row.created_at,
      updatedAt: row.updated_at
    }
  }
}

