import type { NextApiRequest, NextApiResponse } from 'next'
import { kv } from '@vercel/kv'

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse,
) {
  if (req.method === 'POST') {
    const { userAddress, wallet } = req.body
    if (!userAddress || !wallet) {
      return res.status(400).json({ error: 'invalid input' })
    }

    const key = `user:${userAddress.toLowerCase()}`
    const user = (await kv.get<{ wallets: string[] }>(key)) || { wallets: [] }

    if (!user.wallets.includes(wallet)) {
      user.wallets.push(wallet)
      await kv.set(key, user)
    }

    return res.status(200).json(user)
  }

  if (req.method === 'GET') {
    const { userAddress } = req.query
    const key = `user:${(userAddress as string).toLowerCase()}`
    const user = await kv.get<{ wallets: string[] }>(key)
    return res.status(200).json(user || { wallets: [] })
  }

  return res.status(405).json({ error: 'method not allowed' })
}
