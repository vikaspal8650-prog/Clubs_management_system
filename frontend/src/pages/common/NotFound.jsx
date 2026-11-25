import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Compass, Home } from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';
import { Button } from '../../components/common/Button';
import { Card } from '../../components/common/Card';

export const NotFound = () => {
  const navigate = useNavigate();
  const { user, getHomeRouteForRole } = useAuth();

  return (
    <div className="auth-container">
      <Card className="auth-card" bordered padding="lg" style={{ textAlign: 'center' }}>
        <div
          style={{
            width: 64,
            height: 64,
            borderRadius: '50%',
            backgroundColor: 'var(--primary-50)',
            color: 'var(--primary-600)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            margin: '0 auto var(--space-4)',
          }}
        >
          <Compass size={36} />
        </div>

        <h2 style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--slate-900)' }}>
          404 - Page Not Found
        </h2>
        <p style={{ fontSize: '0.875rem', color: 'var(--slate-500)', marginTop: 'var(--space-2)' }}>
          The portal page you requested does not exist or has been moved.
        </p>

        <div
          style={{
            display: 'flex',
            justifyContent: 'center',
            marginTop: 'var(--space-6)',
          }}
        >
          <Button
            variant="primary"
            icon={Home}
            onClick={() => navigate(user ? getHomeRouteForRole(user.role) : '/login')}
          >
            Return to Dashboard
          </Button>
        </div>
      </Card>
    </div>
  );
};
