import React from "react";

export type LevelProps = {
  color: string;
  level: number;
  height: number;
};

const Level = ({ color, level, height }: LevelProps) => {
  const level_integer = Math.floor(level);
  const level_percentage = (parseFloat((level % 1).toFixed(2)) * 100).toFixed(
    0
  );
  const progressWidth = (parseInt(level_percentage) / 100) * 445;

  return (
    <>
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
        style={{
          animationDelay: "1.25s",
        }}
        x="25"
        y={height - 40}
        width="445"
        height="30"
        rx="15"
        fill="#161b22"
      />
      <rect
        className="fadeIn"
        style={{
          animationDelay: "1.25s",
        }}
        x="25"
        y={height - 40}
        width="445"
        height="30"
        rx="15"
        stroke="#30363d"
        strokeWidth="1"
        fill="none"
      />
      {/* Bar fill */}
      <rect
        className="progress_bar"
        style={{
          animationDelay: "1.5s",
        }}
        x="25"
        y={height - 40}
        width="445"
        height="30"
        rx="15"
        fill={color}
        fillOpacity="0.6"
      />
      {/* Level text */}
      <text
        fill="#e6edf3"
        xmlSpace="preserve"
        className="fadeIn"
        style={{
          animationDelay: "1.5s",
          whiteSpace: "nowrap",
        }}
        fontFamily="'Segoe UI', Ubuntu, 'Helvetica Neue', Arial, sans-serif"
        fontSize="12"
        fontWeight="600"
        letterSpacing="0em"
        textAnchor="middle"
      >
        <tspan x="247" y={height - 20}>
          level {level_integer} - {level_percentage}%
        </tspan>
      </text>
    </>
  );
};

export default Level;
