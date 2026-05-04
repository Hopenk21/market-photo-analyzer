const fs = require('fs')
const path = require('path')
const os = require('os')
const formidable = require('formidable')
const sharp = require('sharp')

export const config = {
  api: {
    bodyParser: false,
  },
}

function getFilePath(file) {
  return file.filepath || file.path || file.file;
}

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'method_not_allowed' })

  const S3_BUCKET = process.env.S3_BUCKET
  const uploadDir = S3_BUCKET ? path.join(process.cwd(), 'uploads') : os.tmpdir()
  if (S3_BUCKET) {
    if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir, { recursive: true })
  }

  const form = formidable({ multiples: false, uploadDir, keepExtensions: true })

  form.parse(req, async (err, fields, files) => {
    if (err) {
      console.error('form parse error', err)
      return res.status(500).json({ error: 'parse_failed' })
    }

    const file = files.file
    if (!file) return res.status(400).json({ error: 'no_file' })

    try {
      const filePath = getFilePath(file)
      const filename = path.basename(filePath)
      const destPath = path.join(uploadDir, filename)

      if (filePath !== destPath) {
        try { fs.renameSync(filePath, destPath) } catch (e) { /* ignore */ }
      }

      // Basic local analysis
      const image = sharp(destPath)
      const { data, info } = await image.ensureAlpha().raw().toBuffer({ resolveWithObject: true })
      const pixels = info.width * info.height
      const channels = info.channels
      const sums = new Array(channels).fill(0)
      for (let i = 0; i < data.length; i += channels) {
        for (let c = 0; c < channels; c++) sums[c] += data[i + c]
      }
      const avg = sums.map(s => Math.round(s / pixels))
      const avgColor = { r: avg[0], g: avg[1], b: avg[2], a: channels >= 4 ? avg[3] : 255 }

      const analysis = {
        filename,
        sizeBytes: fs.statSync(destPath).size,
        width: info.width,
        height: info.height,
        avgColor,
        note: 'Prototype result: use a vision API for production-grade market analysis.'
      }

      // Optional S3 upload
      const AWS_REGION = process.env.AWS_REGION
      const AWS_ACCESS_KEY_ID = process.env.AWS_ACCESS_KEY_ID
      const AWS_SECRET_ACCESS_KEY = process.env.AWS_SECRET_ACCESS_KEY
      if (S3_BUCKET && AWS_REGION && AWS_ACCESS_KEY_ID && AWS_SECRET_ACCESS_KEY) {
        try {
          const { S3Client, PutObjectCommand } = require('@aws-sdk/client-s3')
          const { v4: uuidv4 } = require('uuid')
          const client = new S3Client({ region: AWS_REGION, credentials: { accessKeyId: AWS_ACCESS_KEY_ID, secretAccessKey: AWS_SECRET_ACCESS_KEY } })
          const buffer = fs.readFileSync(destPath)
          const key = `uploads/${uuidv4()}-${filename}`
          await client.send(new PutObjectCommand({ Bucket: S3_BUCKET, Key: key, Body: buffer, ContentType: file.mimetype || 'image/jpeg', ACL: 'public-read' }))
          analysis.storage = { provider: 's3', url: `https://${S3_BUCKET}.s3.${AWS_REGION}.amazonaws.com/${key}` }
        } catch (e) {
          console.error('s3 upload failed', e)
          analysis.storage = { provider: 's3', error: 'upload_failed' }
        }
      }

      // Provider analysis: QWEN and generic REST
      let qwenResult = null
      let restResult = null

      const QWEN_URL = process.env.QWEN_API_URL
      const QWEN_KEY = process.env.QWEN_API_KEY
      if (QWEN_URL && QWEN_KEY) {
        try {
          const fileBuf = fs.readFileSync(destPath)
          const b64 = fileBuf.toString('base64')
          const payload = { model: 'qwen-3.0-vl', inputs: [{ type: 'image_base64', data: b64, mime: 'image/jpeg' }, { type: 'text', text: 'Analyze this forex chart screenshot: extract indicators (RSI, MACD), patterns, prices and recommend BUY/SELL/HOLD with confidence.' }] }
          const qres = await fetch(QWEN_URL, { method: 'POST', headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${QWEN_KEY}` }, body: JSON.stringify(payload) })
          if (qres.ok) qwenResult = await qres.json()
          else { console.error('qwen error', qres.status); qwenResult = { error: `status ${qres.status}` } }
        } catch (e) { console.error('qwen request failed', e); qwenResult = { error: 'request_failed' } }
      }

      const REST_URL = process.env.REST_ANALYSIS_URL
      const REST_KEY = process.env.REST_ANALYSIS_KEY
      if (REST_URL) {
        try {
          const fileBuf = fs.readFileSync(destPath)
          const b64 = fileBuf.toString('base64')
          const restPayload = { filename, image_base64: b64 }
          const restRes = await fetch(REST_URL, { method: 'POST', headers: { 'Content-Type': 'application/json', ...(REST_KEY ? { Authorization: `Bearer ${REST_KEY}` } : {}) }, body: JSON.stringify(restPayload) })
          if (restRes.ok) restResult = await restRes.json()
          else { console.error('rest analysis error', restRes.status); restResult = { error: `status ${restRes.status}` } }
        } catch (e) { console.error('rest analysis request failed', e); restResult = { error: 'request_failed' } }
      }

      // Decide suggested trade using strategy library
      const { decideTrade } = require('../../lib/strategies')
      const indicators = (restResult && restResult.indicators) || (qwenResult && qwenResult.indicators) || analysis.indicators || {}
      const patterns = (restResult && restResult.patterns) || (qwenResult && qwenResult.patterns) || analysis.patterns || []
      const prices = (restResult && restResult.prices) || (qwenResult && qwenResult.prices) || analysis.prices || {}
      const suggested = decideTrade({ indicators, patterns, prices })

      if (restResult && !restResult.suggested_trade) restResult.suggested_trade = suggested
      if (qwenResult && !qwenResult.suggested_trade) qwenResult.suggested_trade = suggested
      analysis.suggested_trade = analysis.suggested_trade || suggested

      return res.status(200).json({ analysis, provider: { qwen: qwenResult, rest: restResult } })
    } catch (e) {
      console.error(e)
      return res.status(500).json({ error: 'processing_failed' })
    }
  })
}
