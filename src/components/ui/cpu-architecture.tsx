import { cn } from "../../lib/utils";
import React from "react";

export interface CpuArchitectureSvgProps {
  className?: string;
  width?: string;
  height?: string;
  text?: string;
  showCpuConnections?: boolean;
  lineMarkerSize?: number;
  animateText?: boolean;
  animateLines?: boolean;
  animateMarkers?: boolean;
}

const CpuArchitecture = ({
  className,
  width = "100%",
  height = "100%",
  text = "CPU",
  showCpuConnections = true,
  animateText = true,
  lineMarkerSize = 18,
  animateLines = true,
  animateMarkers = true,
}: CpuArchitectureSvgProps) => {
  return (
    <svg
      className={cn("text-muted", className)}
      width={width}
      height={height}
      viewBox="0 0 200 100"
    >
      {/* Paths */}
      <g
        stroke="currentColor"
        fill="none"
        strokeWidth="0.3"
        strokeDasharray="100 100"
        pathLength="100"
        markerStart="url(#cpu-circle-marker)"
      >
        {/* 1st */}
        <path
          strokeDasharray="100 100"
          pathLength="100"
          d="M 10 20 h 79.5 q 5 0 5 5 v 30"
        />
        {/* 2nd */}
        <path
          strokeDasharray="100 100"
          pathLength="100"
          d="M 180 10 h -69.7 q -5 0 -5 5 v 30"
        />
        {/* 3rd */}
        <path d="M 130 20 v 21.8 q 0 5 -5 5 h -10" />
        {/* 4th */}
        <path d="M 170 80 v -21.8 q 0 -5 -5 -5 h -50" />
        {/* 5th */}
        <path
          strokeDasharray="100 100"
          pathLength="100"
          d="M 135 65 h 15 q 5 0 5 5 v 10 q 0 5 -5 5 h -39.8 q -5 0 -5 -5 v -20"
        />
        {/* 6th */}
        <path d="M 94.8 95 v -36" />
        {/* 7th */}
        <path d="M 88 88 v -15 q 0 -5 -5 -5 h -10 q -5 0 -5 -5 v -5 q 0 -5 5 -5 h 14" />
        {/* 8th */}
        <path d="M 30 30 h 25 q 5 0 5 5 v 6.5 q 0 5 5 5 h 20" />
        {/* Animation For Path Starting */}
        {animateLines && (
          <animate
            attributeName="stroke-dashoffset"
            from="100"
            to="0"
            dur="1s"
            fill="freeze"
            calcMode="spline"
            keySplines="0.25,0.1,0.5,1"
            keyTimes="0; 1"
          />
        )}
      </g>

      {/* 1. Blue Light */}
      <g mask="url(#cpu-mask-1)">
        <circle
          className="cpu-architecture cpu-line-1"
          cx="0"
          cy="0"
          r="8"
          fill="url(#cpu-blue-grad)"
        />
      </g>
      {/* 2. Yellow Light */}
      <g mask="url(#cpu-mask-2)">
        <circle
          className="cpu-architecture cpu-line-2"
          cx="0"
          cy="0"
          r="8"
          fill="url(#cpu-yellow-grad)"
        />
      </g>
      {/* 3. Pinkish Light */}
      <g mask="url(#cpu-mask-3)">
        <circle
          className="cpu-architecture cpu-line-3"
          cx="0"
          cy="0"
          r="8"
          fill="url(#cpu-pinkish-grad)"
        />
      </g>
      {/* 4. White Light */}
      <g mask="url(#cpu-mask-4)">
        <circle
          className="cpu-architecture cpu-line-4"
          cx="0"
          cy="0"
          r="8"
          fill="url(#cpu-white-grad)"
        />
      </g>
      {/* 5. Green Light */}
      <g mask="url(#cpu-mask-5)">
        <circle
          className="cpu-architecture cpu-line-5"
          cx="0"
          cy="0"
          r="8"
          fill="url(#cpu-green-grad)"
        />
      </g>
      {/* 6. Orange Light */}
      <g mask="url(#cpu-mask-6)">
        <circle
          className="cpu-architecture cpu-line-6"
          cx="0"
          cy="0"
          r="8"
          fill="url(#cpu-orange-grad)"
        />
      </g>
      {/* 7. Cyan Light */}
      <g mask="url(#cpu-mask-7)">
        <circle
          className="cpu-architecture cpu-line-7"
          cx="0"
          cy="0"
          r="8"
          fill="url(#cpu-cyan-grad)"
        />
      </g>
      {/* 8. Rose Light */}
      <g mask="url(#cpu-mask-8)">
        <circle
          className="cpu-architecture cpu-line-8"
          cx="0"
          cy="0"
          r="8"
          fill="url(#cpu-rose-grad)"
        />
      </g>
      {/* CPU Box */}
      <g>
        {/* Cpu connections */}
        {showCpuConnections && (
          <g fill="url(#cpu-connection-gradient)">
            <rect x="93" y="37" width="2.5" height="5" rx="0.7" />
            <rect x="104" y="37" width="2.5" height="5" rx="0.7" />
            <rect
              x="116.3"
              y="44"
              width="2.5"
              height="5"
              rx="0.7"
              transform="rotate(90 116.25 45.5)"
            />
            <rect
              x="122.8"
              y="44"
              width="2.5"
              height="5"
              rx="0.7"
              transform="rotate(90 116.25 45.5)"
            />
            <rect
              x="104"
              y="16"
              width="2.5"
              height="5"
              rx="0.7"
              transform="rotate(180 105.25 39.5)"
            />
            <rect
              x="114.5"
              y="16"
              width="2.5"
              height="5"
              rx="0.7"
              transform="rotate(180 105.25 39.5)"
            />
            <rect
              x="81.5"
              y="44"
              width="2.5"
              height="5"
              rx="0.7"
              transform="rotate(-90 83.75 45.5)"
            />
            <rect
              x="75"
              y="44"
              width="2.5"
              height="5"
              rx="0.7"
              transform="rotate(-90 83.75 45.5)"
            />
          </g>
        )}

        {/* CPU Box */}
        <rect
          x="85"
          y="42"
          width="30"
          height="30"
          rx="3"
          fill="url(#cpu-box-gradient)"
          stroke="currentColor"
          strokeWidth="0.3"
        />

        {/* CPU Text */}
        <text
          x="100"
          y="57"
          textAnchor="middle"
          dominantBaseline="middle"
          fill="white"
          fontSize="8"
          fontWeight="bold"
          className="cpu-text"
        >
          {text}
          {animateText && (
            <animate
              attributeName="opacity"
              values="0;1;0;1;0;1;0;1"
              dur="0.8s"
              begin="0.8s"
              fill="freeze"
            />
          )}
        </text>
      </g>

      {/* Definitions */}
      <defs>
        {/* Circle Marker */}
        <marker
          id="cpu-circle-marker"
          viewBox="0 0 10 10"
          refX="5"
          refY="5"
          markerWidth={lineMarkerSize}
          markerHeight={lineMarkerSize}
        >
          <circle
            cx="5"
            cy="5"
            r="2"
            fill="currentColor"
            className="cpu-marker"
          >
            {animateMarkers && (
              <animate
                attributeName="opacity"
                values="0;1"
                dur="0.3s"
                begin="0.7s"
                fill="freeze"
              />
            )}
          </circle>
        </marker>

        {/* Gradients */}
        <linearGradient
          id="cpu-box-gradient"
          x1="0%"
          y1="0%"
          x2="100%"
          y2="100%"
        >
          <stop offset="0%" stopColor="#1a1a1a" />
          <stop offset="100%" stopColor="#383838" />
        </linearGradient>

        <linearGradient
          id="cpu-connection-gradient"
          x1="0%"
          y1="0%"
          x2="100%"
          y2="100%"
        >
          <stop offset="0%" stopColor="#4a4a4a" />
          <stop offset="100%" stopColor="#6a6a6a" />
        </linearGradient>

        <radialGradient id="cpu-blue-grad" cx="0.5" cy="0.5" r="0.5">
          <stop offset="0%" stopColor="#7DF9FF" stopOpacity="0.8" />
          <stop offset="100%" stopColor="#0096FF" stopOpacity="0" />
        </radialGradient>

        <radialGradient id="cpu-yellow-grad" cx="0.5" cy="0.5" r="0.5">
          <stop offset="0%" stopColor="#FDFD96" stopOpacity="0.8" />
          <stop offset="100%" stopColor="#FFEA00" stopOpacity="0" />
        </radialGradient>

        <radialGradient id="cpu-pinkish-grad" cx="0.5" cy="0.5" r="0.5">
          <stop offset="0%" stopColor="#FFD1DC" stopOpacity="0.8" />
          <stop offset="100%" stopColor="#FF9999" stopOpacity="0" />
        </radialGradient>

        <radialGradient id="cpu-white-grad" cx="0.5" cy="0.5" r="0.5">
          <stop offset="0%" stopColor="#FFFFFF" stopOpacity="0.8" />
          <stop offset="100%" stopColor="#F8F8FF" stopOpacity="0" />
        </radialGradient>

        <radialGradient id="cpu-green-grad" cx="0.5" cy="0.5" r="0.5">
          <stop offset="0%" stopColor="#98FB98" stopOpacity="0.8" />
          <stop offset="100%" stopColor="#32CD32" stopOpacity="0" />
        </radialGradient>

        <radialGradient id="cpu-orange-grad" cx="0.5" cy="0.5" r="0.5">
          <stop offset="0%" stopColor="#FFDAB9" stopOpacity="0.8" />
          <stop offset="100%" stopColor="#FFA500" stopOpacity="0" />
        </radialGradient>

        <radialGradient id="cpu-cyan-grad" cx="0.5" cy="0.5" r="0.5">
          <stop offset="0%" stopColor="#E0FFFF" stopOpacity="0.8" />
          <stop offset="100%" stopColor="#00FFFF" stopOpacity="0" />
        </radialGradient>

        <radialGradient id="cpu-rose-grad" cx="0.5" cy="0.5" r="0.5">
          <stop offset="0%" stopColor="#FFE4E1" stopOpacity="0.8" />
          <stop offset="100%" stopColor="#FF69B4" stopOpacity="0" />
        </radialGradient>

        {/* Masks */}
        <mask id="cpu-mask-1">
          <rect width="200" height="100" fill="white" />
          <path
            d="M 10 20 h 79.5 q 5 0 5 5 v 30"
            stroke="black"
            strokeWidth="0.5"
            fill="none"
          />
        </mask>

        <mask id="cpu-mask-2">
          <rect width="200" height="100" fill="white" />
          <path
            d="M 180 10 h -69.7 q -5 0 -5 5 v 30"
            stroke="black"
            strokeWidth="0.5"
            fill="none"
          />
        </mask>

        <mask id="cpu-mask-3">
          <rect width="200" height="100" fill="white" />
          <path
            d="M 130 20 v 21.8 q 0 5 -5 5 h -10"
            stroke="black"
            strokeWidth="0.5"
            fill="none"
          />
        </mask>

        <mask id="cpu-mask-4">
          <rect width="200" height="100" fill="white" />
          <path
            d="M 170 80 v -21.8 q 0 -5 -5 -5 h -50"
            stroke="black"
            strokeWidth="0.5"
            fill="none"
          />
        </mask>

        <mask id="cpu-mask-5">
          <rect width="200" height="100" fill="white" />
          <path
            d="M 135 65 h 15 q 5 0 5 5 v 10 q 0 5 -5 5 h -39.8 q -5 0 -5 -5 v -20"
            stroke="black"
            strokeWidth="0.5"
            fill="none"
          />
        </mask>

        <mask id="cpu-mask-6">
          <rect width="200" height="100" fill="white" />
          <path
            d="M 94.8 95 v -36"
            stroke="black"
            strokeWidth="0.5"
            fill="none"
          />
        </mask>

        <mask id="cpu-mask-7">
          <rect width="200" height="100" fill="white" />
          <path
            d="M 88 88 v -15 q 0 -5 -5 -5 h -10 q -5 0 -5 -5 v -5 q 0 -5 5 -5 h 14"
            stroke="black"
            strokeWidth="0.5"
            fill="none"
          />
        </mask>

        <mask id="cpu-mask-8">
          <rect width="200" height="100" fill="white" />
          <path
            d="M 30 30 h 25 q 5 0 5 5 v 6.5 q 0 5 5 5 h 20"
            stroke="black"
            strokeWidth="0.5"
            fill="none"
          />
        </mask>
      </defs>

      {/* Styles moved to index.css */}
    </svg>
  );
};

export default CpuArchitecture;