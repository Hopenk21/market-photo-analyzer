import Head from 'next/head'
import dynamic from 'next/dynamic'

const UploadForm = dynamic(() => import('../components/UploadForm'), { ssr: false })

export default function Home() {
  return (
    <>
      <Head>
        <title>Market Photo Analyzer</title>
        <meta name="viewport" content="width=device-width, initial-scale=1" />
      </Head>
      <main style={{ padding: 24, fontFamily: 'Arial, sans-serif' }}>
        <h1>Market Photo Analyzer</h1>
        <p>Upload a photo to run a prototype analysis (local demo).</p>
        <UploadForm />
      </main>
    </>
  )
}
