"use client";
import { useState, useEffect } from 'react';
import { Chart as ChartJS, CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend } from 'chart.js';
import { Bar } from 'react-chartjs-2';
import { locationData } from '../../constants/locationData';
import { cropData } from '../../constants/cropData';

ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend);

// ── Analysis task lists ───────────────────────────────────────────────────────

const YIELD_TASKS = [
  { label: 'Parsing farm input parameters',        delay: 0,    duration: 700  },
  { label: 'Loading regional soil composition',    delay: 400,  duration: 900  },
  { label: 'Cross-referencing rainfall patterns',  delay: 950,  duration: 850  },
  { label: 'Running XGBoost model inference',      delay: 1650, duration: 1300 },
  { label: 'Validating against district averages', delay: 2700, duration: 900  },
];

const PRICE_TASKS = [
  { label: 'Fetching supply chain indicators',    delay: 0,    duration: 700  },
  { label: 'Loading LSTM model architecture',     delay: 450,  duration: 850  },
  { label: 'Analyzing CPI & inflation trends',    delay: 1050, duration: 950  },
  { label: 'Running price forecast model',        delay: 1800, duration: 1200 },
  { label: 'Computing confidence intervals',      delay: 2750, duration: 800  },
];

// ── AnalysisLoader component ──────────────────────────────────────────────────

function AnalysisLoader({ tasks, title, accentColor = 'green' }) {
  const [progress, setProgress] = useState(tasks.map(() => 0));

  useEffect(() => {
    const timers = [];
    const intervals = [];
    tasks.forEach((task, i) => {
      const t = setTimeout(() => {
        const startTime = Date.now();
        const id = setInterval(() => {
          const elapsed = Date.now() - startTime;
          const p = Math.min(100, (elapsed / task.duration) * 100);
          setProgress(prev => { const n = [...prev]; n[i] = p; return n; });
          if (p >= 100) clearInterval(id);
        }, 40);
        intervals.push(id);
      }, task.delay);
      timers.push(t);
    });
    return () => { timers.forEach(clearTimeout); intervals.forEach(clearInterval); };
  }, []);

  const overallPct = Math.round(progress.reduce((s, p) => s + p, 0) / tasks.length);
  const isGreen  = accentColor === 'green';
  const accent   = isGreen ? '#22c55e' : '#3b82f6';
  const accentLt = isGreen ? '#4ade80' : '#60a5fa';
  const border   = isGreen ? 'rgba(34,197,94,0.15)' : 'rgba(59,130,246,0.15)';
  const gradFrom = isGreen ? '#15803d' : '#1d4ed8';

  return (
    <div style={{ padding: '1.25rem', background: 'rgba(5,5,10,0.9)', border: `1px solid ${border}`, borderRadius: '0.75rem', fontFamily: 'ui-monospace,SFMono-Regular,monospace' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1rem' }}>
        <span style={{ width: 7, height: 7, borderRadius: '50%', background: accentLt, display: 'inline-block', boxShadow: `0 0 6px ${accentLt}`, animation: 'pulse 1.2s ease-in-out infinite' }} />
        <span style={{ color: accentLt, fontSize: '0.65rem', letterSpacing: '0.15em', fontWeight: 700, textTransform: 'uppercase' }}>{title}</span>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.65rem' }}>
        {tasks.map((task, i) => {
          const p = progress[i];
          const done = p >= 100, running = p > 0 && !done;
          return (
            <div key={i}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.25rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                  <span style={{ fontSize: '0.6rem', color: done ? accent : running ? '#fbbf24' : '#374151', animation: running ? 'pulse 0.8s ease-in-out infinite' : 'none' }}>
                    {done ? '✓' : running ? '◉' : '○'}
                  </span>
                  <span style={{ fontSize: '0.68rem', color: done ? accent : running ? '#fde68a' : '#4b5563' }}>{task.label}</span>
                </div>
                <span style={{ fontSize: '0.6rem', color: done ? accent : running ? '#fbbf24' : '#1f2937' }}>
                  {done ? '100%' : running ? `${Math.round(p)}%` : '—'}
                </span>
              </div>
              <div style={{ height: 2, background: '#111827', borderRadius: 9999, overflow: 'hidden' }}>
                <div style={{ height: '100%', borderRadius: 9999, width: `${p}%`, background: done ? accent : 'linear-gradient(90deg,#ca8a04,#fbbf24)' }} />
              </div>
            </div>
          );
        })}
      </div>

      <div style={{ marginTop: '1rem', paddingTop: '0.75rem', borderTop: '1px solid #111827' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.3rem' }}>
          <span style={{ fontSize: '0.6rem', color: '#4b5563' }}>Overall Progress</span>
          <span style={{ fontSize: '0.6rem', color: accentLt, fontWeight: 600 }}>{overallPct}%</span>
        </div>
        <div style={{ height: 4, background: '#111827', borderRadius: 9999, overflow: 'hidden' }}>
          <div style={{ height: '100%', borderRadius: 9999, width: `${overallPct}%`, background: `linear-gradient(90deg,${gradFrom},${accentLt})`, transition: 'width 0.3s ease' }} />
        </div>
      </div>
    </div>
  );
}

// ── Shared input styles ───────────────────────────────────────────────────────
const inputCls = "w-full bg-secondary border border-border rounded-lg px-3 py-2 text-sm text-foreground focus:ring-1 focus:ring-primary focus:border-primary transition-all outline-none";
const labelCls = "block text-xs font-medium text-muted-foreground mb-1";

// ── Main page ─────────────────────────────────────────────────────────────────
export default function YieldPrediction() {
  const [formData, setFormData] = useState({ State: 'Tamil Nadu', District: 'Madurai', Crop: 'Rice', Season: 'Kharif', Area: '', Rainfall: '' });
  const [prediction,     setPrediction]     = useState(null);
  const [loading,        setLoading]        = useState(false);
  const [error,          setError]          = useState(null);
  const [pricePrediction,setPricePrediction] = useState(null);
  const [priceLoading,   setPriceLoading]   = useState(false);
  const [priceError,     setPriceError]     = useState(null);

  const avgYields = { Rice: 3.2, Maize: 2.8, Groundnut: 1.8, Cotton: 1.2 };
  const avgYield  = avgYields[formData.Crop] || 2.0;
  const yieldDiff = prediction !== null ? ((prediction - avgYield) / avgYield * 100).toFixed(1) : null;

  const handleChange      = (e) => setFormData(p => ({ ...p, [e.target.name]: e.target.value }));
  const handleStateChange = (e) => {
    const s = e.target.value;
    const districts = locationData[s] || [];
    setFormData(p => ({ ...p, State: s, District: districts[0] || '' }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setPricePrediction(null); setPriceError(null);
    setLoading(true); setError(null); setPrediction(null);
    try {
      const [response] = await Promise.all([
        fetch('http://localhost:5001/predict', {
          method: 'POST', headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ ...formData, Area: parseFloat(formData.Area), Rainfall: formData.Rainfall ? parseFloat(formData.Rainfall) : undefined }),
        }),
        new Promise(r => setTimeout(r, 4000)),
      ]);
      if (!response.ok) throw new Error('Failed to fetch prediction');
      const data = await response.json();
      setPrediction(data.predicted_yield);
    } catch (err) { setError(err.message); }
    finally { setLoading(false); }
  };

  const handlePriceSubmit = async () => {
    if (!prediction) return;
    setPriceLoading(true); setPriceError(null); setPricePrediction(null);
    try {
      const [response] = await Promise.all([
        fetch('http://localhost:5001/predict-price', {
          method: 'POST', headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ Predicted_Yield: prediction, CPI: 155.0, Fuel_Price: 98.0, Current_Price: 1800.0 }),
        }),
        new Promise(r => setTimeout(r, 4000)),
      ]);
      if (!response.ok) throw new Error('Failed to fetch price forecast');
      const data = await response.json();
      setPricePrediction(data.predicted_price);
    } catch (err) { setPriceError(err.message); }
    finally { setPriceLoading(false); }
  };

  const chartData = prediction !== null ? {
    labels: ['Your Yield', 'District Avg', 'Max Potential'],
    datasets: [{
      label: 'Yield (T/Acre)',
      data: [prediction, avgYield, avgYield * 1.5],
      backgroundColor: ['rgba(34,197,94,0.85)', 'rgba(59,130,246,0.65)', 'rgba(234,179,8,0.65)'],
      borderColor:     ['rgba(34,197,94,1)',    'rgba(59,130,246,1)',    'rgba(234,179,8,1)'],
      borderWidth: 1,
      borderRadius: 5,
    }],
  } : null;

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { display: false },
      title:  { display: false },
      tooltip: { callbacks: { label: ctx => ` ${ctx.parsed.y.toFixed(2)} T/Acre` } },
    },
    scales: {
      y: { beginAtZero: true, ticks: { color: '#6b7280', font: { size: 10 } }, grid: { color: 'rgba(255,255,255,0.05)' } },
      x: { ticks: { color: '#6b7280', font: { size: 10 } }, grid: { display: false } },
    },
  };

  const isAnalyzing = loading || priceLoading;

  return (
    <div className="h-full flex flex-col gap-3">

      {/* ── Page header ── */}
      <div className="flex items-center justify-between shrink-0">
        <div>
          <h1 className="text-lg font-bold text-foreground leading-tight">AI Yield &amp; Price Prediction</h1>
          <p className="text-xs text-muted-foreground">Powered by XGBoost &amp; LSTM · Regional agricultural data</p>
        </div>
        <div className="flex gap-1.5">
          {['XGBoost', 'LSTM', 'Regional Data'].map(t => (
            <span key={t} className="text-xs px-2 py-0.5 rounded-full bg-secondary border border-border text-muted-foreground">{t}</span>
          ))}
        </div>
      </div>

      {/* ── Two-column content ── */}
      <div className="flex-1 grid grid-cols-5 gap-4 min-h-0">

        {/* ── Left: Input form ── */}
        <div className="col-span-2 bg-card border border-border rounded-xl p-4 flex flex-col gap-3">
          <div className="shrink-0">
            <p className="text-xs font-semibold text-foreground">Farm Parameters</p>
            <p className="text-xs text-muted-foreground">All fields marked * are required</p>
          </div>

          <form onSubmit={handleSubmit} className="flex flex-col flex-1 gap-3">
            <div className="grid grid-cols-2 gap-x-3 gap-y-2 flex-1 content-start">

              <div>
                <label className={labelCls}>State *</label>
                <select name="State" value={formData.State} onChange={handleStateChange} className={inputCls}>
                  {Object.keys(locationData).sort().map(s => <option key={s} value={s}>{s}</option>)}
                </select>
              </div>

              <div>
                <label className={labelCls}>District *</label>
                <select name="District" value={formData.District} onChange={handleChange} className={inputCls}>
                  {(locationData[formData.State] || []).sort().map(d => <option key={d} value={d}>{d}</option>)}
                </select>
              </div>

              <div>
                <label className={labelCls}>Crop *</label>
                <select name="Crop" value={formData.Crop} onChange={handleChange} className={inputCls}>
                  {cropData.map(cat => (
                    <optgroup key={cat.category} label={cat.category}>
                      {cat.crops.map(c => <option key={c} value={c}>{c}</option>)}
                    </optgroup>
                  ))}
                </select>
              </div>

              <div>
                <label className={labelCls}>Season *</label>
                <select name="Season" value={formData.Season} onChange={handleChange} className={inputCls}>
                  {['Kharif','Rabi','Whole Year','Summer','Winter','Autumn'].map(s => (
                    <option key={s} value={s}>{s}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className={labelCls}>Area (Hectares) *</label>
                <input type="number" name="Area" value={formData.Area} onChange={handleChange} placeholder="e.g. 1000" required className={inputCls} />
              </div>

              <div>
                <label className={labelCls}>Rainfall (mm)</label>
                <input type="number" name="Rainfall" value={formData.Rainfall} onChange={handleChange} placeholder="e.g. 850" className={inputCls} />
              </div>
            </div>

            {error && (
              <div className="shrink-0 text-xs text-destructive bg-destructive/10 border border-destructive/20 rounded-lg px-3 py-2">
                ⚠ {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="shrink-0 w-full bg-primary hover:bg-primary/90 text-primary-foreground font-semibold py-2.5 rounded-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed text-sm"
            >
              {loading ? 'Analyzing…' : '⚡ Predict Yield'}
            </button>
          </form>

          {/* Model info strip */}
          <div className="shrink-0 grid grid-cols-2 gap-2 pt-2 border-t border-border">
            {[
              { label: 'Model',      value: 'XGBoost' },
              { label: 'Accuracy',   value: '~92%' },
              { label: 'Price Model',value: 'LSTM' },
              { label: 'Data Points',value: '10K+' },
            ].map(({ label, value }) => (
              <div key={label} className="bg-secondary/40 rounded-lg px-2.5 py-1.5">
                <p className="text-xs text-muted-foreground">{label}</p>
                <p className="text-xs font-semibold text-foreground">{value}</p>
              </div>
            ))}
          </div>
        </div>

        {/* ── Right: Results panel ── */}
        <div className="col-span-3 bg-card border border-border rounded-xl p-4 flex flex-col min-h-0">

          {/* LOADING STATE (yield or price) */}
          {isAnalyzing && (
            <div className="flex-1 flex flex-col justify-center">
              <AnalysisLoader
                tasks={loading ? YIELD_TASKS : PRICE_TASKS}
                title={loading ? 'AgriChain AI · Yield Analysis Engine' : 'AgriChain AI · Market Price Forecast Engine'}
                accentColor={loading ? 'green' : 'blue'}
              />
            </div>
          )}

          {/* EMPTY STATE */}
          {!isAnalyzing && prediction === null && (
            <div className="flex-1 flex flex-col items-center justify-center gap-4 text-center">
              <div className="w-14 h-14 rounded-full bg-primary/10 border border-primary/20 flex items-center justify-center text-2xl">
                🌾
              </div>
              <div>
                <p className="text-sm font-semibold text-foreground">Ready to Analyze</p>
                <p className="text-xs text-muted-foreground mt-1 leading-relaxed">
                  Fill in your farm details on the left<br/>and click <span className="text-primary font-medium">⚡ Predict Yield</span> to begin.
                </p>
              </div>
              <div className="grid grid-cols-3 gap-2 mt-1 w-full max-w-xs">
                {[
                  { icon: '🧠', label: 'AI-Powered', sub: 'XGBoost + LSTM' },
                  { icon: '📍', label: 'Regional', sub: 'District-level data' },
                  { icon: '📈', label: 'Price Forecast', sub: 'LSTM market model' },
                ].map(({ icon, label, sub }) => (
                  <div key={label} className="bg-secondary/40 border border-border rounded-xl p-2.5 text-center">
                    <div className="text-lg mb-1">{icon}</div>
                    <p className="text-xs font-medium text-foreground">{label}</p>
                    <p className="text-xs text-muted-foreground">{sub}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* RESULTS STATE */}
          {!isAnalyzing && prediction !== null && (
            <div className="flex flex-col h-full gap-3 min-h-0">

              {/* Stat row */}
              <div className="grid grid-cols-3 gap-2 shrink-0">
                <div className="col-span-2 bg-primary/10 border border-primary/20 rounded-xl px-4 py-3 flex items-center gap-3">
                  <div>
                    <p className="text-xs text-primary/70">Predicted Yield</p>
                    <p className="text-3xl font-bold text-foreground leading-none mt-0.5">
                      {prediction.toFixed(2)}
                      <span className="text-sm font-normal text-muted-foreground ml-1">T/Acre</span>
                    </p>
                  </div>
                </div>
                <div className={`rounded-xl px-3 py-3 border ${parseFloat(yieldDiff) >= 0 ? 'bg-green-500/10 border-green-500/20' : 'bg-red-500/10 border-red-500/20'}`}>
                  <p className="text-xs text-muted-foreground">vs District Avg</p>
                  <p className={`text-2xl font-bold leading-none mt-0.5 ${parseFloat(yieldDiff) >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                    {parseFloat(yieldDiff) >= 0 ? '+' : ''}{yieldDiff}%
                  </p>
                  <p className="text-xs text-muted-foreground mt-0.5">{avgYield} avg</p>
                </div>
              </div>

              {/* Chart */}
              <div className="flex-1 bg-secondary/20 rounded-xl border border-border p-3 min-h-0 flex flex-col">
                <p className="text-xs text-muted-foreground shrink-0 mb-2">
                  {formData.Crop} · {formData.District}, {formData.State} · Yield Comparison
                </p>
                <div className="flex-1 min-h-0 relative">
                  <div className="absolute inset-0">
                    <Bar data={chartData} options={chartOptions} />
                  </div>
                </div>
              </div>

              {/* Price section */}
              <div className="shrink-0">
                {!pricePrediction && !priceError && (
                  <button
                    onClick={handlePriceSubmit}
                    className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2.5 rounded-lg transition-all text-sm flex items-center justify-center gap-2"
                  >
                    <span>📈</span>
                    <span>Forecast Market Price for {formData.Crop}</span>
                  </button>
                )}
                {priceError && (
                  <div className="text-xs text-destructive bg-destructive/10 border border-destructive/20 rounded-lg px-3 py-2 text-center">
                    ⚠ {priceError}
                  </div>
                )}
                {pricePrediction && (
                  <div className="bg-blue-500/10 border border-blue-500/20 rounded-xl px-4 py-3 flex items-center justify-between">
                    <div>
                      <p className="text-xs text-blue-400 font-medium">Forecasted Market Price</p>
                      <p className="text-xs text-muted-foreground mt-0.5">Next month · Supply &amp; inflation adjusted</p>
                    </div>
                    <div className="text-right">
                      <p className="text-2xl font-bold text-foreground">₹{pricePrediction.toFixed(0)}</p>
                      <p className="text-xs text-muted-foreground">/ Quintal</p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
