import React from "react";

export type HeaderProps = {
  color: string;
  login: string;
  campus: string;
  cursus: string;
  isLevel21?: boolean;
  isCarbon?: boolean;
};

const UNDEFINED_COLOR = "#e0e0e0";

const Header = ({ color, login, campus, cursus, isLevel21 = false, isCarbon = false }: HeaderProps) => {
  const isDefault = color === UNDEFINED_COLOR;
  const logoFill = isDefault ? "white" : color;
  const logoGradientId = "logo_chrome";

  return (
    <>
      {/* Title */}
      <g
        id="title"
        className="fadeIn"
        style={{
          animationDelay: "0.15s",
        }}
      >
        <text
          fill="#e6edf3"
          xmlSpace="preserve"
          style={{
            whiteSpace: "nowrap",
          }}
          fontFamily="'Futura LT', sans-serif"
          fontSize="18"
          fontWeight="600"
          letterSpacing="0em"
        >
          <tspan x="25" y="38">
            {login}&apos;s {campus} Stats
          </tspan>
        </text>
      </g>
      {/* Cursus subtitle */}
      <g
        id="cursus"
        className="fadeIn"
        style={{
          animationDelay: "0.3s",
        }}
      >
        <text
          fill="#8b949e"
          xmlSpace="preserve"
          style={{
            whiteSpace: "nowrap",
          }}
          fontFamily="'Futura LT', sans-serif"
          fontSize="13"
          fontWeight="400"
          letterSpacing="0em"
        >
          <tspan x="25" y="55">
            {cursus}
          </tspan>
        </text>
      </g>
      {/* 42 logo top-right - chrome shine */}
      <defs>
        <linearGradient id={logoGradientId}
          gradientUnits="userSpaceOnUse" x1="0" y1="17" x2="0" y2="49">
          <stop offset="0%" stopColor={logoFill} stopOpacity="0.4" />
          <stop offset="30%" stopColor={logoFill} stopOpacity="1" />
          <stop offset="48%" stopColor={isDefault ? "#ffffff" : logoFill} stopOpacity={isDefault ? "0.95" : "1"} />
          <stop offset="52%" stopColor="#ffffff" stopOpacity={isDefault ? "0.9" : "0.2"} />
          <stop offset="70%" stopColor={logoFill} stopOpacity="1" />
          <stop offset="100%" stopColor={logoFill} stopOpacity="0.3" />
        </linearGradient>
      </defs>
      <g
        className="fadeIn"
        style={{
          animationDelay: "0.5s",
        }}
        transform="translate(-18, 8)"
      >
        {isDefault && (
          <g filter="url(#shadow)">
            <path
              d="M444 40.7359H459.473V48.4891H467.194V34.4781H451.748L467.194 19H459.473L444 34.4781V40.7359Z"
              fill="black"
              fillOpacity="0.4"
            />
            <path d="M470.527 26.7484L478.252 19H470.527V26.7484Z" fill="black" fillOpacity="0.4" />
            <path
              d="M478.252 26.7484L470.527 34.4781V42.2031H478.252V34.4781L486 26.7484V19H478.252V26.7484Z"
              fill="black"
              fillOpacity="0.4"
            />
            <path d="M486 34.4781L478.252 42.2031H486V34.4781Z" fill="black" fillOpacity="0.4" />
          </g>
        )}
        <path
          d="M442 38.7359H457.473V46.4891H465.194V32.4781H449.748L465.194 17H457.473L442 32.4781V38.7359Z"
          fill={isLevel21 || isCarbon ? logoFill : isDefault ? `url(#${logoGradientId})` : logoFill}
        />
        <path d="M468.527 24.7484L476.252 17H468.527V24.7484Z" fill={isLevel21 || isCarbon ? logoFill : isDefault ? `url(#${logoGradientId})` : logoFill} />
        <path
          d="M476.252 24.7484L468.527 32.4781V40.2031H476.252V32.4781L484 24.7484V17H476.252V24.7484Z"
          fill={isLevel21 || isCarbon ? logoFill : isDefault ? `url(#${logoGradientId})` : logoFill}
        />
        <path d="M484 32.4781L476.252 40.2031H484V32.4781Z" fill={isLevel21 || isCarbon ? logoFill : isDefault ? `url(#${logoGradientId})` : logoFill} />
      </g>
    </>
  );
};

export default Header;
