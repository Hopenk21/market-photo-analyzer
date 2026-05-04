import { useState } from 'react'

export default function UploadForm() {
  const [file, setFile] = useState(null)
  const [result, setResult] = useState(null)
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e) {
    e.preventDefault()
    if (!file) return
    setLoading(true)
    setResult(null)
    const fd = new FormData()
    fd.append('file', file)
    try {
      const res = await fetch('/api/upload', { method: 'POST', body: fd })
      const data = await res.json()
      setResult(data)
    } catch (err) {
      setResult({ error: String(err) })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div>
      <form onSubmit={handleSubmit}>
        <input type="file" accept="image/*" onChange={e => setFile(e.target.files?.[0] ?? null)} />
        <button type="submit" disabled={loading || !file} style={{ marginLeft: 8 }}>
          {loading ? 'Uploading…' : 'Upload & Analyze'}
        </button>
      </form>

      {result && (
        <pre style={{ marginTop: 16, background: '#f6f8fa', padding: 12 }}>{JSON.stringify(result, null, 2)}</pre>
      )}
    </div>
  )
}
