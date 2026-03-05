import React from "react";

export type InfomationProps = {
  data: [key: string, value: string][];
  color: string;
  hasProfileImage?: boolean;
  startY?: number;
};

const Infomation = ({ data, color, hasProfileImage, startY: startYProp }: InfomationProps) => {
  const startY = startYProp ?? 88;
  const startDelay = 0.4;
  const distance = 22;
  const labelX = hasProfileImage ? 100 : 25;
  const valueX = hasProfileImage ? 170 : 95;

  return (
    <>
      {data.map(([key, value], i) => (
        <g
          key={`${key}-${value}`}
          className="fadeIn"
          style={{
            animationDelay: `${startDelay + i * 0.15}s`,
          }}
        >
          {/* Label */}
          <text
            fill={color}
            xmlSpace="preserve"
            style={{
              whiteSpace: "nowrap",
            }}
            fontFamily="'Segoe UI', Ubuntu, 'Helvetica Neue', Arial, sans-serif"
            fontSize="13"
            fontWeight="600"
            letterSpacing="0em"
          >
            <tspan x={labelX} y={startY + i * distance}>
              {key.toLowerCase()}:
            </tspan>
          </text>
          {/* Value */}
          <text
            fill="#8b949e"
            xmlSpace="preserve"
            style={{
              whiteSpace: "nowrap",
            }}
            fontFamily="'Segoe UI', Ubuntu, 'Helvetica Neue', Arial, sans-serif"
            fontSize="13"
            fontWeight="400"
            letterSpacing="0em"
          >
            <tspan x={valueX} y={startY + i * distance}>
              {value}
            </tspan>
          </text>
        </g>
      ))}
    </>
  );
};

export default Infomation;
