import { expect, test } from 'vitest'
import { authService } from '../src/lib/stores/auth'

// Mock Supabase client
const mockSupabase = {
  auth: {
    signUp: vi.fn(),
    signInWithPassword: vi.fn(),
    signOut: vi.fn(),
    getSession: vi.fn(),
    onAuthStateChange: vi.fn()
  },
  from: vi.fn(() => ({
    select: vi.fn(() => ({
      eq: vi.fn(() => ({
        single: vi.fn()
      }))
    }))
  }))
}

vi.mock('../src/lib/config/supabase', () => ({
  supabase: mockSupabase
}))

test('authService.signUp creates new user account', async () => {
  const mockResponse = {
    data: { user: { id: '123', email: 'test@example.com' } },
    error: null
  }
  
  mockSupabase.auth.signUp.mockResolvedValueOnce(mockResponse)

  const result = await authService.signUp('test@example.com', 'password123', 'Test User')
  
  expect(mockSupabase.auth.signUp).toHaveBeenCalledWith({
    email: 'test@example.com',
    password: 'password123',
    options: {
      data: {
        full_name: 'Test User'
      }
    }
  })
  
  expect(result).toEqual(mockResponse.data)
})

test('authService.signIn authenticates existing user', async () => {
  const mockResponse = {
    data: { user: { id: '123', email: 'test@example.com' } },
    error: null
  }
  
  mockSupabase.auth.signInWithPassword.mockResolvedValueOnce(mockResponse)

  const result = await authService.signIn('test@example.com', 'password123')
  
  expect(mockSupabase.auth.signInWithPassword).toHaveBeenCalledWith({
    email: 'test@example.com',
    password: 'password123'
  })
  
  expect(result).toEqual(mockResponse.data)
})

test('authService.signOut ends user session', async () => {
  mockSupabase.auth.signOut.mockResolvedValueOnce({ error: null })

  await authService.signOut()
  
  expect(mockSupabase.auth.signOut).toHaveBeenCalled()
})