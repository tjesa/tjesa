'use client';

import React, { useState, useEffect } from 'react';
import EgyptChart from './EgyptChart';
import EyeOfHorusLoader from '../EyeOfHorusLoader';
import { AlertTriangle } from 'lucide-react';

export default function PublicChartClient({ config }) {
  const [chartData, setChartData] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  const settings = config.settings || {};

  useEffect(() => {
    async function loadData() {
      try {
        const response = await fetch(`/api/tools/charts/data?config_id=${config.id}`);
        const result = await response.json();

        if (response.ok && result.success) {
          setChartData(result.chartData);
        } else {
          setError(result.error || 'Failed to aggregate chart data.');
        }
      } catch (err) {
        setError('A network disruption occurred while reading the scroll.');
        console.error(err);
      } finally {
        setIsLoading(false);
      }
    }

    loadData();
  }, [config.id]);

  return (
    <div style={{
      flex: 1,
      display: 'flex',
      flexDirection: 'column',
      justifyContent: 'center',
      alignItems: 'center',
      padding: '16px',
      width: '100%',
      maxWidth: '650px',
      margin: '0 auto',
      boxSizing: 'border-box'
    }}>
      {isLoading ? (
        <div style={{ padding: '40px 0' }}>
          <EyeOfHorusLoader text="Summoning visual scroll coordinates..." />
        </div>
      ) : error ? (
        <div style={{
          textAlign: 'center',
          border: '1px solid var(--scarab-red)',
          background: 'rgba(168, 36, 36, 0.05)',
          borderRadius: '12px',
          padding: '32px 20px',
          maxWidth: '450px',
          boxShadow: '0 8px 32px rgba(0, 0, 0, 0.5)'
        }}>
          <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '12px', color: '#FF7F7F' }}>
            <AlertTriangle size={36} />
          </div>
          <h3 style={{ fontFamily: 'var(--font-headings)', color: 'var(--gold)', textTransform: 'uppercase', margin: '0 0 8px 0', fontSize: '16px', letterSpacing: '0.05em' }}>
            Observatory Alignment Fault
          </h3>
          <p style={{ fontSize: '13px', color: '#FF7F7F', lineHeight: 1.5, margin: 0 }}>
            {error}
          </p>
        </div>
      ) : (
        <div style={{
          width: '100%',
          animation: 'fadeIn 0.4s ease-out'
        }}>
          <EgyptChart
            title={settings.chart_title}
            type={settings.chart_type}
            data={chartData}
            palette={settings.color_palette}
          />
          <div style={{
            marginTop: '12px',
            textAlign: 'center',
            fontSize: '9px',
            color: 'var(--sand-dark)',
            letterSpacing: '0.15em',
            fontFamily: 'var(--font-headings)'
          }}>
            POWERED BY TJESA SUITE • ATEN OBSERVATORY
          </div>
        </div>
      )}
    </div>
  );
}
