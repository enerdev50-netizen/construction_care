import React from 'react';
import './BarChart.css';

interface BarChartDataPoint {
  label: string;
  value: number; // Montant dépensé
  limit?: number; // Budget optionnel
}

interface BarChartProps {
  data: BarChartDataPoint[];
  title: string;
  subtitle: string;
}

const BarChart: React.FC<BarChartProps> = ({ data, title, subtitle }) => {
  // Trouver la valeur maximale pour mettre à l'échelle les barres
  const allValues = data.flatMap((d) => [d.value, d.limit || 0]);
  const maxValue = Math.max(...allValues, 100000); // minimum 100k pour l'échelle

  // Générer les graduations de l'axe Y (5 lignes du max à 0)
  const yAxisTicks = Array.from({ length: 5 }, (_, i) => {
    const val = Math.round((maxValue * (4 - i)) / 4);
    return val;
  });

  const getBarHeight = (value: number): string => {
    const percentage = (value / maxValue) * 100;
    return `${Math.max(percentage, 3)}%`;
  };

  const formatCurrency = (val: number) => {
    if (val >= 1000000) {
      return `${(val / 1000000).toFixed(1)}M`;
    }
    if (val >= 1000) {
      return `${(val / 1000).toFixed(0)}k`;
    }
    return val.toString();
  };

  return (
    <div className="barchart animate-fade-in">
      <div className="barchart-header">
        <div>
          <h3 className="barchart-title">{title}</h3>
          <p className="barchart-subtitle">{subtitle}</p>
        </div>
      </div>

      <div className="barchart-legend">
        <div className="barchart-legend-item">
          <span className="barchart-legend-dot spent" />
          <span>Dépensé (FCFA)</span>
        </div>
        {data.some((d) => d.limit !== undefined) && (
          <div className="barchart-legend-item">
            <span className="barchart-legend-dot limit" />
            <span>Budget Prévu</span>
          </div>
        )}
      </div>

      <div className="barchart-area">
        {/* Axe Y */}
        <div className="barchart-yaxis">
          {yAxisTicks.map((tick, i) => (
            <span key={i} className="barchart-yaxis-label">
              {formatCurrency(tick)}
            </span>
          ))}
          <span className="barchart-yaxis-label">0</span>
        </div>

        {/* Lignes de repère */}
        <div className="barchart-grid">
          {yAxisTicks.map((_, i) => (
            <div key={i} className="barchart-grid-line" />
          ))}
          <div className="barchart-grid-line" />
        </div>

        {/* Barres de données */}
        <div className="barchart-bars">
          {data.map((point, idx) => (
            <div key={idx} className="barchart-day">
              <div className="barchart-day-bars">
                <div
                  className="barchart-bar spent"
                  style={{ height: getBarHeight(point.value) }}
                  data-value={`${point.value.toLocaleString()} FCFA`}
                  role="img"
                  aria-label={`${point.label}: ${point.value} FCFA`}
                />
                {point.limit !== undefined && (
                  <div
                    className="barchart-bar limit"
                    style={{ height: getBarHeight(point.limit) }}
                    data-value={`${point.limit.toLocaleString()} FCFA`}
                    role="img"
                    aria-label={`Budget: ${point.limit} FCFA`}
                  />
                )}
              </div>
              <span className="barchart-day-label" title={point.label}>
                {point.label}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default BarChart;
