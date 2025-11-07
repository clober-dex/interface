import axios from 'axios'

/**
 * Caching + server read
 */
export async function fetchWalletConnectors(
  userAddress: `0x${string}`,
): Promise<string[]> {
  const cacheKey = `wallets:${userAddress}`
  const cacheTimeKey = `${cacheKey}:timestamp`

  const cached = localStorage.getItem(cacheKey)
  const cachedTime = localStorage.getItem(cacheTimeKey)

  const now = Date.now()
  const ttl = 1000 * 60 * 60 * 24 // 24 hours

  // 1️⃣ Return cache if still valid
  if (cached && cachedTime && now - parseInt(cachedTime) < ttl) {
    try {
      return JSON.parse(cached)
    } catch {
      localStorage.removeItem(cacheKey)
      localStorage.removeItem(cacheTimeKey)
    }
  }

  // 2️⃣ Fetch from server
  const { data } = await axios.get('/api/connect-wallet', {
    params: { userAddress },
  })

  // 3️⃣ Save to cache
  localStorage.setItem(cacheKey, JSON.stringify(data.wallets))
  localStorage.setItem(cacheTimeKey, now.toString())

  return data.wallets
}

/**
 * Send wallet info to the server (with duplicate prevention)
 */
export async function postWalletConnector(
  userAddress: `0x${string}`,
  wallet: string,
): Promise<void> {
  if (!userAddress || !wallet) {
    return
  }

  try {
    await axios.post(
      '/api/connect-wallet',
      { userAddress, wallet },
      { headers: { 'Content-Type': 'application/json' } },
    )

    // On success, update local cache as well
    const cacheKey = `wallets:${userAddress}`
    const cacheTimeKey = `${cacheKey}:timestamp`
    const cached = localStorage.getItem(cacheKey)
    const now = Date.now()

    let wallets: string[] = []
    if (cached) {
      try {
        wallets = JSON.parse(cached)
      } catch {
        localStorage.removeItem(cacheKey)
      }
    }

    if (!wallets.includes(wallet)) {
      wallets.push(wallet)
      localStorage.setItem(cacheKey, JSON.stringify(wallets))
      localStorage.setItem(cacheTimeKey, now.toString())
    }

    console.log('✅ wallet info synced to server:', wallet)
  } catch (err) {
    console.error('❌ error posting wallet info:', err)
  }
}
