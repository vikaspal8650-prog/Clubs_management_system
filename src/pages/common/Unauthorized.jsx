import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ShieldX, ArrowLeft, Home } from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';
import { Button } from '../../components/common/Button';
import { Card } from '../../components/common/Card';

export const Unauthorized = () => {
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
            backgroundColor: 'var(--danger-50)',
            color: 'var(--danger-600)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            margin: '0 auto var(--space-4)',
          }}
        >
          <ShieldX size={36} />
        </div>

        <h2 style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--slate-900)' }}>
          Access Denied
        </h2>
        <p style={{ fontSize: '0.875rem', color: 'var(--slate-500)', marginTop: 'var(--space-2)' }}>
          You do not have administrative privileges to access this area.
          {user && (
            <span>
              {' '}
              Your current logged-in role is <strong>{user.role}</strong>.
            </span>
          )}
        </p>

        <div
          style={{
            display: 'flex',
            justifyContent: 'center',
            gap: 'var(--space-3)',
            marginTop: 'var(--space-6)',
          }}
        >
          <Button variant="outline" icon={ArrowLeft} onClick={() => navigate(-1)}>
            Go Back
          </Button>
          <Button
            variant="primary"
            icon={Home}
            onClick={() => navigate(getHomeRouteForRole(user?.role))}
          >
            Go to My Portal
          </Button>
        </div>
      </Card>
    </div>
  );
};
