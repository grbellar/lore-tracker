// Mock next-auth module to avoid ESM issues
export const getServerSession = jest.fn()
export default jest.fn()
