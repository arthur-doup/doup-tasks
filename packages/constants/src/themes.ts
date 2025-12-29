export const THEMES = ["light", "dark"];

export interface I_THEME_OPTION {
  key: string;
  value: string;
  i18n_label: string;
  type: string;
  icon: {
    border: string;
    color1: string;
    color2: string;
  };
}

export const THEME_OPTIONS: I_THEME_OPTION[] = [
  {
    key: "system_preference",
    value: "system",
    i18n_label: "System preference",
    type: "light",
    icon: {
      border: "#D2D7DF",
      color1: "#FFFFFF",
      color2: "#FA900F", // Doup Orange
    },
  },
  {
    key: "light",
    value: "light",
    i18n_label: "Light",
    type: "light",
    icon: {
      border: "#D2D7DF",
      color1: "#FFFFFF",
      color2: "#FA900F", // Doup Orange
    },
  },
  {
    key: "dark",
    value: "dark",
    i18n_label: "Dark",
    type: "dark",
    icon: {
      border: "#353535",
      color1: "#1A1A1A",
      color2: "#FA900F", // Doup Orange
    },
  },
];
