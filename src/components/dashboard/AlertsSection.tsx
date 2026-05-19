import React from 'react';
import { DashboardAlert } from '../../types/dashboard';
import { AlertCard } from './AlertCard';

interface AlertsSectionProps {
  alerts: DashboardAlert[];
}

export const AlertsSection: React.FC<AlertsSectionProps> = ({ alerts }) => {
  if (alerts.length === 0) return null;

  return (
    <div className="mb-8">
      <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
        🚨 Alertas Críticas
      </h2>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {alerts.map((alert, index) => (
          <AlertCard key={`alert-${index}`} alert={alert} />
        ))}
      </div>
    </div>
  );
};
