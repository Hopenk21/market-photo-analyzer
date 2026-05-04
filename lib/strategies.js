// Simple trading strategy library used to compute suggested trades from indicators
// Exports a single function `decideTrade(context)` which returns { action, confidence, entry, stop_loss, take_profit }

function rsiStrategy(indicators) {
  const rsi = indicators?.rsi
  if (rsi === undefined || rsi === null) return null
  const r = Number(rsi)
  if (Number.isNaN(r)) return null
  if (r >= 70) return { action: 'SELL', confidence: 0.8 }
  if (r <= 30) return { action: 'BUY', confidence: 0.8 }
  if (r >= 55) return { action: 'BUY', confidence: 0.55 }
  if (r <= 45) return { action: 'SELL', confidence: 0.55 }
  return null
}

function macdStrategy(indicators) {
  const macd = indicators?.macd
  if (!macd) return null
  const m = String(macd).toLowerCase()
  if (m.includes('bull')) return { action: 'BUY', confidence: 0.7 }
  if (m.includes('bear')) return { action: 'SELL', confidence: 0.7 }
  return null
}

function maCrossoverStrategy(indicators) {
  // expects sma_short and sma_long or sma50/sma200
  const s = indicators?.sma50 ?? indicators?.sma_short
  const l = indicators?.sma200 ?? indicators?.sma_long
  if (s === undefined || l === undefined) return null
  const ss = Number(s), ll = Number(l)
  if (Number.isNaN(ss) || Number.isNaN(ll)) return null
  if (ss > ll) return { action: 'BUY', confidence: 0.72 }
  if (ss < ll) return { action: 'SELL', confidence: 0.72 }
  return null
}

function patternStrategy(patterns) {
  if (!Array.isArray(patterns)) return null
  for (const p of patterns) {
    const name = (p?.name || '').toLowerCase()
    if (!name) continue
    if (name.includes('head_and_shoulders') || name.includes('double_top')) return { action: 'SELL', confidence: 0.9 }
    if (name.includes('double_bottom') || name.includes('inverse_head_and_shoulders') || name.includes('bull_flag')) return { action: 'BUY', confidence: 0.9 }
  }
  return null
}

function aggregateVotes(votes) {
  // votes: array of { action, confidence }
  const scores = { BUY: 0, SELL: 0, HOLD: 0 }
  for (const v of votes) {
    if (!v || !v.action) continue
    const a = v.action.toUpperCase()
    const c = Number(v.confidence) || 0.5
    scores[a] = (scores[a] || 0) + c
  }
  // choose action with max score
  let best = 'HOLD', bestScore = scores.HOLD
  for (const k of Object.keys(scores)) {
    if (scores[k] > bestScore) { best = k; bestScore = scores[k] }
  }
  // normalize confidence to 0..1
  const total = scores.BUY + scores.SELL + scores.HOLD
  const conf = total > 0 ? Math.min(1, bestScore / total) : 0.5
  return { action: best, confidence: Number(conf.toFixed(2)) }
}

function buildRiskSizing(action, prices) {
  let entry, stop_loss, take_profit
  if (!prices || !prices.current) return { entry: undefined, stop_loss: undefined, take_profit: undefined }
  const cur = Number(prices.current)
  if (Number.isNaN(cur)) return { entry: undefined, stop_loss: undefined, take_profit: undefined }
  if (action === 'BUY') {
    entry = cur
    stop_loss = prices.support ?? +(cur * 0.995).toFixed(6)
    take_profit = prices.resistance ?? +(cur * 1.01).toFixed(6)
  } else if (action === 'SELL') {
    entry = cur
    stop_loss = prices.resistance ?? +(cur * 1.005).toFixed(6)
    take_profit = prices.support ?? +(cur * 0.99).toFixed(6)
  }
  return { entry, stop_loss, take_profit }
}

function decideTrade({ indicators = {}, patterns = [], prices = {} } = {}) {
  const votes = []
  const r = rsiStrategy(indicators); if (r) votes.push(r)
  const m = macdStrategy(indicators); if (m) votes.push(m)
  const ma = maCrossoverStrategy(indicators); if (ma) votes.push(ma)
  const p = patternStrategy(patterns); if (p) votes.push(p)

  // if no votes, default HOLD
  if (votes.length === 0) return { action: 'HOLD', confidence: 0.5 }

  const agg = aggregateVotes(votes)
  const sizing = buildRiskSizing(agg.action, prices)
  return { action: agg.action, confidence: agg.confidence, ...sizing }
}

module.exports = { decideTrade }
