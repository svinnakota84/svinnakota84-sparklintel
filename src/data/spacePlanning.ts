export const SPACE_TYPES = {
  house: {
    label: "House",
    size: [12, 10],
    items: ["wall", "opening", "stair", "bed", "sofa", "table", "cabinet", "bath"],
    layout: [["wall", 0, 4], ["opening", 3, 4], ["wall", 5, 4], ["bed", 1, 1], ["sofa", 2, 6], ["cabinet", 9, 1], ["table", 8, 6], ["bath", 9, 3]],
  },
  business: {
    label: "Business space",
    size: [18, 12],
    items: ["wall", "opening", "desk", "chair", "counter", "display", "table", "cabinet"],
    layout: [["counter", 2, 2], ["desk", 7, 2], ["desk", 7, 5], ["table", 12, 3], ["display", 3, 8], ["cabinet", 14, 8]],
  },
  warehouse: {
    label: "Warehouse",
    size: [30, 20],
    items: ["wall", "opening", "rack", "staging", "dock", "desk", "column"],
    layout: [["dock", 2, 0], ["staging", 3, 3], ["rack", 11, 3], ["rack", 11, 9], ["rack", 19, 3], ["rack", 19, 9], ["desk", 25, 15]],
  },
} as const;

export type SpaceType = keyof typeof SPACE_TYPES;

export const PLANNER_ITEMS = {
  cabinet: { label: "Cabinet", dims: [2, .6, 1], color: "#c6a889" },
  bath: { label: "Bathtub", dims: [1.7, .8, .6], color: "#d5dbe0" },
  desk: { label: "Work desk", dims: [1.6, .8, .75], color: "#c3a384" },
  counter: { label: "Reception or checkout counter", dims: [2.4, .8, 1.1], color: "#b1a68e" },
  display: { label: "Retail display", dims: [2, .9, 1.5], color: "#b3beb2" },
  rack: { label: "Pallet rack", dims: [4, 1.1, 3.5], color: "#88a1ad" },
  staging: { label: "Staging area", dims: [5, 4, .03], color: "#d7c69c" },
  dock: { label: "Loading bay", dims: [3.5, 2, .08], color: "#aaaab3" },
} satisfies Record<string, {label: string; dims: [number, number, number]; color: string}>;
