import { create } from 'zustand';

export interface Layer {
  id: string;
  title: string;
  componentKey: string;
  props: Record<string, any>;
  minimized: boolean;
  zIndex: number;
  level: number;
}

interface LayerStore {
  layers: Layer[];
  baseZIndex: number;
  addLayer: (layer: Omit<Layer, 'id' | 'zIndex' | 'minimized'>) => void;
  removeLayer: (layerId: string) => void;
  collapseAll: () => void;
  restoreAll: () => void;
  collapseAbove: (layerId: string) => void;
  minimizeLayer: (layerId: string) => void;
  toggleMinimize: (layerId: string) => void;
  getVisibleLayers: () => Layer[];
  getMinimizedCount: () => number;
}

let layerIdCounter = 0;

export const useLayerStore = create<LayerStore>((set, get) => ({
  layers: [],
  baseZIndex: 100,

  addLayer: (layer) => {
    const id = `layer-${++layerIdCounter}-${Date.now()}`;
    const currentLayers = get().layers;
    const maxZ = currentLayers.length > 0
      ? Math.max(...currentLayers.map(l => l.zIndex))
      : get().baseZIndex;

    set({
      layers: [
        ...currentLayers,
        {
          ...layer,
          id,
          zIndex: maxZ + 10,
          minimized: false,
        },
      ],
    });
  },

  removeLayer: (layerId) => {
    set({ layers: get().layers.filter(l => l.id !== layerId) });
  },

  collapseAll: () => {
    set({
      layers: get().layers.map(l => ({ ...l, minimized: true })),
    });
  },

  restoreAll: () => {
    set({
      layers: get().layers.map(l => ({ ...l, minimized: false })),
    });
  },

  collapseAbove: (layerId) => {
    const layers = get().layers;
    const targetLayer = layers.find(l => l.id === layerId);
    if (!targetLayer) return;

    set({
      layers: layers.map(l =>
        l.zIndex > targetLayer.zIndex ? { ...l, minimized: true } : l
      ),
    });
  },

  minimizeLayer: (layerId) => {
    set({
      layers: get().layers.map(l =>
        l.id === layerId ? { ...l, minimized: true } : l
      ),
    });
  },

  toggleMinimize: (layerId) => {
    set({
      layers: get().layers.map(l =>
        l.id === layerId ? { ...l, minimized: !l.minimized } : l
      ),
    });
  },

  getVisibleLayers: () => {
    return get().layers.filter(l => !l.minimized);
  },

  getMinimizedCount: () => {
    return get().layers.filter(l => l.minimized).length;
  },
}));
