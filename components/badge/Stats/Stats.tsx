import React from "react";
import BlackHole from "./BlackHole";
import Container from "./Container";
import Header from "./Header";
import Infomation from "./Infomation";
import Level from "./Level";

const F18: Record<string, number> = {" ":4.19,"'":3.38,"0":10.22,"1":10.22,"2":10.22,"3":10.22,"4":10.22,"5":10.22,"6":10.22,"7":10.22,"8":10.22,"9":10.22,A:11.2,B:9.54,C:11.63,D:11.38,E:8.68,F:7.81,G:13.64,H:11.92,I:4.43,J:5.51,K:10.22,L:6.44,M:15.53,N:13.79,O:14.29,P:8.21,Q:14.29,R:9.04,S:9.32,T:7.67,U:11.63,V:10.01,W:17.24,X:9.07,Y:9.54,Z:9.65,a:9.47,b:9.47,c:7.88,d:9.47,e:8.66,f:4.32,g:9.47,h:8.46,i:3.74,j:3.74,k:7.6,l:3.74,m:12.33,n:8.46,o:9.43,p:9.47,q:9.47,r:5.33,s:6.34,t:3.85,u:8.39,v:7.63,w:12.28,x:8.17,y:8.28,z:8.28};

function measureTitle(text: string): number {
  let w = 0;
  for (const ch of text) w += F18[ch] ?? 9;
  return w;
}

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

  const badgeSize = 42;
  const badgeGap = 8;
  const badgeTotalW = badges.length * badgeSize + (badges.length - 1) * badgeGap;
  const titleText = `${data.login}'s ${data.campus} Stats`;
  const titleRightX = 25 + measureTitle(titleText) * 1.05; // 5% faux-bold correction (font is regular, renders at weight 600)
  const LOGO_LEFT_X = 424;
  const BADGE_PADDING = 10;
  const badgeZoneLeft = titleRightX + BADGE_PADDING;
  const badgeZoneRight = LOGO_LEFT_X - BADGE_PADDING;
  const badgeZoneWidth = Math.max(0, badgeZoneRight - badgeZoneLeft);
  const headerBadgeStartX = badgeZoneLeft + (badgeZoneWidth - badgeTotalW) / 2;
  const headerBadgeY = 41 - badgeSize / 2;

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
