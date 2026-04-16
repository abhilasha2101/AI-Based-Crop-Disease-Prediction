import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { dashboardApi } from '../services/api';
import {
  Upload, Activity, AlertTriangle, CloudSun,
  TrendingUp, ArrowRight
} from 'lucide-react';
import { Link } from 'react-router-dom';

export default function DashboardPage() {
  const { user } = useAuth();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadDashboard();
  }, []);

  const loadDashboard = async () => {
    try {
      const res = await dashboardApi.get();
      setData(res.data.data);
    } catch (err) {
      console.error('Dashboard load failed:', err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="page-container">
        <div className="loading-overlay">
          <div className="spinner spinner-lg" />
          <p className="loading-text">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  const stats = data?.stats || {};
  const weather = data?.weather;
  const mandiSummary = data?.mandiSummary || {};

  return (
    <div className="page-container">
      <div className="page-header">
        <h1>Welcome back, {user?.name?.split(' ')[0]} 👋</h1>
        <p>Here's an overview of your crop health monitoring</p>
      </div>

      {/* Stats */}
      <div className="stats-grid stagger-children">
        <div className="stat-card green animate-fadein">
          <div className="stat-icon"><Upload size={22} /></div>
          <div className="stat-value">{stats.totalUploads || 0}</div>
          <div className="stat-label">Images Uploaded</div>
        </div>
        <div className="stat-card blue animate-fadein">
          <div className="stat-icon"><Activity size={22} /></div>
          <div className="stat-value">{stats.totalPredictions || 0}</div>
          <div className="stat-label">Predictions Made</div>
        </div>
        <div className="stat-card red animate-fadein">
          <div className="stat-icon"><AlertTriangle size={22} /></div>
          <div className="stat-value">{stats.highRiskCount || 0}</div>
          <div className="stat-label">High Risk Alerts</div>
        </div>
        <div className="stat-card amber animate-fadein">
          <div className="stat-icon"><TrendingUp size={22} /></div>
          <div className="stat-value">4</div>
          <div className="stat-label">Crops Supported</div>
        </div>
      </div>

      <div className="content-grid">
        <div>
          {/* Quick Actions */}
          <div className="card" style={{ marginBottom: 24 }}>
            <div className="card-header">
              <h3 className="card-title">Quick Actions</h3>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
              <Link to="/predict" className="btn btn-primary" style={{ justifyContent: 'space-between' }}>
                <span style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <Activity size={18} /> Predict Disease
                </span>
                <ArrowRight size={16} />
              </Link>
              <Link to="/detect" className="btn btn-secondary" style={{ justifyContent: 'space-between' }}>
                <span style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <Upload size={18} /> Upload Image
                </span>
                <ArrowRight size={16} />
              </Link>
            </div>
          </div>

          {/* Recent Results */}
          <div className="card">
            <div className="card-header">
              <h3 className="card-title">Recent Predictions</h3>
              <Link to="/predict" style={{ color: 'var(--primary-600)', fontSize: '0.85rem', fontWeight: 600 }}>
                View All →
              </Link>
            </div>
            {data?.recentResults?.length > 0 ? (
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Crop</th>
                    <th>Disease</th>
                    <th>Risk</th>
                    <th>Type</th>
                  </tr>
                </thead>
                <tbody>
                  {data.recentResults.map((r, i) => (
                    <tr key={i}>
                      <td style={{ textTransform: 'capitalize' }}>{r.cropType}</td>
                      <td>{r.diseaseName}</td>
                      <td>
                        <span className={`badge ${r.riskLevel === 'HIGH' ? 'badge-danger' : r.riskLevel === 'MEDIUM' ? 'badge-warning' : 'badge-success'}`}>
                          {r.riskLevel}
                        </span>
                      </td>
                      <td><span className="badge badge-info">{r.predictionType}</span></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            ) : (
              <div style={{ textAlign: 'center', padding: 32, color: 'var(--gray-400)' }}>
                <Activity size={40} style={{ marginBottom: 8, opacity: 0.3 }} />
                <p>No predictions yet. Start by predicting disease risk!</p>
              </div>
            )}
          </div>
        </div>

        <div>
          {/* Weather Card */}
          {weather && (
            <div className="weather-card" style={{ marginBottom: 24 }}>
              <div className="location">{weather.district}, {weather.state}</div>
              <div className="condition" style={{ textTransform: 'capitalize' }}>{weather.description}</div>
              <div className="temp">{Math.round(weather.temperature || 0)}°C</div>
              <div className="weather-stats">
                <div className="weather-stat">
                  <div className="label">Humidity</div>
                  <div className="value">{Math.round(weather.humidity || 0)}%</div>
                </div>
                <div className="weather-stat">
                  <div className="label">Rainfall</div>
                  <div className="value">{(weather.rainfall || 0).toFixed(1)}mm</div>
                </div>
                <div className="weather-stat">
                  <div className="label">Wind</div>
                  <div className="value">{(weather.windSpeed || 0).toFixed(1)}km/h</div>
                </div>
              </div>
            </div>
          )}

          {/* Mandi Summary */}
          <div className="card">
            <div className="card-header">
              <h3 className="card-title">Mandi Prices</h3>
              <Link to="/mandi" style={{ color: 'var(--primary-600)', fontSize: '0.85rem', fontWeight: 600 }}>
                View All →
              </Link>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {Object.entries(mandiSummary).map(([crop, info]) => (
                <div key={crop} style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '10px 12px',
                  background: 'var(--gray-50)',
                  borderRadius: 'var(--radius-md)',
                }}>
                  <span style={{ textTransform: 'capitalize', fontWeight: 600, fontSize: '0.9rem' }}>
                    {crop === 'rice' ? '🍚' : crop === 'tea' ? '🍵' : crop === 'makhana' ? '🫘' : '🥔'} {crop}
                  </span>
                  <span style={{ fontFamily: 'var(--font-primary)', fontWeight: 700, color: 'var(--primary-700)' }}>
                    ₹{info?.latest?.modalPrice?.toLocaleString() || 'N/A'}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
