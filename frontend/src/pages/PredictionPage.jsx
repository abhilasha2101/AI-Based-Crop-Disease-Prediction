import { useState } from 'react';
import { cropApi } from '../services/api';
import { Activity, AlertTriangle, CheckCircle, Leaf } from 'lucide-react';

const CROPS = ['Rice', 'Potato', 'Tea', 'Makhana'];

export default function PredictionPage() {
  const [crop, setCrop] = useState('Rice');
  const [temp, setTemp] = useState(28);
  const [humidity, setHumidity] = useState(70);
  const [rainfall, setRainfall] = useState(10);
  const [waterDepth, setWaterDepth] = useState(1.0);
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);

  const handlePredict = async () => {
    setLoading(true);
    setResult(null);
    try {
      const res = await cropApi.predict({
        crop: crop.toLowerCase(),
        temperature: temp,
        humidity: humidity,
        rainfall: rainfall,
        waterDepth: crop === 'Makhana' ? waterDepth : 0.0,
      });
      setResult(res.data.data);
    } catch (err) {
      console.error('Prediction failed:', err);
    } finally {
      setLoading(false);
    }
  };

  const mlData = result?.mlResponse || result?.result || {};

  return (
    <div className="page-container">
      <div className="page-header">
        <h1>🔮 Disease Prediction</h1>
        <p>Predict if your crop could get a disease based on current weather conditions</p>
      </div>

      <div className="two-col-grid">
        {/* Input Panel */}
        <div className="card">
          <h3 className="card-title" style={{ marginBottom: 20 }}>Environmental Parameters</h3>

          {/* Crop Selection */}
          <div className="form-group">
            <label className="form-label">Select Crop</label>
            <div className="crop-selector">
              {CROPS.map((c) => (
                <button
                  key={c}
                  className={`crop-chip ${crop === c ? 'active' : ''}`}
                  onClick={() => setCrop(c)}
                >
                  {c === 'Rice' ? '🍚' : c === 'Potato' ? '🥔' : c === 'Tea' ? '🍵' : '🫘'} {c}
                </button>
              ))}
            </div>
          </div>

          {/* Temperature */}
          <div className="form-group">
            <label className="form-label" style={{ display: 'flex', justifyContent: 'space-between' }}>
              Temperature
              <span style={{ fontFamily: 'var(--font-primary)', fontWeight: 700, fontSize: '1.1rem', color: 'var(--gray-900)' }}>
                {temp}°C
              </span>
            </label>
            <input
              type="range"
              className="range-slider"
              min={5} max={45} value={temp}
              onChange={(e) => setTemp(Number(e.target.value))}
            />
          </div>

          {/* Humidity */}
          <div className="form-group">
            <label className="form-label" style={{ display: 'flex', justifyContent: 'space-between' }}>
              Humidity
              <span style={{ fontFamily: 'var(--font-primary)', fontWeight: 700, fontSize: '1.1rem', color: 'var(--gray-900)' }}>
                {humidity}%
              </span>
            </label>
            <input
              type="range"
              className="range-slider"
              min={20} max={100} value={humidity}
              onChange={(e) => setHumidity(Number(e.target.value))}
              style={{ accentColor: '#3b82f6' }}
            />
          </div>

          {/* Rainfall */}
          <div className="form-group">
            <label className="form-label" style={{ display: 'flex', justifyContent: 'space-between' }}>
              Rainfall
              <span style={{ fontFamily: 'var(--font-primary)', fontWeight: 700, fontSize: '1.1rem', color: 'var(--gray-900)' }}>
                {rainfall}mm
              </span>
            </label>
            <input
              type="range"
              className="range-slider"
              min={0} max={150} value={rainfall}
              onChange={(e) => setRainfall(Number(e.target.value))}
              style={{ accentColor: '#6366f1' }}
            />
          </div>

          {/* Water Depth (Makhana only) */}
          {crop === 'Makhana' && (
            <div className="form-group">
              <label className="form-label" style={{ display: 'flex', justifyContent: 'space-between' }}>
                Water Depth
                <span style={{ fontFamily: 'var(--font-primary)', fontWeight: 700, fontSize: '1.1rem', color: 'var(--gray-900)' }}>
                  {waterDepth}m
                </span>
              </label>
              <input
                type="range"
                className="range-slider"
                min={0} max={3} step={0.1} value={waterDepth}
                onChange={(e) => setWaterDepth(Number(e.target.value))}
                style={{ accentColor: '#06b6d4' }}
              />
            </div>
          )}

          <button
            id="predict-btn"
            className="btn btn-primary btn-lg btn-block"
            onClick={handlePredict}
            disabled={loading}
            style={{ marginTop: 8 }}
          >
            {loading ? (
              <><span className="spinner" /> Analyzing...</>
            ) : (
              <><Activity size={20} /> Run Disease Prediction</>
            )}
          </button>
        </div>

        {/* Results Panel */}
        <div>
          {loading && (
            <div className="card">
              <div className="loading-overlay">
                <div className="spinner spinner-lg" />
                <p className="loading-text">Analyzing weather patterns...</p>
              </div>
            </div>
          )}

          {!loading && result && (
            <div className="result-card animate-fadein">
              <div className={`result-header ${
                mlData.riskLevel === 'HIGH' ? 'high-risk' :
                mlData.riskLevel === 'MEDIUM' ? 'medium-risk' : 'low-risk'
              }`}>
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                    <span className={`badge ${
                      mlData.riskLevel === 'HIGH' ? 'badge-danger' :
                      mlData.riskLevel === 'MEDIUM' ? 'badge-warning' : 'badge-success'
                    }`}>
                      {mlData.riskLevel === 'HIGH' ? <AlertTriangle size={12} /> :
                       mlData.riskLevel === 'LOW' ? <CheckCircle size={12} /> : null}
                      {mlData.riskLevel || 'Unknown'}
                    </span>
                  </div>
                  <h2 style={{ fontSize: '1.5rem', color: 'var(--gray-900)' }}>
                    {mlData.diseaseName || mlData.disease_name || 'Unknown'}
                  </h2>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <div style={{ fontSize: '0.75rem', color: 'var(--gray-500)', textTransform: 'uppercase' }}>Confidence</div>
                  <div style={{ fontFamily: 'var(--font-primary)', fontSize: '1.8rem', fontWeight: 800, color: 'var(--gray-900)' }}>
                    {Math.round((mlData.confidence || 0) * 100)}%
                  </div>
                </div>
              </div>

              <div className="result-body">
                <div style={{ marginBottom: 8, fontSize: '0.8rem', color: 'var(--gray-500)', textTransform: 'uppercase', fontWeight: 600 }}>
                  Confidence Level
                </div>
                <div className="confidence-bar">
                  <div
                    className={`fill ${mlData.riskLevel === 'HIGH' ? 'high' : mlData.riskLevel === 'MEDIUM' ? 'medium' : 'low'}`}
                    style={{ width: `${Math.round((mlData.confidence || 0) * 100)}%` }}
                  />
                </div>

                <div style={{
                  marginTop: 20,
                  padding: 16,
                  background: 'linear-gradient(135deg, #eff6ff, #dbeafe)',
                  borderRadius: 'var(--radius-md)',
                  borderLeft: '4px solid #3b82f6',
                }}>
                  <div style={{ fontSize: '0.75rem', fontWeight: 700, color: '#1e40af', textTransform: 'uppercase', marginBottom: 4 }}>
                    Suggested Treatment
                  </div>
                  <p style={{ color: '#1e3a5f', fontSize: '0.9rem', lineHeight: 1.5 }}>
                    {mlData.treatment || 'No treatment required.'}
                  </p>
                </div>

                {/* All Risks */}
                {mlData.allRisks?.length > 0 && (
                  <div style={{ marginTop: 20 }}>
                    <div style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--gray-600)', marginBottom: 8 }}>
                      All Potential Risks
                    </div>
                    {mlData.allRisks.map((risk, i) => (
                      <div key={i} style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        padding: '8px 12px',
                        background: i % 2 === 0 ? 'var(--gray-50)' : 'white',
                        borderRadius: 'var(--radius-sm)',
                        marginBottom: 2,
                      }}>
                        <span style={{ fontSize: '0.85rem' }}>{risk.disease}</span>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                          <span className={`badge ${
                            risk.risk_level === 'HIGH' ? 'badge-danger' :
                            risk.risk_level === 'MEDIUM' ? 'badge-warning' : 'badge-success'
                          }`}>
                            {risk.risk_level}
                          </span>
                          <span style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--gray-700)' }}>
                            {Math.round(risk.confidence * 100)}%
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                <div style={{ marginTop: 16, fontSize: '0.75rem', color: 'var(--gray-400)' }}>
                  Method: {mlData.predictionMethod || mlData.prediction_method || 'N/A'} • Crop: {crop}
                </div>
              </div>
            </div>
          )}

          {!loading && !result && (
            <div className="card" style={{ textAlign: 'center', padding: 48 }}>
              <Leaf size={56} style={{ color: 'var(--gray-200)', marginBottom: 12 }} />
              <h3 style={{ color: 'var(--gray-400)', fontWeight: 600 }}>Waiting for Input</h3>
              <p style={{ color: 'var(--gray-400)', fontSize: '0.85rem', marginTop: 4 }}>
                Adjust weather parameters and click "Run Disease Prediction"
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
