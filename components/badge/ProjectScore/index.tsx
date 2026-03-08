/* ************************************************************************** */
/*                                                                            */
/*                                                        :::      ::::::::   */
/*   index.tsx                                          :+:      :+:    :+:   */
/*                                                    +:+ +:+         +:+     */
/*   By: jaeskim <jaeskim@student.42seoul.kr>       +#+  +:+       +#+        */
/*                                                +#+#+#+#+#+   +#+           */
/*   Created: 2020/11/22 03:04:45 by jaeskim           #+#    #+#             */
/*   Updated: 2022/04/04 23:36:50 by jaeskim          ###   ########seoul.kr  */
/*                                                                            */
/* ************************************************************************** */

import React from "react";
import { ProjectUser } from "../../../lib/api/42api";
import calculateStringWidth from "../../../lib/calculateStringWidth";
import { fontFaceStyle } from "../../../lib/fontBase64";
import Icon from "./Icon";

const ICONSWIDTH = 300;
const PADDING = 50;

interface Props {
  data: ProjectUser;
}

const ProjectScore: React.FC<Props> = ({ data }) => {
  const type =
    data["validated?"] != null
      ? data["validated?"] == true
        ? "success"
        : "fail"
      : "subscribed";

  const color =
    data["validated?"] != null
      ? data["validated?"] == true
        ? "#5CB85C"
        : "#D8636F"
      : "#00BABC";

  // Fixed width: match the widest case ("success 125/100") for all badges
  const refWidth =
    ICONSWIDTH +
    PADDING * 2 +
    calculateStringWidth("success", 120) +
    calculateStringWidth("125", 200) +
    calculateStringWidth("/100", 80);

  const fixedWidth = refWidth + PADDING * 2; // extra padding on both sides

  // Calculate actual content width for centering
  const hasScore = data["validated?"] != null;
  const contentWidth =
    ICONSWIDTH +
    PADDING +
    calculateStringWidth(type, 120) +
    (hasScore
      ? PADDING +
        calculateStringWidth(data.final_mark.toString(), 200) +
        calculateStringWidth("/100", 80)
      : 0);

  const offsetX = (fixedWidth - contentWidth) / 2;

  return (
    <svg
      width={(fixedWidth / 10).toFixed(0)}
      height="28"
      viewBox={`0 0 ${fixedWidth} 280`}
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <defs>
        <style dangerouslySetInnerHTML={{ __html: fontFaceStyle }} />
      </defs>
      <rect width={fixedWidth} height="280" rx="1" fill={color} />
      <g transform={`translate(${offsetX}, 0)`}>
        <Icon type={type} />
      </g>
      <g
        fill="#fff"
        textAnchor="start"
        fontFamily="'Futura LT', sans-serif"
        fontSize="150"
      >
        <text
          x={offsetX + ICONSWIDTH}
          y="200"
          textLength={calculateStringWidth(type, 120)}
          data-testid={"type"}
        >
          {type}
        </text>
      </g>
      {hasScore && (
        <>
          <g
            fill="#fff"
            textAnchor="start"
            fontFamily="'Futura LT', sans-serif"
            fontSize="200"
          >
            <text
              x={offsetX + ICONSWIDTH + calculateStringWidth(type, 120) + PADDING}
              y="210"
              textLength={calculateStringWidth(data.final_mark.toString(), 200)}
              data-testid={"final_mark"}
            >
              {data.final_mark.toString()}
            </text>
          </g>
          <g
            fill="#fff"
            textAnchor="start"
            fontFamily="'Futura LT', sans-serif"
            fontSize="80"
          >
            <text
              x={
                offsetX +
                ICONSWIDTH +
                calculateStringWidth(type, 120) +
                PADDING +
                calculateStringWidth(data.final_mark.toString(), 200)
              }
              y="210"
              textLength={calculateStringWidth("/100", 80)}
            >
              /100
            </text>
          </g>
        </>
      )}
    </svg>
  );
};

export default ProjectScore;
