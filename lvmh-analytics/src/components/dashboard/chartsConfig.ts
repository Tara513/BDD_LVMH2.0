/**
 * Style commun des graphiques : premium dark LVMH
 */
/** Couleurs distinctes pour éviter confusion entre segments (or, puis gris bien différenciés) */
export const CHART_COLORS = [
  "#d4af37", // gold
  "#8b7355", // bronze
  "#a3a3a3", // gris clair
  "#737373",
  "#525252",
  "#404040",
];

export const TOOLTIP_STYLE = {
  backgroundColor: "#0a0a0a",
  borderRadius: 8,
  border: "1px solid #262626",
  fontSize: 12,
  padding: "10px 14px",
};

export const AXIS_STYLE = {
  stroke: "#525252",
  fontSize: 11,
  tick: { fill: "#737373" },
};

export const BAR_RADIUS = [4, 4, 0, 0] as const;

/** Taille des camemberts : graphique plus grand, place pour la légende */
export const PIE_SIZE = { height: 300, outerRadius: 78 };
