import React, { useEffect, useState } from 'react';
import { AlertTriangle, RefreshCw } from 'lucide-react';
import { analyticsService } from '../../services/analyticsService';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from './Card';
import './StudentAnalyticsCharts.css';

const CHART_HEIGHT = 292;
const PLOT = { top: 30, bottom: 222, left: 52, right: 16 };

const wrapLabel = (value) => {
  const words = String(value || '').trim().split(/\s+/).filter(Boolean);
  if (!words.length) return [''];
  const lines = [''];
  words.forEach((word) => {
    const current = lines[lines.length - 1];
    if (current && `${current} ${word}`.length > 12 && lines.length < 2) lines.push(word);
    else lines[lines.length - 1] = current ? `${current} ${word}` : word;
  });
  if (lines[1]?.length > 14) lines[1] = `${lines[1].slice(0, 13)}…`;
  if (lines.length === 1 && lines[0].length > 14) lines[0] = `${lines[0].slice(0, 13)}…`;
  return lines;
};

const BarChart = ({ title, axisLabel, data }) => {
  const width = Math.max(480, data.length * 76);
  const plotWidth = width - PLOT.left - PLOT.right;
  const plotHeight = PLOT.bottom - PLOT.top;
  const maxCount = Math.max(0, ...data.map((item) => item.count));
  const axisMax = Math.max(4, Math.ceil(maxCount / 4) * 4);
  const tickStep = axisMax / 4;
  const slotWidth = plotWidth / data.length;

  return (
    <div className="student-analytics-chart__viewport" role="img" aria-label={`${title}: ${data.map((item) => `${item.name}, ${item.count} students`).join('; ')}`}>
      <svg className="student-analytics-chart__svg" width={width} height={CHART_HEIGHT} viewBox={`0 0 ${width} ${CHART_HEIGHT}`} aria-hidden="true">
        <text className="student-analytics-chart__axis-title" x="14" y={PLOT.top + plotHeight / 2} transform={`rotate(-90 14 ${PLOT.top + plotHeight / 2})`}>Students</text>
        {[0, 1, 2, 3, 4].map((step) => {
          const value = axisMax - step * tickStep;
          const y = PLOT.top + step * plotHeight / 4;
          return (
            <g key={value}>
              <line className="student-analytics-chart__grid-line" x1={PLOT.left} x2={width - PLOT.right} y1={y} y2={y} />
              <text className="student-analytics-chart__tick" x={PLOT.left - 10} y={y + 4} textAnchor="end">{value}</text>
            </g>
          );
        })}
        <line className="student-analytics-chart__axis-line" x1={PLOT.left} x2={PLOT.left} y1={PLOT.top} y2={PLOT.bottom} />
        <line className="student-analytics-chart__axis-line" x1={PLOT.left} x2={width - PLOT.right} y1={PLOT.bottom} y2={PLOT.bottom} />
        {data.map((item, index) => {
          const center = PLOT.left + slotWidth * (index + 0.5);
          const barHeight = item.count === 0 ? 2 : (item.count / axisMax) * plotHeight;
          const barWidth = Math.min(44, slotWidth * 0.58);
          const barY = PLOT.bottom - barHeight;
          const lines = wrapLabel(item.name);
          return (
            <g key={item.id}>
              <title>{`${item.name}: ${item.count} students`}</title>
              <text className="student-analytics-chart__value" x={center} y={Math.max(18, barY - 8)} textAnchor="middle">{item.count}</text>
              <rect className="student-analytics-chart__bar" x={center - barWidth / 2} y={barY} width={barWidth} height={barHeight} rx="4" />
              <text className="student-analytics-chart__label" x={center} y={PLOT.bottom + 17} textAnchor="middle">
                {lines.map((line, lineIndex) => <tspan key={`${item.id}-${lineIndex}`} x={center} dy={lineIndex === 0 ? 0 : 13}>{line}</tspan>)}
              </text>
            </g>
          );
        })}
        <text className="student-analytics-chart__axis-title" x={(PLOT.left + width - PLOT.right) / 2} y={CHART_HEIGHT - 5} textAnchor="middle">{axisLabel}</text>
      </svg>
    </div>
  );
};

const ChartCard = ({ title, description, data, loading, error, onRetry, noun, totalLabel, axisLabel }) => (
  <Card className="student-analytics-card">
    <CardHeader>
      <CardTitle>{title}</CardTitle>
      <CardDescription>{description}</CardDescription>
    </CardHeader>
    <CardContent>
      {loading ? <div className="student-analytics-state" role="status">Loading chart data…</div> : error ? (
        <div className="student-analytics-state student-analytics-state--error" role="alert">
          <AlertTriangle size={18} /><span>{error}</span>
          <button type="button" className="student-analytics-retry" onClick={onRetry}><RefreshCw size={15} /> Retry</button>
        </div>
      ) : data.length === 0 ? (
        <div className="student-analytics-state" role="status">No {noun} to display yet.</div>
      ) : <BarChart title={title} axisLabel={axisLabel} data={data} />}
    </CardContent>
    {!loading && !error && <CardFooter className="student-analytics-card__footer">Total number of {totalLabel}: {data.length}. Counts are distinct students.</CardFooter>}
  </Card>
);

const useChartData = (fetchData, errorMessage) => {
  const [state, setState] = useState({ data: [], loading: true, error: '' });
  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    let active = true;
    setState((current) => ({ ...current, loading: true, error: '' }));
    fetchData()
      .then((data) => { if (active) setState({ data, loading: false, error: '' }); })
      .catch((error) => { if (active) setState((current) => ({ ...current, loading: false, error: error.message || errorMessage })); });
    return () => { active = false; };
  }, [fetchData, errorMessage, attempt]);

  return { ...state, retry: () => setAttempt((current) => current + 1) };
};

const fetchEvents = () => analyticsService.getEventParticipation();
const fetchClubs = () => analyticsService.getClubMembership();

export const EventParticipationChart = () => {
  const chart = useChartData(fetchEvents, 'Could not load event participation data.');
  return <ChartCard title="Event-wise Student Participation" description="Distinct student registrations for each event." data={chart.data} loading={chart.loading} error={chart.error} onRetry={chart.retry} noun="events" totalLabel="events" axisLabel="Events" />;
};

export const AnalyticsCharts = () => {
  const events = useChartData(fetchEvents, 'Could not load event participation data.');
  const clubs = useChartData(fetchClubs, 'Could not load club membership data.');
  return (
    <div className="student-analytics-grid">
      <ChartCard title="Event-wise Student Participation" description="Distinct student registrations for each event." data={events.data} loading={events.loading} error={events.error} onRetry={events.retry} noun="events" totalLabel="events" axisLabel="Events" />
      <ChartCard title="Club-wise Student Membership" description="Distinct student members in each club." data={clubs.data} loading={clubs.loading} error={clubs.error} onRetry={clubs.retry} noun="clubs" totalLabel="clubs" axisLabel="Clubs" />
    </div>
  );
};
