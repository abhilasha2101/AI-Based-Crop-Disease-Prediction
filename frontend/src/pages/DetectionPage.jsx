import { useState, useRef } from 'react';
import { cropApi } from '../services/api';
import { Upload, Image, AlertTriangle, CheckCircle, X } from 'lucide-react';

const CROPS = ['Rice', 'Potato', 'Tea', 'Makhana'];

export default function DetectionPage() {
  const [crop, setCrop] = useState('Rice');
  const [file, setFile] = useState(null);
  const [preview, setPreview] = useState(null);
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [dragOver, setDragOver] = useState(false);
  const fileInput = useRef(null);

  const handleFile = (f) => {
    if (!f || !f.type.startsWith('image/')) return;
    setFile(f);
    setPreview(URL.createObjectURL(f));
    setResult(null);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setDragOver(false);
    handleFile(e.dataTransfer.files[0]);
  };

  const handleUpload = async () => {
    if (!file) return;
    setLoading(true);
    setResult(null);
    try {
      const formData = new FormData();
      formData.append('crop', crop.toLowerCase());
      formData.append('image', file);
      const res = await cropApi.upload(formData);
      setResult(res.data.data);
    } catch (err) {
      console.error('Upload failed:', err);
    } finally {
      setLoading(false);
    }
  };

  const clearFile = () => {
    setFile(null);
    setPreview(null);
    setResult(null);
  };

  const mlData = result?.mlResponse || {};

  return (
    <div className="page-container">
      <div className="page-header">
        <h1>📷 Image Detection</h1>
        <p>Upload a crop leaf image to detect existing diseases using AI</p>
      </div>

      <div className="two-col-grid">
        {/* Upload Panel */}
        <div className="card">
          <h3 className="card-title" style={{ marginBottom: 20 }}>Upload Crop Image</h3>

          <div className="form-group">
            <label className="form-label">Select Crop Type</label>
            <div className="crop-selector">
              {CROPS.map((c) => (
                <button
                  key={c}
                  className={`crop-chip ${crop === c ? 'active' : ''}`}
                  onClick={() => setCrop(c)}
                >
                  {c}
                </button>
              ))}
            </div>
          </div>

          {!preview ? (
            <div
              className={`upload-zone ${dragOver ? 'dragover' : ''}`}
              onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
              onDragLeave={() => setDragOver(false)}
              onDrop={handleDrop}
              onClick={() => fileInput.current.click()}
            >
              <Upload className="upload-icon" size={48} />
              <div className="upload-text">Drop image here or click to browse</div>
              <div className="upload-hint">Supports JPG, PNG, WebP • Max 10MB</div>
              <input
                ref={fileInput}
                type="file"
                accept="image/*"
                style={{ display: 'none' }}
                onChange={(e) => handleFile(e.target.files[0])}
              />
            </div>
          ) : (
            <div style={{ position: 'relative' }}>
              <div className="image-preview">
                <img src={preview} alt="Crop preview" style={{ maxHeight: 300, width: '100%', objectFit: 'cover', borderRadius: 'var(--radius-lg)' }} />
              </div>
              <button
                onClick={clearFile}
                style={{
                  position: 'absolute', top: 8, right: 8,
                  background: 'rgba(0,0,0,0.6)', color: 'white',
                  borderRadius: '50%', width: 32, height: 32,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}
              >
                <X size={16} />
              </button>
              <p style={{ marginTop: 8, fontSize: '0.8rem', color: 'var(--gray-500)' }}>
                {file?.name} ({(file?.size / 1024).toFixed(0)} KB)
              </p>
            </div>
          )}

          <button
            className="btn btn-primary btn-lg btn-block"
            onClick={handleUpload}
            disabled={!file || loading}
            style={{ marginTop: 20 }}
          >
            {loading ? (
              <><span className="spinner" /> Analyzing Image...</>
            ) : (
              <><Image size={20} /> Detect Disease</>
            )}
          </button>
        </div>

        {/* Results */}
        <div>
          {loading && (
            <div className="card">
              <div className="loading-overlay">
                <div className="spinner spinner-lg" />
                <p className="loading-text">Processing image with CNN model...</p>
              </div>
            </div>
          )}

          {!loading && result && (
            <div className="result-card animate-fadein">
              <div className={`result-header ${
                mlData.risk_level === 'HIGH' ? 'high-risk' :
                mlData.risk_level === 'MEDIUM' ? 'medium-risk' : 'low-risk'
              }`}>
                <div>
                  <span className={`badge ${
                    mlData.risk_level === 'HIGH' ? 'badge-danger' :
                    mlData.risk_level === 'MEDIUM' ? 'badge-warning' : 'badge-success'
                  }`}>
                    {mlData.risk_level === 'HIGH' ? <AlertTriangle size={12} /> : <CheckCircle size={12} />}
                    {mlData.risk_level}
                  </span>
                  <h2 style={{ fontSize: '1.5rem', color: 'var(--gray-900)', marginTop: 4 }}>
                    {mlData.disease_name}
                  </h2>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <div style={{ fontSize: '0.75rem', color: 'var(--gray-500)' }}>CONFIDENCE</div>
                  <div style={{ fontFamily: 'var(--font-primary)', fontSize: '1.8rem', fontWeight: 800 }}>
                    {Math.round((mlData.confidence || 0) * 100)}%
                  </div>
                </div>
              </div>

              <div className="result-body">
                <div className="confidence-bar">
                  <div
                    className={`fill ${mlData.risk_level === 'HIGH' ? 'high' : mlData.risk_level === 'MEDIUM' ? 'medium' : 'low'}`}
                    style={{ width: `${Math.round((mlData.confidence || 0) * 100)}%` }}
                  />
                </div>

                <div style={{
                  marginTop: 20, padding: 16,
                  background: 'linear-gradient(135deg, #eff6ff, #dbeafe)',
                  borderRadius: 'var(--radius-md)',
                  borderLeft: '4px solid #3b82f6',
                }}>
                  <div style={{ fontSize: '0.75rem', fontWeight: 700, color: '#1e40af', textTransform: 'uppercase', marginBottom: 4 }}>
                    Treatment
                  </div>
                  <p style={{ color: '#1e3a5f', fontSize: '0.9rem' }}>{mlData.treatment}</p>
                </div>

                {/* All predictions */}
                {mlData.all_predictions?.length > 1 && (
                  <div style={{ marginTop: 20 }}>
                    <div style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--gray-600)', marginBottom: 8 }}>
                      Classification Results
                    </div>
                    {mlData.all_predictions.map((p, i) => (
                      <div key={i} style={{
                        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                        padding: '8px 12px',
                        background: i === 0 ? 'var(--primary-50)' : i % 2 === 0 ? 'var(--gray-50)' : 'white',
                        borderRadius: 'var(--radius-sm)', marginBottom: 2,
                        borderLeft: i === 0 ? '3px solid var(--primary-500)' : 'none',
                      }}>
                        <span style={{ fontSize: '0.85rem', fontWeight: i === 0 ? 600 : 400 }}>{p.disease}</span>
                        <span style={{ fontSize: '0.8rem', fontWeight: 600 }}>{Math.round(p.confidence * 100)}%</span>
                      </div>
                    ))}
                  </div>
                )}

                <div style={{ marginTop: 16, fontSize: '0.75rem', color: 'var(--gray-400)' }}>
                  Model: {mlData.model_type || 'CNN'} • Crop: {crop}
                </div>
              </div>
            </div>
          )}

          {!loading && !result && (
            <div className="card" style={{ textAlign: 'center', padding: 48 }}>
              <Image size={56} style={{ color: 'var(--gray-200)', marginBottom: 12 }} />
              <h3 style={{ color: 'var(--gray-400)', fontWeight: 600 }}>No Image Uploaded</h3>
              <p style={{ color: 'var(--gray-400)', fontSize: '0.85rem', marginTop: 4 }}>
                Upload a crop leaf image to detect diseases
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
