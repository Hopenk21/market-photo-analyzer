const sharp = require('sharp')

// Very small heuristic chart parser for prototype purposes.
// It computes a brightness-based proxy for RSI and simple moving averages
// from the image average brightness. This is NOT production-grade chart
// parsing — replace with a proper OCR / candlestick detector when ready.
async function parseChartImage(imagePath) {
  try {
    const img = sharp(imagePath).resize(100, 100, { fit: 'inside' }).greyscale()
    const { data, info } = await img.raw().toBuffer({ resolveWithObject: true })
    // compute mean brightness
    let sum = 0
    for (let i = 0; i < data.length; i += info.channels) {
      sum += data[i]
    }
    const pixels = info.width * info.height
    const mean = pixels > 0 ? sum / pixels : 128

    // map mean 0..255 to RSI 0..100
    const rsi = Math.round((mean / 255) * 100)

    // create simple SMA proxies based on mean brightness
    const sma50 = +(mean * 0.9).toFixed(2)
    const sma200 = +(mean * 0.85).toFixed(2)

    // price proxy: current price mapped from mean
    const current = +(1000 + (mean / 255) * 100).toFixed(4)
    const support = +(current * 0.995).toFixed(4)
    const resistance = +(current * 1.005).toFixed(4)

    return {
      indicators: { rsi, macd: rsi >= 55 ? 'bullish' : 'bearish', sma50, sma200 },
      prices: { current, support, resistance },
      patterns: [],
    }
  } catch (e) {
    console.error('chartParser failed', e)
    return { indicators: {}, prices: {}, patterns: [] }
  }
}

module.exports = { parseChartImage }
