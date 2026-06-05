import React from 'react';
import { useLayerStore, Layer } from '../../stores/layerStore';
import { Minimize2, Maximize2, X, Layers, RotateCcw } from 'lucide-react';

interface LayerManagerProps {
  children: React.ReactNode;
  renderLayer: (layer: Layer) => React.ReactNode;
}

export const LayerManager: React.FC<LayerManagerProps> = ({ children, renderLayer }) => {
  const { layers, collapseAll, restoreAll, getMinimizedCount } = useLayerStore();
  const minimizedCount = getMinimizedCount();
  const visibleLayers = layers.filter(l => !l.minimized);

  return (
    <div className="relative w-full h-full overflow-hidden">
      {/* Base Layer (Schicht 0) - Always visible */}
      <div className="absolute inset-0 z-0">
        {children}
      </div>

      {/* Rendered Layers (Schichten 1+) */}
      {visibleLayers.map((layer) => (
        <LayerWindow key={layer.id} layer={layer}>
          {renderLayer(layer)}
        </LayerWindow>
      ))}

      {/* Floating Action Button - Restore All */}
      {minimizedCount > 0 && (
        <button
          onClick={restoreAll}
          className="fixed bottom-6 right-6 z-[9999] flex items-center gap-2 px-4 py-3 
                     bg-af-primary text-white rounded-full shadow-lg shadow-af-primary/30
                     hover:bg-indigo-400 transition-all duration-200 hover:scale-105
                     animate-fade-in"
          title="Alle minimierten Fenster wiederherstellen"
        >
          <RotateCcw size={18} />
          <span className="text-sm font-medium">{minimizedCount} minimiert</span>
        </button>
      )}

      {/* Global Collapse Button */}
      {visibleLayers.length > 0 && (
        <button
          onClick={collapseAll}
          className="fixed bottom-6 left-6 z-[9999] flex items-center gap-2 px-4 py-3
                     bg-af-surface-light text-af-text rounded-full shadow-lg border border-af-border
                     hover:bg-af-border transition-all duration-200 hover:scale-105"
          title="Alle Fenster minimieren"
        >
          <Layers size={18} />
          <span className="text-sm font-medium">Alle minimieren</span>
        </button>
      )}
    </div>
  );
};

interface LayerWindowProps {
  layer: Layer;
  children: React.ReactNode;
}

const LayerWindow: React.FC<LayerWindowProps> = ({ layer, children }) => {
  const { removeLayer, minimizeLayer, collapseAbove } = useLayerStore();

  return (
    <div
      className="absolute inset-4 animate-slide-up af-panel flex flex-col overflow-hidden"
      style={{ zIndex: layer.zIndex }}
    >
      {/* Title Bar */}
      <div className="flex items-center justify-between px-4 py-3 bg-af-dark/50 border-b border-af-border">
        <div className="flex items-center gap-3">
          <div className="w-2 h-2 rounded-full bg-af-primary animate-pulse" />
          <h3 className="text-sm font-semibold text-af-text">{layer.title}</h3>
          <span className="text-xs text-af-text-muted px-2 py-0.5 bg-af-surface-light rounded">
            Schicht {layer.level}
          </span>
        </div>
        <div className="flex items-center gap-1">
          {/* Collapse All Above - Inverted Pyramid Icon */}
          <button
            onClick={() => collapseAbove(layer.id)}
            className="p-1.5 rounded hover:bg-af-surface-light text-af-text-muted hover:text-af-accent transition-colors"
            title="Alle darüber minimieren"
          >
            <Minimize2 size={14} />
          </button>
          {/* Minimize this layer */}
          <button
            onClick={() => minimizeLayer(layer.id)}
            className="p-1.5 rounded hover:bg-af-surface-light text-af-text-muted hover:text-yellow-400 transition-colors"
            title="Minimieren"
          >
            <Maximize2 size={14} />
          </button>
          {/* Close layer */}
          <button
            onClick={() => removeLayer(layer.id)}
            className="p-1.5 rounded hover:bg-red-500/20 text-af-text-muted hover:text-red-400 transition-colors"
            title="Schließen"
          >
            <X size={14} />
          </button>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-auto p-4">
        {children}
      </div>
    </div>
  );
};

export default LayerManager;
