import { Request, Response, NextFunction } from 'express'
import { 
  validateSSN, 
  validateState, 
  validateZipCode, 
  validateEmail, 
  validatePassword,
  validateAirportCode,
  validateCreditCard,
  validateCVV,
  validateCardExpiry,
  assertValid
} from '../utils/validators'

/**
 * Middleware to validate user registration data
 */
export const validateUserRegistration = (req: Request, res: Response, next: NextFunction) => {
  try {
    const { userId, firstName, lastName, email, password, state, zipCode } = req.body

    // Validate required fields
    if (!userId) throw new Error('User ID (SSN) is required')
    if (!firstName) throw new Error('First name is required')
    if (!lastName) throw new Error('Last name is required')
    if (!email) throw new Error('Email is required')
    if (!password) throw new Error('Password is required')

    // Validate formats
    assertValid(validateSSN(userId))
    assertValid(validateEmail(email))
    assertValid(validatePassword(password))

    if (state) {
      assertValid(validateState(state))
    }
    if (zipCode) {
      assertValid(validateZipCode(zipCode))
    }

    next()
  } catch (error: any) {
    res.status(400).json({ error: error.message })
  }
}

/**
 * Middleware to validate login data
 */
export const validateLogin = (req: Request, res: Response, next: NextFunction) => {
  try {
    const { email, password } = req.body

    if (!email) throw new Error('Email is required')
    if (!password) throw new Error('Password is required')

    assertValid(validateEmail(email))

    next()
  } catch (error: any) {
    res.status(400).json({ error: error.message })
  }
}

/**
 * Middleware to validate flight search
 */
export const validateFlightSearch = (req: Request, res: Response, next: NextFunction) => {
  try {
    const { origin, destination } = req.query

    if (!origin) throw new Error('Origin airport is required')
    if (!destination) throw new Error('Destination airport is required')

    assertValid(validateAirportCode(origin as string))
    assertValid(validateAirportCode(destination as string))

    if (origin === destination) {
      throw new Error('Origin and destination must be different')
    }

    next()
  } catch (error: any) {
    res.status(400).json({ error: error.message })
  }
}

/**
 * Middleware to validate hotel search
 */
export const validateHotelSearch = (req: Request, res: Response, next: NextFunction) => {
  try {
    const { city, state } = req.query

    if (!city && !state) {
      throw new Error('City or state is required for hotel search')
    }

    if (state) {
      assertValid(validateState(state as string))
    }

    next()
  } catch (error: any) {
    res.status(400).json({ error: error.message })
  }
}

/**
 * Middleware to validate car search
 */
export const validateCarSearch = (req: Request, res: Response, next: NextFunction) => {
  try {
    const { location } = req.query

    if (!location) {
      throw new Error('Location is required for car search')
    }

    next()
  } catch (error: any) {
    res.status(400).json({ error: error.message })
  }
}

/**
 * Middleware to validate booking creation
 */
export const validateBookingCreation = (req: Request, res: Response, next: NextFunction) => {
  try {
    const { 
      bookingType, 
      entityId, 
      quantity, 
      checkInDate, 
      checkOutDate, 
      totalAmount, 
      paymentMethod, 
      paymentDetails 
    } = req.body

    // Required fields
    if (!bookingType) throw new Error('Booking type is required')
    if (!entityId) throw new Error('Entity ID is required')
    if (!quantity) throw new Error('Quantity is required')
    if (!checkInDate) throw new Error('Check-in date is required')
    if (!checkOutDate) throw new Error('Check-out date is required')
    if (!totalAmount) throw new Error('Total amount is required')
    if (!paymentMethod) throw new Error('Payment method is required')
    if (!paymentDetails) throw new Error('Payment details are required')

    // Validate booking type
    const validTypes = ['flight', 'hotel', 'car']
    if (!validTypes.includes(bookingType)) {
      throw new Error(`Invalid booking type. Must be one of: ${validTypes.join(', ')}`)
    }

    // Validate quantity
    if (quantity < 1) {
      throw new Error('Quantity must be at least 1')
    }

    // Validate amount
    if (totalAmount <= 0) {
      throw new Error('Total amount must be greater than 0')
    }

    // Validate payment method
    const validPaymentMethods = ['credit_card', 'debit_card', 'paypal']
    if (!validPaymentMethods.includes(paymentMethod)) {
      throw new Error(`Invalid payment method. Must be one of: ${validPaymentMethods.join(', ')}`)
    }

    // Validate payment details based on method
    if (paymentMethod === 'credit_card' || paymentMethod === 'debit_card') {
      const { cardNumber, cvv, expiryDate } = paymentDetails
      
      if (!cardNumber) throw new Error('Card number is required')
      if (!cvv) throw new Error('CVV is required')
      if (!expiryDate) throw new Error('Expiry date is required')

      assertValid(validateCreditCard(cardNumber))
      assertValid(validateCVV(cvv))
      assertValid(validateCardExpiry(expiryDate))
    } else if (paymentMethod === 'paypal') {
      if (!paymentDetails.paypalEmail) {
        throw new Error('PayPal email is required')
      }
      assertValid(validateEmail(paymentDetails.paypalEmail))
    }

    next()
  } catch (error: any) {
    res.status(400).json({ error: error.message })
  }
}

/**
 * Middleware to validate ID parameter
 */
export const validateIdParam = (paramName: string = 'id') => {
  return (req: Request, res: Response, next: NextFunction) => {
    try {
      const id = req.params[paramName]
      
      if (!id || id.trim().length === 0) {
        throw new Error(`${paramName} is required`)
      }

      next()
    } catch (error: any) {
      res.status(400).json({ error: error.message })
    }
  }
}

/**
 * Middleware to validate pagination parameters
 */
export const validatePagination = (req: Request, res: Response, next: NextFunction) => {
  try {
    const { page, limit } = req.query

    if (page) {
      const pageNum = parseInt(page as string)
      if (isNaN(pageNum) || pageNum < 1) {
        throw new Error('Page must be a positive integer')
      }
    }

    if (limit) {
      const limitNum = parseInt(limit as string)
      if (isNaN(limitNum) || limitNum < 1 || limitNum > 1000) {
        throw new Error('Limit must be between 1 and 1000')
      }
    }

    next()
  } catch (error: any) {
    res.status(400).json({ error: error.message })
  }
}

/**
 * Middleware to sanitize request body
 */
export const sanitizeBody = (req: Request, res: Response, next: NextFunction) => {
  if (req.body && typeof req.body === 'object') {
    const sanitize = (obj: any): any => {
      if (typeof obj === 'string') {
        return obj.trim()
      }
      if (Array.isArray(obj)) {
        return obj.map(sanitize)
      }
      if (typeof obj === 'object' && obj !== null) {
        const sanitized: any = {}
        for (const key in obj) {
          sanitized[key] = sanitize(obj[key])
        }
        return sanitized
      }
      return obj
    }

    req.body = sanitize(req.body)
  }
  next()
}

/**
 * Generic validation middleware factory
 */
export const validate = (schema: (data: any) => { valid: boolean; error?: string }) => {
  return (req: Request, res: Response, next: NextFunction) => {
    try {
      const result = schema(req.body)
      if (!result.valid) {
        throw new Error(result.error)
      }
      next()
    } catch (error: any) {
      res.status(400).json({ error: error.message })
    }
  }
}

