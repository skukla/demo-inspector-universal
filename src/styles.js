/**
 * Shadow DOM CSS for the <demo-inspector> panel.
 * Matches the frosted glass aesthetic of the demo-inspector React app.
 */
export const PANEL_STYLES = `
/* Host positioning */
:host {
  position: fixed;
  top: 80px;
  right: 16px;
  z-index: 99999;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
}

/* Panel container */
.panel {
  background: rgba(255, 255, 255, 0.95);
  backdrop-filter: blur(4px);
  border-radius: 16px;
  box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.25);
  border: 1px solid #e5e7eb;
  width: 320px;
  padding: 0;
  max-height: 85vh;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}
.panel.hidden { display: none; }

/* Minimized toggle button */
.toggle-btn {
  background: #111827;
  color: white;
  padding: 12px;
  border-radius: 9999px;
  border: none;
  box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1);
  cursor: pointer;
  font-size: 20px;
  line-height: 1;
  transition: background 0.15s;
}
.toggle-btn:hover { background: #1f2937; }

/* Header */
.header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 16px;
  user-select: none;
}
.header-title {
  font-weight: 600;
  font-size: 14px;
  color: #111827;
  display: flex;
  align-items: center;
  gap: 8px;
}
.header-controls { display: flex; gap: 8px; }
.header-btn {
  background: none;
  border: none;
  color: #9ca3af;
  cursor: pointer;
  font-size: 16px;
  padding: 0;
  line-height: 1;
}
.header-btn:hover { color: #6b7280; }

/* Shared section structure */
.content-section { padding: 12px 16px; }
.controls-section {
  padding: 12px 16px;
  border-top: 1px solid #f3f4f6;
  display: flex;
  flex-direction: column;
  gap: 8px;
}
.section-label {
  font-size: 12px;
  color: #6b7280;
  text-transform: uppercase;
  font-weight: 500;
  margin-bottom: 8px;
}
.section-header {
  display: flex;
  align-items: baseline;
  justify-content: space-between;
  margin-bottom: 8px;
}
.section-header .section-label { margin-bottom: 0; }
.section-count {
  font-size: 11px;
  color: #6b7280;
  background: none;
  border: none;
  cursor: pointer;
  font-family: inherit;
  padding: 0;
}
.section-count:hover { color: #374151; }

/* Data source buttons */
.source-btn {
  width: 100%;
  text-align: left;
  padding: 12px;
  border-radius: 12px;
  border: none;
  cursor: pointer;
  transition: all 0.15s, transform 0.15s;
  background: #f9fafb;
  margin-bottom: 8px;
  font-family: inherit;
}
.source-btn:hover { background: #f3f4f6; transform: scale(1.02); }
.source-btn.active { box-shadow: 0 10px 15px -3px rgba(0,0,0,0.1); color: white; }
.source-btn .source-icon { font-size: 24px; margin-right: 12px; }
.source-btn .source-name { font-weight: 500; font-size: 14px; }
.source-btn .source-desc { font-size: 12px; opacity: 0.7; }
.source-btn.active .pulse {
  width: 8px;
  height: 8px;
  background: white;
  border-radius: 50%;
  animation: pulse 2s infinite;
}
@keyframes pulse { 0%, 100% { opacity: 1; } 50% { opacity: 0.5; } }

/* Toggle switch */
.toggle-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
}
.toggle-label { font-size: 14px; color: #4b5563; }
.toggle-track {
  position: relative;
  width: 44px;
  height: 24px;
  background: #d1d5db;
  border-radius: 12px;
  cursor: pointer;
  transition: background 0.2s;
  border: none;
  padding: 0;
}
.toggle-track.active { background: #4b5563; }
.toggle-knob {
  position: absolute;
  top: 4px;
  left: 4px;
  width: 16px;
  height: 16px;
  background: white;
  border-radius: 50%;
  transition: transform 0.2s;
}
.toggle-track.active .toggle-knob { transform: translateX(20px); }

/* Settings overlay */
.settings-overlay {
  padding: 16px;
}
.mode-card {
  display: flex;
  align-items: center;
  gap: 12px;
  width: 100%;
  padding: 12px;
  border-radius: 12px;
  border: 1px solid #e5e7eb;
  background: #f9fafb;
  cursor: pointer;
  transition: all 0.15s;
  margin-bottom: 8px;
  font-family: inherit;
  text-align: left;
}
.mode-card:hover { background: #f3f4f6; border-color: #d1d5db; }
.mode-card.active {
  background: rgba(99, 102, 241, 0.08);
  border-color: #6366f1;
  box-shadow: 0 0 0 1px rgba(99, 102, 241, 0.2);
}
.mode-card-icon { font-size: 20px; flex-shrink: 0; }
.mode-card-title { font-size: 13px; font-weight: 600; color: #111827; }
.mode-card-desc { font-size: 11px; color: #6b7280; margin-top: 2px; }
.settings-done-btn {
  width: 100%;
  margin-top: 16px;
  padding: 8px 16px;
  background: #f3f4f6;
  color: #374151;
  border: 1px solid #d1d5db;
  border-radius: 8px;
  cursor: pointer;
  font-size: 13px;
  font-weight: 500;
  font-family: inherit;
}
.settings-done-btn:hover { background: #e5e7eb; }

/* EDS Tree view */
.tree-section { padding: 0; }
.tree-item {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 6px 8px;
  border-radius: 8px;
  cursor: pointer;
  transition: background 0.15s;
  font-size: 13px;
}
.tree-item:hover { background: #f3f4f6; }
.tree-item.active { color: white; }
.tree-item.active.block { background: linear-gradient(135deg, #818cf8, #6366f1); }
.tree-item.active.slot { background: linear-gradient(135deg, #4ade80, #22c55e); }
.tree-arrow {
  width: 14px;
  font-size: 9px;
  color: #9ca3af;
  text-align: center;
  flex-shrink: 0;
}
.tree-icon { width: 14px; height: 14px; flex-shrink: 0; opacity: 0.6; }
.tree-item.active .tree-icon { opacity: 1; }
.tree-icon svg { width: 14px; height: 14px; }
.tree-icon.block { color: #6366f1; }
.tree-icon.slot { color: #22c55e; }
.tree-item.active .tree-icon { color: white; }
.tree-name { flex: 1; font-weight: 500; }
.tree-badge {
  background: #e5e7eb;
  color: #6b7280;
  font-size: 10px;
  padding: 1px 6px;
  border-radius: 10px;
}
.tree-item.active .tree-badge { background: rgba(255,255,255,0.25); color: white; }
.tree-children {
  display: none;
  margin-top: 2px;
  padding-left: 4px;
  border-left: 1px solid #e5e7eb;
  margin-left: 6px;
}
.tree-children.visible { display: block; }

/* EDS action buttons */
.eds-actions {
  display: flex;
  gap: 6px;
}
.eds-btn {
  flex: 1;
  padding: 6px 12px;
  border: none;
  border-radius: 8px;
  cursor: pointer;
  font-size: 12px;
  font-weight: 500;
  font-family: inherit;
}
.eds-btn-primary {
  background: linear-gradient(135deg, #6366f1, #4f46e5);
  color: white;
}
.eds-btn-secondary {
  background: white;
  color: #374151;
  border: 1px solid #d1d5db;
}
.eds-btn:hover { opacity: 0.9; }

/* Query tracker */
.query-section {
  padding: 16px;
  border-top: 1px solid #e5e7eb;
}
.query-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  cursor: pointer;
  font-size: 14px;
  color: #4b5563;
}
.query-header:hover { color: #374151; }
.query-list { margin-top: 8px; max-height: 160px; overflow-y: auto; }
.query-list-items { display: flex; flex-direction: column; gap: 4px; }
.query-empty { font-size: 12px; color: #9ca3af; padding: 8px 0; }
.query-item {
  font-size: 12px;
  padding: 8px;
  background: #f9fafb;
  border-radius: 6px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 4px;
}
.query-name { font-family: monospace; }
.query-time { color: #9ca3af; }
.query-clear {
  width: 100%;
  margin-top: 8px;
  background: none;
  border: none;
  color: #6b7280;
  font-size: 12px;
  cursor: pointer;
  font-family: inherit;
}
.query-clear:hover { color: #374151; }

/* Help section */
.help-section {
  padding: 16px;
  border-top: 1px solid #e5e7eb;
  font-size: 12px;
  color: #6b7280;
  line-height: 1.8;
}

/* Panel body scrollbar */
.panel-body { flex: 1; overflow-y: auto; }
.panel-body::-webkit-scrollbar { width: 6px; }
.panel-body::-webkit-scrollbar-track { background: #f3f4f6; }
.panel-body::-webkit-scrollbar-thumb { background: #d1d5db; border-radius: 3px; }

/* Empty state */
.empty-state { text-align: center; padding: 24px; color: #9ca3af; }
.empty-icon { font-size: 24px; margin-bottom: 8px; }

`;
