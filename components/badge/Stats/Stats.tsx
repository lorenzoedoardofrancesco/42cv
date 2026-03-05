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
    cover: string;
    logo: string;
    level: number;
    profileImage?: string | null;
  };
};

const Stats = ({ data }: StatsProps) => {
  const infoRows = [
    data.name && ["Name", data.name],
    data.email && ["Email", data.email],
    ["Grade", data.grade],
  ].filter(Boolean) as [string, string][];

  const baseHeight = 190 - (infoRows.length < 3 ? 25 : 0);
  const height = data.profileImage ? Math.max(baseHeight, 190) : baseHeight;

  // Center the avatar vertically in the content area (between header and level bar)
  const contentTop = 65;
  const contentBottom = height - 45;
  const infoCenterY = (contentTop + contentBottom) / 2;
  const avatarR = 30;
  const avatarCx = 55;
  const avatarCy = infoCenterY;

  return (
    <Container height={height} color={data.color} cover_url={data.cover}>
      <Header
        color={data.color}
        campus={data.campus}
        cursus={data.cursus}
        login={data.login}
        logo_url={data.logo}
      />
      {data.profileImage && (
        <g>
          <defs>
            <clipPath id="avatar_clip">
              <circle cx={avatarCx} cy={avatarCy} r={avatarR - 1} />
            </clipPath>
          </defs>
          <circle
            cx={avatarCx}
            cy={avatarCy}
            r={avatarR + 1}
            stroke={data.color}
            strokeWidth="2"
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
        color={data.color}
        hasProfileImage={!!data.profileImage}
        startY={data.profileImage ? infoCenterY - ((infoRows.length - 1) * 22) / 2 : undefined}
        data={infoRows}
      />
      <BlackHole
        data={{
          begin_at: data.begin_at,
          blackholed_at: data.blackholed_at,
          end_at: data.end_at,
          grade: data.grade,
        }}
        color={data.color}
      />
      <Level height={height} color={data.color} level={data.level} />
    </Container>
  );
};

export default Stats;
