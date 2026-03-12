import React from "react";
import BlackHole from "./BlackHole";
import Container from "./Container";
import Header from "./Header";
import Infomation from "./Infomation";
import Level from "./Level";

export type StatsProps = {
  data: {
    login: string;
    campus: string;
    cursus: string;
    grade: string;
    begin_at: string;
    blackholed_at?: string | null;
    end_at?: string | null;
    name?: string | null;
    email?: string | null;
    color: string;
    level: number;
    profileImage?: string | null;
    projectCount?: number | null;
    credlyBadges?: { imageUrl: string; name?: string }[];
  };
};

const GOLDEN_COLOR = "#C8A400";
const CARBON_COLOR = "#C0C8D8";

const Stats = ({ data }: StatsProps) => {
  const isLevel21 = data.color === GOLDEN_COLOR;
  const isCarbon = data.color === CARBON_COLOR;
  const effectiveColor = data.color;

  const infoRows = [
    data.name && ["Name", data.name],
    data.email && ["Email", data.email],
    ["Grade", data.grade],
    data.projectCount != null && ["Projects", `${data.projectCount} validated`],
  ].filter(Boolean) as [string, string][];

  const badges = (data.credlyBadges ?? []).slice(0, 4);
  const hasBadges = badges.length > 0;

  // ~75% of credit card ratio; grows by 24px per row beyond 3
  const height = 227 + Math.max(0, infoRows.length - 3) * 24;

  const contentTop = 75;
  const contentBottom = height - 48;
  const infoCenterY = (contentTop + contentBottom) / 2;
  const infoStartY = infoCenterY - ((infoRows.length - 1) * 24) / 2;

  const avatarR = 35;
  const avatarCx = 55;
  const avatarCy = infoCenterY - 3;

  // Badges in header: match 42 logo size (logo effective y=25–57, height=32, center y=41)
  // Logo effective x starts at ~424; title text ends at ~230
  const badgeSize = 32;
  const badgeGap = 8;
  const badgeTotalW = badges.length * badgeSize + (badges.length - 1) * badgeGap;
  const headerBadgeCenterX = (230 + 424) / 2; // 327 — midpoint between title end and logo start
  const headerBadgeStartX = headerBadgeCenterX - badgeTotalW / 2;
  const headerBadgeY = 41 - badgeSize / 2; // same vertical center as 42 logo (y=25)

  return (
    <Container height={height} color={effectiveColor} isLevel21={isLevel21} isCarbon={isCarbon}>
      <Header
        color={effectiveColor}
        campus={data.campus}
        cursus={data.cursus}
        login={data.login}
        isLevel21={isLevel21}
        isCarbon={isCarbon}
      />
      {data.profileImage && (
        <g className="fadeIn" style={{ animationDelay: "0.5s" }}>
          <defs>
            <clipPath id="avatar_clip">
              <circle cx={avatarCx} cy={avatarCy} r={avatarR} />
            </clipPath>
          </defs>
          <circle
            cx={avatarCx}
            cy={avatarCy}
            r={avatarR + 1.5}
            stroke={effectiveColor}
            strokeWidth="1.5"
            fill="none"
          />
          <image
            x={avatarCx - avatarR}
            y={avatarCy - avatarR}
            width={avatarR * 2}
            height={avatarR * 2}
            href={data.profileImage}
            preserveAspectRatio="xMidYMid slice"
            clipPath="url(#avatar_clip)"
          />
        </g>
      )}
      <Infomation
        color={effectiveColor}
        hasProfileImage={!!data.profileImage}
        startY={infoStartY}
        distance={24}
        data={infoRows}
      />
      <BlackHole
        data={{
          begin_at: data.begin_at,
          blackholed_at: data.blackholed_at,
          end_at: data.end_at,
          grade: data.grade,
        }}
        color={effectiveColor}
      />
      {hasBadges && (
        <g className="fadeIn" style={{ animationDelay: "0.4s" }}>
          {badges.map((badge, i) => (
            <image
              key={i}
              x={headerBadgeStartX + i * (badgeSize + badgeGap)}
              y={headerBadgeY}
              width={badgeSize}
              height={badgeSize}
              href={badge.imageUrl}
              preserveAspectRatio="xMidYMid meet"
            />
          ))}
        </g>
      )}
      <Level height={height} color={effectiveColor} level={data.level} isLevel21={isLevel21} />
    </Container>
  );
};

export default Stats;
