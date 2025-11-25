import type { NextApiRequest, NextApiResponse } from 'next'

const ALLOWED_HOSTS = ['api.0x.org']
const ALLOWED_HEADERS = ['0x-api-key', '0x-version']

const SECRET_HEADER_MAP = {
  '0x-api-key': process.env.ZERO_EX_API_KEY || '',
}

function filterHeaders(headers: NextApiRequest['headers']) {
  const out: Record<string, string> = {}
  for (const key of Object.keys(headers)) {
    if (!ALLOWED_HEADERS.includes(key)) {
      continue
    }
    out[key] = headers[key] as string
  }
  for (const [key, value] of Object.entries(SECRET_HEADER_MAP)) {
    out[key] = value
  }
  return out
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse,
) {
  const target = req.query.url as string
  if (!target) {
    return res.status(400).json({ error: 'missing url' })
  }

  const targetUrl = new URL(target)
  if (!ALLOWED_HOSTS.includes(targetUrl.host)) {
    return res.status(403).json({ error: 'not allowed' })
  }

  const forwardHeaders = filterHeaders(req.headers)

  try {
    const response = await fetch(target, {
      method: req.method,
      headers: forwardHeaders,
      body: req.method !== 'GET' ? JSON.stringify(req.body) : undefined,
    })

    const data = await response.json()

    res.status(response.status).json(data)
  } catch (err: any) {
    res.status(500).json({ error: err.message })
  }
}
