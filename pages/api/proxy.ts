import type { NextApiRequest, NextApiResponse } from 'next'

const ALLOWED_ORIGINS = ['https://app.clober.io', 'http://localhost:3000']
const ALLOWED_HOSTS = ['api.0x.org', 'app.geckoterminal.com', 'rpc.kuru.io']
const ALLOWED_HEADERS = [
  '0x-api-key',
  '0x-version',
  'content-type',
  'host',
  'origin',
]

const SECRET_HEADER_MAP = {
  '0x-api-key': process.env.ZERO_EX_API_KEY || '',
}

function filterHeaders(headers: NextApiRequest['headers']) {
  const out: Record<string, string> = {}
  for (const key of Object.keys(headers)) {
    if (!ALLOWED_HEADERS.includes(key)) {
      continue
    }
    if (Object.keys(SECRET_HEADER_MAP).includes(key)) {
      out[key] = SECRET_HEADER_MAP[key as keyof typeof SECRET_HEADER_MAP]
    } else {
      out[key] = headers[key] as string
    }
  }
  return out
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse,
) {
  const origin = req.headers.origin
  if (!origin || !ALLOWED_ORIGINS.includes(origin)) {
    return res.status(403).json({ error: 'not allowed' })
  }

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
      body: req.method !== 'GET' ? req.body : undefined,
    })
    const body = await response.text()

    try {
      const json = JSON.parse(body)
      res.status(response.status).json(json)
    } catch {
      res.status(response.status).send(body)
    }
  } catch (err: any) {
    res.status(500).json({ error: err.message })
  }
}
