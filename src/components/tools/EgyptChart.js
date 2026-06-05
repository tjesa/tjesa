import React, { useState } from 'react';

export default function EgyptChart({ title, type, data, palette }) {
  const [hoveredIdx, setHoveredIdx] = useState(null);
  const [tooltipPos, setTooltipPos] = useState({ x: 0, y: 0 });

  // 1. Fallback for Empty Data
  if (!data || !data.labels || data.labels.length === 0) {
    return (
      <div style={{
        height: '280px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        color: 'var(--sand-dark)',
        fontSize: '13px',
        border: '1px dashed rgba(212,175,55,0.1)',
        borderRadius: '8px',
        background: '#0D0D0B'
      }}>
        🔮 Waiting for database scroll data alignment...
      </div>
    );
  }

  const { labels, values } = data;
  const total = values.reduce((a, b) => a + b, 0);
  const maxVal = Math.max(...values, 1);

  // 2. Color Palettes Settings
  const getColors = (index, totalCount) => {
    const goldGradients = [
      ['#FFDF73', '#D4AF37'],
      ['#D4AF37', '#AA8928'],
      ['#AA8928', '#8C6E2E'],
      ['#EAD5A0', '#C5B387'],
      ['#C5B387', '#93845B']
    ];

    const roseGradients = [
      ['#F687B3', '#D53F8C'],
      ['#ED64A6', '#B83280'],
      ['#ED8936', '#DD6B20'],
      ['#F6AD55', '#E08027'],
      ['#FBB6CE', '#F687B3']
    ];

    const blueGradients = [
      ['#4FD1C5', '#319795'],
      ['#63B3ED', '#3182CE'],
      ['#4299E1', '#2B6CB0'],
      ['#319795', '#236E6C'],
      ['#81E6D9', '#4FD1C5']
    ];

    let set = goldGradients;
    if (palette === 'desert_rose') set = roseGradients;
    else if (palette === 'nile_blue') set = blueGradients;

    return set[index % set.length];
  };

  const getSingleColor = (index) => {
    const goldHex = ['#FFDF73', '#D4AF37', '#AA8928', '#EAD5A0', '#C5B387'];
    const roseHex = ['#F687B3', '#D53F8C', '#ED64A6', '#ED8936', '#F6AD55'];
    const blueHex = ['#4FD1C5', '#3182CE', '#4299E1', '#319795', '#81E6D9'];

    let set = goldHex;
    if (palette === 'desert_rose') set = roseHex;
    else if (palette === 'nile_blue') set = blueHex;

    return set[index % set.length];
  };

  // 3. Render Helpers for Chart Types
  const renderBarChart = () => {
    const svgWidth = 500;
    const svgHeight = 300;
    const paddingLeft = 50;
    const paddingRight = 20;
    const paddingTop = 30;
    const paddingBottom = 40;

    const chartWidth = svgWidth - paddingLeft - paddingRight;
    const chartHeight = svgHeight - paddingTop - paddingBottom;

    const barCount = values.length;
    const spacing = 12;
    const barWidth = (chartWidth - (spacing * (barCount - 1))) / barCount;

    // Draw horizontal grid lines
    const gridLines = [];
    const ticks = 4;
    for (let i = 0; i <= ticks; i++) {
      const y = paddingTop + (chartHeight * i / ticks);
      const val = Math.round(maxVal - (maxVal * i / ticks));
      gridLines.push(
        <g key={`grid-${i}`}>
          <line 
            x1={paddingLeft} 
            y1={y} 
            x2={svgWidth - paddingRight} 
            y2={y} 
            stroke="rgba(212, 175, 55, 0.08)" 
            strokeWidth="1" 
          />
          <text 
            x={paddingLeft - 10} 
            y={y + 4} 
            fill="var(--sand-dark)" 
            fontSize="10px" 
            textAnchor="end"
            fontFamily="monospace"
          >
            {val}
          </text>
        </g>
      );
    }

    return (
      <svg viewBox={`0 0 ${svgWidth} ${svgHeight}`} style={{ width: '100%', height: 'auto' }}>
        <defs>
          <filter id="glow-bar" x="-20%" y="-20%" width="140%" height="140%">
            <feGaussianBlur stdDeviation="4" result="blur" />
            <feComposite in="SourceGraphic" in2="blur" operator="over" />
          </filter>
          {values.map((_, i) => {
            const colors = getColors(i, values.length);
            return (
              <linearGradient key={`grad-${i}`} id={`barGrad-${i}`} x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor={colors[0]} />
                <stop offset="100%" stopColor={colors[1]} />
              </linearGradient>
            );
          })}
        </defs>

        {/* Grid lines */}
        {gridLines}

        {/* X & Y Axis */}
        <line 
          x1={paddingLeft} 
          y1={svgHeight - paddingBottom} 
          x2={svgWidth - paddingRight} 
          y2={svgHeight - paddingBottom} 
          stroke="rgba(212, 175, 55, 0.2)" 
          strokeWidth="1" 
        />
        <line 
          x1={paddingLeft} 
          y1={paddingTop} 
          x2={paddingLeft} 
          y2={svgHeight - paddingBottom} 
          stroke="rgba(212, 175, 55, 0.2)" 
          strokeWidth="1" 
        />

        {/* Bars */}
        {values.map((val, i) => {
          const barHeight = (val / maxVal) * chartHeight;
          const x = paddingLeft + (i * (barWidth + spacing));
          const y = svgHeight - paddingBottom - barHeight;

          const isHovered = hoveredIdx === i;

          return (
            <g 
              key={`bar-${i}`}
              onMouseEnter={(e) => {
                setHoveredIdx(i);
                // Position tooltip relative to SVG container
                const rect = e.currentTarget.getBoundingClientRect();
                setTooltipPos({ x: x + barWidth / 2, y: y - 10 });
              }}
              onMouseLeave={() => setHoveredIdx(null)}
              style={{ cursor: 'pointer' }}
            >
              <rect
                x={x}
                y={y}
                width={barWidth}
                height={Math.max(barHeight, 3)} // Ensure small bars are still visible
                rx={Math.min(barWidth / 4, 4)}
                fill={`url(#barGrad-${i})`}
                style={{
                  transition: 'all 0.2s ease',
                  filter: isHovered ? 'url(#glow-bar)' : 'none',
                  opacity: hoveredIdx !== null && !isHovered ? 0.6 : 1
                }}
              />
              
              {/* X label */}
              <text
                x={x + barWidth / 2}
                y={svgHeight - paddingBottom + 16}
                fill={isHovered ? 'var(--gold)' : 'var(--sand-dim)'}
                fontSize="9px"
                textAnchor="middle"
                style={{ transition: 'fill 0.2s ease', maxWidth: barWidth }}
              >
                {labels[i].length > 10 ? `${labels[i].substring(0, 8)}...` : labels[i]}
              </text>
            </g>
          );
        })}
      </svg>
    );
  };

  const renderDonutChart = () => {
    const size = 300;
    const center = size / 2;
    const radius = 90;
    const strokeWidth = 26;

    let accumulatedAngle = -90; // Start at the top

    const slices = [];

    values.forEach((val, i) => {
      const percentage = val / total;
      const angle = percentage * 360;

      // Calculate path for wedge stroke
      const radStart = (accumulatedAngle * Math.PI) / 180;
      const radEnd = ((accumulatedAngle + angle) * Math.PI) / 180;

      const x1 = center + radius * Math.cos(radStart);
      const y1 = center + radius * Math.sin(radStart);
      const x2 = center + radius * Math.cos(radEnd);
      const y2 = center + radius * Math.sin(radEnd);

      const largeArc = angle > 180 ? 1 : 0;

      // Arc path
      const pathD = `M ${x1} ${y1} A ${radius} ${radius} 0 ${largeArc} 1 ${x2} ${y2}`;

      const color = getSingleColor(i);
      const isHovered = hoveredIdx === i;

      slices.push(
        <path
          key={`slice-${i}`}
          d={pathD}
          fill="none"
          stroke={color}
          strokeWidth={isHovered ? strokeWidth + 4 : strokeWidth}
          strokeLinecap="round"
          onMouseEnter={(e) => {
            setHoveredIdx(i);
            const midAngle = radStart + (radEnd - radStart) / 2;
            const tx = center + (radius + 20) * Math.cos(midAngle);
            const ty = center + (radius + 20) * Math.sin(midAngle);
            setTooltipPos({ x: tx, y: ty });
          }}
          onMouseLeave={() => setHoveredIdx(null)}
          style={{
            cursor: 'pointer',
            transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
            filter: isHovered ? 'drop-shadow(0 0 10px ' + color + '80)' : 'none',
            opacity: hoveredIdx !== null && !isHovered ? 0.45 : 1
          }}
        />
      );

      accumulatedAngle += angle;
    });

    return (
      <div style={{ position: 'relative', width: '280px', margin: '0 auto' }}>
        <svg viewBox={`0 0 ${size} ${size}`} style={{ width: '100%', height: 'auto' }}>
          {/* Slices */}
          {slices}

          {/* Inner Text Center */}
          <circle cx={center} cy={center} r={radius - strokeWidth / 2 - 2} fill="#0A0A0B" />
          <text 
            x={center} 
            y={center - 8} 
            textAnchor="middle" 
            fill="var(--sand-dark)" 
            fontSize="10px" 
            fontFamily="var(--font-headings)" 
            letterSpacing="0.1em"
          >
            TOTAL COUNT
          </text>
          <text 
            x={center} 
            y={center + 16} 
            textAnchor="middle" 
            fill="var(--gold)" 
            fontSize="26px" 
            fontWeight="bold"
            fontFamily="monospace"
          >
            {total}
          </text>
        </svg>
      </div>
    );
  };

  const renderLineChart = () => {
    const svgWidth = 500;
    const svgHeight = 300;
    const paddingLeft = 50;
    const paddingRight = 20;
    const paddingTop = 30;
    const paddingBottom = 40;

    const chartWidth = svgWidth - paddingLeft - paddingRight;
    const chartHeight = svgHeight - paddingTop - paddingBottom;

    const pointCount = values.length;
    const stepX = chartWidth / Math.max(pointCount - 1, 1);

    // Draw horizontal grid lines
    const gridLines = [];
    const ticks = 4;
    for (let i = 0; i <= ticks; i++) {
      const y = paddingTop + (chartHeight * i / ticks);
      const val = Math.round(maxVal - (maxVal * i / ticks));
      gridLines.push(
        <g key={`grid-line-${i}`}>
          <line 
            x1={paddingLeft} 
            y1={y} 
            x2={svgWidth - paddingRight} 
            y2={y} 
            stroke="rgba(212, 175, 55, 0.08)" 
            strokeWidth="1" 
          />
          <text 
            x={paddingLeft - 10} 
            y={y + 4} 
            fill="var(--sand-dark)" 
            fontSize="10px" 
            textAnchor="end"
            fontFamily="monospace"
          >
            {val}
          </text>
        </g>
      );
    }

    // Build the SVG path string for the line
    const points = values.map((val, i) => {
      const x = paddingLeft + (i * stepX);
      const y = svgHeight - paddingBottom - ((val / maxVal) * chartHeight);
      return { x, y, value: val, label: labels[i] };
    });

    let pathD = '';
    let areaD = '';

    if (points.length > 0) {
      pathD = `M ${points[0].x} ${points[0].y}`;
      areaD = `M ${points[0].x} ${svgHeight - paddingBottom} L ${points[0].x} ${points[0].y}`;

      for (let i = 1; i < points.length; i++) {
        // Curve option (smooth bezier)
        const cpX1 = points[i-1].x + (points[i].x - points[i-1].x) / 2;
        const cpY1 = points[i-1].y;
        const cpX2 = points[i-1].x + (points[i].x - points[i-1].x) / 2;
        const cpY2 = points[i].y;

        pathD += ` C ${cpX1} ${cpY1}, ${cpX2} ${cpY2}, ${points[i].x} ${points[i].y}`;
        areaD += ` C ${cpX1} ${cpY1}, ${cpX2} ${cpY2}, ${points[i].x} ${points[i].y}`;
      }

      areaD += ` L ${points[points.length - 1].x} ${svgHeight - paddingBottom} Z`;
    }

    const themeColors = getColors(0, 1);

    return (
      <svg viewBox={`0 0 ${svgWidth} ${svgHeight}`} style={{ width: '100%', height: 'auto' }}>
        <defs>
          <filter id="glow-line" x="-10%" y="-10%" width="120%" height="120%">
            <feGaussianBlur stdDeviation="3" result="blur" />
            <feComposite in="SourceGraphic" in2="blur" operator="over" />
          </filter>
          <linearGradient id="areaGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={themeColors[0]} stopOpacity="0.35" />
            <stop offset="100%" stopColor={themeColors[1]} stopOpacity="0.00" />
          </linearGradient>
        </defs>

        {/* Grid lines */}
        {gridLines}

        {/* Axes */}
        <line 
          x1={paddingLeft} 
          y1={svgHeight - paddingBottom} 
          x2={svgWidth - paddingRight} 
          y2={svgHeight - paddingBottom} 
          stroke="rgba(212, 175, 55, 0.2)" 
          strokeWidth="1" 
        />
        <line 
          x1={paddingLeft} 
          y1={paddingTop} 
          x2={paddingLeft} 
          y2={svgHeight - paddingBottom} 
          stroke="rgba(212, 175, 55, 0.2)" 
          strokeWidth="1" 
        />

        {/* Area Fill */}
        {points.length > 0 && (
          <path d={areaD} fill="url(#areaGrad)" style={{ pointerEvents: 'none' }} />
        )}

        {/* Line Path */}
        {points.length > 0 && (
          <path 
            d={pathD} 
            fill="none" 
            stroke={themeColors[0]} 
            strokeWidth="3.5" 
            filter="url(#glow-line)"
            style={{ pointerEvents: 'none' }}
          />
        )}

        {/* Points & Interactive Areas */}
        {points.map((pt, i) => {
          const isHovered = hoveredIdx === i;

          return (
            <g 
              key={`pt-${i}`}
              onMouseEnter={() => {
                setHoveredIdx(i);
                setTooltipPos({ x: pt.x, y: pt.y - 12 });
              }}
              onMouseLeave={() => setHoveredIdx(null)}
              style={{ cursor: 'pointer' }}
            >
              {/* Hidden larger hover target */}
              <circle 
                cx={pt.x} 
                cy={pt.y} 
                r="14" 
                fill="transparent" 
              />
              {/* Visible Circle Dot */}
              <circle 
                cx={pt.x} 
                cy={pt.y} 
                r={isHovered ? 6 : 4} 
                fill={themeColors[0]} 
                stroke="#0A0A0B" 
                strokeWidth="1.5"
                style={{
                  transition: 'all 0.15s ease',
                  filter: isHovered ? 'drop-shadow(0 0 5px ' + themeColors[0] + ')' : 'none'
                }}
              />

              {/* X label */}
              {i % Math.max(Math.round(pointCount / 6), 1) === 0 && (
                <text
                  x={pt.x}
                  y={svgHeight - paddingBottom + 16}
                  fill="var(--sand-dark)"
                  fontSize="9px"
                  textAnchor="middle"
                >
                  {pt.label.length > 10 ? `${pt.label.substring(0, 8)}...` : pt.label}
                </text>
              )}
            </g>
          );
        })}
      </svg>
    );
  };

  return (
    <div style={{ position: 'relative', width: '100%', userSelect: 'none' }}>
      <h4 style={{
        fontSize: '15px',
        color: 'var(--gold)',
        fontFamily: 'var(--font-headings)',
        textTransform: 'uppercase',
        letterSpacing: '0.05em',
        textAlign: 'center',
        marginBottom: '16px'
      }}>
        {title || 'Observation Chart'}
      </h4>

      {/* Render selected chart */}
      <div style={{ background: '#090908', border: '1px solid rgba(212, 175, 55, 0.1)', borderRadius: '8px', padding: '16px 12px', boxShadow: 'inset 0 4px 16px rgba(0,0,0,0.5)' }}>
        {type === 'bar' && renderBarChart()}
        {type === 'pie' && renderDonutChart()}
        {type === 'line' && renderLineChart()}
      </div>

      {/* Shared Tooltip Display */}
      {hoveredIdx !== null && (
        <div style={{
          position: 'absolute',
          left: `${tooltipPos.x}px`,
          top: `${tooltipPos.y}px`,
          transform: 'translate(-50%, -100%)',
          background: 'var(--obsidian-mid)',
          border: '1px solid var(--gold)',
          borderRadius: '4px',
          padding: '6px 10px',
          pointerEvents: 'none',
          boxShadow: '0 4px 15px rgba(0, 0, 0, 0.75), 0 0 6px rgba(212, 175, 55, 0.25)',
          zIndex: 100,
          animation: 'fadeIn 0.1s ease-out',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: '2px'
        }}>
          <span style={{ fontSize: '9px', color: 'var(--sand-dark)', whiteSpace: 'nowrap', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
            {labels[hoveredIdx]}
          </span>
          <span style={{ fontSize: '13px', color: 'var(--gold)', fontWeight: 'bold', fontFamily: 'monospace' }}>
            {values[hoveredIdx]}
          </span>
        </div>
      )}
    </div>
  );
}
