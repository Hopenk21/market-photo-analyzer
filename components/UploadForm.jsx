import { useState, useRef, useCallback, useEffect } from 'react'
import { useRouter } from 'next/router'

export default function UploadForm({ onResult }) {
  const [file, setFile] = useState(null)
  const [preview, setPreview] = useState(null)
  const [result, setResult] = useState(null)
  const [loading, setLoading] = useState(false)
  const [dragActive, setDragActive] = useState(false)
  const inputRef = useRef(null)
  const router = useRouter()

  const handleFiles = useCallback((f) => {
    const first = f?.[0]
    if (!first) return
    setFile(first)
    setResult(null)
    const url = URL.createObjectURL(first)
    setPreview(url)
  }, [])

  useEffect(() => {
    return () => {
      if (preview) URL.revokeObjectURL(preview)
    }
  }, [preview])

  function handleChange(e) {
    handleFiles(e.target.files)
  }

  function openPicker() {
    inputRef.current?.click()
  }

  function handleDrag(e) {
    e.preventDefault(); e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') setDragActive(true)
    if (e.type === 'dragleave') setDragActive(false)
  }

  function handleDrop(e) {
    e.preventDefault(); e.stopPropagation();
    setDragActive(false)
    const dt = e.dataTransfer
    handleFiles(dt.files)
  }

  async function handleSubmit(e) {
    e?.preventDefault()
    if (!file) return
    setLoading(true)
    setResult(null)
    const fd = new FormData()
    fd.append('file', file)
    try {
      const res = await fetch('/api/upload', { method: 'POST', body: fd })
      const data = await res.json()
      setResult(data)
      if (typeof onResult === 'function') onResult(data)
      try {
        // store last analysis in sessionStorage for feedback page
        if (typeof window !== 'undefined') sessionStorage.setItem('lastAnalysis', JSON.stringify(data))
      } catch (e) {
        console.error('sessionStorage save failed', e)
      }
      // navigate to feedback page
      router.push('/feedback')
    } catch (err) {
      setResult({ error: String(err) })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div>
      <div
        onDragEnter={handleDrag}
        onDragOver={handleDrag}
        onDragLeave={handleDrag}
        onDrop={handleDrop}
        className={`rounded-2xl p-4 ${dragActive ? 'border-emerald-400 bg-slate-900/60' : ''}`}
      >
        <input ref={inputRef} type="file" accept="image/*" onChange={handleChange} className="hidden" />

        <div className="flex flex-col sm:flex-row items-center gap-4">
          <div className="flex-1 text-left">
            <p className="text-sm text-slate-400">Drop an image here or</p>
            <button type="button" onClick={openPicker} className="mt-2 inline-flex items-center gap-2 px-4 py-2 rounded-2xl bg-emerald-500 hover:bg-emerald-400 text-black font-semibold">Choose File</button>
            <button type="button" onClick={handleSubmit} disabled={!file || loading} className="mt-2 ml-2 inline-flex items-center gap-2 px-4 py-2 rounded-2xl border border-slate-700 hover:bg-slate-800 text-white">{loading ? 'Analyzing…' : 'Upload & Analyze'}</button>
          </div>

          <div className="w-36 h-24 rounded-lg bg-slate-800/60 flex items-center justify-center">
            {preview ? <img src={preview} alt="preview" className="object-contain w-full h-full rounded-lg" /> : <span className="text-slate-400">No file</span>}
          </div>
        </div>
      </div>

      {result && (
        <div className="mt-4 space-y-4">
          <div className="p-4 rounded-2xl bg-gradient-to-r from-emerald-500/10 to-slate-900 border border-slate-800">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-400">AI Trade Signal</p>
                <h3 className="text-2xl font-black mt-1">{(result.provider?.rest?.suggested_trade?.action || result.provider?.qwen?.suggested_trade?.action || result.analysis?.suggested_trade?.action) ?? 'N/A'}</h3>
              </div>

              <div className="text-right">
                <p className="text-sm text-slate-400">Confidence</p>
                <div className="text-xl font-bold">{Math.round(((result.provider?.rest?.suggested_trade?.confidence ?? result.provider?.qwen?.suggested_trade?.confidence ?? result.analysis?.suggested_trade?.confidence) || 0) * 100)}%</div>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800">
              <p className="text-sm text-slate-400">Indicators</p>
              <pre className="mt-2 text-sm text-slate-300 bg-transparent p-2 rounded">{JSON.stringify(result.provider?.rest?.indicators || result.provider?.qwen?.indicators || result.analysis?.indicators || {}, null, 2)}</pre>
            </div>

            <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800">
              <p className="text-sm text-slate-400">Suggested Trade</p>
              <pre className="mt-2 text-sm text-slate-300 bg-transparent p-2 rounded">{JSON.stringify(result.provider?.rest?.suggested_trade || result.provider?.qwen?.suggested_trade || result.analysis?.suggested_trade || {}, null, 2)}</pre>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
