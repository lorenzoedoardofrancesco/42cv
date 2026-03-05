import React, { PropsWithChildren } from "react";

export type ContainerProps = {
  color: string;
  cover_url: string;
  height: number;
};

const Container: React.FC<PropsWithChildren<ContainerProps>> = ({
  children,
  color,
  height,
}) => {
  return (
    <svg
      width="495"
      height={height + 10}
      viewBox={`0 0 495 ${height + 10}`}
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      xmlnsXlink="http://www.w3.org/1999/xlink"
    >
      <defs>
        <filter
          id="shadow"
          filterUnits="userSpaceOnUse"
          colorInterpolationFilters="sRGB"
        >
          <feFlood floodOpacity="0" result="BackgroundImageFix" />
          <feBlend
            mode="normal"
            in="SourceGraphic"
            in2="BackgroundImageFix"
            result="shape"
          />
          <feGaussianBlur
            stdDeviation="1"
            result="effect1_foregroundBlur_101_3"
          />
        </filter>
      </defs>
      <style
        dangerouslySetInnerHTML={{
          __html: `
            @keyframes fadeIn {
              0% { opacity: 0; }
              100% { opacity: 1; }
            }
            .fadeIn {
              opacity: 0;
              animation: fadeIn 0.5s ease-in-out;
              animation-fill-mode: forwards;
            }
          `,
        }}
      />
      <g>
        {/* Card background */}
        <rect x="5" y="5" width="485" height={height} rx="10" fill="#0d1117" />
        <rect
          x="5"
          y="5"
          width="485"
          height={height}
          rx="10"
          fill={color}
          fillOpacity="0.06"
        />
        {/* Border */}
        <rect
          x="5.5"
          y="5.5"
          width="484"
          height={height - 1}
          rx="9.5"
          stroke={color}
          strokeOpacity="0.3"
        />
      </g>
      {children}
    </svg>
  );
};

export default Container;
