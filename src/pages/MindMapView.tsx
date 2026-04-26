import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { CSSProperties, MouseEvent as ReactMouseEvent } from "react";
import { Link, useParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  ArrowLeft,
  Edit2,
  GitCommit,
  MousePointer2,
  Palette,
  Plus,
  Save,
  Trash2,
  Type,
  ThumbsUp,
  X,
} from "lucide-react";
import { toast } from "sonner";

type NodeColorKey = "default" | "wine" | "blue" | "green" | "amber" | "rose" | "purple";

type MindNode = {
  id: string;
  x: number;
  y: number;
  text: string;
  colorKey: NodeColorKey;
};

type MindEdge = {
  id: string;
  source: string;
  target: string;
};

type NativeMindMap = {
  version: "mindy-native-v1";
  nodes: MindNode[];
  edges: MindEdge[];
};

type MousePoint = { x: number; y: number };

const NODE_WIDTH = 208;
const NODE_HEIGHT = 68;

const COLORS: Array<{ key: NodeColorKey; name: string; hue: string; soft: string; ink: string }> = [
  { key: "default", name: "Osso", hue: "var(--card)", soft: "var(--secondary)", ink: "var(--foreground)" },
  { key: "wine", name: "Vinho", hue: "var(--primary)", soft: "var(--primary-soft)", ink: "var(--primary)" },
  { key: "blue", name: "Azul", hue: "var(--map-blue)", soft: "var(--map-blue-soft)", ink: "var(--map-blue-ink)" },
  { key: "green", name: "Verde", hue: "var(--accent)", soft: "var(--accent-soft)", ink: "var(--accent)" },
  { key: "amber", name: "Âmbar", hue: "var(--map-amber)", soft: "var(--map-amber-soft)", ink: "var(--map-amber-ink)" },
  { key: "rose", name: "Rosa", hue: "var(--map-rose)", soft: "var(--map-rose-soft)", ink: "var(--map-rose-ink)" },
  { key: "purple", name: "Roxo", hue: "var(--map-purple)", soft: "var(--map-purple-soft)", ink: "var(--map-purple-ink)" },
];

const cleanNodeText = (value: string) => value.replace(/^[\s\-•]+/, "").replace(/[(){}\[\]"]/g, "").trim();

const colorByIndex = (index: number): NodeColorKey => COLORS[(index % (COLORS.length - 1)) + 1].key;

const parseMermaidToNative = (raw: string, fallbackTitle: string): NativeMindMap => {
  const rows = raw
    .split("\n")
    .map((line) => ({ indent: line.search(/\S|$/), text: cleanNodeText(line) }))
    .filter((line) => line.text && !line.text.toLowerCase().startsWith("mindmap"));

  const centralText = cleanNodeText(rows[0]?.text.replace(/^root\s*/i, "") || fallbackTitle || "Ideia principal");
  const nodes: MindNode[] = [{ id: "root", x: 96, y: 280, text: centralText, colorKey: "wine" }];
  const edges: MindEdge[] = [];
  const stack: Array<{ indent: number; id: string }> = [{ indent: -1, id: "root" }];
  const levelCount: Record<number, number> = {};

  rows.slice(1).forEach((row, index) => {
    while (stack.length > 1 && row.indent <= stack[stack.length - 1].indent) stack.pop();
    const parent = stack[stack.length - 1];
    const level = stack.length;
    levelCount[level] = (levelCount[level] ?? 0) + 1;
    const id = `node-${index + 1}`;
    nodes.push({
      id,
      x: 96 + level * 280,
      y: 96 + levelCount[level] * 104 + (level % 2) * 34,
      text: row.text,
      colorKey: level === 1 ? colorByIndex(index) : "default",
    });
    edges.push({ id: `e-${parent.id}-${id}`, source: parent.id, target: id });
    stack.push({ indent: row.indent, id });
  });

  if (nodes.length === 1) {
    const starters = ["Conceitos-chave", "Memória ativa", "Revisão SRS"];
    starters.forEach((text, index) => {
      const id = `node-${index + 1}`;
      nodes.push({ id, x: 390, y: 190 + index * 130, text, colorKey: colorByIndex(index) });
      edges.push({ id: `e-root-${id}`, source: "root", target: id });
    });
  }

  return { version: "mindy-native-v1", nodes, edges };
};

const deserializeMap = (raw: string, title: string): NativeMindMap => {
  try {
    const parsed = JSON.parse(raw) as NativeMindMap;
    if (parsed?.version === "mindy-native-v1" && Array.isArray(parsed.nodes) && Array.isArray(parsed.edges)) return parsed;
  } catch {
    return parseMermaidToNative(raw, title);
  }
  return parseMermaidToNative(raw, title);
};

const serializeMap = (nodes: MindNode[], edges: MindEdge[]) => JSON.stringify({ version: "mindy-native-v1", nodes, edges }, null, 2);

const getColor = (key: NodeColorKey) => COLORS.find((color) => color.key === key) ?? COLORS[0];

export default function MindMapView() {
  const { id } = useParams();
  const { user } = useAuth();
  const canvasRef = useRef<HTMLDivElement | null>(null);
  const editInputRef = useRef<HTMLInputElement | null>(null);

  const [map, setMap] = useState<any>(null);
  const [nodes, setNodes] = useState<MindNode[]>([]);
  const [edges, setEdges] = useState<MindEdge[]>([]);
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);
  const [selectedEdgeId, setSelectedEdgeId] = useState<string | null>(null);
  const [editingNodeId, setEditingNodeId] = useState<string | null>(null);
  const [draggingNodeId, setDraggingNodeId] = useState<string | null>(null);
  const [dragOffset, setDragOffset] = useState<MousePoint>({ x: 0, y: 0 });
  const [isPanning, setIsPanning] = useState(false);
  const [lastPanPoint, setLastPanPoint] = useState<MousePoint | null>(null);
  const [connectingFromId, setConnectingFromId] = useState<string | null>(null);
  const [mousePos, setMousePos] = useState<MousePoint>({ x: 0, y: 0 });
  const [openTabs, setOpenTabs] = useState<string[]>([]);
  const [activeTabId, setActiveTabId] = useState<string | null>(null);

  useEffect(() => {
    if (!id) return;
    (supabase as any)
      .from("mind_maps")
      .select("*")
      .eq("id", id)
      .maybeSingle()
      .then(({ data }: any) => {
        setMap(data);
        const nativeMap = deserializeMap(data?.mermaid_code ?? "", data?.title ?? "Mapa mental");
        setNodes(nativeMap.nodes);
        setEdges(nativeMap.edges);
        setSelectedNodeId(nativeMap.nodes[0]?.id ?? null);
      });
  }, [id]);

  useEffect(() => {
    if (!editingNodeId || !editInputRef.current) return;
    editInputRef.current.focus();
    editInputRef.current.setSelectionRange(editInputRef.current.value.length, editInputRef.current.value.length);
  }, [editingNodeId]);

  const selectedNode = useMemo(() => nodes.find((node) => node.id === selectedNodeId) ?? null, [nodes, selectedNodeId]);
  const activeTabNode = useMemo(() => nodes.find((node) => node.id === activeTabId) ?? null, [nodes, activeTabId]);
  const canEdit = user?.id === map?.user_id;

  const deleteEdge = useCallback((edgeId: string) => {
    setEdges((current) => current.filter((edge) => edge.id !== edgeId));
    setSelectedEdgeId((current) => (current === edgeId ? null : current));
  }, []);

  const deleteNode = useCallback((nodeId: string) => {
    setNodes((current) => current.filter((node) => node.id !== nodeId));
    setEdges((current) => current.filter((edge) => edge.source !== nodeId && edge.target !== nodeId));
    setOpenTabs((current) => current.filter((tabId) => tabId !== nodeId));
    setSelectedNodeId((current) => (current === nodeId ? null : current));
    setActiveTabId((current) => (current === nodeId ? null : current));
  }, []);

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (editingNodeId || !canEdit) return;
      if (event.key === "Delete" || event.key === "Backspace") {
        if (selectedNodeId) deleteNode(selectedNodeId);
        else if (selectedEdgeId) deleteEdge(selectedEdgeId);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [canEdit, deleteEdge, deleteNode, editingNodeId, selectedEdgeId, selectedNodeId]);

  const getMouseCoords = (event: ReactMouseEvent): MousePoint => {
    if (!canvasRef.current) return { x: 0, y: 0 };
    const rect = canvasRef.current.getBoundingClientRect();
    return { x: event.clientX - rect.left, y: event.clientY - rect.top };
  };

  const updateNodeText = (nodeId: string, text: string) => {
    setNodes((current) => current.map((node) => (node.id === nodeId ? { ...node, text } : node)));
  };

  const updateNodeColor = (nodeId: string, colorKey: NodeColorKey) => {
    setNodes((current) => current.map((node) => (node.id === nodeId ? { ...node, colorKey } : node)));
  };

  const openNodeTab = (nodeId: string) => {
    setOpenTabs((current) => (current.includes(nodeId) ? current : [...current, nodeId]));
    setActiveTabId(nodeId);
    setSelectedNodeId(nodeId);
    setSelectedEdgeId(null);
  };

  const closeNodeTab = (nodeId: string) => {
    setOpenTabs((current) => current.filter((tabId) => tabId !== nodeId));
    setActiveTabId((current) => (current === nodeId ? openTabs.find((tabId) => tabId !== nodeId) ?? null : current));
  };

  const addNode = () => {
    if (!canEdit) return;
    const newNode: MindNode = {
      id: `node-${Date.now()}`,
      x: 260 + Math.random() * 240,
      y: 160 + Math.random() * 220,
      text: "Nova ideia",
      colorKey: colorByIndex(nodes.length),
    };
    setNodes((current) => [...current, newNode]);
    setSelectedNodeId(newNode.id);
    setEditingNodeId(newNode.id);
    openNodeTab(newNode.id);
  };

  const save = async () => {
    if (!map || !user || map.user_id !== user.id) return;
    const { error } = await (supabase as any)
      .from("mind_maps")
      .update({ mermaid_code: serializeMap(nodes, edges) })
      .eq("id", map.id);
    if (error) return toast.error(error.message);
    toast.success("Mapa mental salvo");
  };

  const upvote = async () => {
    if (!map || !user) return;
    const { error } = await (supabase as any).from("material_upvotes").insert({
      user_id: user.id,
      material_type: "mind_map",
      material_id: map.id,
      creator_user_id: map.user_id,
    });
    if (error) return toast.error("Você já votou ou não pode votar neste material");
    toast.success("Upvote enviado");
  };

  const handleCanvasMouseMove = useCallback(
    (event: ReactMouseEvent<HTMLDivElement>) => {
      const coords = getMouseCoords(event);
      if (isPanning && lastPanPoint) {
        const deltaX = coords.x - lastPanPoint.x;
        const deltaY = coords.y - lastPanPoint.y;
        setNodes((current) => current.map((node) => ({ ...node, x: node.x + deltaX, y: node.y + deltaY })));
        setLastPanPoint(coords);
        return;
      }
      if (draggingNodeId && canEdit) {
        setNodes((current) =>
          current.map((node) => (node.id === draggingNodeId ? { ...node, x: coords.x - dragOffset.x, y: coords.y - dragOffset.y } : node)),
        );
      }
      if (connectingFromId) setMousePos(coords);
    },
    [canEdit, connectingFromId, dragOffset.x, dragOffset.y, draggingNodeId, isPanning, lastPanPoint],
  );

  const handleCanvasMouseUp = useCallback(() => {
    setDraggingNodeId(null);
    setConnectingFromId(null);
    setIsPanning(false);
    setLastPanPoint(null);
  }, []);

  const handleCanvasMouseDown = (event: ReactMouseEvent<HTMLDivElement>) => {
    if (event.button !== 2 || event.target !== canvasRef.current) return;
    event.preventDefault();
    setIsPanning(true);
    setLastPanPoint(getMouseCoords(event));
    setSelectedNodeId(null);
    setSelectedEdgeId(null);
    setEditingNodeId(null);
  };

  const handleCanvasClick = (event: ReactMouseEvent<HTMLDivElement>) => {
    if (event.target === canvasRef.current) {
      setSelectedNodeId(null);
      setSelectedEdgeId(null);
      setEditingNodeId(null);
    }
  };

  const handleNodeMouseDown = (event: ReactMouseEvent<HTMLDivElement>, nodeId: string) => {
    if (event.button === 2) {
      event.preventDefault();
      event.stopPropagation();
      setIsPanning(true);
      setLastPanPoint(getMouseCoords(event));
      return;
    }
    if (!canEdit || event.button !== 0 || editingNodeId === nodeId) return;
    event.stopPropagation();
    const coords = getMouseCoords(event);
    const node = nodes.find((item) => item.id === nodeId);
    if (!node) return;
    setDragOffset({ x: coords.x - node.x, y: coords.y - node.y });
    setDraggingNodeId(nodeId);
    setSelectedNodeId(nodeId);
    setSelectedEdgeId(null);
  };

  const handleNodeMouseUp = (event: ReactMouseEvent<HTMLDivElement>, targetNodeId: string) => {
    event.stopPropagation();
    if (connectingFromId && connectingFromId !== targetNodeId && canEdit) {
      const edgeExists = edges.some(
        (edge) =>
          (edge.source === connectingFromId && edge.target === targetNodeId) ||
          (edge.target === connectingFromId && edge.source === targetNodeId),
      );
      if (!edgeExists) setEdges((current) => [...current, { id: `e-${Date.now()}`, source: connectingFromId, target: targetNodeId }]);
    }
    setConnectingFromId(null);
    setDraggingNodeId(null);
  };

  const handleConnectorMouseDown = (event: ReactMouseEvent<HTMLDivElement>, nodeId: string) => {
    if (!canEdit) return;
    event.stopPropagation();
    setConnectingFromId(nodeId);
    setMousePos(getMouseCoords(event));
  };

  const renderEdge = (sourceNode: MindNode, targetNode: MindNode | MousePoint, isTemp = false) => {
    const startX = sourceNode.x + NODE_WIDTH;
    const startY = sourceNode.y + NODE_HEIGHT / 2;
    const endX = targetNode.x;
    const endY = isTemp ? targetNode.y : targetNode.y + NODE_HEIGHT / 2;
    const controlPointOffset = Math.max(Math.abs(endX - startX) / 2, 58);
    return `M ${startX} ${startY} C ${startX + controlPointOffset} ${startY}, ${endX - controlPointOffset} ${endY}, ${endX} ${endY}`;
  };

  if (!map) return <div className="container py-8">Carregando...</div>;

  return (
    <div className="h-[calc(100vh-2rem)] min-h-[720px] overflow-hidden bg-background text-foreground animate-fade-in">
      <header className="flex items-center justify-between gap-3 border-b bg-card/88 px-5 py-3 backdrop-blur-md">
        <div className="min-w-0">
          <Link to="/app/mind-maps" className="mb-1 inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground">
            <ArrowLeft className="h-4 w-4" /> Mapas mentais
          </Link>
          <h1 className="truncate text-2xl font-semibold tracking-tight">{map.title}</h1>
        </div>
        <div className="flex flex-wrap items-center justify-end gap-2">
          <Badge variant="secondary" className="gap-1"><GitCommit className="h-3.5 w-3.5" /> Editor nativo</Badge>
          {map.visibility === "public" && <Button variant="outline" onClick={upvote}><ThumbsUp className="h-4 w-4" /> Upvote</Button>}
          {canEdit && <Button onClick={save}><Save className="h-4 w-4" /> Salvar</Button>}
        </div>
      </header>

      <main className="flex h-[calc(100%-73px)] w-full overflow-hidden">
        <aside className="hidden w-72 shrink-0 border-r bg-card/80 p-4 lg:flex lg:flex-col">
          <button
            onClick={addNode}
            className="flex w-full items-center gap-3 rounded-lg border border-primary/20 bg-primary-soft p-3 text-left font-medium text-primary transition-smooth hover:border-primary/40 hover:shadow-soft"
          >
            <Plus className="h-5 w-5" /> Nova ideia
          </button>

          <div className="mt-8 space-y-4">
            <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Gestos rápidos</p>
            {[
              { icon: MousePointer2, text: "Arraste blocos para reorganizar." },
              { icon: MousePointer2, text: "Segure o botão direito para mover o canvas." },
              { icon: GitCommit, text: "Puxe a bolinha lateral para conectar." },
              { icon: Type, text: "Duplo clique para editar o texto." },
              { icon: Trash2, text: "Delete remove bloco ou conexão." },
            ].map(({ icon: Icon, text }) => (
              <div key={text} className="flex items-start gap-3 text-sm text-muted-foreground">
                <Icon className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
                <span>{text}</span>
              </div>
            ))}
          </div>
        </aside>

        <section className="relative flex min-w-0 flex-1 flex-col">
          {selectedNode && canEdit && (
            <div className="absolute left-1/2 top-4 z-30 flex -translate-x-1/2 items-center gap-3 rounded-full border bg-card/95 px-4 py-2 shadow-glow backdrop-blur-md">
              <Palette className="h-4 w-4 text-muted-foreground" />
              <div className="flex gap-1.5 border-r pr-3">
                {COLORS.map((color) => (
                  <button
                    key={color.key}
                    onClick={() => updateNodeColor(selectedNode.id, color.key)}
                    className="h-6 w-6 rounded-full border transition-smooth hover:scale-110"
                    style={{
                      background: `hsl(${color.soft})`,
                      borderColor: `hsl(${color.hue})`,
                      boxShadow: selectedNode.colorKey === color.key ? `0 0 0 3px hsl(var(--ring) / 0.28)` : undefined,
                    }}
                    title={color.name}
                  />
                ))}
              </div>
              <button onClick={() => openNodeTab(selectedNode.id)} className="rounded-md p-1.5 text-muted-foreground transition-smooth hover:bg-secondary hover:text-foreground" title="Abrir aba">
                <GitCommit className="h-4 w-4" />
              </button>
              <button onClick={() => setEditingNodeId(selectedNode.id)} className="rounded-md p-1.5 text-muted-foreground transition-smooth hover:bg-secondary hover:text-foreground" title="Editar texto">
                <Edit2 className="h-4 w-4" />
              </button>
              <button onClick={() => deleteNode(selectedNode.id)} className="rounded-md p-1.5 text-destructive transition-smooth hover:bg-destructive/10" title="Excluir bloco">
                <Trash2 className="h-4 w-4" />
              </button>
            </div>
          )}

          {selectedEdgeId && !selectedNode && canEdit && (
            <div className="absolute left-1/2 top-4 z-30 flex -translate-x-1/2 items-center gap-3 rounded-full border bg-card/95 px-4 py-2 shadow-glow">
              <span className="text-sm font-medium text-muted-foreground">Conexão selecionada</span>
              <button onClick={() => deleteEdge(selectedEdgeId)} className="inline-flex items-center gap-1 rounded-full bg-destructive/10 px-3 py-1.5 text-sm font-medium text-destructive">
                <Trash2 className="h-4 w-4" /> Excluir
              </button>
            </div>
          )}

          <div
            ref={canvasRef}
            className={`relative min-h-0 flex-1 overflow-hidden touch-none ${isPanning ? "cursor-grabbing" : "cursor-grab"}`}
            style={{
              backgroundImage: "radial-gradient(hsl(var(--border)) 1px, transparent 1px)",
              backgroundSize: "24px 24px",
              backgroundPosition: "-12px -12px",
            }}
            onMouseDown={handleCanvasMouseDown}
            onMouseMove={handleCanvasMouseMove}
            onMouseUp={handleCanvasMouseUp}
            onMouseLeave={handleCanvasMouseUp}
            onClick={handleCanvasClick}
            onContextMenu={(event) => event.preventDefault()}
          >
            <svg className="pointer-events-none absolute inset-0 h-full w-full" style={{ zIndex: 0 }}>
              <defs>
                <marker id="mindy-arrow" markerWidth="10" markerHeight="7" refX="9" refY="3.5" orient="auto">
                  <polygon points="0 0, 10 3.5, 0 7" fill="hsl(var(--muted-foreground))" />
                </marker>
                <marker id="mindy-arrow-selected" markerWidth="10" markerHeight="7" refX="9" refY="3.5" orient="auto">
                  <polygon points="0 0, 10 3.5, 0 7" fill="hsl(var(--primary))" />
                </marker>
              </defs>

              {edges.map((edge) => {
                const source = nodes.find((node) => node.id === edge.source);
                const target = nodes.find((node) => node.id === edge.target);
                if (!source || !target) return null;
                const isSelected = selectedEdgeId === edge.id;
                const pathData = renderEdge(source, target);
                return (
                  <g key={edge.id}>
                    <path
                      d={pathData}
                      className="pointer-events-auto cursor-pointer"
                      stroke="transparent"
                      strokeWidth="16"
                      fill="none"
                      onClick={(event) => {
                        event.stopPropagation();
                        setSelectedEdgeId(edge.id);
                        setSelectedNodeId(null);
                      }}
                    />
                    <path
                      d={pathData}
                      stroke={isSelected ? "hsl(var(--primary))" : "hsl(var(--muted-foreground) / 0.52)"}
                      strokeWidth={isSelected ? 3 : 2}
                      fill="none"
                      markerEnd={`url(#${isSelected ? "mindy-arrow-selected" : "mindy-arrow"})`}
                    />
                  </g>
                );
              })}

              {connectingFromId && nodes.find((node) => node.id === connectingFromId) && (
                <path
                  d={renderEdge(nodes.find((node) => node.id === connectingFromId)!, mousePos, true)}
                  stroke="hsl(var(--primary) / 0.72)"
                  strokeWidth="2"
                  fill="none"
                  strokeDasharray="6,6"
                />
              )}
            </svg>

            <div className="pointer-events-none absolute inset-0" style={{ zIndex: 1 }}>
              {nodes.map((node) => {
                const isSelected = selectedNodeId === node.id;
                const isEditing = editingNodeId === node.id;
                const color = getColor(node.colorKey);
                const nodeStyle: CSSProperties = {
                  width: NODE_WIDTH,
                  height: NODE_HEIGHT,
                  left: node.x,
                  top: node.y,
                  cursor: draggingNodeId === node.id ? "grabbing" : canEdit ? "grab" : "default",
                  background: `linear-gradient(135deg, hsl(${color.soft}), hsl(var(--card) / 0.94))`,
                  borderColor: `hsl(${color.hue} / 0.72)`,
                  color: `hsl(${color.ink})`,
                  transition: draggingNodeId === node.id ? "none" : "box-shadow 0.2s, transform 0.2s, background 0.3s, border-color 0.3s",
                };

                return (
                  <div
                    key={node.id}
                    className="group pointer-events-auto absolute flex select-none items-center justify-center rounded-lg border-2 px-4 shadow-soft"
                    style={{
                      ...nodeStyle,
                      transform: isSelected ? "scale(1.025)" : undefined,
                      boxShadow: isSelected ? "var(--shadow-glow)" : undefined,
                    }}
                    onMouseDown={(event) => handleNodeMouseDown(event, node.id)}
                    onMouseUp={(event) => handleNodeMouseUp(event, node.id)}
                    onDoubleClick={(event) => {
                      event.stopPropagation();
                      if (canEdit) setEditingNodeId(node.id);
                      setSelectedNodeId(node.id);
                    }}
                  >
                    <div className="absolute -left-2 top-1/2 h-4 w-4 -translate-y-1/2 rounded-full border-2 border-card bg-secondary opacity-0 transition-opacity group-hover:opacity-100" />
                    <button
                      type="button"
                      onClick={(event) => {
                        event.stopPropagation();
                        openNodeTab(node.id);
                      }}
                      className="absolute -top-3 right-4 rounded-full border bg-card px-2 py-0.5 text-[10px] font-semibold text-muted-foreground opacity-0 shadow-soft transition-smooth hover:text-primary group-hover:opacity-100"
                    >
                      Abrir
                    </button>
                    <div className="w-full text-center">
                      {isEditing ? (
                        <input
                          ref={editInputRef}
                          type="text"
                          className="w-full rounded-md border bg-card/90 px-2 py-1 text-center font-semibold text-foreground outline-none focus:ring-2 focus:ring-ring"
                          value={node.text}
                          onChange={(event) => updateNodeText(node.id, event.target.value)}
                          onBlur={() => setEditingNodeId(null)}
                          onKeyDown={(event) => {
                            if (event.key === "Enter") setEditingNodeId(null);
                          }}
                          onMouseDown={(event) => event.stopPropagation()}
                        />
                      ) : (
                        <span className="block truncate text-sm font-semibold pointer-events-none">{node.text}</span>
                      )}
                    </div>
                    {canEdit && (
                      <div
                        className="absolute -right-3 top-1/2 flex h-7 w-7 -translate-y-1/2 cursor-crosshair items-center justify-center"
                        onMouseDown={(event) => handleConnectorMouseDown(event, node.id)}
                        title="Arraste para conectar"
                      >
                        <div className="h-4 w-4 rounded-full border-2 border-card bg-primary shadow-soft transition-transform group-hover:scale-125" />
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </section>

        <aside className="hidden w-80 shrink-0 border-l bg-card/82 xl:flex xl:flex-col">
          <div className="border-b p-4">
            <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Abas abertas</p>
            <div className="mt-3 flex flex-wrap gap-2">
              {openTabs.length === 0 ? (
                <span className="text-sm text-muted-foreground">Clique em “Abrir” em qualquer bloco.</span>
              ) : (
                openTabs.map((tabId) => {
                  const tabNode = nodes.find((node) => node.id === tabId);
                  if (!tabNode) return null;
                  return (
                    <button
                      key={tabId}
                      onClick={() => setActiveTabId(tabId)}
                      className={`inline-flex max-w-full items-center gap-1 rounded-full border px-3 py-1.5 text-sm transition-smooth ${
                        activeTabId === tabId ? "bg-primary text-primary-foreground" : "bg-secondary text-secondary-foreground hover:bg-primary-soft hover:text-primary"
                      }`}
                    >
                      <span className="truncate">{tabNode.text}</span>
                      <X
                        className="h-3.5 w-3.5"
                        onClick={(event) => {
                          event.stopPropagation();
                          closeNodeTab(tabId);
                        }}
                      />
                    </button>
                  );
                })
              )}
            </div>
          </div>

          <div className="flex-1 p-4">
            {activeTabNode ? (
              <div className="space-y-5">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Bloco ativo</p>
                  <h2 className="mt-2 text-2xl font-semibold leading-tight">{activeTabNode.text}</h2>
                </div>
                <div className="rounded-lg border bg-background/60 p-4">
                  <p className="text-sm text-muted-foreground">Use esta aba como foco rápido: edite o bloco, mude a cor e conecte novas ideias no canvas.</p>
                </div>
                {canEdit && (
                  <div className="space-y-2">
                    <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Texto</label>
                    <input
                      value={activeTabNode.text}
                      onChange={(event) => updateNodeText(activeTabNode.id, event.target.value)}
                      className="w-full rounded-md border bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-ring"
                    />
                  </div>
                )}
              </div>
            ) : (
              <div className="flex h-full items-center justify-center text-center text-sm text-muted-foreground">Abra um bloco para trabalhar em abas laterais.</div>
            )}
          </div>
        </aside>
      </main>
    </div>
  );
}
