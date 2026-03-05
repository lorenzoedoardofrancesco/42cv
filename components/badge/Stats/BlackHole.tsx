import React from "react";

export type BlackHoleProps = {
  data: {
    begin_at: string;
    blackholed_at?: string | null;
    end_at?: string | null;
    grade: string;
  };
  color: string;
};

const getRemainDay = (end: string) => {
  const startDate = new Date();
  const endDate = new Date(end);

  const Difference_In_Time = endDate.getTime() - startDate.getTime();

  return Math.floor(Difference_In_Time / (1000 * 3600 * 24));
};

const getDayColor = (day: number) => {
  if (day >= 50) return "rgb(83, 210, 122)";
  if (day >= 30) return "rgb(223, 149, 57)";
  return "rgb(255,69,0)";
};

const InfoBox = ({
  color,
  title,
  titleColor,
  value,
}: {
  color?: string;
  title: string;
  titleColor: string;
  value: string;
}) => (
  <>
    <rect
      className="fadeIn"
      style={{ animationDelay: "1.0s" }}
      x="328"
      y="71"
      width="150"
      height="48"
      rx="8"
      fill="#161b22"
    />
    <rect
      className="fadeIn"
      style={{ animationDelay: "1.0s" }}
      x="328"
      y="71"
      width="150"
      height="48"
      rx="8"
      stroke="#30363d"
      strokeWidth="1"
      fill="none"
    />
    <text
      fill={titleColor}
      xmlSpace="preserve"
      className="fadeIn"
      style={{
        animationDelay: "1.25s",
        whiteSpace: "nowrap",
      }}
      fontFamily="'Segoe UI', Ubuntu, 'Helvetica Neue', Arial, sans-serif"
      fontSize="9"
      fontWeight="600"
      letterSpacing="0em"
      textAnchor="middle"
    >
      <tspan x="403" y="90">
        {title}
      </tspan>
    </text>
    <text
      fill={color || "#8b949e"}
      xmlSpace="preserve"
      className="fadeIn"
      style={{
        animationDelay: "1.5s",
        whiteSpace: "nowrap",
      }}
      fontFamily="'Segoe UI', Ubuntu, 'Helvetica Neue', Arial, sans-serif"
      fontSize="11"
      fontWeight="600"
      letterSpacing="0em"
      textAnchor="middle"
    >
      <tspan x="403" y="108">
        {value}
      </tspan>
    </text>
  </>
);

const BlackHole = ({ data, color }: BlackHoleProps) => {
  const reaminDay = data.blackholed_at
    ? getRemainDay(data.blackholed_at)
    : null;

  const isPisciner = data.grade === "Pisciner";
  const beginDate = new Date(data.begin_at).toISOString().substring(0, 10);
  const endDate = data.end_at
    ? new Date(data.end_at).toISOString().substring(0, 10)
    : null;

  // Absorbed by black hole
  if (reaminDay !== null && reaminDay < 0)
    return (
      <g
        dangerouslySetInnerHTML={{
          __html: "<!-- You've been absorbed by the Black Hole. -->",
        }}
      />
    );

  // Has blackhole — show days remaining
  if (data.blackholed_at) {
    return (
      <InfoBox
        titleColor="#ffc221"
        title="BlackHole absorption"
        color={getDayColor(reaminDay)}
        value={
          reaminDay <= 1 ? "few hours left!" : `${reaminDay} days left!`
        }
      />
    );
  }

  // Has end date — show period
  if (endDate) {
    return (
      <InfoBox
        titleColor={color}
        title={isPisciner ? "Piscine period" : "Student period"}
        value={`${beginDate} ~ ${endDate}`}
      />
    );
  }

  // No end date — still active
  return (
    <InfoBox
      titleColor={color}
      title={isPisciner ? "Pisciner since" : "Student since"}
      value={beginDate}
    />
  );
};

export default BlackHole;
