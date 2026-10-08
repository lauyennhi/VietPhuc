import React from 'react';

interface GroundShadowProps {
  isSeated?: boolean;
}

export const GroundShadow: React.FC<GroundShadowProps> = ({ isSeated = false }) => {
  return (
    <g id="ground-shadow" opacity="0.35">
      <defs>
        <radialGradient id="shadowGradient" cx="50%" cy="50%" r="50%" fx="50%" fy="50%">
          <stop offset="0%" stopColor="#1F1B18" stopOpacity="0.45" />
          <stop offset="60%" stopColor="#1F1B18" stopOpacity="0.18" />
          <stop offset="100%" stopColor="#1F1B18" stopOpacity="0" />
        </radialGradient>
      </defs>

      {isSeated ? (
        // Broader contact shadow for wheelchair base
        <ellipse cx="200" cy="460" rx="90" ry="22" fill="url(#shadowGradient)" />
      ) : (
        // Natural dual contact shadow for standing feet
        <>
          <ellipse cx="180" cy="465" rx="36" ry="12" fill="url(#shadowGradient)" />
          <ellipse cx="225" cy="465" rx="36" ry="12" fill="url(#shadowGradient)" />
          <ellipse cx="200" cy="466" rx="65" ry="14" fill="url(#shadowGradient)" opacity="0.6" />
        </>
      )}
    </g>
  );
};
