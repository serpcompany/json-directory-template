import { POST } from '../route'

describe('POST /api/submit', () => {
  it('keeps runtime submissions disabled for static builds', async () => {
    const response = POST()

    expect(response.status).toBe(410)
    await expect(response.json()).resolves.toEqual({
      error: 'Runtime submissions are disabled. Use the static GitHub issue submit flow.'
    })
  })
})
