import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import {
  LayoutDashboard, Upload, CloudSun, TrendingUp,
  Activity, LogOut, Leaf, Shield
} from 'lucide-react';

const navItems = [
  { path: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { path: '/predict', label: 'Disease Prediction', icon: Activity },
  { path: '/detect', label: 'Image Detection', icon: Upload },
  { path: '/weather', label: 'Weather Data', icon: CloudSun },
  { path: '/mandi', label: 'Mandi Prices', icon: TrendingUp },
];

export default function Sidebar() {
  const location = useLocation();
  const { user, logout } = useAuth();

  return (
    <aside className="sidebar">
      <div className="sidebar-brand">
        <div className="brand-icon">🌾</div>
        <div>
          <h2>CropAI</h2>
          <span>Disease Prediction System</span>
        </div>
      </div>

      <nav className="sidebar-nav">
        <div className="nav-section-label">Main Menu</div>
        {navItems.map((item) => (
          <Link
            key={item.path}
            to={item.path}
            className={`nav-item ${location.pathname === item.path ? 'active' : ''}`}
          >
            <item.icon className="nav-icon" size={20} />
            {item.label}
          </Link>
        ))}

        {user?.role === 'ADMIN' && (
          <>
            <div className="nav-section-label">Admin</div>
            <Link
              to="/admin"
              className={`nav-item ${location.pathname === '/admin' ? 'active' : ''}`}
            >
              <Shield className="nav-icon" size={20} />
              Admin Panel
            </Link>
          </>
        )}
      </nav>

      <div className="sidebar-footer">
        <div className="user-info">
          <div className="user-avatar">
            {user?.name?.charAt(0)?.toUpperCase() || 'U'}
          </div>
          <div className="user-details">
            <div className="name">{user?.name || 'User'}</div>
            <div className="role">{user?.role?.toLowerCase() || 'farmer'}</div>
          </div>
        </div>
        <button
          className="nav-item"
          onClick={logout}
          style={{ width: '100%', marginTop: 8, background: 'rgba(239,68,68,0.1)', color: '#fca5a5' }}
        >
          <LogOut size={20} />
          Logout
        </button>
      </div>
    </aside>
  );
}
