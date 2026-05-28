import { NextRequest } from 'next/server'
import { POST } from '../route'

jest.mock('@/lib/submission-token', () => ({
  generateToken: jest.fn(() => 'example-token')
}))

jest.mock('@/lib/submissions-store', () => ({
  readSubmissions: jest.fn(async () => []),
  writeSubmissions: jest.fn(async () => undefined)
}))

const validBody = {
  category: 'developer-tools',
  content: 'A complete description for reviewers.',
  description: 'A short description for reviewers.',
  logoUrl: 'https://example.com/logo.png',
  name: 'Example Extension',
  resourceLinks: [{ label: '', url: '' }],
  videoUrl: '',
  website: 'https://example.com'
}

function submitRequest(body: unknown) {
  return new NextRequest('http://localhost/api/submit', {
    body: JSON.stringify(body),
    method: 'POST'
  })
}

describe('POST /api/submit', () => {
  it('accepts blank Video URL and blank FAQs when required fields are present', async () => {
    const response = await POST(
      submitRequest({ ...validBody, faqs: [{ answer: '', question: '' }] })
    )

    expect(response.status).toBe(200)
    await expect(response.json()).resolves.toEqual({ token: 'example-token' })
  })

  it('rejects partially filled FAQ rows', async () => {
    const response = await POST(
      submitRequest({
        ...validBody,
        faqs: [{ answer: '', question: 'What browsers are supported?' }]
      })
    )

    expect(response.status).toBe(400)
    await expect(response.json()).resolves.toEqual(
      expect.objectContaining({ error: expect.any(Object) })
    )
  })
})
