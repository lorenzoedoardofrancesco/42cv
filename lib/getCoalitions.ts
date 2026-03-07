import { Coalition } from "./api/42api";
import collection from "lodash-es/collection";

const getCoalitions = (
  id: string,
  _coalitions: Coalition[]
) => {
  const collections = {
    ...collection.keyBy(_coalitions, "id"),
    piscine: { color: "#00babc" },
    undefined: { color: "#e0e0e0" },
    level21: { color: "#C8A400" },
    midnight: { color: "#818cf8" },
    carbon: { color: "#C0C8D8" },
    rose: { color: "#f472b6" },
    neon: { color: "#e040fb" },
  };

  return collections[id];
};

export default getCoalitions;
