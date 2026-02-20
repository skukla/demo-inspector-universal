(()=>{function K(a,e){let t=n(a,e),o=new Set;function n(m,w){try{let k=localStorage.getItem(w);if(k!==null)return{...m,...JSON.parse(k)}}catch{}return{...m}}function l(){localStorage.setItem(e,JSON.stringify(t))}function h(m){for(let w of Object.keys(m))if(t[w]!==m[w])return!0;return!1}function u(){return de(t)}function y(m){if(!(Object.keys(m).length===0||!h(m))){t={...t,...m},l();for(let w of o)w(u())}}function x(m){return o.add(m),()=>o.delete(m)}function v(){o.clear()}return{getState:u,setState:y,subscribe:x,destroy:v}}function de(a){let e={};for(let[t,o]of Object.entries(a))e[t]=Array.isArray(o)?[...o]:o;return e}var j="[data-slot], [data-slot-key]";function ue(a){let e=a.textContent?.trim();if(e&&e.length>0||a.querySelector("img, svg, video, canvas, iframe")||a.querySelector("input, button, select, textarea"))return!0;let t=window.getComputedStyle(a);if(t.backgroundImage&&t.backgroundImage!=="none")return!0;let o=a.children;for(let n=0;n<o.length;n++){let l=o[n],h=l.getBoundingClientRect();if(h.width>0&&h.height>0){let u=window.getComputedStyle(l);if(u.display!=="none"&&u.visibility!=="hidden"&&u.opacity!=="0")return!0}}return!1}function q(a,e=null,t=!1){if(t)return!0;let o=window.getComputedStyle(a);if(o.display==="none"||o.visibility==="hidden"||o.opacity==="0")return!1;let n=a.getBoundingClientRect();if(e){let l=e.toLowerCase();if(l==="header"||l==="footer"||l.includes("header")||l.includes("footer"))return n.height>0||n.width>0}return!(n.height===0||n.width===0||!ue(a))}function I(a,e){if(a===e)return 0;let t=a.compareDocumentPosition(e);return t&Node.DOCUMENT_POSITION_FOLLOWING?-1:t&Node.DOCUMENT_POSITION_PRECEDING?1:0}function B(a){let e=a.parentElement;for(;e;){if(e.hasAttribute&&e.hasAttribute("data-block-name"))return e;e=e.parentElement}return null}function F(a,e){let t=a.parentElement;for(;t&&t!==e;){if(t.hasAttribute&&(t.hasAttribute("data-slot")||t.hasAttribute("data-slot-key")))return t;t=t.parentElement}return null}function Y(a,e={}){let t=e.showEmptySlots??!1,o=Array.from(a.querySelectorAll("[data-block-name]")),n=new Set,l=new Set;function h(s,r){if(n.has(s)||!q(s,null,t))return null;n.add(s);let p=Array.from(s.querySelectorAll(j)).filter(d=>{if(n.has(d)||d===s||F(d,r)!==s)return!1;let C=B(d);return!(C&&C!==r)});p.sort(I);let S=p.map(d=>h(d,r)).filter(d=>d!==null),f=[];o.forEach(d=>{if(l.has(d)||!s.contains(d))return;let b=B(d);if(b&&b!==r)return;let C=F(d,r);if(C&&C!==s)return;let D=d.getAttribute("data-block-name");if(!q(d,D,t)){l.add(d);return}f.push(d)}),f.sort(I);let _=f.map(d=>x(d,0));return{name:s.getAttribute("data-slot")||s.getAttribute("data-slot-key")||"Unnamed Slot",element:s,childSlots:S,children:_}}function u(s){let r=Array.from(s.querySelectorAll(j));r.sort(I);let p=[];return r.forEach(S=>{if(n.has(S))return;let f=B(S);if(f&&f!==s||F(S,s))return;let d=h(S,s);d&&p.push(d)}),p}function y(s){let r=[];return o.forEach(p=>{if(l.has(p))return;if(B(p)===s){let f=p.getAttribute("data-block-name");if(!q(p,f,t)){l.add(p);return}r.push(p)}}),r.sort(I),r}function x(s,r=0){l.add(s);let p={name:s.getAttribute("data-block-name"),element:s,slots:u(s),children:[],depth:r};return y(s).forEach(f=>{p.children.push(x(f,r+1))}),p}let v=o.filter(s=>{if(B(s))return!1;let r=s.getAttribute("data-block-name");return q(s,r,t)});v.sort(I);let m=v.map(s=>x(s)),w=Array.from(a.querySelectorAll(j)),k=[];w.forEach(s=>{n.has(s)||o.some(p=>p.contains(s))||q(s,null,t)&&(n.add(s),k.push({name:s.getAttribute("data-slot")||s.getAttribute("data-slot-key")||"Unnamed Slot",element:s}))}),k.sort((s,r)=>I(s.element,r.element)),k.length>0&&m.push({name:"Standalone Slots",element:document.body,slots:k,children:[],depth:0});let T=0,M=0,$=0,g=0;function i(s){s.id=`slot-${M++}`,g++,s.childSlots&&s.childSlots.length>0&&s.childSlots.forEach(r=>i(r)),s.children&&s.children.length>0&&c(s.children)}function c(s){s.forEach(r=>{r.id=`block-${T++}`,$++,r.slots.forEach(p=>i(p)),r.children.length>0&&c(r.children)})}return c(m),{blocks:m,standaloneSlots:k,counts:{blocks:$,slots:g}}}var z=[{id:"commerce",name:"Commerce Core",color:"#9333ea",icon:"\u{1F3EA}",description:"Navigation, categories & store data"},{id:"catalog",name:"Catalog Service",color:"#2563eb",icon:"\u{1F4E6}",description:"Product listings & inventory"},{id:"search",name:"Live Search",color:"#16a34a",icon:"\u{1F50D}",description:"Search, facets & filtering"}];function he(a,e){return e.Citisignal_productDetail||a==="GetProductDetail"||e.Citisignal_productCards||e.products||a.includes("ProductCards")||e.Citisignal_productPageData||a==="GetProductPageData"?"catalog":e.Citisignal_productFacets||e.facets||a.includes("Facet")||a.includes("Search")||a.includes("Filter")?"search":(e.categories||e.storeConfig||e.navigation||e.breadcrumbs||a.includes("Navigation")||a.includes("Breadcrumb"),"commerce")}function V(a=50){let e=[];function t(l){e.unshift(l),e.length>a&&(e.length=a)}function o(l=10){return e.slice(0,l)}function n(){e=[]}return{trackQuery:t,getQueries:o,clearQueries:n}}function J(a){window.__demoInspectorTrackQuery=a.trackQuery,window.__demoInspectorStoreData=e=>e}function pe(a){return async(e,t,o)=>{let n=e.match(/query\s+(\w+)/),l=n?n[1]:"Anonymous",h=performance.now(),u=await a(e,t,o),y=performance.now()-h,x=he(l,u);return typeof window.__demoInspectorTrackQuery=="function"&&window.__demoInspectorTrackQuery({queryName:l,source:x,responseTime:y,timestamp:Date.now()}),typeof window.__demoInspectorStoreData=="function"&&window.__demoInspectorStoreData(u),u}}function X(a){let e=a.querySelectorAll("[data-inspector-source]"),t=new Map;for(let o of e){let n=o.getAttribute("data-inspector-source");t.has(n)||t.set(n,[]),t.get(n).push(o)}return t}function Z(a){if(a>=1e3){let e=(a/1e3).toFixed(1);return e.endsWith(".0")?`${e.slice(0,-2)}s`:`${e}s`}return`${a}ms`}var ee={block:{border:"2px solid #6366f1",outline:"2px solid rgba(99, 102, 241, 0.3)",backgroundColor:"rgba(99, 102, 241, 0.08)",labelBg:"#6366f1"},slot:{border:"2px dashed #22c55e",outline:"2px dashed rgba(34, 197, 94, 0.4)",backgroundColor:"rgba(34, 197, 94, 0.08)",labelBg:"#22c55e"}};function te(){let a=new Map,e=new Map,t=new Map,o=new Map;function n(i){return i.getAttribute("data-inspector-field")==="color-swatch"}function l(i){return i.getAttribute("data-inspector-value")}function h(i){let c=l(i);c&&c.startsWith("#")&&(i.style.backgroundColor=c)}function u(i){return i.filter(c=>{let s=c.getAttribute("data-inspector-source"),r=c.parentElement;for(;r;){if(r.getAttribute("data-inspector-source")===s)return!1;r=r.parentElement}return!0})}function y(i){if(i.tagName==="INPUT"){let s=i.type||"";return s!=="checkbox"&&s!=="radio"}if(i.tagName==="BUTTON"||i.tagName==="SELECT"||i.querySelector("img")||i.querySelector("input")||i.classList.contains("card")||i.classList.contains("product"))return!0;let c=i.style.backgroundColor;return!!(c&&c!=="transparent"&&c!=="rgba(0, 0, 0, 0)")}function x(i,c){let s=u(i);for(let r of s){a.set(r,{backgroundColor:r.style.backgroundColor,boxShadow:r.style.boxShadow,position:r.style.position,zIndex:r.style.zIndex,borderRadius:r.style.borderRadius});let S=window.getComputedStyle(r).borderRadius||"0px",f=r.getAttribute("data-inspector-type");if(f==="search-bar"){let b=r.querySelector("input");b&&(S=window.getComputedStyle(b).borderRadius||S)}else if(f==="sort-dropdown"){let b=r.querySelector("select");b&&(S=window.getComputedStyle(b).borderRadius||S)}r.style.borderRadius=S;let _=`0 0 0 3px ${c}`;if(n(r)){r.style.boxShadow=_,r.style.position="relative",r.style.zIndex="10",h(r);continue}if(y(r)){r.style.boxShadow=`${_}, inset 0 0 0 1000px ${c}20`;let b=r.querySelector('input[type="text"], input[type="search"], input:not([type])');b&&(b.dataset.originalBoxShadow===void 0&&(b.dataset.originalBoxShadow=b.style.boxShadow||""),b.style.boxShadow=`inset 0 0 0 1000px ${c}20`)}else r.style.boxShadow=_,r.style.backgroundColor=`${c}10`;r.style.position="relative",r.style.zIndex="10",r.querySelectorAll('[data-inspector-field="color-swatch"]').forEach(b=>h(b))}}function v(){for(let[i,c]of a){n(i)?h(i):i.style.backgroundColor=c.backgroundColor,i.style.boxShadow=c.boxShadow,i.style.position=c.position,i.style.zIndex=c.zIndex,i.style.borderRadius=c.borderRadius;let s=i.querySelector('input[type="text"], input[type="search"], input:not([type])');s&&s.dataset.originalBoxShadow!==void 0&&(s.style.boxShadow=s.dataset.originalBoxShadow||"",delete s.dataset.originalBoxShadow),i.querySelectorAll('[data-inspector-field="color-swatch"]').forEach(p=>h(p))}a.clear()}function m(i,c,s,r){e.set(c,{element:i,border:i.style.border,outline:i.style.outline,backgroundColor:i.style.backgroundColor,position:i.style.position,zIndex:i.style.zIndex});let p=ee[r];i.style.border=p.border,i.style.outline=p.outline,i.style.backgroundColor=p.backgroundColor,i.style.position="relative",i.style.zIndex="10000",M(c,i,s,r)}function w(i){let c=e.get(i);if(c){let r=c.element;r.style.border=c.border,r.style.outline=c.outline,r.style.backgroundColor=c.backgroundColor,r.style.position=c.position,r.style.zIndex=c.zIndex,e.delete(i)}let s=t.get(i);s&&(s.remove(),t.delete(i),o.delete(i))}function k(i,c){return!(i.right<c.left||i.left>c.right||i.bottom<c.top||i.top>c.bottom)}function T(i,c){let s=i.offsetWidth||60,r=i.offsetHeight||20,p=window.pageYOffset||document.documentElement.scrollTop,S=window.pageXOffset||document.documentElement.scrollLeft,f=4,_=6,d=c.top+p,b=c.left+S,C=c.right+S,D=c.bottom+p,U=[];o.forEach(A=>{U.push({top:A.top-_,left:A.left-_,right:A.left+A.width+_,bottom:A.top+A.height+_})});function W(A){return U.some(le=>k(A,le))}let P={top:d-r-f,left:b,right:b+s,bottom:d-f},L={top:D+f,left:b,right:b+s,bottom:D+f+r},R={top:d,left:C+f,right:C+f+s,bottom:d+r},Q={top:d,left:b-s-f,right:b-f,bottom:d+r};if(!W(P))return{top:P.top,left:P.left};let ae=window.innerWidth-c.right,ce=c.left,G=s+20,H;ae>=G?H=[R,L,Q]:ce>=G?H=[L,Q,R]:H=[L,R,Q];for(let A of H)if(!W(A))return{top:A.top,left:A.left};return{top:L.top,left:L.left}}function M(i,c,s,r){let p=t.get(i);p&&p.remove();let S=ee[r],f=document.createElement("div");Object.assign(f.style,{position:"absolute",padding:"3px 8px",borderRadius:"3px",fontSize:"11px",fontWeight:"600",fontFamily:'system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',background:S.labelBg,color:"white",whiteSpace:"nowrap",zIndex:"999998",pointerEvents:"none",boxShadow:"0 2px 4px rgba(0,0,0,0.2)"}),f.textContent=s,document.body.appendChild(f);let _=c.getBoundingClientRect(),d=T(f,_);d.top=Math.max((window.pageYOffset||document.documentElement.scrollTop)+4,d.top),d.left=Math.max(4,d.left),f.style.top=d.top+"px",f.style.left=d.left+"px",o.set(i,{top:d.top,left:d.left,width:f.offsetWidth||60,height:f.offsetHeight||20}),t.set(i,f)}function $(){v();for(let i of[...e.keys()])w(i);t.forEach(i=>i.remove()),t.clear(),o.clear()}function g(){$(),a=null,e=null,t=null,o=null}return{highlightMeshSource:x,clearMeshHighlights:v,highlightEdsItem:m,clearEdsHighlight:w,clearAll:$,destroy:g}}var N=`
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
.mode-card:hover:not(.disabled) { background: #f3f4f6; border-color: #d1d5db; }
.mode-card.disabled {
  opacity: 0.4;
  cursor: not-allowed;
  pointer-events: none;
}
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
.query-name { font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, 'Liberation Mono', 'Courier New', monospace; }
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

`;var oe={block:`<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"
    stroke-linecap="round" stroke-linejoin="round">
    <path d="M21 8l-9-5-9 5v8l9 5 9-5V8z"></path>
    <path d="M3 8l9 5 9-5"></path>
    <path d="M12 13v9"></path></svg>`,slot:`<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"
    stroke-linecap="round" stroke-linejoin="round">
    <path d="M19.439 7.85c-.049.322.059.648.289.878l1.568 1.568c.47.47.706 1.087.706
    1.704s-.235 1.233-.706 1.704l-1.611 1.611a.98.98 0 0 1-.837.276c-.47-.07-.802-.48
    -.968-.925a2.501 2.501 0 1 0-3.214 3.214c.446.166.855.497.925.968a.979.979 0 0
    1-.276.837l-1.61 1.61a2.404 2.404 0 0 1-1.705.707 2.402 2.402 0 0 1-1.704-.706
    l-1.568-1.568a1.026 1.026 0 0 0-.877-.29c-.493.074-.84.504-1.02.968a2.5 2.5 0
    1 1-3.237-3.237c.464-.18.894-.527.967-1.02a1.026 1.026 0 0 0-.289-.877l-1.568
    -1.568A2.402 2.402 0 0 1 1.998 12c0-.617.236-1.234.706-1.704L4.315 8.69c.218
    -.22.346-.549.276-.837-.07-.471-.48-.802-.925-.968a2.501 2.501 0 1 1 3.214-3.214
    c.166.446.497.855.968.925.288.07.617-.058.837-.276l1.61-1.611a2.404 2.404 0 0 1
    1.705-.706c.618 0 1.234.236 1.704.706l1.568 1.568c.23.23.556.338.877.29.493-.074
    .84-.504 1.02-.969a2.5 2.5 0 1 1 3.237 3.237c-.464.18-.894.527-.967 1.02Z"></path>
    </svg>`};function E(a){return typeof a!="string"?String(a):a.replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;").replace(/"/g,"&quot;").replace(/'/g,"&#39;")}var fe={enabled:!0,panelCollapsed:!1,panelPosition:"right",activeMode:"mesh",activeSources:[],allSourcesHighlighted:!1,trackedQueries:[],cacheDisabled:!1,activeItems:[],expandedNodes:[],showEmptySlots:!1,isMinimized:!1},O=class extends HTMLElement{constructor(){super(),this.attachShadow({mode:"open"}),this.store=K({...fe},"demo-inspector-state"),this.highlighter=te(),this._showQueries=!1,this._showSettings=!1,this._lastEdsScan=null}connectedCallback(){this._enforceAvailableMode(),this.render(),this._unsubscribe=this.store.subscribe(()=>this.render()),this._setupKeyboardShortcuts()}_getAvailableModes(){let e=this.getAttribute("modes");return e?e.split(",").map(t=>t.trim()).filter(Boolean):["mesh","eds"]}_enforceAvailableMode(){let e=this._getAvailableModes(),t=this.store.getState();e.includes(t.activeMode)||this.store.setState({activeMode:e[0]||"mesh"})}disconnectedCallback(){this._unsubscribe&&this._unsubscribe(),this.highlighter.destroy(),this.store.destroy(),this._keyHandler&&window.removeEventListener("keydown",this._keyHandler)}render(){let e=this.store.getState(),t=this._scanEdsDom(e);this._lastEdsScan=t;let o=e.activeMode==="mesh",n=e.activeMode==="eds";if(!e.enabled){this.shadowRoot.innerHTML=`<style>${N}</style>`;return}if(e.isMinimized){this.shadowRoot.innerHTML=`
        <style>${N}</style>
        <button class="toggle-btn" data-action="expand" aria-label="Open Demo Inspector">&#128269;</button>
      `,this._attachEventListeners(e),this._applyPosition(e);return}this.shadowRoot.innerHTML=`
      <style>${N}</style>
      <div class="panel">
        ${this._renderHeader()}
        <div class="panel-body">
          ${this._showSettings?this._renderSettingsOverlay(e):`${o?this._renderMeshSection(e):""}
               ${n?this._renderEdsSection(e,t):""}
               ${o?this._renderQuerySection(e):""}
               ${this._renderHelp()}`}
        </div>
      </div>
    `,this._attachEventListeners(e),this._applyPosition(e)}_renderHeader(){return`
      <div class="header">
        <div class="header-title">
          <span>&#128269;</span>
          <span>Demo Inspector</span>
        </div>
        <div class="header-controls">
          <button class="header-btn" data-action="settings" title="Settings">&#9881;</button>
          <button class="header-btn" data-action="minimize" title="Minimize">&minus;</button>
          <button class="header-btn" data-action="close" title="Close">&times;</button>
        </div>
      </div>
    `}_renderSettingsOverlay(e){let t=this._getAvailableModes();return`
      <div class="settings-overlay">
        <div class="section-label">INSPECTOR MODE</div>
        ${[{id:"mesh",icon:"&#127978;",title:"API Mesh",desc:"Data source highlights"},{id:"eds",icon:"&#129521;",title:"EDS Structure",desc:"Blocks & dropin slots"}].map(l=>{let h=e.activeMode===l.id,u=!t.includes(l.id);return`
        <button class="${["mode-card",h&&"active",u&&"disabled"].filter(Boolean).join(" ")}" data-mode="${l.id}"${u?" disabled":""}>
          <span class="mode-card-icon">${l.icon}</span>
          <div>
            <div class="mode-card-title">${E(l.title)}</div>
            <div class="mode-card-desc">${E(l.desc)}</div>
          </div>
        </button>
      `}).join("")}
        <button class="settings-done-btn" data-action="settings-done">Done</button>
      </div>
    `}_renderMeshSection(e){return`
      <div class="content-section">
        <div class="section-label">DATA SOURCES</div>
        ${z.map(o=>{let n=e.activeSources.includes(o.id),l=n?`background: linear-gradient(135deg, ${o.color}, ${o.color}cc)`:"";return`
        <button class="source-btn${n?" active":""}"
                data-source="${o.id}"
                style="${l}">
          <div style="display:flex;align-items:center;justify-content:space-between">
            <div style="display:flex;align-items:center">
              <span class="source-icon">${o.icon}</span>
              <div>
                <div class="source-name">${E(o.name)}</div>
                <div class="source-desc">${E(o.description)}</div>
              </div>
            </div>
            ${n?'<div class="pulse"></div>':""}
          </div>
        </button>
      `}).join("")}
      </div>
      <div class="controls-section">
        <div class="toggle-row">
          <span class="toggle-label">Highlight All</span>
          <button class="toggle-track${e.allSourcesHighlighted?" active":""}"
                  data-toggle="highlight-all">
            <div class="toggle-knob"></div>
          </button>
        </div>
        <div class="toggle-row">
          <span class="toggle-label">Disable Cache</span>
          <button class="toggle-track${e.cacheDisabled?" active":""}"
                  data-toggle="disable-cache">
            <div class="toggle-knob"></div>
          </button>
        </div>
      </div>
    `}_renderEdsSection(e,t){let{blocks:o,counts:n}=t,l=o.length>0?`<div class="tree-section">${this._renderBlockTree(o,e)}</div>`:'<div class="empty-state"><div class="empty-icon">&#128466;</div>No EDS blocks detected</div>',h=e.activeItems.length>0;return`
      <div class="content-section">
        <div class="section-header">
          <div class="section-label">BLOCKS &amp; SLOTS</div>
          <button class="section-count" data-action="collapse-all"
                  title="Collapse all">${n.blocks} blocks &middot; ${n.slots} slots</button>
        </div>
        ${l}
      </div>
      <div class="controls-section">
        <div class="eds-actions">
          <button class="eds-btn eds-btn-secondary" data-action="refresh">Refresh</button>
          <button class="eds-btn eds-btn-primary" data-action="${h?"clear-all":"show-all"}">
            ${h?"Clear All":"Show All"}
          </button>
        </div>
        <div class="toggle-row">
          <span class="toggle-label">Show Empty</span>
          <button class="toggle-track${e.showEmptySlots?" active":""}"
                  data-toggle="show-empty">
            <div class="toggle-knob"></div>
          </button>
        </div>
      </div>
    `}_renderBlockTree(e,t){return e.map(o=>this._renderBlockNode(o,t)).join("")}_renderBlockNode(e,t){let o=e.children.length>0||e.slots.length>0,n=t.expandedNodes.includes(e.id),l=t.activeItems.includes(e.id),h=o?`<span class="tree-arrow" data-expand="${e.id}">${n?"&#9660;":"&#9654;"}</span>`:'<span class="tree-arrow"></span>',u=e.slots.length,y=u>0?`<span class="tree-badge">${u}</span>`:"",x="";if(o){let v=e.slots.map(w=>this._renderSlotNode(w,t)).join(""),m=e.children.map(w=>this._renderBlockNode(w,t)).join("");x=`
        <div class="tree-children${n?" visible":""}">
          ${v}${m}
        </div>
      `}return`
      <div class="tree-item${l?" active block":""}" data-id="${e.id}" data-type="block" data-name="${E(e.name)}">
        ${h}
        <span class="tree-icon block">${oe.block}</span>
        <span class="tree-name">${E(e.name)}</span>
        ${y}
      </div>
      ${x}
    `}_renderSlotNode(e,t){let o=e.childSlots&&e.childSlots.length>0||e.children&&e.children.length>0,n=t.expandedNodes.includes(e.id),l=t.activeItems.includes(e.id),h=o?`<span class="tree-arrow" data-expand="${e.id}">${n?"&#9660;":"&#9654;"}</span>`:'<span class="tree-arrow"></span>',u="";if(o){let y=(e.childSlots||[]).map(v=>this._renderSlotNode(v,t)).join(""),x=(e.children||[]).map(v=>this._renderBlockNode(v,t)).join("");u=`
        <div class="tree-children${n?" visible":""}">
          ${y}${x}
        </div>
      `}return`
      <div class="tree-item${l?" active slot":""}" data-id="${e.id}" data-type="slot" data-name="${E(e.name)}">
        ${h}
        <span class="tree-icon slot">${oe.slot}</span>
        <span class="tree-name">${E(e.name)}</span>
      </div>
      ${u}
    `}_renderQuerySection(e){let t=e.trackedQueries||[],o=t.length,n="";if(this._showQueries){let l=o===0?'<div class="query-empty">No queries tracked yet</div>':`<div class="query-list-items">
            ${t.slice(0,10).map(u=>{let y=z.find(v=>v.id===u.source);return`
                <div class="query-item">
                  <div style="display:flex;align-items:center;gap:8px">
                    <span>${y?y.icon:""}</span>
                    <span class="query-name">${E(u.queryName||u.name||"")}</span>
                  </div>
                  <span class="query-time">${Z(u.responseTime||0)}</span>
                </div>
              `}).join("")}
          </div>`,h=o>0?'<button class="query-clear" data-action="clear-queries">Clear queries</button>':"";n=`
        <div class="query-list">${l}</div>
        ${h}
      `}return`
      <div class="query-section">
        <div class="query-header" data-action="toggle-queries">
          <span>Recent Queries (${o})</span>
          <span>${this._showQueries?"&#9660;":"&#9654;"}</span>
        </div>
        ${n}
      </div>
    `}_renderHelp(){return`
      <div class="help-section">
        <strong>Keyboard Shortcuts</strong><br>
        Cmd+Shift+D &mdash; Toggle Inspector<br>
        Cmd+Shift+E &mdash; Minimize/Expand<br>
        Cmd+Shift+Arrow &mdash; Move Panel
      </div>
    `}_scanEdsDom(e){try{return Y(document.body,{showEmptySlots:e.showEmptySlots})}catch{return{blocks:[],standaloneSlots:[],counts:{blocks:0,slots:0}}}}_attachEventListeners(e){let t=this.shadowRoot,o=t.querySelector('[data-action="expand"]');o&&o.addEventListener("click",()=>{this.store.setState({isMinimized:!1})});let n=t.querySelector('[data-action="settings"]');n&&n.addEventListener("click",()=>{this._showSettings=!this._showSettings,this.render()});let l=t.querySelector('[data-action="settings-done"]');l&&l.addEventListener("click",()=>{this._showSettings=!1,this.render()});let h=t.querySelector('[data-action="minimize"]');h&&h.addEventListener("click",()=>{let g=this.store.getState();this.store.setState({isMinimized:!g.isMinimized})});let u=t.querySelector('[data-action="close"]');u&&u.addEventListener("click",()=>{this.store.setState({enabled:!1}),this.highlighter.clearAll()}),t.querySelectorAll(".mode-card[data-mode]:not([disabled])").forEach(g=>{g.addEventListener("click",()=>{let i=g.getAttribute("data-mode");this._handleModeSwitch(i)})}),t.querySelectorAll(".source-btn[data-source]").forEach(g=>{g.addEventListener("click",()=>{let i=g.getAttribute("data-source");this._handleSourceToggle(i)})});let y=t.querySelector('[data-toggle="highlight-all"]');y&&y.addEventListener("click",()=>{let i=!this.store.getState().allSourcesHighlighted,c=i?z.map(s=>s.id):[];this.store.setState({allSourcesHighlighted:i,activeSources:c}),this._applyMeshHighlights()});let x=t.querySelector('[data-toggle="disable-cache"]');x&&x.addEventListener("click",()=>{let g=this.store.getState();this.store.setState({cacheDisabled:!g.cacheDisabled})}),t.querySelectorAll(".tree-item[data-id]").forEach(g=>{g.addEventListener("click",i=>{if(i.target.closest(".tree-arrow[data-expand]"))return;let c=g.getAttribute("data-id"),s=g.getAttribute("data-name");this._handleTreeItemToggle(c,s)})}),t.querySelectorAll(".tree-arrow[data-expand]").forEach(g=>{g.addEventListener("click",()=>{let i=g.getAttribute("data-expand");this._handleExpandToggle(i)})});let v=t.querySelector('[data-action="show-all"]');v&&v.addEventListener("click",()=>this._handleShowAll());let m=t.querySelector('[data-action="clear-all"]');m&&m.addEventListener("click",()=>this._handleClearAll());let w=t.querySelector('[data-action="collapse-all"]');w&&w.addEventListener("click",()=>{this.store.setState({expandedNodes:[]})});let k=t.querySelector('[data-action="refresh"]');k&&k.addEventListener("click",()=>this.render());let T=t.querySelector('[data-toggle="show-empty"]');T&&T.addEventListener("click",()=>{let g=this.store.getState();this.store.setState({showEmptySlots:!g.showEmptySlots})});let M=t.querySelector('[data-action="toggle-queries"]');M&&M.addEventListener("click",()=>{this._showQueries=!this._showQueries,this.render()});let $=t.querySelector('[data-action="clear-queries"]');$&&$.addEventListener("click",()=>{this.store.setState({trackedQueries:[]})})}_handleModeSwitch(e){this.highlighter.clearAll(),this._showSettings=!1,this.store.setState({activeMode:e})}_handleSourceToggle(e){let o=[...this.store.getState().activeSources],n=o.indexOf(e);n>=0?o.splice(n,1):o.push(e),this.store.setState({activeSources:o}),this._applyMeshHighlights()}_handleExpandToggle(e){let o=[...this.store.getState().expandedNodes],n=o.indexOf(e);n>=0?o.splice(n,1):o.push(e),this.store.setState({expandedNodes:o})}_handleTreeItemToggle(e,t){let n=[...this.store.getState().activeItems],l=n.indexOf(e);if(l>=0)n.splice(l,1),this.highlighter.clearEdsHighlight(e);else{n.push(e);let h=this._lastEdsScan;if(h){let u=this._findElementById(e,h.blocks);if(u){let y=e.startsWith("block")?"block":"slot";this.highlighter.highlightEdsItem(u,e,t,y)}}}this.store.setState({activeItems:n})}_handleShowAll(){let e=this._lastEdsScan;if(!e)return;let t=[];this._collectAllIds(e.blocks,t),t.forEach(o=>{o.element&&this.highlighter.highlightEdsItem(o.element,o.id,o.name,o.type)}),this.store.setState({activeItems:t.map(o=>o.id)})}_handleClearAll(){this.highlighter.clearAll(),this.store.setState({activeItems:[],activeSources:[]})}_findElementById(e,t){for(let o of t){if(o.id===e)return o.element;for(let n of o.slots||[]){let l=this._findInSlot(e,n);if(l)return l}if(o.children){let n=this._findElementById(e,o.children);if(n)return n}}return null}_findInSlot(e,t){if(t.id===e)return t.element;for(let o of t.childSlots||[]){let n=this._findInSlot(e,o);if(n)return n}for(let o of t.children||[])if(o.id===e)return o.element;return null}_collectAllIds(e,t){for(let o of e){t.push({id:o.id,name:o.name,element:o.element,type:"block"});for(let n of o.slots||[])this._collectSlotIds(n,t);o.children&&this._collectAllIds(o.children,t)}}_collectSlotIds(e,t){t.push({id:e.id,name:e.name,element:e.element,type:"slot"});for(let o of e.childSlots||[])this._collectSlotIds(o,t);for(let o of e.children||[])t.push({id:o.id,name:o.name,element:o.element,type:"block"})}_applyMeshHighlights(){this.highlighter.clearMeshHighlights();let e=this.store.getState();if(e.activeMode!=="mesh")return;let t=X(document);e.activeSources.forEach(o=>{let n=z.find(h=>h.id===o),l=t.get(o)||[];n&&l.length>0&&this.highlighter.highlightMeshSource(l,n.color)})}_applyPosition(e){e.panelPosition==="left"?(this.style.left="16px",this.style.right="auto"):(this.style.left="",this.style.right="16px")}_setupKeyboardShortcuts(){this._keyHandler=e=>{if((e.metaKey||e.ctrlKey)&&e.shiftKey){if(e.key==="D"||e.key==="d"){e.preventDefault();let t=this.store.getState();this.store.setState({enabled:!t.enabled}),t.enabled&&this.highlighter.clearAll()}if(e.key==="E"||e.key==="e"){e.preventDefault();let t=this.store.getState();t.enabled&&this.store.setState({isMinimized:!t.isMinimized})}e.key==="ArrowLeft"&&(e.preventDefault(),this.store.setState({panelPosition:"left"})),e.key==="ArrowRight"&&(e.preventDefault(),this.store.setState({panelPosition:"right"}))}},window.addEventListener("keydown",this._keyHandler)}};customElements.get("demo-inspector")||customElements.define("demo-inspector",O);var ge=V(50);J(ge);function ne(){let a=document.querySelector("demo-inspector");if(!a||!a.store)return;let e=window.__demoInspectorTrackQuery;window.__demoInspectorTrackQuery=t=>{e&&e(t);let o=a.store.getState(),n=[t,...o.trackedQueries].slice(0,50);a.store.setState({trackedQueries:n})}}document.readyState==="loading"?document.addEventListener("DOMContentLoaded",ne):queueMicrotask(ne);var se=location.href;function re(){if(location.href!==se){se=location.href;let a=document.querySelector("demo-inspector");a&&a.render()}}setInterval(re,500);window.addEventListener("popstate",()=>setTimeout(re,500));var ie=null,be=new MutationObserver(a=>{a.some(t=>{if(t.type!=="childList")return!1;for(let o of t.addedNodes){if(o.nodeType!==Node.ELEMENT_NODE)continue;let n=o;if(n.matches?.("[data-block-name], [data-slot], [data-slot-key], [data-inspector-source]")||n.querySelector?.("[data-block-name], [data-slot], [data-slot-key], [data-inspector-source]"))return!0}return!1})&&(clearTimeout(ie),ie=setTimeout(()=>{let t=document.querySelector("demo-inspector");t&&t.render()},300))});be.observe(document.body,{childList:!0,subtree:!0});})();
