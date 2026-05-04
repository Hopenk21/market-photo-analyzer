import UploadForm from '../components/UploadForm'

export default function MarketPhotoAnalyzer() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 text-white">
      {/* Navbar */}
      <nav className="flex items-center justify-between px-8 py-5 border-b border-slate-800 backdrop-blur-xl">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Market Photo Analyzer</h1>
          <p className="text-sm text-slate-400 mt-1">AI-powered forex chart analysis platform</p>
        </div>

        <div className="flex items-center gap-4">
          <button className="px-5 py-2 rounded-xl border border-slate-700 hover:bg-slate-800 transition-all">Login</button>

          <button className="px-5 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-black font-semibold transition-all shadow-lg shadow-emerald-500/20">Get Started</button>
        </div>
      </nav>

      {/* Hero */}
      <section className="max-w-7xl mx-auto px-6 py-20 grid lg:grid-cols-2 gap-14 items-center">
        <div>
          <div className="inline-flex items-center gap-2 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 px-4 py-2 rounded-full text-sm mb-6">
            <span className="w-2 h-2 bg-emerald-400 rounded-full animate-pulse"></span>
            Live AI Market Analysis
          </div>

          <h1 className="text-5xl md:text-6xl font-black leading-tight">
            Upload Trading Charts.
            <span className="block text-emerald-400 mt-2">Get Instant AI Signals.</span>
          </h1>

          <p className="mt-6 text-lg text-slate-400 leading-relaxed max-w-xl">
            Analyze forex chart screenshots using AI-powered pattern recognition, sentiment analysis, RSI, MACD, and smart trade signals.
          </p>

          <div className="flex flex-wrap gap-4 mt-8">
            <a href="#upload-section" className="px-7 py-4 rounded-2xl bg-emerald-500 hover:bg-emerald-400 text-black font-bold transition-all shadow-2xl shadow-emerald-500/20">Start Analyzing</a>

            <button className="px-7 py-4 rounded-2xl border border-slate-700 hover:bg-slate-800 transition-all">View Demo</button>
          </div>

          <div className="grid grid-cols-3 gap-4 mt-12">
            <div className="bg-slate-900/70 border border-slate-800 rounded-2xl p-5 backdrop-blur-xl">
              <h3 className="text-3xl font-bold text-emerald-400">98%</h3>
              <p className="text-slate-400 mt-1 text-sm">Signal Accuracy</p>
            </div>

            <div className="bg-slate-900/70 border border-slate-800 rounded-2xl p-5 backdrop-blur-xl">
              <h3 className="text-3xl font-bold text-emerald-400">24/7</h3>
              <p className="text-slate-400 mt-1 text-sm">Market Monitoring</p>
            </div>

            <div className="bg-slate-900/70 border border-slate-800 rounded-2xl p-5 backdrop-blur-xl">
              <h3 className="text-3xl font-bold text-emerald-400">AI</h3>
              <p className="text-slate-400 mt-1 text-sm">Trade Intelligence</p>
            </div>
          </div>
        </div>

        {/* Upload Card */}
        <div className="relative">
          <div className="absolute inset-0 bg-emerald-500/20 blur-3xl rounded-full"></div>

          <div id="upload-section" className="relative bg-slate-900/80 border border-slate-800 rounded-3xl p-8 backdrop-blur-2xl shadow-2xl">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="text-2xl font-bold">Upload Chart Screenshot</h2>
                <p className="text-slate-400 mt-1">PNG, JPG or WEBP supported</p>
              </div>

              <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 flex items-center justify-center text-emerald-400 text-2xl">📈</div>
            </div>

            <div className="border-2 border-dashed border-slate-700 hover:border-emerald-500 transition-all rounded-3xl p-6 text-center bg-slate-950/40">
              <div className="text-6xl mb-4">☁️</div>

              <h3 className="text-xl font-semibold">Drag & Drop Chart Image</h3>

              <p className="text-slate-400 mt-2 mb-4">Or click below to upload your forex chart screenshot</p>

              <div className="max-w-full">
                <UploadForm />
              </div>
            </div>

            {/* Results area will be rendered by UploadForm; keep placeholder cards for initial state */}
            <div className="grid grid-cols-2 gap-4 mt-6">
              <div className="bg-slate-950 border border-slate-800 rounded-2xl p-5" aria-hidden>
                <p className="text-slate-400 text-sm">RSI</p>
                <h3 className="text-2xl font-bold mt-2">—</h3>
                <span className="text-slate-400 text-sm">Waiting for upload</span>
              </div>

              <div className="bg-slate-950 border border-slate-800 rounded-2xl p-5" aria-hidden>
                <p className="text-slate-400 text-sm">MACD</p>
                <h3 className="text-2xl font-bold mt-2">—</h3>
                <span className="text-slate-400 text-sm">Waiting for upload</span>
              </div>
            </div>

            <div className="mt-6 bg-gradient-to-r from-emerald-500 to-green-400 rounded-2xl p-6 text-black" aria-hidden>
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-semibold opacity-80">AI Trade Signal</p>

                  <h2 className="text-4xl font-black mt-2">—</h2>
                </div>

                <div className="text-right">
                  <p className="font-semibold opacity-80">Confidence</p>

                  <h3 className="text-3xl font-black mt-2">—</h3>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="max-w-7xl mx-auto px-6 pb-20">
        <div className="text-center mb-14">
          <h2 className="text-4xl font-black">Powerful Trading Features</h2>

          <p className="text-slate-400 mt-4 max-w-2xl mx-auto">Everything you need to analyze forex charts using AI and technical indicators.</p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
          {[
            {
              title: 'Candlestick Recognition',
              desc: 'Detect chart patterns automatically.',
              icon: '📊',
            },
            {
              title: 'AI Trade Signals',
              desc: 'Receive BUY, SELL and HOLD signals.',
              icon: '🤖',
            },
            {
              title: 'Technical Indicators',
              desc: 'RSI, MACD, Bollinger Bands and more.',
              icon: '📈',
            },
            {
              title: 'Market Sentiment',
              desc: 'Track bullish and bearish sentiment.',
              icon: '🌍',
            },
          ].map((feature) => (
            <div
              key={feature.title}
              className="bg-slate-900/70 border border-slate-800 rounded-3xl p-6 hover:border-emerald-500/40 hover:-translate-y-1 transition-all"
            >
              <div className="text-5xl mb-5">{feature.icon}</div>

              <h3 className="text-xl font-bold mb-3">{feature.title}</h3>

              <p className="text-slate-400 leading-relaxed">{feature.desc}</p>
            </div>
          ))}
        </div>
      </section>
    </div>
  )
}
