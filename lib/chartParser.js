const sharp = require('sharp')

// Improved prototype parser that extracts a price series by scanning columns
// for the chart line (bright/dark pixel) and computes indicators (RSI,
// simple MACD proxy, SMA50/SMA200) from the derived series. This is still
// heuristic but significantly better than using global image brightness.

function calcSMA(series, period) {
  if (!series || series.length < period) return null
  const res = []
  let sum = 0
  for (let i = 0; i < series.length; i++) {
    sum += series[i]
    if (i >= period) sum -= series[i - period]
    if (i >= period - 1) res.push(sum / period)
  }
  return res
}

function calcEMA(series, period) {
  if (!series || series.length < period) return null
  const k = 2 / (period + 1)
  let ema = series.slice(0, period).reduce((a, b) => a + b, 0) / period
  const res = [ema]
  for (let i = period; i < series.length; i++) {
    ema = series[i] * k + ema * (1 - k)
    res.push(ema)
  }
  return res
}

function calcRSI(series, period = 14) {
  if (!series || series.length < period + 1) return null
  let gains = 0, losses = 0
  for (let i = 1; i <= period; i++) {
    const diff = series[i] - series[i - 1]
    if (diff >= 0) gains += diff
    else losses += -diff
  }
  let avgGain = gains / period
  let avgLoss = losses / period
  for (let i = period + 1; i < series.length; i++) {
    const diff = series[i] - series[i - 1]
    avgGain = (avgGain * (period - 1) + Math.max(0, diff)) / period
    avgLoss = (avgLoss * (period - 1) + Math.max(0, -diff)) / period
  }
  if (avgLoss === 0) return 100
  const rs = avgGain / avgLoss
  const rsi = 100 - 100 / (1 + rs)
  return Math.round(rsi)
}

async function parseChartImage(imagePath) {
  try {
    const W = 300
    const H = 200
    const img = sharp(imagePath).resize(W, H, { fit: 'inside' }).greyscale()
    const { data, info } = await img.raw().toBuffer({ resolveWithObject: true })
    const width = info.width
    const height = info.height
    const channels = info.channels

    // Build a 2D brightness array
    const cols = Array.from({ length: width }, () => new Array(height))
    for (let y = 0; y < height; y++) {
      for (let x = 0; x < width; x++) {
        const idx = (y * width + x) * channels
        const v = data[idx] // greyscale so first channel
        cols[x][y] = v
      }
    }

    // For each column, find the brightest pixel (assumes line is bright)
    const series = []
    for (let x = 0; x < width; x++) {
      let bestY = 0
      let bestV = -1
      for (let y = 0; y < height; y++) {
        const v = cols[x][y]
        if (v > bestV) { bestV = v; bestY = y }
      }
      // convert y to price proxy (invert y: 0 top -> high price)
      const norm = 1 - bestY / Math.max(1, height - 1)
      series.push(Number((norm).toFixed(6)))
    }

    // smooth the series with a simple moving average window
    const smooth = calcSMA(series, 3) || series
    const prices = smooth.map(v => 1000 + v * 100) // map to price-like numbers

    // compute indicators
    const rsi = calcRSI(prices)
    const ema12 = calcEMA(prices, 12)
    const ema26 = calcEMA(prices, 26)
    const macdVal = (ema12 && ema26 && ema12.length && ema26.length) ? (ema12[ema12.length - 1] - ema26[ema26.length - 1]) : 0
    const macd = macdVal >= 0 ? 'bullish' : 'bearish'
    const sma50 = (calcSMA(prices, 50) || [null]).slice(-1)[0]
    const sma200 = (calcSMA(prices, 200) || [null]).slice(-1)[0]

    const current = prices[prices.length - 1]
    const support = +(current * 0.995).toFixed(6)
    const resistance = +(current * 1.005).toFixed(6)

    return {
      indicators: { rsi: rsi ?? null, macd, sma50: sma50 ?? null, sma200: sma200 ?? null },
      prices: { current, support, resistance },
      patterns: [],
      _debug: { width, height, samplePoints: series.length }
    }
  } catch (e) {
    console.error('chartParser failed', e)
    return { indicators: {}, prices: {}, patterns: [] }
  }
}

module.exports = { parseChartImage }
