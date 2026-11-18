import {useEffect, useRef, useState} from "react";
import type {PointerEvent} from "react";
import {VendorTerms} from "./LegalShieldModal";

type Point = {x: number; y: number};
type Piece = Point & {id: string; kind: string; w: number; d: number; h: number; color: string; source?: string; elevation?: number};
type Item = {label: string; dims: [number, number, number]; color: string};
type Mode = "interior" | "casting";

const furniture: Record<string, Item> = {
  sofa: {label: "Bouclé Cloud Sofa", dims: [2.4, .95, .82], color: "#d8cfc0"},
  chair: {label: "Swivel Accent Chair", dims: [.82, .82, .88], color: "#c29b70"},
  table: {label: "Travertine Round Table", dims: [1.5, 1.5, .75], color: "#d5cab8"},
  credenza: {label: "Fluted Walnut Credenza", dims: [1.9, .5, .8], color: "#6e4b34"},
  wardrobe: {label: "Vitrine Wardrobe", dims: [1.6, .6, 2.1], color: "#3d3f44"},
  sectional: {label: "Olive Mohair Sectional", dims: [2.7, 1.6, .84], color: "#5f6e58"},
  bench: {label: "Saddle Gallery Bench", dims: [1.5, .48, .45], color: "#9c5b34"},
  bed: {label: "King Platform Bed", dims: [1.8, 2.1, .68], color: "#a3929b"},
  planter: {label: "Cast Olive Planter", dims: [.7, .7, 1.5], color: "#687857"},
  lamp: {label: "Alabaster Table Lamp", dims: [.35, .35, .55], color: "#d2b47c"},
};
const structure: Record<string, Item> = {
  wall: {label: "Wall panel", dims: [3, .2, 2.8], color: "#a8a297"},
  column: {label: "Column", dims: [.45, .45, 3], color: "#8d9a9a"},
  slab: {label: "Slab", dims: [3.5, 3, .25], color: "#b8ab91"},
  beam: {label: "Beam", dims: [3, .4, .4], color: "#a08774"},
  opening: {label: "Framed opening", dims: [2, .25, 2.6], color: "#8b8c78"},
  stair: {label: "Stair flight", dims: [1.2, 2.5, 1.5], color: "#9c9280"},
};
const collections = [
  {label: "George Buildings", note: "Browse furniture and contact George for a quote.", url: "https://georgebuildings.com/george-furniture/", action: "Browse George furniture"},
  {label: "Sophiakey Furniture", note: "Browse the sourcing service or send a project inquiry.", url: "https://sophiakeyfurniture.store/", action: "Visit Sophiakey store", inquiry: "https://sophiakeyfurniture.store/pages/contact"},
  {label: "Sophiakey on Instagram", note: "Browse showroom inspiration. Use Sophiakey’s site to confirm ordering terms.", url: "https://www.instagram.com/sophiakey_designerfurniture/", action: "View Instagram"},
];
function supplierLink(value: string) {
  try {
    const url = new URL(value);
    if (url.protocol !== "https:" || url.username || url.password) return "";
    const host = url.hostname.replace(/^www\./, "");
    if (["georgebuildings.com","sophiakeyfurniture.store","instagram.com"].includes(host)) return url.href;
  } catch {}
  return "";
}
const grid = 10;
const maxHeight = 4;
const finish = ["#a8a297", "#c9b594", "#7d8786", "#9a7463"];
const limit = (n: number, max = grid) => Math.max(0, Math.min(max, n));
const makePiece = (catalog: Record<string, Item>, kind: string, x: number, y: number): Piece => {
  const {dims: [w,d,h], color} = catalog[kind];
  return {id: crypto.randomUUID(), kind, x: limit(x, grid-w), y: limit(y, grid-d), w,d,h,color};
};

function templates(template: string): Piece[] {
  const positions: Record<string, Array<[string,number,number]>> = {
    wall: [["wall",2,3], ["opening",5,3], ["wall",7,3]],
    frame: [["column",2,2], ["column",7,2], ["column",2,7], ["column",7,7], ["beam",3,2]],
    shell: [["slab",3,3], ["wall",3,3], ["wall",5,5], ["stair",6,3]],
    blank: [],
  };
  return positions[template].map(([kind,x,y]) => {
    const piece = makePiece(structure,kind,x,y);
    if(template === "frame" && kind === "beam") return {...piece, x:2, w:5.45, elevation:3};
    return piece;
  });
}

function project(x: number, y: number, z = 0) {
  return [210 + (x-y)*16, 108 + (x+y)*8 - z*22].join(",");
}

function shape(piece: Piece, active: boolean) {
  const {x,y,w,d,h} = piece;
  const parts: Array<[number,number,number,number,number,number]> = [];
  if (piece.kind === "opening") {
    parts.push([x,y,0,w*.12,d,h], [x+w*.88,y,0,w*.12,d,h], [x+w*.12,y,h*.82,w*.76,d,h*.18]);
  } else if (piece.kind === "stair") {
    for (let i=0;i<5;i++) parts.push([x,y+(4-i)*d/5,0,w,d/5,h*(i+1)/5]);
  } else if (piece.kind === "table") {
    for (const a of [.08,.84]) for (const b of [.08,.84]) parts.push([x+a*w,y+b*d,0,w*.08,d*.08,h*.9]);
    parts.push([x,y,h*.9,w,d,h*.1]);
  } else if (piece.kind === "sofa" || piece.kind === "chair") {
    parts.push([x,y,0,w,d,h*.5], [x,y,h*.5,w,d*.18,h*.5]);
    parts.push([x,y+d*.18,h*.5,w*.15,d*.82,h*.2], [x+w*.85,y+d*.18,h*.5,w*.15,d*.82,h*.2]);
  } else if (piece.kind === "bed") {
    parts.push([x,y,0,w,d,h*.6], [x,y,h*.6,w,d*.1,h*.4]);
  } else {
    parts.push([x,y,0,w,d,h]);
  }
  return parts.map(([a,b,z,width,depth,height], i) => {
    const base=z+(piece.elevation ?? 0), top=base+height, right=a+width, front=b+depth;
    const stroke=active?"#71360f":"#57534e";
    const c=piece.color;
    return <g key={i} stroke={stroke} strokeWidth={active?2:1} strokeLinejoin="round">
      <polygon fill={c} points={[project(a,front,base),project(right,front,base),project(right,front,top),project(a,front,top)].join(" ")}/>
      <polygon fill={c} fillOpacity=".76" points={[project(right,b,base),project(right,front,base),project(right,front,top),project(right,b,top)].join(" ")}/>
      <polygon fill={c} stroke={stroke} points={[project(a,b,top),project(right,b,top),project(right,front,top),project(a,front,top)].join(" ")}/>
    </g>;
  });
}

function readLayout(key: string, catalog: Record<string, Item>) {
  try {
    const saved = JSON.parse(localStorage.getItem(key) ?? "null");
    if (!saved || !Array.isArray(saved.pieces) || !Array.isArray(saved.lines)) return null;
    return {
      pieces: saved.pieces.slice(0,80).filter((p: Piece) => p && Object.hasOwn(catalog,p.kind) &&
        typeof p.id==="string" && /^#[0-9a-f]{6}$/i.test(p.color) &&
        [p.x,p.y,p.w,p.d,p.h,p.elevation ?? 0].every(v=>Number.isFinite(v) && v>=0 && v<=grid)),
      lines: saved.lines.slice(0,50).filter((line: Point[])=>Array.isArray(line) && line.length<=200 &&
        line.every(p=>p && Number.isFinite(p.x) && Number.isFinite(p.y))),
    } as {pieces: Piece[]; lines: Point[][]};
  } catch {return null}
}

function seedInteriorPieces(): Piece[] {
  return [
    makePiece(furniture, "sofa", 1.8, 5.2),
    makePiece(furniture, "table", 5.8, 2.2),
    makePiece(furniture, "chair", 4.6, 5.4),
    makePiece(furniture, "credenza", 1.2, 1.5),
  ];
}

export function LayoutEditor({mode, preview, onPlans}: {mode: Mode; preview: boolean; onPlans: () => void}) {
  const casting=mode==="casting";
  const catalog=casting?structure:furniture;
  const key="sparklintel-layout-"+mode;
  const [initial]=useState(()=>readLayout(key,catalog));
  const [pieces,setPieces]=useState<Piece[]>(()=>initial?.pieces && initial.pieces.length > 0 ? initial.pieces : (casting?templates("wall"):seedInteriorPieces()));
  const [lines,setLines]=useState<Point[][]>(()=>initial?.lines ?? []);
  const [tool,setTool]=useState<"move" | "pencil">("move");
  const [view,setView]=useState<"plan" | "3d">("plan");
  const [kind,setKind]=useState(Object.keys(catalog)[0]);
  const [selected,setSelected]=useState("");
  const [storageFailed,setStorageFailed]=useState(false);
  const [confirmClear,setConfirmClear]=useState(false);
  const [template,setTemplate]=useState("wall");
  const [source,setSource]=useState("");
  const [sourceError,setSourceError]=useState(false);
  const stage=useRef<SVGSVGElement>(null);
  const gesture=useRef<{pointer: number; point: Point; piece?: Piece} | null>(null);
  const item=pieces.find(p=>p.id===selected);
  useEffect(()=>{
    if(!preview)return;
    try {localStorage.setItem(key,JSON.stringify({pieces,lines}))} catch {setStorageFailed(true)}
  },[key,lines,pieces,preview]);

  function point(event: PointerEvent): Point | null {
    const svg=stage.current, matrix=svg?.getScreenCTM();
    if(!svg || !matrix)return null;
    const p=new DOMPoint(event.clientX,event.clientY).matrixTransform(matrix.inverse());
    if(view==="plan")return {x:(p.x-60)/30,y:(p.y-20)/27};
    const a=(p.x-210)/16,b=(p.y-108)/8;
    return {x:(b+a)/2,y:(b-a)/2};
  }
  function begin(event: PointerEvent, piece?: Piece) {
    if ((event.pointerType === "mouse" && event.button !== 0) || gesture.current) return;
    const at=point(event);
    if(!at)return;
    if(tool==="move" && !piece)return;
    if(tool==="pencil" && lines.length>=50)return;
    gesture.current={pointer:event.pointerId,point:at,piece:tool==="move"?piece:undefined};
    try {
      stage.current?.setPointerCapture(event.pointerId);
    } catch {
      // Ignore environments where SVG pointer capture throws
    }
    if(tool==="move" && piece)setSelected(piece.id);
    else setLines(previous=>[...previous,[{x:limit(at.x),y:limit(at.y)}]]);
  }
  function updatePiece(id: string, patch: Partial<Piece>) {
    setPieces(previous=>previous.map(p=>{
      if(p.id!==id)return p;
      const next={...p,...patch};
      return {...next,x:limit(next.x,grid-next.w),y:limit(next.y,grid-next.d),elevation:limit(next.elevation ?? 0,maxHeight-next.h)};
    }));
  }
  function move(event: PointerEvent) {
    const active=gesture.current, at=point(event);
    if(!active || active.pointer!==event.pointerId || !at)return;
    if(active.piece){
      const p=active.piece;
      updatePiece(p.id,{x:p.x+at.x-active.point.x,y:p.y+at.y-active.point.y});
    }else{
      setLines(previous=>{
        const last=previous.at(-1);
        if(!last || last.length>=200)return previous;
        return [...previous.slice(0,-1),[...last,{x:limit(at.x),y:limit(at.y)}]];
      });
    }
  }
  const button="min-h-11 rounded-lg border border-stone-300 bg-white px-3 text-sm font-medium text-stone-900 aria-pressed:border-amber-800 aria-pressed:bg-amber-100 disabled:opacity-50";
  return <details open className="mx-auto mt-5 w-[calc(100%-2rem)] max-w-7xl rounded-2xl border border-stone-200 bg-[#fbf9f4]">
    <summary className="cursor-pointer px-5 py-4 font-semibold">{casting?"Draw & Move 3D Casting Walls, Columns & Structures (Pencil + Move)":"Pencil Sketch & Move Sophia Key / George Furniture Floor Plan"}</summary>
    <div className="space-y-4 border-t border-stone-200 p-4 sm:p-5">
      {!casting && preview && <section aria-labelledby="shop-vendors" className="space-y-3">
        <h2 id="shop-vendors" className="text-lg font-semibold">Shop furniture directly from suppliers</h2>
        <p className="text-sm text-stone-700">Order and pay on the vendor’s site or through its sales team. For delivery damage, missing items, returns or warranty claims, contact the seller on your order.</p>
        <details className="rounded-xl border border-stone-200 bg-white px-4 py-3">
          <summary className="cursor-pointer font-medium text-stone-900">Legal Shield · Vendor orders and damage claims</summary>
          <div className="pt-3"><VendorTerms /></div>
        </details>
        <div className="grid gap-3 sm:grid-cols-3">{collections.map(vendor=><article key={vendor.url} className="flex flex-col gap-2 rounded-xl border border-stone-200 bg-white p-4">
          <h3 className="font-semibold">{vendor.label}</h3><p className="text-sm text-stone-700">{vendor.note}</p>
          <a href={vendor.url} target="_blank" rel="noopener noreferrer" className="mt-auto inline-flex min-h-11 items-center self-start text-sm font-semibold text-amber-900 underline">{vendor.action} ↗</a>
          {vendor.inquiry && <a href={vendor.inquiry} target="_blank" rel="noopener noreferrer" className="inline-flex min-h-11 items-center self-start text-sm font-semibold text-amber-900 underline">Contact Sophiakey for sourcing ↗</a>}
        </article>)}</div>
      </section>}
      {!casting && !preview && (
        <div className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-amber-200 bg-amber-50/70 px-4 py-2.5 text-xs text-stone-800">
          <span>Draw freely with the <strong>Pencil</strong> or drag furniture below. Subscribe to Pro/Studio to save layouts and unlock full vendor store ordering.</span>
          <button type="button" className="rounded-lg bg-stone-900 px-3 py-1.5 font-semibold text-white cursor-pointer" onClick={onPlans}>View Subscriptions</button>
        </div>
      )}
        <div className="flex flex-wrap gap-2">
          {casting && <><label className="flex items-center gap-2 text-sm">Starting layout<select className={button} value={template} onChange={e=>setTemplate(e.target.value)}>
            <option value="wall">Walls and openings</option><option value="frame">Column and beam frame</option><option value="shell">Slabs and stairs</option><option value="blank">Blank layout</option>
          </select></label><button className={button} type="button" onClick={()=>{if(pieces.length+templates(template).length<=80)setPieces(previous=>[...previous,...templates(template)]);}} disabled={template==="blank"}>Add template</button>
          </>}
          {!confirmClear ? (
            <button className={button} type="button" onClick={()=>setConfirmClear(true)}>Clear canvas</button>
          ) : (
            <span className="inline-flex items-center gap-1.5">
              <button className="min-h-11 rounded-lg border border-red-300 bg-red-50 px-3 text-sm font-semibold text-red-800 cursor-pointer" type="button" onClick={()=>{setPieces([]);setLines([]);setSelected("");setConfirmClear(false);}}>Confirm clear</button>
              <button className={button} type="button" onClick={()=>setConfirmClear(false)}>Cancel</button>
            </span>
          )}
          <label className="flex items-center gap-2 text-sm">{casting?"Element":"Furniture"}<select className={button} value={kind} onChange={e=>setKind(e.target.value)}>{Object.entries(catalog).map(([id,p])=><option value={id} key={id}>{p.label}</option>)}</select></label>
          <button className={button} type="button" disabled={pieces.length>=80} onClick={()=>{
            const link=casting?"":supplierLink(source.trim());
            if(!casting && source.trim() && !link){setSourceError(true);return;}
            const p=makePiece(catalog,kind,4+pieces.length%4*.4,4);
            if(link)p.source=link;
            setPieces(previous=>[...previous,p]);setSelected(p.id);setTool("move");setSource("");setSourceError(false);
          }}>Add to canvas</button>
        </div>
        {!casting && <div className="max-w-lg">
          <label className="flex flex-col gap-1 text-sm">Supplier product link (optional — George Buildings / Sophiakey / Instagram)
            <input type="url" className={button} value={source} onChange={event=>{setSource(event.target.value);setSourceError(false);}} placeholder="https://sophiakeyfurniture.store/…" />
          </label>
          {sourceError && <p role="alert" className="text-sm text-red-800">Enter an HTTPS link from George Buildings, Sophiakey Furniture, or Instagram.</p>}
        </div>}
        <div className="flex flex-wrap gap-2">
          <button className={button} type="button" aria-pressed={view==="plan"} onClick={()=>setView("plan")}>2D Floor Plan</button>
          <button className={button} type="button" aria-pressed={view==="3d"} onClick={()=>{setView("3d");}}>3D Isometric</button>
          <button className={button} type="button" aria-pressed={tool==="move"} onClick={()=>setTool("move")}>✋ Move Items</button>
          <button className={button} type="button" aria-pressed={tool==="pencil"} onClick={()=>{setTool("pencil");}}>✏️ Pencil Draw</button>
          <button className={button} type="button" disabled={!lines.length} onClick={()=>setLines(previous=>previous.slice(0,-1))}>Undo pencil mark</button>
        </div>
        <p className="text-sm text-stone-700">{tool==="pencil"?"Pencil active: draw walls, rugs, or paths with your mouse, finger, or stylus (works in both 2D and 3D views).":"Move active: drag any furniture/structure item with a mouse or finger, or select it and use the arrows below."}</p>
        <svg ref={stage} aria-label={view==="plan"?"Editable floor plan":"Editable 3D layout"} role="img" viewBox="0 0 420 310" className="mx-auto block w-full max-w-[660px] rounded-xl border border-stone-300 bg-[#f1ece2]" style={{touchAction:"none",cursor:tool==="pencil"?"crosshair":"grab"}} onPointerDown={event=>begin(event)} onPointerMove={move} onPointerUp={()=>{gesture.current=null}} onPointerCancel={()=>{gesture.current=null}} onLostPointerCapture={()=>{gesture.current=null}}>
          {view==="plan"? <>
            <rect x="60" y="20" width="300" height="270" fill="#fcfaf3" stroke="#8c8274"/>
            {Array.from({length:9},(_,i)=><path key={i} d={`M${90+i*30} 20v270 M60 ${47+i*27}h300`} fill="none" stroke="#ded6c9"/>)}
            {pieces.map(p=><g key={p.id} style={{touchAction:"none"}} onPointerDown={event=>{if(tool==="move"){event.stopPropagation();begin(event,p);}}}>
              <rect x={60+p.x*30} y={20+p.y*27} width={p.w*30} height={p.d*27} rx="2" fill={p.color} stroke={selected===p.id?"#703908":"#4e463e"} strokeWidth={selected===p.id?3:1}/>
              {p.w>=1.1 && p.d>=.45 && <text x={64+p.x*30} y={32+p.y*27} fontSize="8.5" fill="#17130f" pointerEvents="none">{catalog[p.kind].label}</text>}
            </g>)}
            {lines.map((line,index)=><polyline key={index} points={line.map(p=>[60+p.x*30,20+p.y*27].join(",")).join(" ")} fill="none" stroke="#92400E" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" pointerEvents="none"/>)}
          </> : <>
            <polygon points={[project(0,0),project(grid,0),project(grid,grid),project(0,grid)].join(" ")} fill="#f8f4eb" stroke="#8c8274"/>
            {Array.from({length:9},(_,i)=><g key={i} opacity=".45" stroke="#b9afa2">
              <polyline points={project(i+1,0)+" "+project(i+1,grid)}/><polyline points={project(0,i+1)+" "+project(grid,i+1)}/>
            </g>)}
            {[...pieces].sort((a,b)=>a.x+a.y-b.x-b.y).map(p=><g key={p.id} style={{touchAction:"none"}} onPointerDown={event=>{if(tool==="move"){event.stopPropagation();begin(event,p);}}}>{shape(p,p.id===selected)}</g>)}
            {lines.map((line,index)=><polyline key={"3d-line-"+index} points={line.map(p=>project(p.x,p.y,0)).join(" ")} fill="none" stroke="#92400E" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" pointerEvents="none"/>)}
          </>}
        </svg>
        <div className="flex flex-wrap items-center gap-2">
          <label className="flex items-center gap-2 text-sm">Selected object<select className={button} value={selected} onChange={e=>setSelected(e.target.value)}><option value="">Select an object</option>{pieces.map((p,index)=><option key={p.id} value={p.id}>{catalog[p.kind].label} {index+1}</option>)}</select></label>
          {item && <>
            {([[-1,0,"←","Move left"],[1,0,"→","Move right"],[0,-1,"↑","Move back"],[0,1,"↓","Move forward"]] as const).map(([dx,dy,icon,label])=><button className={button} type="button" key={label} aria-label={label} onClick={()=>updatePiece(item.id,{x:item.x+dx*.2,y:item.y+dy*.2})}>{icon}</button>)}
            <button className={button} type="button" onClick={()=>updatePiece(item.id,{w:item.d,d:item.w})}>Rotate footprint</button>
            <button className={button} type="button" onClick={()=>{setPieces(previous=>previous.filter(p=>p.id!==item.id));setSelected("");}}>Remove</button>
          </>}
        </div>
        {item && <div className="flex flex-wrap gap-3">
          {([["w","Width"],["d","Depth"],["h","Height"]] as const).map(([field,label])=><label className="flex flex-col gap-1 text-sm" key={item.id+field}>{label} (m)<input className={button+" w-24"} type="number" min=".1" max={field==="h"?maxHeight:grid} step=".01" value={item[field]} onChange={e=>{const n=e.target.valueAsNumber;if(n>=.1&&n<=(field==="h"?maxHeight:grid))updatePiece(item.id,{[field]:n});}}/></label>)}
          <label className="flex flex-col gap-1 text-sm">Elevation (m)<input className={button+" w-24"} type="number" min="0" max={maxHeight-item.h} step=".01" value={item.elevation ?? 0}
            onChange={event=>{const elevation=event.target.valueAsNumber;if(elevation>=0&&elevation<=maxHeight-item.h)updatePiece(item.id,{elevation});}}/></label>
          <label className="flex flex-col gap-1 text-sm">Finish<select className={button} value={item.color} onChange={e=>updatePiece(item.id,{color:e.target.value})}>
            <option value={catalog[item.kind].color}>Original</option>{finish.filter(c=>c!==catalog[item.kind].color).map((c,i)=><option key={c} value={c}>{["Concrete gray","Sand","Slate","Clay"][finish.indexOf(c)] ?? i}</option>)}
          </select></label>
        </div>}
        {item?.source && supplierLink(item.source) && <a href={supplierLink(item.source)} target="_blank" rel="noopener noreferrer" className="inline-block py-2 text-sm font-medium text-amber-900 underline">View this item at the vendor ↗</a>}
        <p className="text-xs text-stone-600">{casting?"Concept geometry for layout discussion. A qualified local engineer must validate structural designs. ":"Supplier models use approximate shapes. "}{storageFailed?"This browser could not save the layout.":preview?"This layout saves in this browser.":"Select a plan preview to keep your layout in this browser."}</p>
    </div>
  </details>;
}
