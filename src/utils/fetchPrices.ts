export async function fetchCryptoPrices(ids: string[]): Promise<Record<string, {price: number, change24h: number, change30d: number}>> {
  try {
    // Fetch current prices with 24h change
    const priceResponse = await fetch(
      `https://api.coingecko.com/api/v3/simple/price?ids=${ids.join(',')}&vs_currencies=usd&include_24hr_change=true`
    )
    const priceData = await priceResponse.json()

    // Fetch 30-day historical data for percentage change calculation
    const prices: Record<string, {price: number, change24h: number, change30d: number}> = {}

    for (const id of ids) {
      if (priceData[id]) {
        // Get 30 day chart data
        const chartResponse = await fetch(
          `https://api.coingecko.com/api/v3/coins/${id}/market_chart?vs_currency=usd&days=30&interval=daily`
        )
        const chartData = await chartResponse.json()

        let change30d = 0
        if (chartData.prices && chartData.prices.length > 0) {
          const price30dAgo = chartData.prices[0][1]
          const currentPrice = priceData[id].usd
          change30d = ((currentPrice - price30dAgo) / price30dAgo) * 100
        }

        prices[id] = {
          price: priceData[id].usd || 0,
          change24h: priceData[id].usd_24h_change || 0,
          change30d: change30d
        }
      }
    }
    return prices
  } catch (error) {
    console.error('Failed to fetch prices:', error)
    return {}
  }
}
