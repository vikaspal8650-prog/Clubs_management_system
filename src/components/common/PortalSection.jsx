import React from 'react';
import { BarChart3, FileText, History, BookOpen } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from './Card';
import { EmptyState } from './EmptyState';

const SECTION_META = {
  reports: {
    title: 'Reports & Attendance',
    description: 'A consolidated view of club participation, events, and attendance records.',
    icon: BookOpen,
  },
  documents: {
    title: 'Document Repository',
    description: 'Club proposals, sanction records, and supporting documents are organized by the relevant workflow.',
    icon: FileText,
  },
  analytics: {
    title: 'Analytics',
    description: 'Operational metrics for memberships, events, and approvals.',
    icon: BarChart3,
  },
  activity: {
    title: 'Activity Log',
    description: 'Recent account, club, and event activity across the portal.',
    icon: History,
  },
};

export const PortalSection = ({ section, metrics = [], children, title, description }) => {
  const meta = SECTION_META[section];
  const Icon = meta?.icon || FileText;

  return (
    <Card>
      <CardHeader>
        <CardTitle>{title || meta?.title || 'Portal Section'}</CardTitle>
        { (description || meta?.description) && (
          <CardDescription>{description || meta?.description}</CardDescription>
        )}
      </CardHeader>
      <CardContent>
        {metrics.length > 0 && (
          <div className="metrics-grid" style={{ marginBottom: 'var(--space-6)' }}>
            {metrics.map((metric) => (
              <Card
                key={metric.label}
                className={`metric-card ${metric.onClick ? 'metric-card--clickable' : ''}`}
                hoverable={Boolean(metric.onClick)}
                onClick={metric.onClick}
              >
                <span className="metric-card__label">{metric.label}</span>
                <span className="metric-card__value">{metric.value}</span>
                {metric.hint && <span className="metric-card__hint">{metric.hint}</span>}
              </Card>
            ))}
          </div>
        )}
        {children || (
          <EmptyState
            icon={Icon}
            title={title || meta?.title || 'No data available'}
            description="This section will show records as portal activity is completed."
            size="sm"
          />
        )}
      </CardContent>
    </Card>
  );
};
