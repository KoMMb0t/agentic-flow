import React from 'react';
import { useAppStore } from '../stores/appStore';

const PyramidLayers: React.FC = () => {
  const { layers, removeLayer, toggleLayer, minimizeAll, restoreAll } = useAppStore();

  if (layers.length === 0) return null;

  return (
    <div className="absolute bottom-0 left-0 right-0 z-50">
      {/* Layer Controls */}
      <div className="flex items-center justify-between px-3 py-1 bg-af-dark/90 border-t border-af-border">
        <span className="text-[9px] text-af-muted">{layers.length} Layer(s)</span>
        <div className="flex gap-2">
          <button onClick={minimizeAll} className="text-[9px] text-af-muted hover:text-af-text">
            Alle minimieren
          </button>
          <button onClick={restoreAll} className="text-[9px] text-af-muted hover:text-af-text">
            Alle wiederherstellen
          </button>
        </div>
      </div>

      {/* Layer Tabs */}
      <div className="flex gap-1 px-2 py-1 bg-af-dark/80 overflow-x-auto">
        {layers.map((layer) => (
          <div
            key={layer.id}
            className={`flex items-center gap-1.5 px-2 py-1 rounded text-[10px] transition-colors ${
              layer.minimized ? 'bg-af-surface/50 text-af-muted' : 'bg-af-accent/20 text-af-accent'
            }`}
          >
            <button onClick={() => toggleLayer(layer.id)} className="hover:text-af-text">
              {layer.title}
            </button>
            <button
              onClick={() => removeLayer(layer.id)}
              className="text-af-muted hover:text-af-error ml-1"
            >
              ×
            </button>
          </div>
        ))}
      </div>
    </div>
  );
};

export default PyramidLayers;
