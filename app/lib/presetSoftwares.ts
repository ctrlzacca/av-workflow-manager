export type PresetSoftware = {
  name: string;
  icon: string;
  isImage?: boolean;
  defaultTasks?: { title: string; done: boolean }[];
};

export const PRESET_SOFTWARES: PresetSoftware[] = [
  {
    name: "Ableton",
    icon: "/ableton.svg",
    isImage: true,

    defaultTasks: [
      { title: "Produzione/Struttura", done: false },
      { title: "Rec Voci", done: false },
      { title: "Mix", done: false },
      { title: "Master", done: false },
      { title: "Video/Reel Promozionale", done: false },
      { title: "SIAE", done: false },
    ],
  },

  {
    name: "TouchDesigner",
    icon: "/touchdesigner.svg",
    isImage: true,

    defaultTasks: [
      { title: "Setup Visual", done: false },
      { title: "Sync Audio", done: false },
      { title: "Test Performance", done: false },
    ],
  },

    {
    name: "Illustrator",
    icon: "/illustrator.svg",
    isImage: true,

    defaultTasks: [
      { title: "...", done: false },
      { title: "...", done: false },
      { title: "...", done: false },
    ],
  },
      {
    name: "InDesign",
    icon: "/indesign.svg",
    isImage: true,

    defaultTasks: [
      { title: "...", done: false },
      { title: "...", done: false },
      { title: "...", done: false },
    ],
  },
      {
    name: "Photoshop",
    icon: "/photoshop.svg",
    isImage: true,

    defaultTasks: [
      { title: "...", done: false },
      { title: "...", done: false },
      { title: "...", done: false },
    ],
  },
      {
    name: "Resolume",
    icon: "/resolume.svg",
    isImage: true,

    defaultTasks: [
      { title: "...", done: false },
      { title: "...", done: false },
      { title: "...", done: false },
    ],
  },
      {
    name: "Max MSP",
    icon: "/max-msp.svg",
    isImage: true,

    defaultTasks: [
      { title: "...", done: false },
      { title: "...", done: false },
      { title: "...", done: false },
    ],
  },
      {
    name: "DaVinci Resolve",
    icon: "/davinci.svg",
    isImage: true,

    defaultTasks: [
      { title: "...", done: false },
      { title: "...", done: false },
      { title: "...", done: false },
    ],
  },
      {
    name: "Premiere Pro",
    icon: "/premiere.svg",
    isImage: true,

    defaultTasks: [
      { title: "...", done: false },
      { title: "...", done: false },
      { title: "...", done: false },
    ],
  },
      {
    name: "Blender",
    icon: "/blender.svg",
    isImage: true,

    defaultTasks: [
      { title: "...", done: false },
      { title: "...", done: false },
      { title: "...", done: false },
    ],
  },
];