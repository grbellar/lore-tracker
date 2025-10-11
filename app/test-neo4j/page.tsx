'use client'

import { useEffect, useState } from 'react'
import { useSession } from 'next-auth/react'

export default function TestNeo4jPage() {
  const { data: session, status } = useSession()
  const [testResult, setTestResult] = useState<any>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const runTest = async () => {
    setLoading(true)
    setError(null)
    try {
      const response = await fetch('/api/neo4j/test')
      const data = await response.json()

      if (!response.ok) {
        setError(data.error || 'Test failed')
      } else {
        setTestResult(data)
      }
    } catch (err) {
      setError('Failed to connect to API')
    } finally {
      setLoading(false)
    }
  }

  if (status === 'loading') {
    return (
      <div className="min-h-screen bg-[#0A0A0A] text-white flex items-center justify-center">
        <div className="text-xl">Loading...</div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#0A0A0A] text-white p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold mb-8">Neo4j Integration Test</h1>

        <div className="bg-[#111111] border border-[#222222] rounded-lg p-6 mb-6">
          <h2 className="text-xl font-semibold mb-4">Session Info</h2>
          <div className="space-y-2 font-mono text-sm">
            <div>
              <span className="text-gray-400">Status:</span>{' '}
              <span className="text-emerald-500">{status}</span>
            </div>
            {session?.user && (
              <>
                <div>
                  <span className="text-gray-400">User ID:</span>{' '}
                  <span className="text-blue-400">{session.user.id}</span>
                </div>
                <div>
                  <span className="text-gray-400">Email:</span>{' '}
                  <span>{session.user.email}</span>
                </div>
                <div>
                  <span className="text-gray-400">Name:</span>{' '}
                  <span>{session.user.name}</span>
                </div>
              </>
            )}
          </div>
        </div>

        <button
          onClick={runTest}
          disabled={loading}
          className="px-6 py-3 bg-emerald-600 hover:bg-emerald-700 disabled:bg-gray-600
                     rounded-lg font-semibold transition-colors mb-6"
        >
          {loading ? 'Running Test...' : 'Run Neo4j Test'}
        </button>

        {error && (
          <div className="bg-red-900/20 border border-red-500 rounded-lg p-4 mb-6">
            <h3 className="text-red-500 font-semibold mb-2">Error</h3>
            <p className="text-red-300">{error}</p>
          </div>
        )}

        {testResult && (
          <div className="bg-[#111111] border border-emerald-500 rounded-lg p-6">
            <h2 className="text-xl font-semibold mb-4 text-emerald-500">
              ✓ Test Passed
            </h2>
            <pre className="bg-[#0A0A0A] p-4 rounded-lg overflow-x-auto text-sm">
              {JSON.stringify(testResult, null, 2)}
            </pre>
          </div>
        )}

        <div className="mt-8 bg-[#111111] border border-[#222222] rounded-lg p-6">
          <h2 className="text-xl font-semibold mb-4">What This Test Does</h2>
          <ul className="space-y-2 text-gray-300">
            <li>✓ Verifies Neo4j connection is working</li>
            <li>✓ Extracts user_id from your authenticated session</li>
            <li>✓ Creates a test node with user isolation</li>
            <li>✓ Queries only your user's data</li>
            <li>✓ Cleans up the test node automatically</li>
            <li>✓ Confirms data isolation is enforced</li>
          </ul>
        </div>
      </div>
    </div>
  )
}
