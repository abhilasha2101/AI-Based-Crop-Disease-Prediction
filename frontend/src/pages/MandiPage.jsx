import { useState, useEffect } from 'react';
import { mandiApi } from '../services/api';
import { TrendingUp, ArrowUp, ArrowDown, IndianRupee } from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';

const CROPS = ['Rice', 'Potato', 'Tea', 'Makhana'];
const CROP_COLORS = { Rice: '#10b981', Potato: '#f59e0b', Tea: '#8b5cf6', Makhana: '#3b82f6' };

export default function MandiPage() {
  const [crop, setCrop] = useState('Rice');
  const [prices, setPrices] = useState([]);
  const [trend, setTrend] = useState([]);
  const [summary, setSummary] = useState({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, [crop]);

  const loadData = async () => {
    setLoading(true);
    try {
      const [priceRes, trendRes, summaryRes] = await Promise.all([
        mandiApi.getLatest(crop),
        mandiApi.getTrends(crop, 30),
        mandiApi.getSummary(),
      ]);
      setPrices(priceRes.data.data || []);
      setTrend(trendRes.data.data || []);
      setSummary(summaryRes.data.data || {});
    } catch (err) {
      console.error('Mandi data load failed:', err);
    } finally {
      setLoading(false);
    }
  };

  // Process trend data for chart
  const chartData = trend.reduce((acc, item) => {
    const dateStr = item.date;
    const existing = acc.find(d => d.date === dateStr);
    if (existing) {
      existing[item.market] = item.modalPrice;
    } else {
      acc.push({ date: dateStr, [item.market]: item.modalPrice });
    }
    return acc;
  }, []).slice(-15);

  const markets = [...new Set(trend.map(t => t.market))];
  const marketColors = ['#10b981', '#f59e0b', '#8b5cf6', '#3b82f6', '#ef4444'];

  return (
    <div className="page-container">
      <div className="page-header">
        <h1>📊 Mandi Prices</h1>
        <p>Track current mandi prices and trends for Rice, Tea, Makhana, and Potato</p>
      </div>

      {/* Crop Summary Cards */}
      <div className="stats-grid stagger-children" style={{ marginBottom: 28 }}>
        {CROPS.map((c) => {
          const info = summary[c.toLowerCase()];
          return (
            <div
              key={c}
              className={`stat-card ${crop === c ? 'green' : ''} animate-fadein`}
              onClick={() => setCrop(c)}
              style={{
                cursor: 'pointer',
                border: crop === c ? '2px solid var(--primary-500)' : '1px solid var(--gray-200)',
              }}
            >
              <div style={{ fontSize: '1.4rem', marginBottom: 4 }}>
                {c === 'Rice' ? '🍚' : c === 'Potato' ? '🥔' : c === 'Tea' ? '🍵' : '🫘'}
              </div>
              <div className="stat-label">{c}</div>
              <div className="stat-value" style={{ fontSize: '1.4rem' }}>
                ₹{info?.latest?.modalPrice?.toLocaleString() || 'N/A'}
              </div>
              <div style={{ fontSize: '0.72rem', color: 'var(--gray-400)' }}>
                per {info?.latest?.unit || 'Quintal'}
              </div>
            </div>
          );
        })}
      </div>

      {loading ? (
        <div className="card">
          <div className="loading-overlay">
            <div className="spinner spinner-lg" />
            <p className="loading-text">Loading prices...</p>
          </div>
        </div>
      ) : (
        <div className="content-grid">
          <div>
            {/* Price Trend Chart */}
            <div className="card" style={{ marginBottom: 24 }}>
              <div className="card-header">
                <h3 className="card-title">{crop} Price Trend (30 days)</h3>
                <span className="badge badge-info">{markets.length} markets</span>
              </div>
              {chartData.length > 0 ? (
                <ResponsiveContainer width="100%" height={320}>
                  <LineChart data={chartData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                    <XAxis
                      dataKey="date"
                      tick={{ fontSize: 11 }}
                      tickFormatter={(val) => {
                        const d = new Date(val);
                        return `${d.getDate()}/${d.getMonth() + 1}`;
                      }}
                    />
                    <YAxis tick={{ fontSize: 11 }} />
                    <Tooltip
                      formatter={(val) => [`₹${val?.toLocaleString()}`, '']}
                      labelFormatter={(label) => `Date: ${label}`}
                    />
                    <Legend />
                    {markets.map((market, i) => (
                      <Line
                        key={market}
                        type="monotone"
                        dataKey={market}
                        stroke={marketColors[i % marketColors.length]}
                        strokeWidth={2}
                        dot={false}
                        name={market}
                      />
                    ))}
                  </LineChart>
                </ResponsiveContainer>
              ) : (
                <p style={{ textAlign: 'center', padding: 40, color: 'var(--gray-400)' }}>
                  No trend data available
                </p>
              )}
            </div>

            {/* Price Table */}
            <div className="card">
              <div className="card-header">
                <h3 className="card-title">Latest {crop} Prices</h3>
              </div>
              <div style={{ overflowX: 'auto' }}>
                <table className="data-table">
                  <thead>
                    <tr>
                      <th>Market</th>
                      <th>State</th>
                      <th>Min (₹)</th>
                      <th>Max (₹)</th>
                      <th>Modal (₹)</th>
                      <th>Date</th>
                    </tr>
                  </thead>
                  <tbody>
                    {prices.map((p, i) => (
                      <tr key={i}>
                        <td style={{ fontWeight: 600 }}>{p.market}</td>
                        <td>{p.state}</td>
                        <td>₹{p.minPrice?.toLocaleString()}</td>
                        <td>₹{p.maxPrice?.toLocaleString()}</td>
                        <td style={{ fontWeight: 700, color: 'var(--primary-700)' }}>₹{p.modalPrice?.toLocaleString()}</td>
                        <td style={{ fontSize: '0.8rem', color: 'var(--gray-500)' }}>{p.date}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>

          <div>
            {/* Market Info */}
            <div className="card">
              <h3 className="card-title" style={{ marginBottom: 16 }}>Market Overview</h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {prices.slice(0, 5).map((p, i) => (
                  <div key={i} style={{
                    padding: '12px', background: 'var(--gray-50)',
                    borderRadius: 'var(--radius-md)',
                  }}>
                    <div style={{ fontWeight: 600, fontSize: '0.9rem' }}>{p.market}</div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--gray-500)' }}>{p.district}, {p.state}</div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 6 }}>
                      <span style={{ fontSize: '0.8rem', color: 'var(--gray-600)' }}>{p.variety}</span>
                      <span style={{ fontFamily: 'var(--font-primary)', fontWeight: 700, color: 'var(--primary-700)' }}>
                        ₹{p.modalPrice?.toLocaleString()}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
