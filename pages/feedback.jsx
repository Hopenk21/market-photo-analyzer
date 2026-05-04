import { useEffect, useState } from 'react'

export default function FeedbackPage() {
  const [analysis, setAnalysis] = useState(null)
  const [rating, setRating] = useState(5)
  const [comment, setComment] = useState('')
  const [status, setStatus] = useState(null)

  useEffect(() => {
    if (typeof window === 'undefined') return
    const raw = sessionStorage.getItem('lastAnalysis')
    if (raw) {
      try {
        setAnalysis(JSON.parse(raw))
      } catch (e) {
        console.error('failed to parse lastAnalysis', e)
      }
    }
  }, [])

  async function handleSubmit(e) {
    e.preventDefault()
    setStatus('sending')
    try {
      const payload = { rating, comment, analysis }
      const res = await fetch('/api/feedback', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) })
      const json = await res.json()
      if (res.ok) {
        setStatus('thanks')
        // clear stored analysis
        try { sessionStorage.removeItem('lastAnalysis') } catch (e) {}
      } else {
        setStatus('error')
        console.error('feedback response', json)
      }
    } catch (e) {
      console.error(e)
      setStatus('error')
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 text-white py-12">
      <div className="max-w-3xl mx-auto px-6">
        <h1 className="text-3xl font-bold mb-4">Feedback — Analysis Review</h1>

        {!analysis && (
          <div className="p-6 bg-slate-900 rounded-2xl border border-slate-800">No recent analysis found. Please run an analysis first.</div>
        )}

        {analysis && (
          <div className="space-y-6">
            <div className="p-4 bg-slate-900 rounded-2xl border border-slate-800">
              <h2 className="font-semibold">Analysis Summary</h2>
              <pre className="mt-2 text-sm text-slate-300 bg-transparent p-2 rounded overflow-auto">{JSON.stringify(analysis, null, 2)}</pre>
            </div>

            <form onSubmit={handleSubmit} className="p-6 bg-slate-900 rounded-2xl border border-slate-800">
              <label className="block mb-2 text-sm text-slate-400">How accurate was the suggested trade?</label>
              <select value={rating} onChange={e => setRating(Number(e.target.value))} className="mb-4 bg-slate-800 text-white p-2 rounded">
                {[5,4,3,2,1].map(n => <option key={n} value={n}>{n} — {n>=4 ? 'Good' : n===3 ? 'Neutral' : 'Poor'}</option>)}
              </select>

              <label className="block mb-2 text-sm text-slate-400">Comments (optional)</label>
              <textarea value={comment} onChange={e => setComment(e.target.value)} className="w-full p-2 rounded bg-slate-800 text-white mb-4" rows={4} />

              <div className="flex items-center gap-3">
                <button className="px-4 py-2 bg-emerald-500 rounded font-semibold" type="submit">Send Feedback</button>
                {status === 'sending' && <span className="text-slate-400">Sending…</span>}
                {status === 'thanks' && <span className="text-emerald-400">Thanks for your feedback!</span>}
                {status === 'error' && <span className="text-red-400">Failed to send — try again.</span>}
              </div>
            </form>
          </div>
        )}
      </div>
    </div>
  )
}
