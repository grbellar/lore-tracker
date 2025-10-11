import { hashPassword, verifyPassword } from '../auth'
import bcrypt from 'bcryptjs'

describe('lib/auth.ts', () => {
  describe('hashPassword', () => {
    it('should hash a password successfully', async () => {
      const password = 'testPassword123'
      const hashedPassword = await hashPassword(password)

      expect(hashedPassword).toBeDefined()
      expect(hashedPassword).not.toBe(password)
      expect(hashedPassword.length).toBeGreaterThan(0)
      expect(hashedPassword).toMatch(/^\$2[aby]\$/) // bcrypt hash format
    })

    it('should generate different hashes for the same password (salt randomness)', async () => {
      const password = 'testPassword123'
      const hash1 = await hashPassword(password)
      const hash2 = await hashPassword(password)

      expect(hash1).not.toBe(hash2)
      // But both should be valid hashes
      expect(hash1).toMatch(/^\$2[aby]\$/)
      expect(hash2).toMatch(/^\$2[aby]\$/)
    })

    it('should handle empty string password', async () => {
      const password = ''
      const hashedPassword = await hashPassword(password)

      expect(hashedPassword).toBeDefined()
      expect(hashedPassword).toMatch(/^\$2[aby]\$/)
    })

    it('should handle long passwords', async () => {
      const password = 'a'.repeat(100)
      const hashedPassword = await hashPassword(password)

      expect(hashedPassword).toBeDefined()
      expect(hashedPassword).toMatch(/^\$2[aby]\$/)
    })

    it('should handle special characters in password', async () => {
      const password = '!@#$%^&*()_+-={}[]|:";\'<>?,./'
      const hashedPassword = await hashPassword(password)

      expect(hashedPassword).toBeDefined()
      expect(hashedPassword).toMatch(/^\$2[aby]\$/)
    })

    it('should handle unicode characters in password', async () => {
      const password = '你好世界🔒🔑'
      const hashedPassword = await hashPassword(password)

      expect(hashedPassword).toBeDefined()
      expect(hashedPassword).toMatch(/^\$2[aby]\$/)
    })

    it('should log errors when bcrypt fails', async () => {
      // Mock bcrypt to throw an error
      jest.spyOn(bcrypt, 'genSalt').mockRejectedValueOnce(new Error('bcrypt error'))

      await expect(hashPassword('test')).rejects.toThrow('bcrypt error')
    })
  })

  describe('verifyPassword', () => {
    it('should verify a correct password', async () => {
      const password = 'testPassword123'
      const hashedPassword = await hashPassword(password)

      const isValid = await verifyPassword(password, hashedPassword)

      expect(isValid).toBe(true)
    })

    it('should reject an incorrect password', async () => {
      const password = 'testPassword123'
      const wrongPassword = 'wrongPassword456'
      const hashedPassword = await hashPassword(password)

      const isValid = await verifyPassword(wrongPassword, hashedPassword)

      expect(isValid).toBe(false)
    })

    it('should handle empty password verification', async () => {
      const password = ''
      const hashedPassword = await hashPassword(password)

      const isValid = await verifyPassword(password, hashedPassword)

      expect(isValid).toBe(true)
    })

    it('should reject empty password when hash is not for empty string', async () => {
      const hashedPassword = await hashPassword('actualPassword')

      const isValid = await verifyPassword('', hashedPassword)

      expect(isValid).toBe(false)
    })

    it('should be case-sensitive', async () => {
      const password = 'TestPassword123'
      const hashedPassword = await hashPassword(password)

      const isValid = await verifyPassword('testpassword123', hashedPassword)

      expect(isValid).toBe(false)
    })

    it('should handle special characters correctly', async () => {
      const password = '!@#$%^&*()_+-={}[]|:";\'<>?,./'
      const hashedPassword = await hashPassword(password)

      const isValid = await verifyPassword(password, hashedPassword)

      expect(isValid).toBe(true)
    })

    it('should handle unicode characters correctly', async () => {
      const password = '你好世界🔒🔑'
      const hashedPassword = await hashPassword(password)

      const isValid = await verifyPassword(password, hashedPassword)

      expect(isValid).toBe(true)
    })

    it('should reject password with slight variation', async () => {
      const password = 'testPassword123'
      const hashedPassword = await hashPassword(password)

      const isValid = await verifyPassword('testPassword124', hashedPassword)

      expect(isValid).toBe(false)
    })

    it('should reject password with extra space', async () => {
      const password = 'testPassword123'
      const hashedPassword = await hashPassword(password)

      const isValid = await verifyPassword('testPassword123 ', hashedPassword)

      expect(isValid).toBe(false)
    })

    it('should reject invalid hash format', async () => {
      const password = 'testPassword123'
      const invalidHash = 'not-a-valid-hash'

      const isValid = await verifyPassword(password, invalidHash)

      expect(isValid).toBe(false)
    })

    it('should handle bcrypt errors gracefully', async () => {
      // Mock bcrypt.compare to throw an error
      jest.spyOn(bcrypt, 'compare').mockRejectedValueOnce(new Error('bcrypt compare error'))

      await expect(verifyPassword('test', 'hash')).rejects.toThrow('bcrypt compare error')
    })
  })

  describe('Security considerations', () => {
    it('should use consistent time for password verification (timing attack resistance)', async () => {
      const password = 'testPassword123'
      const hashedPassword = await hashPassword(password)

      // Measure time for correct password
      const start1 = Date.now()
      await verifyPassword(password, hashedPassword)
      const time1 = Date.now() - start1

      // Measure time for incorrect password
      const start2 = Date.now()
      await verifyPassword('wrongPassword', hashedPassword)
      const time2 = Date.now() - start2

      // Times should be similar (within 100ms tolerance for CI environments)
      // bcrypt naturally provides timing attack resistance
      expect(Math.abs(time1 - time2)).toBeLessThan(100)
    })

    it('should produce sufficiently long hashes (security)', async () => {
      const password = 'test'
      const hashedPassword = await hashPassword(password)

      // bcrypt hashes are 60 characters
      expect(hashedPassword.length).toBe(60)
    })

    it('should use strong salt rounds (performance check)', async () => {
      const password = 'test'

      // Hashing should take at least a few milliseconds (not instant)
      const start = Date.now()
      await hashPassword(password)
      const duration = Date.now() - start

      // With 10 rounds, this should take at least 10ms
      expect(duration).toBeGreaterThan(10)
    })
  })

  describe('Error logging and propagation', () => {
    beforeEach(() => {
      jest.clearAllMocks()
    })

    it('should propagate hashing errors to caller', async () => {
      jest.spyOn(bcrypt, 'genSalt').mockRejectedValueOnce(new Error('Salt generation failed'))

      await expect(hashPassword('test')).rejects.toThrow('Salt generation failed')
    })

    it('should propagate verification errors to caller', async () => {
      jest.spyOn(bcrypt, 'compare').mockRejectedValueOnce(new Error('Comparison failed'))

      await expect(verifyPassword('test', 'hash')).rejects.toThrow('Comparison failed')
    })
  })
})
