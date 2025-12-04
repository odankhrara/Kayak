import bcrypt from 'bcryptjs'
import jwt from 'jsonwebtoken'
import { UserRepository } from '../repositories/userRepository'
import { User } from '../models/User'

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key'

export class UserService {
  private userRepository = new UserRepository()

  /**
   * Validate SSN format (XXX-XX-XXXX)
   */
  private validateSSN(ssn: string): void {
    const ssnRegex = /^\d{3}-\d{2}-\d{4}$/
    if (!ssnRegex.test(ssn)) {
      throw new Error('Invalid SSN format. Must be XXX-XX-XXXX (e.g., 123-45-6789)')
    }
  }

  /**
   * Validate US state abbreviation
   */
  private validateState(state: string): void {
    const validStates = [
      'AL', 'AK', 'AZ', 'AR', 'CA', 'CO', 'CT', 'DE', 'FL', 'GA',
      'HI', 'ID', 'IL', 'IN', 'IA', 'KS', 'KY', 'LA', 'ME', 'MD',
      'MA', 'MI', 'MN', 'MS', 'MO', 'MT', 'NE', 'NV', 'NH', 'NJ',
      'NM', 'NY', 'NC', 'ND', 'OH', 'OK', 'OR', 'PA', 'RI', 'SC',
      'SD', 'TN', 'TX', 'UT', 'VT', 'VA', 'WA', 'WV', 'WI', 'WY'
    ]
    
    if (!validStates.includes(state.toUpperCase())) {
      throw new Error(`Invalid state abbreviation: ${state}. Must be a valid US state code (e.g., CA, NY, TX)`)
    }
  }

  /**
   * Validate ZIP code format (##### or #####-####)
   */
  private validateZipCode(zipCode: string): void {
    const zipRegex = /^\d{5}(-\d{4})?$/
    if (!zipRegex.test(zipCode)) {
      throw new Error('Invalid ZIP code format. Must be ##### or #####-#### (e.g., 95123 or 95123-4567)')
    }
  }

  /**
   * Validate email format
   */
  private validateEmail(email: string): void {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(email)) {
      throw new Error('Invalid email format')
    }
  }

  /**
   * Validate password strength
   */
  private validatePassword(password: string): void {
    if (password.length < 8) {
      throw new Error('Password must be at least 8 characters long')
    }
  }

  /**
   * Validate phone number format (US)
   * Accepts: XXX-XXX-XXXX, (XXX) XXX-XXXX, XXX.XXX.XXXX, or 10 digits
   */
  private validatePhone(phone: string): void {
    if (!phone || phone.trim() === '') {
      return // Phone is optional
    }
    
    // Remove all non-digit characters
    const digitsOnly = phone.replace(/\D/g, '')
    
    // Check if it's exactly 10 digits
    if (digitsOnly.length !== 10) {
      throw new Error('Invalid phone number. Must be 10 digits (e.g., 555-123-4567 or 5551234567)')
    }
    
    // Check if it's all numeric after removing formatting
    if (!/^\d{10}$/.test(digitsOnly)) {
      throw new Error('Phone number must contain only numbers')
    }
  }

  /**
   * Validate city-state combination
   */
  private validateCityState(city: string, state: string): void {
    if (!city || !state) {
      return // Skip if either is missing
    }

    // Map of major US cities to their states
    const cityStateMap: { [key: string]: string } = {
      'San Francisco': 'CA', 'Los Angeles': 'CA', 'San Diego': 'CA', 'San Jose': 'CA',
      'Sacramento': 'CA', 'Oakland': 'CA', 'Fresno': 'CA',
      'New York': 'NY', 'Buffalo': 'NY', 'Rochester': 'NY', 'Albany': 'NY', 'Syracuse': 'NY',
      'Houston': 'TX', 'Dallas': 'TX', 'Austin': 'TX', 'San Antonio': 'TX', 'Fort Worth': 'TX', 'El Paso': 'TX',
      'Miami': 'FL', 'Tampa': 'FL', 'Orlando': 'FL', 'Jacksonville': 'FL', 'Tallahassee': 'FL',
      'Chicago': 'IL', 'Springfield': 'IL', 'Naperville': 'IL',
      'Philadelphia': 'PA', 'Pittsburgh': 'PA', 'Harrisburg': 'PA',
      'Phoenix': 'AZ', 'Tucson': 'AZ', 'Mesa': 'AZ',
      'Seattle': 'WA', 'Spokane': 'WA', 'Tacoma': 'WA',
      'Boston': 'MA', 'Cambridge': 'MA', 'Worcester': 'MA',
      'Denver': 'CO', 'Colorado Springs': 'CO', 'Aurora': 'CO',
      'Detroit': 'MI', 'Grand Rapids': 'MI', 'Lansing': 'MI',
      'Atlanta': 'GA', 'Savannah': 'GA', 'Augusta': 'GA',
      'Las Vegas': 'NV', 'Reno': 'NV', 'Henderson': 'NV',
      'Portland': 'OR', 'Eugene': 'OR', 'Salem': 'OR',
      'Birmingham': 'AL', 'Montgomery': 'AL', 'Mobile': 'AL', 'Huntsville': 'AL'
    }

    const expectedState = cityStateMap[city]
    
    // If city is in our map, validate the state matches
    if (expectedState && expectedState !== state.toUpperCase()) {
      throw new Error(`${city} is located in ${expectedState}, not ${state}. Please correct the state.`)
    }
  }

  /**
   * Register a new user
   */
  async register(userData: {
    userId: string; // SSN
    firstName: string;
    lastName: string;
    email: string;
    password: string;
    phone?: string;
    address?: string;
    city?: string;
    state?: string;
    zipCode?: string;
  }): Promise<{ user: any; token: string }> {
    try {
      // Validate all fields
      this.validateSSN(userData.userId)
      this.validateEmail(userData.email)
      this.validatePassword(userData.password)
      
      if (userData.phone) {
        this.validatePhone(userData.phone)
      }
      if (userData.state) {
        this.validateState(userData.state)
      }
      if (userData.zipCode) {
        this.validateZipCode(userData.zipCode)
      }
      if (userData.city && userData.state) {
        this.validateCityState(userData.city, userData.state)
      }

      // Hash password
      const hashedPassword = await bcrypt.hash(userData.password, 10)

      // Create user via repository (repository will check for duplicates)
      const user = await this.userRepository.create({
        user_id: userData.userId,
        first_name: userData.firstName,
        last_name: userData.lastName,
        email: userData.email,
        hashedPassword,
        phone: userData.phone,
        address: userData.address,
        city: userData.city,
        state: userData.state,
        zip_code: userData.zipCode
      })

      // Generate JWT token
      const token = jwt.sign(
        { 
          userId: user.userId, 
          email: user.email, 
          isAdmin: false 
        },
        JWT_SECRET,
        { expiresIn: '7d' }
      )

      // Remove sensitive data before returning
      const { hashedPassword: _, ...userWithoutPassword } = user

      return { 
        user: userWithoutPassword, 
        token 
      }
    } catch (error: any) {
      // Enhanced error messages
      if (error.message.includes('already exists')) {
        throw new Error('User with this email or SSN already exists')
      }
      throw error
    }
  }

  /**
   * Login user
   */
  async login(email: string, password: string): Promise<{ user: any; token: string }> {
    try {
      // Validate inputs
      if (!email || !password) {
        throw new Error('Email and password are required')
      }

      this.validateEmail(email)

      // Get user by email
      const user = await this.userRepository.getByEmail(email)
      if (!user) {
        throw new Error('Invalid email or password')
      }

      // Check if user is active
      if (user.status !== 'active') {
        throw new Error('Account is inactive or suspended')
      }

      // Verify password
      const isValidPassword = await bcrypt.compare(password, user.hashedPassword)
      if (!isValidPassword) {
        throw new Error('Invalid email or password')
      }

      // Generate JWT token with actual admin status from database
      const token = jwt.sign(
        { 
          userId: user.userId, 
          email: user.email, 
          isAdmin: user.isAdmin || false 
        },
        JWT_SECRET,
        { expiresIn: '7d' }
      )

      // Remove sensitive data
      const { hashedPassword: _, ...userWithoutPassword } = user

      return { 
        user: userWithoutPassword, 
        token 
      }
    } catch (error: any) {
      throw error
    }
  }

  /**
   * Get user by ID
   */
  async getUserById(userId: string): Promise<any> {
    const user = await this.userRepository.getById(userId)
    if (!user) {
      throw new Error('User not found')
    }

    // Remove sensitive data
    const { hashedPassword: _, ...userWithoutPassword } = user
    return userWithoutPassword
  }

  /**
   * Update user profile
   */
  async updateUser(userId: string, updates: {
    firstName?: string;
    lastName?: string;
    email?: string;
    password?: string;
    phone?: string;
    address?: string;
    city?: string;
    state?: string;
    zipCode?: string;
    profileImageId?: string;
  }): Promise<any> {
    try {
      // Check if user exists
      const existingUser = await this.userRepository.getById(userId)
      if (!existingUser) {
        throw new Error('User not found')
      }

      // Validate fields if provided
      if (updates.email) {
        this.validateEmail(updates.email)
      }
      if (updates.phone) {
        this.validatePhone(updates.phone)
      }
      if (updates.state) {
        this.validateState(updates.state)
      }
      if (updates.zipCode) {
        this.validateZipCode(updates.zipCode)
      }
      if (updates.password) {
        this.validatePassword(updates.password)
        // Hash new password
        const hashedPassword = await bcrypt.hash(updates.password, 10)
        updates = { ...updates, password: undefined } as any
        ;(updates as any).hashedPassword = hashedPassword
      }
      
      // Validate city-state combination
      const cityToValidate = updates.city || existingUser.city
      const stateToValidate = updates.state || existingUser.state
      if (cityToValidate && stateToValidate) {
        this.validateCityState(cityToValidate, stateToValidate)
      }

      // Update user
      const updatedUser = await this.userRepository.update(userId, updates as any)

      // Remove sensitive data
      const { hashedPassword: _, ...userWithoutPassword } = updatedUser
      return userWithoutPassword
    } catch (error: any) {
      throw error
    }
  }

  /**
   * Delete user
   */
  async deleteUser(userId: string): Promise<void> {
    const user = await this.userRepository.getById(userId)
    if (!user) {
      throw new Error('User not found')
    }

    await this.userRepository.delete(userId)
  }

  /**
   * Get user's booking history
   */
  async getUserBookings(userId: string, type?: 'past' | 'current' | 'future'): Promise<any[]> {
    const user = await this.userRepository.getById(userId)
    if (!user) {
      throw new Error('User not found')
    }

    return this.userRepository.getUserBookings(userId)
  }

  /**
   * Search users (Admin only)
   */
  async searchUsers(query: string): Promise<any[]> {
    if (!query || query.trim().length === 0) {
      throw new Error('Search query is required')
    }

    const users = await this.userRepository.searchUsers(query)
    
    // Remove sensitive data from all users
    return users.map(user => {
      const { hashedPassword: _, ...userWithoutPassword } = user
      return userWithoutPassword
    })
  }

  /**
   * Get all users (Admin only)
   */
  async getAllUsers(): Promise<any[]> {
    const users = await this.userRepository.getAllUsers()
    
    // Remove sensitive data from all users
    return users.map(user => {
      const { hashedPassword: _, ...userWithoutPassword } = user
      return userWithoutPassword
    })
  }

  /**
   * Verify JWT token
   */
  verifyToken(token: string): any {
    try {
      return jwt.verify(token, JWT_SECRET)
    } catch (error) {
      throw new Error('Invalid or expired token')
    }
  }
}

