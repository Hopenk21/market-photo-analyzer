const { decideTrade } = require('../lib/strategies')

test('RSI overbought returns SELL', () => {
  const res = decideTrade({ indicators: { rsi: 75 }, prices: { current: 1.2345 } })
  expect(res.action).toBe('SELL')
  expect(res.confidence).toBeGreaterThan(0)
})

test('RSI oversold returns BUY', () => {
  const res = decideTrade({ indicators: { rsi: 20 }, prices: { current: 1.2345 } })
  expect(res.action).toBe('BUY')
})

test('MA crossover returns BUY when short > long', () => {
  const res = decideTrade({ indicators: { sma50: 105, sma200: 100 }, prices: { current: 100 } })
  expect(res.action).toBe('BUY')
})

test('No indicators returns HOLD', () => {
  const res = decideTrade({ indicators: {}, prices: {} })
  expect(res.action).toBe('HOLD')
  expect(res.confidence).toBe(0.5)
})
