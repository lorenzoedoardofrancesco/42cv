import React, { PropsWithChildren } from "react";
import { fontFaceStyle } from "../../../lib/fontBase64";

export type ContainerProps = {
  color: string;
  height: number;
  isLevel21?: boolean;
  isCarbon?: boolean;
};

const Container: React.FC<PropsWithChildren<ContainerProps>> = ({
  children,
  color,
  height,
  isLevel21 = false,
  isCarbon = false,
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
        {isLevel21 ? (
          <>
            <linearGradient id="card_bg" x1="0" y1="0" x2="1" y2="1">
              <stop offset="0%" stopColor="#14100a" />
              <stop offset="45%" stopColor="#100d07" />
              <stop offset="100%" stopColor="#0a0804" />
            </linearGradient>
            <linearGradient id="card_sheen" x1="0" y1="0" x2="1" y2="1">
              <stop offset="0%" stopColor="#FFD700" stopOpacity="0.10" />
              <stop offset="30%" stopColor="#C8A400" stopOpacity="0.05" />
              <stop offset="60%" stopColor="#FFD700" stopOpacity="0.00" />
              <stop offset="100%" stopColor="#FFD700" stopOpacity="0.00" />
            </linearGradient>
            <linearGradient id="border_grad" x1="0" y1="0" x2="1" y2="1">
              <stop offset="0%" stopColor="#FFD700" stopOpacity="0.95" />
              <stop offset="35%" stopColor="#E8C100" stopOpacity="0.80" />
              <stop offset="65%" stopColor="#C8A400" stopOpacity="0.70" />
              <stop offset="100%" stopColor="#8B6914" stopOpacity="0.50" />
            </linearGradient>
          </>
        ) : isCarbon ? (
          <>
            <linearGradient id="card_bg" x1="0" y1="0" x2="1" y2="1">
              <stop offset="0%" stopColor="#050505" />
              <stop offset="100%" stopColor="#000000" />
            </linearGradient>
            <linearGradient id="card_sheen" x1="0" y1="0" x2="1" y2="1">
              <stop offset="0%" stopColor="#ffffff" stopOpacity="0.04" />
              <stop offset="40%" stopColor="#ffffff" stopOpacity="0.01" />
              <stop offset="100%" stopColor="#ffffff" stopOpacity="0.00" />
            </linearGradient>
            <linearGradient id="border_grad" x1="0" y1="0" x2="1" y2="1">
              <stop offset="0%" stopColor="#ffffff" stopOpacity="0.70" />
              <stop offset="35%" stopColor="#C0C8D8" stopOpacity="0.55" />
              <stop offset="65%" stopColor="#8090A8" stopOpacity="0.40" />
              <stop offset="100%" stopColor="#404858" stopOpacity="0.25" />
            </linearGradient>
          </>
        ) : (
          <>
            <linearGradient id="card_bg" x1="0" y1="0" x2="1" y2="1">
              <stop offset="0%" stopColor="#12161f" />
              <stop offset="45%" stopColor="#0e1420" />
              <stop offset="100%" stopColor="#090c14" />
            </linearGradient>
            <linearGradient id="card_sheen" x1="0" y1="0" x2="1" y2="1">
              <stop offset="0%" stopColor="#ffffff" stopOpacity="0.07" />
              <stop offset="30%" stopColor="#ffffff" stopOpacity="0.03" />
              <stop offset="60%" stopColor="#ffffff" stopOpacity="0.00" />
              <stop offset="100%" stopColor="#ffffff" stopOpacity="0.00" />
            </linearGradient>
            <linearGradient id="border_grad" x1="0" y1="0" x2="1" y2="1">
              <stop offset="0%" stopColor="#9ca3af" stopOpacity="0.9" />
              <stop offset="50%" stopColor="#6b7280" stopOpacity="0.6" />
              <stop offset="100%" stopColor="#374151" stopOpacity="0.4" />
            </linearGradient>
          </>
        )}
        <linearGradient id="separator" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0%" stopColor={color} stopOpacity="0" />
          <stop offset="20%" stopColor={color} stopOpacity="0.4" />
          <stop offset="80%" stopColor={color} stopOpacity="0.4" />
          <stop offset="100%" stopColor={color} stopOpacity="0" />
        </linearGradient>
        <filter id="card_glow" x="-8%" y="-8%" width="116%" height="116%">
          <feGaussianBlur stdDeviation="6" />
        </filter>
      </defs>
      <style
        dangerouslySetInnerHTML={{
          __html: `
            ${fontFaceStyle}
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
        {/* Outer glow */}
        <rect x="5" y="5" width="485" height={height} rx="10"
          fill={color} fillOpacity="0.12" filter="url(#card_glow)" />
        {/* Card background — luxury dark gradient */}
        <rect x="5" y="5" width="485" height={height} rx="10" fill="url(#card_bg)" />
        {/* Color tint */}
        <rect x="5" y="5" width="485" height={height} rx="10" fill={color} fillOpacity="0.04" />
        {/* Metallic sheen */}
        <rect x="5" y="5" width="485" height={height} rx="10" fill="url(#card_sheen)" />
        {/* Platinum border */}
        <rect
          x="5.5"
          y="5.5"
          width="484"
          height={height - 1}
          rx="9.5"
          stroke="url(#border_grad)"
          strokeWidth="1.5"
          fill="none"
        />
        {/* Separator line */}
        <line x1="25" y1="68" x2="470" y2="68"
          stroke="url(#separator)" strokeWidth="0.5" />
      </g>
      {children}
    </svg>
  );
};

export default Container;
