import bcrypt from 'bcryptjs'
import jwt from 'jsonwebtoken'
import { UserRepository } from '../repositories/userRepository'
import { User } from '../models/User'

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key'

export class UserService {
  private userRepository = new UserRepository()

  async createUser(userData: Omit<User, 'userId' | 'hashedPassword' | 'createdAt' | 'updatedAt'> & { password: string }): Promise<User> {
    const hashedPassword = await bcrypt.hash(userData.password, 10)
    return this.userRepository.create({
      ...userData,
      hashedPassword
    })
  }

  async login(email: string, password: string): Promise<{ user: User; token: string } | null> {
    const user = await this.userRepository.getByEmail(email)
    if (!user) return null

    const isValid = await bcrypt.compare(password, user.hashedPassword)
    if (!isValid) return null

    const token = jwt.sign(
      { userId: user.userId, email: user.email, isAdmin: false },
      JWT_SECRET,
      { expiresIn: '7d' }
    )

    return { user, token }
  }

  async getUserById(userId: string): Promise<User | null> {
    return this.userRepository.getById(userId)
  }

  async updateUser(userId: string, updates: Partial<User>): Promise<User> {
    if (updates.password) {
      updates.hashedPassword = await bcrypt.hash(updates.password, 10)
      delete (updates as any).password
    }
    return this.userRepository.update(userId, updates)
  }

  async deleteUser(userId: string): Promise<void> {
    return this.userRepository.delete(userId)
  }

  async getAllUsers(): Promise<User[]> {
    return this.userRepository.getAllUsers()
  }

  async searchUsers(query: string): Promise<User[]> {
    return this.userRepository.searchUsers(query)
  }
}

