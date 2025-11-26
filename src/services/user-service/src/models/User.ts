export interface User {
  userId: string
  ssn: string
  name: string
  address: string
  city: string
  state: string
  zip: string
  phone: string
  email: string
  hashedPassword: string
  profileImage?: string
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

