const fs = require('fs')
const os = require('os')
const path = require('path')

export default function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'method_not_allowed' })

  const body = req.body
  try {
    // Persist feedback to a JSONL file in tmpdir (best-effort; ephemeral on serverless)
    const out = { ts: new Date().toISOString(), body }
    const file = path.join(os.tmpdir(), 'market-photo-analyzer-feedback.jsonl')
    fs.appendFileSync(file, JSON.stringify(out) + '\n')
    console.log('feedback saved', file)
  } catch (e) {
    console.error('failed to save feedback', e)
  }

  console.log('received feedback', body)
  return res.status(200).json({ ok: true })
}
