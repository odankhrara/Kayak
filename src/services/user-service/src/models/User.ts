export interface User {
  userId: string
  firstName: string
  lastName: string
  email: string
  hashedPassword: string
  phone?: string
  address?: string
  city?: string
  state?: string
  zipCode?: string
  profileImageId?: string
  status: string
  isAdmin: boolean
  createdAt: Date
  updatedAt: Date
}

export interface Admin {
  adminId: string
  userId: string
  role: string
  accessLevel: string
  reportsManaged?: string[]
  createdAt: Date
  updatedAt: Date
}

