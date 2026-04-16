import { useState, useEffect } from 'react';
import { weatherApi } from '../services/api';
import { CloudSun, Droplets, Wind, Thermometer, Search } from 'lucide-react';

export default function WeatherPage() {
  const [districts, setDistricts] = useState([]);
  const [weatherData, setWeatherData] = useState([]);
  const [search, setSearch] = useState('');
  const [selected, setSelected] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadWeather();
  }, []);

  const loadWeather = async () => {
    try {
      const [distRes, allRes] = await Promise.all([
        weatherApi.getDistricts(),
        weatherApi.getAll(),
      ]);
      setDistricts(distRes.data.data || []);
      setWeatherData(allRes.data.data || []);
      if (allRes.data.data?.length > 0) setSelected(allRes.data.data[0]);
    } catch (err) {
      console.error('Weather load failed:', err);
    } finally {
      setLoading(false);
    }
  };

  const filtered = weatherData.filter((w) =>
    w.district?.toLowerCase().includes(search.toLowerCase()) ||
    w.state?.toLowerCase().includes(search.toLowerCase())
  );

  if (loading) {
    return (
      <div className="page-container">
        <div className="loading-overlay">
          <div className="spinner spinner-lg" />
          <p className="loading-text">Fetching weather data...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="page-container">
      <div className="page-header">
        <h1>🌤️ Weather Data</h1>
        <p>Real-time weather for major districts across India</p>
      </div>

      <div className="content-grid">
        <div>
          {/* Search */}
          <div style={{ position: 'relative', marginBottom: 20 }}>
            <Search size={18} style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', color: 'var(--gray-400)' }} />
            <input
              type="text"
              className="form-input"
              placeholder="Search district or state..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              style={{ paddingLeft: 42 }}
            />
          </div>

          {/* District List */}
          <div className="card" style={{ maxHeight: 600, overflowY: 'auto', padding: 0 }}>
            {filtered.map((w, i) => (
              <div
                key={i}
                onClick={() => setSelected(w)}
                style={{
                  padding: '14px 20px',
                  cursor: 'pointer',
                  borderBottom: '1px solid var(--gray-100)',
                  background: selected?.district === w.district ? 'var(--primary-50)' : 'white',
                  borderLeft: selected?.district === w.district ? '3px solid var(--primary-500)' : '3px solid transparent',
                  transition: 'all 150ms ease',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                }}
              >
                <div>
                  <div style={{ fontWeight: 600, fontSize: '0.9rem' }}>{w.district}</div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--gray-500)' }}>{w.state}</div>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <div style={{ fontFamily: 'var(--font-primary)', fontSize: '1.2rem', fontWeight: 700 }}>
                    {Math.round(w.temperature || 0)}°C
                  </div>
                  <div style={{ fontSize: '0.7rem', color: 'var(--gray-500)' }}>
                    {Math.round(w.humidity || 0)}% humidity
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div>
          {selected && (
            <div className="animate-fadein">
              {/* Main Weather Card */}
              <div className="weather-card" style={{ marginBottom: 20 }}>
                <div className="location">{selected.district}</div>
                <div className="condition">{selected.state}</div>
                <div style={{ display: 'flex', alignItems: 'flex-end', gap: 12, marginTop: 12 }}>
                  <div className="temp">{Math.round(selected.temperature || 0)}°</div>
                  <span style={{ opacity: 0.6, fontSize: '0.9rem', paddingBottom: 8, textTransform: 'capitalize' }}>
                    {selected.description}
                  </span>
                </div>
                <div className="weather-stats">
                  <div className="weather-stat">
                    <div className="label">💧 Humidity</div>
                    <div className="value">{Math.round(selected.humidity || 0)}%</div>
                  </div>
                  <div className="weather-stat">
                    <div className="label">🌧️ Rainfall</div>
                    <div className="value">{(selected.rainfall || 0).toFixed(1)}mm</div>
                  </div>
                  <div className="weather-stat">
                    <div className="label">💨 Wind</div>
                    <div className="value">{(selected.windSpeed || 0).toFixed(1)}km/h</div>
                  </div>
                </div>
              </div>

              {/* Disease Risk Assessment */}
              <div className="card">
                <h3 className="card-title" style={{ marginBottom: 16 }}>Disease Risk Assessment</h3>
                <p style={{ fontSize: '0.85rem', color: 'var(--gray-600)', marginBottom: 12 }}>
                  Based on current conditions in {selected.district}:
                </p>

                {/* Risk indicators based on weather */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  <RiskItem
                    label="Fungal Disease Risk"
                    level={selected.humidity > 80 ? 'HIGH' : selected.humidity > 60 ? 'MEDIUM' : 'LOW'}
                    reason={`Humidity: ${Math.round(selected.humidity)}%`}
                  />
                  <RiskItem
                    label="Bacterial Blight Risk"
                    level={selected.temperature > 28 && selected.humidity > 75 ? 'HIGH' : 'LOW'}
                    reason={`Temp: ${Math.round(selected.temperature)}°C`}
                  />
                  <RiskItem
                    label="Pest Infestation Risk"
                    level={selected.temperature > 30 && selected.humidity < 50 ? 'MEDIUM' : 'LOW'}
                    reason={`Heat + dry conditions`}
                  />
                </div>

                <div style={{ marginTop: 16 }}>
                  <p style={{ fontSize: '0.75rem', color: 'var(--gray-400)' }}>
                    Lat: {selected.latitude?.toFixed(4)} • Lon: {selected.longitude?.toFixed(4)}
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function RiskItem({ label, level, reason }) {
  return (
    <div style={{
      display: 'flex', justifyContent: 'space-between', alignItems: 'center',
      padding: '10px 12px', background: 'var(--gray-50)', borderRadius: 'var(--radius-md)',
    }}>
      <div>
        <div style={{ fontWeight: 600, fontSize: '0.85rem' }}>{label}</div>
        <div style={{ fontSize: '0.75rem', color: 'var(--gray-500)' }}>{reason}</div>
      </div>
      <span className={`badge ${level === 'HIGH' ? 'badge-danger' : level === 'MEDIUM' ? 'badge-warning' : 'badge-success'}`}>
        {level}
      </span>
    </div>
  );
}
