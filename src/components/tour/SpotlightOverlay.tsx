import React from 'react';

export interface SpotlightRect {
  x: number;
  y: number;
  width: number;
  height: number;
}

interface SpotlightOverlayProps {
  targetRect: SpotlightRect | null;
  padding?: number;
  borderRadius?: number;
  interactive?: boolean;
  onClickScrim?: () => void;
}

export const SpotlightOverlay: React.FC<SpotlightOverlayProps> = ({
  targetRect,
  padding = 8,
  borderRadius = 16,
  interactive = false,
  onClickScrim,
}) => {
  // If targetRect is null (fallback mode / element not found), render a soft translucent dimming scrim
  const adjustedRect = targetRect
    ? {
        x: Math.max(2, targetRect.x - padding),
        y: Math.max(2, targetRect.y - padding),
        width: targetRect.width + padding * 2,
        height: targetRect.height + padding * 2,
      }
    : null;

  return (
    <>
      <svg
        className="spotlight-svg-scrim"
        style={{
          position: 'fixed',
          inset: 0,
          width: '100vw',
          height: '100vh',
          zIndex: 99980,
          pointerEvents: 'none',
        }}
        aria-hidden="true"
      >
        <defs>
          <mask id="travelnest-spotlight-mask">
            {/* White base makes everything visible (dimmed) */}
            <rect x="0" y="0" width="100%" height="100%" fill="#FFFFFF" />

            {/* Black cutout makes this area transparent */}
            {adjustedRect && (
              <rect
                x={adjustedRect.x}
                y={adjustedRect.y}
                width={adjustedRect.width}
                height={adjustedRect.height}
                rx={borderRadius}
                ry={borderRadius}
                fill="#000000"
                className="spotlight-cutout-rect"
              />
            )}
          </mask>
        </defs>

        {/* Backdrop Scrim */}
        <rect
          x="0"
          y="0"
          width="100%"
          height="100%"
          fill="rgba(11, 12, 14, 0.72)"
          mask="url(#travelnest-spotlight-mask)"
          style={{ pointerEvents: 'auto', cursor: 'default' }}
          onClick={onClickScrim}
        />

        {/* Active Highlight Outline Ring with subtle glow */}
        {adjustedRect && (
          <rect
            x={adjustedRect.x}
            y={adjustedRect.y}
            width={adjustedRect.width}
            height={adjustedRect.height}
            rx={borderRadius}
            ry={borderRadius}
            fill="none"
            stroke="#FFFFFF"
            strokeWidth="2.5"
            strokeOpacity="0.92"
            className="spotlight-cutout-rect spotlight-active-ring"
          />
        )}
      </svg>

      {/* When interactive is false, overlay a transparent guard over target to prevent accidental clicks */}
      {adjustedRect && !interactive && (
        <div
          style={{
            position: 'fixed',
            left: adjustedRect.x,
            top: adjustedRect.y,
            width: adjustedRect.width,
            height: adjustedRect.height,
            zIndex: 99985,
            pointerEvents: 'auto',
            cursor: 'default',
          }}
          onClick={(e) => {
            e.stopPropagation();
          }}
        />
      )}

      <style>{`
        .spotlight-cutout-rect {
          transition: x 280ms cubic-bezier(0.16, 1, 0.3, 1),
                      y 280ms cubic-bezier(0.16, 1, 0.3, 1),
                      width 280ms cubic-bezier(0.16, 1, 0.3, 1),
                      height 280ms cubic-bezier(0.16, 1, 0.3, 1);
        }
        .spotlight-active-ring {
          filter: drop-shadow(0 0 10px rgba(255, 255, 255, 0.45));
          animation: spotlightPulse 2.4s ease-in-out infinite;
        }
        @keyframes spotlightPulse {
          0%, 100% {
            stroke-opacity: 0.95;
            stroke-width: 2.5;
          }
          50% {
            stroke-opacity: 0.65;
            stroke-width: 2;
          }
        }
      `}</style>
    </>
  );
};
