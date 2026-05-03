import { create } from 'zustand';

export type MaterialCategory = 'anodized' | 'wood' | 'slate';

export interface TableParameters {
  tableLength: number;   // 0-100  → 桌面长
  tableWidth: number;    // 0-100  → 桌面宽
  cornerRadius: number;  // 0-100  → 桌面圆角
  legHeight: number;     // 0-100  → 腿高度
  legWidth: number;      // 0-100  → 腿宽度
  legFlare: number;      // 0-100  → 腿张开度 (腿开面宽)
  legInset: number;      // 0-100  → 腿内缩距离 (欠度)
  apronHeight: number;   // 0-100  → 桌架厚度
  colorHue: number;      // 0-360  → 色相
  metalness: number;     // 0-100  → 金属感
  roughness: number;     // 0-100  → 粗糙度
  materialCategory: MaterialCategory; // 材质分类
}

interface TableState {
  viewMode: 'editor' | 'showcase' | 'gallery' | 'library';
  setViewMode: (mode: 'editor' | 'showcase' | 'gallery' | 'library') => void;
  generatedImages: string[];
  setGeneratedImages: (images: string[]) => void;
  currentImageIndex: number;
  setCurrentImageIndex: (index: number) => void;
  parameters: TableParameters;
  setParameters: (params: Partial<TableParameters>) => void;
  resetParameters: () => void;
  scenePrompt: string;
  setScenePrompt: (prompt: string) => void;
  isCapturing: boolean;
  setIsCapturing: (isCapturing: boolean) => void;
  capturedSnapshot: string | null;
  setCapturedSnapshot: (snapshot: string | null) => void;
  // AI Home Integration
  userHomePhoto: string | null;
  setUserHomePhoto: (photo: string | null) => void;
  // My Portfolio
  myWorks: Array<{
    id: string;
    images: string[];
    title: string;
    description: string;
    parameters: TableParameters;
    timestamp: number;
  }>;
  saveWork: (work: { title: string; description: string }) => void;
}

const defaultParameters: TableParameters = {
  tableLength: 1800,
  tableWidth:  800,
  cornerRadius: 40,
  legHeight:   750,
  legWidth:    60,
  legFlare:     2,
  legInset:    80,
  apronHeight: 60,
  colorHue:   200,
  metalness:   0.8,
  roughness:   0.2,
  materialCategory: 'anodized',
};

export const useTableStore = create<TableState>((set) => ({
  viewMode: 'editor',
  setViewMode: (viewMode) => set({ viewMode }),
  generatedImages: [],
  setGeneratedImages: (generatedImages) => set({ generatedImages }),
  currentImageIndex: 0,
  setCurrentImageIndex: (currentImageIndex) => set({ currentImageIndex }),
  parameters: defaultParameters,
  setParameters: (params) => set((state) => {
    const newParams = { ...state.parameters };
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined) {
        // @ts-ignore
        newParams[key as keyof TableParameters] = value;
      }
    });
    return { parameters: newParams };
  }),
  resetParameters: () => set({ parameters: defaultParameters }),
  scenePrompt: "现代简约书房",
  setScenePrompt: (prompt) => set({ scenePrompt: prompt }),
  isCapturing: false,
  setIsCapturing: (isCapturing) => set({ isCapturing }),
  capturedSnapshot: null,
  setCapturedSnapshot: (capturedSnapshot) => set({ capturedSnapshot }),
  userHomePhoto: null,
  setUserHomePhoto: (userHomePhoto) => set({ userHomePhoto }),
  myWorks: [],
  saveWork: ({ title, description }) => set((state) => ({
    myWorks: [
      {
        id: Math.random().toString(36).substring(7),
        images: [...state.generatedImages],
        title,
        description,
        parameters: { ...state.parameters },
        timestamp: Date.now(),
      },
      ...state.myWorks,
    ]
  })),
}));
