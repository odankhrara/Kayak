import { Router, Request, Response } from 'express'
import { UserService } from '../services/userService'
import { requireAuth, requireAdmin } from '@kayak/common/src/middleware/auth'

const router = Router()
const userService = new UserService()

// Public routes
router.post('/register', async (req: Request, res: Response) => {
  try {
    const user = await userService.createUser(req.body)
    res.status(201).json({ userId: user.userId, email: user.email })
  } catch (error: any) {
    res.status(400).json({ error: error.message })
  }
})

router.post('/login', async (req: Request, res: Response) => {
  try {
    const { email, password } = req.body
    const result = await userService.login(email, password)
    if (!result) {
      return res.status(401).json({ error: 'Invalid email or password' })
    }
    res.json(result)
  } catch (error: any) {
    res.status(500).json({ error: error.message })
  }
})

// Protected routes
router.get('/:id', requireAuth, async (req: Request, res: Response) => {
  try {
    const user = await userService.getUserById(req.params.id)
    if (!user) {
      return res.status(404).json({ error: 'User not found' })
    }
    const { hashedPassword, ...userWithoutPassword } = user
    res.json(userWithoutPassword)
  } catch (error: any) {
    res.status(500).json({ error: error.message })
  }
})

router.put('/:id', requireAuth, async (req: Request, res: Response) => {
  try {
    const updatedUser = await userService.updateUser(req.params.id, req.body)
    const { hashedPassword, ...userWithoutPassword } = updatedUser
    res.json(userWithoutPassword)
  } catch (error: any) {
    res.status(500).json({ error: error.message })
  }
})

// Admin routes
router.get('/', requireAdmin, async (req: Request, res: Response) => {
  try {
    const users = await userService.getAllUsers()
    const usersWithoutPasswords = users.map(({ hashedPassword, ...user }) => user)
    res.json(usersWithoutPasswords)
  } catch (error: any) {
    res.status(500).json({ error: error.message })
  }
})

router.get('/search', requireAdmin, async (req: Request, res: Response) => {
  try {
    const { query } = req.query
    const users = await userService.searchUsers(query as string)
    const usersWithoutPasswords = users.map(({ hashedPassword, ...user }) => user)
    res.json(usersWithoutPasswords)
  } catch (error: any) {
    res.status(500).json({ error: error.message })
  }
})

router.delete('/:id', requireAdmin, async (req: Request, res: Response) => {
  try {
    await userService.deleteUser(req.params.id)
    res.status(204).send()
  } catch (error: any) {
    res.status(500).json({ error: error.message })
  }
})

export default router

