const fs = require('fs')
const path = require('path')
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

  const uploadDir = path.join(process.cwd(), 'uploads')
  if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir, { recursive: true })

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
        try { fs.renameSync(filePath, destPath) } catch (e) { /* ignore if already moved */ }
      }

      // Local image summary (basic analysis)
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

      // If S3 credentials are configured, upload the file to S3 and include the public URL.
      const S3_BUCKET = process.env.S3_BUCKET
      const AWS_REGION = process.env.AWS_REGION
      const AWS_ACCESS_KEY_ID = process.env.AWS_ACCESS_KEY_ID
      const AWS_SECRET_ACCESS_KEY = process.env.AWS_SECRET_ACCESS_KEY
      if (S3_BUCKET && AWS_REGION && AWS_ACCESS_KEY_ID && AWS_SECRET_ACCESS_KEY) {
        try {
          const { S3Client, PutObjectCommand } = require('@aws-sdk/client-s3')
          const { v4: uuidv4 } = require('uuid')

          const client = new S3Client({
            region: AWS_REGION,
            credentials: {
              accessKeyId: AWS_ACCESS_KEY_ID,
              secretAccessKey: AWS_SECRET_ACCESS_KEY,
            },
          })

          const buffer = fs.readFileSync(destPath)
          const key = `uploads/${uuidv4()}-${filename}`
          const contentType = (file.mimetype || 'image/jpeg')

          await client.send(new PutObjectCommand({
            Bucket: S3_BUCKET,
            Key: key,
            Body: buffer,
            ContentType: contentType,
            ACL: 'public-read'
          }))

          // Construct URL — for AWS S3 standard URL pattern. If you use another S3-compatible service adjust accordingly.
          const s3Url = `https://${S3_BUCKET}.s3.${AWS_REGION}.amazonaws.com/${key}`
          analysis.storage = { provider: 's3', url: s3Url }
        } catch (e) {
          console.error('s3 upload failed', e)
          analysis.storage = { provider: 's3', error: 'upload_failed' }
        }
      }

      // If QWEN integration is configured, send the image for richer analysis.
      const QWEN_URL = process.env.QWEN_API_URL
      const QWEN_KEY = process.env.QWEN_API_KEY
      if (QWEN_URL && QWEN_KEY) {
        try {
          const fileBuf = fs.readFileSync(destPath)
          const b64 = fileBuf.toString('base64')

          const payload = {
            model: 'qwen-3.0-vl',
            inputs: [
              {
                type: 'image_base64',
                data: b64,
                mime: 'image/jpeg'
              },
              {
                type: 'text',
                text: 'Analyze this market photo: identify visible products, signage/text, likely prices, and summarize market indicators.'
              }
            ]
          }

          const qres = await fetch(QWEN_URL, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${QWEN_KEY}`
            },
            body: JSON.stringify(payload),
            // timeout handled by hosting environment / runtime
          })

          if (qres.ok) {
            const qjson = await qres.json()
            // attach provider result alongside local analysis
            return res.status(200).json({ analysis, provider: { name: 'qwen', raw: qjson } })
          } else {
            const text = await qres.text()
            console.error('qwen error', qres.status, text)
            return res.status(200).json({ analysis, provider: { name: 'qwen', error: `status ${qres.status}` } })
          }
        } catch (e) {
          console.error('qwen request failed', e)
          return res.status(200).json({ analysis, provider: { name: 'qwen', error: 'request_failed' } })
        }
      }

      // Fallback: return local prototype analysis
      return res.status(200).json({ analysis })
    } catch (e) {
      console.error(e)
      return res.status(500).json({ error: 'processing_failed' })
    }
  })
}
