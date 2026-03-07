import React from "react";

export type LevelProps = {
  color: string;
  level: number;
  height: number;
  isLevel21?: boolean;
};

const Level = ({ color, level, height, isLevel21 = false }: LevelProps) => {
  const level_integer = Math.floor(level);
  const level_percentage = (parseFloat((level % 1).toFixed(2)) * 100).toFixed(
    0
  );
  const progressWidth = (parseInt(level_percentage) / 100) * 445;
  const barY = height - 43;
  const barH = 35;

  return (
    <>
      <defs>
        {isLevel21 ? (
          <linearGradient id="bar_gradient" x1="0" y1="0" x2="1" y2="0">
            <stop offset="0%" stopColor="#8B6914" stopOpacity="0.9" />
            <stop offset="30%" stopColor="#C8A400" stopOpacity="1" />
            <stop offset="55%" stopColor="#FFD700" stopOpacity="1" />
            <stop offset="75%" stopColor="#E8C100" stopOpacity="1" />
            <stop offset="100%" stopColor="#C8A400" stopOpacity="0.9" />
          </linearGradient>
        ) : (
          <linearGradient id="bar_gradient" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={color} stopOpacity="0.95" />
            <stop offset="45%" stopColor={color} stopOpacity="0.7" />
            <stop offset="100%" stopColor={color} stopOpacity="0.4" />
          </linearGradient>
        )}
        <linearGradient id="bar_gloss" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#ffffff" stopOpacity="0.28" />
          <stop offset="35%" stopColor="#ffffff" stopOpacity="0.06" />
          <stop offset="55%" stopColor="#ffffff" stopOpacity="0" />
          <stop offset="100%" stopColor="#000000" stopOpacity="0.12" />
        </linearGradient>
        <filter id="bar_glow">
          <feGaussianBlur stdDeviation="4" result="blur" />
          <feMerge>
            <feMergeNode in="blur" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
      </defs>
      <style
        dangerouslySetInnerHTML={{
          __html: `
            @keyframes expandWidth {
              0% { width: 0px; }
              100% { width: ${progressWidth}px; }
            }
            .progress_bar {
              width: 0;
              animation: expandWidth 1s ease;
              animation-fill-mode: forwards;
            }
          `,
        }}
      />
      {/* Bar background */}
      <rect
        className="fadeIn"
        style={{ animationDelay: "1.25s" }}
        x="25" y={barY} width="445" height={barH} rx="17"
        fill="#161b22"
      />
      <rect
        className="fadeIn"
        style={{ animationDelay: "1.25s" }}
        x="25" y={barY} width="445" height={barH} rx="17"
        stroke="#30363d" strokeWidth="1" fill="none"
      />
      {/* Glow behind fill */}
      <rect
        className="progress_bar"
        style={{ animationDelay: "1.5s" }}
        x="25" y={barY} width="445" height={barH} rx="17"
        fill={color} fillOpacity="0.25" filter="url(#bar_glow)"
      />
      {/* 3D gradient fill */}
      <rect
        className="progress_bar"
        style={{ animationDelay: "1.5s" }}
        x="25" y={barY} width="445" height={barH} rx="17"
        fill="url(#bar_gradient)"
      />
      {/* Gloss highlight */}
      <rect
        className="progress_bar"
        style={{ animationDelay: "1.5s" }}
        x="25" y={barY} width="445" height={barH} rx="17"
        fill="url(#bar_gloss)"
      />
      {/* Level text */}
      <text
        fill="#ffffff"
        xmlSpace="preserve"
        className="fadeIn"
        style={{
          animationDelay: "1.5s",
          whiteSpace: "nowrap",
        }}
        fontFamily="'Futura LT', sans-serif"
        fontSize="13"
        fontWeight="700"
        letterSpacing="0.5px"
        textAnchor="middle"
      >
        <tspan x="247" y={height - 21}>
          level {level_integer} - {level_percentage}%
        </tspan>
      </text>
    </>
  );
};

export default Level;
