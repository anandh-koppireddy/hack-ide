import React, { useState, useMemo } from 'react';
import type { CategorizedSymbol } from '../App';
import './SymbolTableInspector.css';

interface SymbolTableInspectorProps {
  isOpen: boolean;
  onClose: () => void;
  symbols: CategorizedSymbol[];
  onSelectSymbol?: (symbolName: string) => void;
}

export const SymbolTableInspector: React.FC<SymbolTableInspectorProps> = ({
  isOpen,
  onClose,
  symbols,
  onSelectSymbol,
}) => {
  const [search, setSearch] = useState('');
  const [showPredefined, setShowPredefined] = useState(false);

  const { labels, variables, predefined } = useMemo(() => {
    const q = search.trim().toLowerCase();
    const matches = (s: CategorizedSymbol) =>
      !q || s.name.toLowerCase().includes(q) || s.address.toString().includes(q);

    return {
      labels: symbols.filter((s) => s.type === 'label' && matches(s)).sort((a, b) => a.address - b.address),
      variables: symbols.filter((s) => s.type === 'variable' && matches(s)).sort((a, b) => a.address - b.address),
      predefined: symbols.filter((s) => s.type === 'predefined' && matches(s)).sort((a, b) => a.address - b.address),
    };
  }, [symbols, search]);

  if (!isOpen) return null;

  return (
    <aside className="symbol-drawer">
      <div className="drawer-header">
        <div>
          <h3>Symbol Table</h3>
          <span className="user-symbols-count">
            {labels.length + variables.length} User Symbols Defined
          </span>
        </div>
        <button className="close-btn" onClick={onClose}>×</button>
      </div>

      <div className="drawer-toolbar">
        <input
          type="text"
          className="symbol-search"
          placeholder="Filter symbols or addresses..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
        <label className="toggle-predefined">
          <input
            type="checkbox"
            checked={showPredefined}
            onChange={(e) => setShowPredefined(e.target.checked)}
          />
          <span>Show Built-in (R0-R15, SCREEN, etc.)</span>
        </label>
      </div>

      <div className="drawer-body">
        {/* Section 1: User Labels (Branch Targets) */}
        <div className="symbol-group">
          <div className="group-heading">
            <span className="group-title">Labels (ROM Jump Targets)</span>
            <span className="badge badge-lbl">{labels.length}</span>
          </div>
          {labels.length === 0 ? (
            <div className="group-empty">No label symbols declared (e.g. `(LOOP)`)</div>
          ) : (
            <div className="cards-grid">
              {labels.map((s) => (
                <div
                  key={s.name}
                  className="symbol-card"
                  onClick={() => onSelectSymbol?.(s.name)}
                  title="Click to locate definition in editor"
                >
                  <div className="card-top">
                    <span className="sym-name">({s.name})</span>
                    <span className="sym-tag lbl-tag">ROM</span>
                  </div>
                  <div className="card-bottom">
                    <span className="addr-item">Line <strong>{s.address}</strong></span>
                    <span className="hex-item">0x{s.address.toString(16).toUpperCase().padStart(4, '0')}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Section 2: Variables (RAM Allocations) */}
        <div className="symbol-group">
          <div className="group-heading">
            <span className="group-title">Allocated Variables (RAM)</span>
            <span className="badge badge-var">{variables.length}</span>
          </div>
          {variables.length === 0 ? (
            <div className="group-empty">No custom variables allocated (@var)</div>
          ) : (
            <div className="cards-grid">
              {variables.map((s) => (
                <div
                  key={s.name}
                  className="symbol-card"
                  onClick={() => onSelectSymbol?.(s.name)}
                  title="Click to locate variable in editor"
                >
                  <div className="card-top">
                    <span className="sym-name">@{s.name}</span>
                    <span className="sym-tag var-tag">RAM</span>
                  </div>
                  <div className="card-bottom">
                    <span className="addr-item">RAM[<strong>{s.address}</strong>]</span>
                    <span className="hex-item">0x{s.address.toString(16).toUpperCase().padStart(4, '0')}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Section 3: Built-in Predefined Symbols (Collapsible/Optional) */}
        {showPredefined && (
          <div className="symbol-group">
            <div className="group-heading">
              <span className="group-title">Predefined Core Symbols</span>
              <span className="badge badge-sys">{predefined.length}</span>
            </div>
            <div className="cards-grid compact">
              {predefined.map((s) => (
                <div key={s.name} className="symbol-card mini">
                  <span className="sym-name-mini">{s.name}</span>
                  <span className="sym-addr-mini">{s.address}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </aside>
  );
};