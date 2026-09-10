"use client";

import React, { useMemo, useEffect } from "react";
import {
  ReactFlow,
  Background,
  Controls,
  Handle,
  Position,
  useNodesState,
  useEdgesState,
  type Node,
  type Edge,
  type NodeProps,
  MarkerType,
  BackgroundVariant
} from "@xyflow/react";
import "@xyflow/react/dist/style.css";
import { Database, Key, Link2 } from "lucide-react";

interface ColumnDef {
  name: string;
  type: string;
  isPk?: boolean;
  isFk?: boolean;
  fkTarget?: string;
}

interface TableNodeData {
  title: string;
  count: number;
  columns: ColumnDef[];
  color?: string;
  [key: string]: unknown;
}

function TableNode({ data }: NodeProps<Node<TableNodeData>>) {
  return (
    <div className="w-64 rounded-xl border border-(--border-color) bg-background/95 shadow-xl backdrop-blur-md overflow-hidden text-xs">
      <Handle
        type="target"
        position={Position.Left}
        className="!h-2.5 !w-2.5 !bg-accent !border-2 !border-background"
      />
      <Handle
        type="source"
        position={Position.Right}
        className="!h-2.5 !w-2.5 !bg-accent !border-2 !border-background"
      />

      {/* Header */}
      <div className="flex items-center justify-between px-3 py-2 bg-foreground/5 border-b border-(--border-color)">
        <div className="flex items-center gap-1.5 font-bold font-mono text-foreground">
          <Database className="h-3.5 w-3.5 text-accent" />
          <span>{data.title}</span>
        </div>
        <span className="rounded-full bg-accent/15 px-2 py-0.5 text-[10px] font-mono font-semibold text-accent">
          {data.count} rows
        </span>
      </div>

      {/* Columns */}
      <div className="divide-y divide-(--border-color)/40 max-h-72 overflow-y-auto">
        {data.columns.map((col) => (
          <div
            key={col.name}
            className="flex items-center justify-between px-3 py-1.5 hover:bg-foreground/5 transition-colors font-mono"
          >
            <div className="flex items-center gap-1.5 truncate">
              {col.isPk ? (
                <span title="Primary Key" className="inline-flex shrink-0">
                  <Key className="h-3 w-3 text-amber-500" />
                </span>
              ) : col.isFk ? (
                <span title={`Foreign Key (${col.fkTarget})`} className="inline-flex shrink-0">
                  <Link2 className="h-3 w-3 text-blue-400" />
                </span>
              ) : (
                <span className="w-3 shrink-0" />
              )}
              <span className={`truncate ${col.isPk ? "font-bold text-foreground" : "text-foreground/80"}`}>
                {col.name}
              </span>
            </div>
            <span className="text-[10px] text-foreground/45 uppercase ml-2 shrink-0">
              {col.type}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

const nodeTypes = {
  tableNode: TableNode
};

interface DatabaseErDiagramProps {
  counts: {
    post?: number;
    category?: number;
    series?: number;
    tag?: number;
    post_tags?: number;
    site_settings?: number;
    auth_rate_limits?: number;
  };
}

export default function DatabaseErDiagram({ counts }: DatabaseErDiagramProps) {
  const initialNodes: Node<TableNodeData>[] = useMemo(
    () => [
      {
        id: "post",
        type: "tableNode",
        position: { x: 380, y: 50 },
        data: {
          title: "post",
          count: counts.post ?? 0,
          columns: [
            { name: "id", type: "uuid", isPk: true },
            { name: "title", type: "text" },
            { name: "slug", type: "text" },
            { name: "category", type: "text", isFk: true, fkTarget: "category.slug" },
            { name: "level", type: "text" },
            { name: "reading_time", type: "int" },
            { name: "series_id", type: "uuid", isFk: true, fkTarget: "series.id" },
            { name: "series_order", type: "int" },
            { name: "published", type: "bool" },
            { name: "published_at", type: "timestamptz" },
            { name: "created_at", type: "timestamptz" },
            { name: "updated_at", type: "timestamptz" }
          ]
        }
      },
      {
        id: "category",
        type: "tableNode",
        position: { x: 50, y: 50 },
        data: {
          title: "category",
          count: counts.category ?? 0,
          columns: [
            { name: "id", type: "uuid", isPk: true },
            { name: "icon", type: "text" },
            { name: "name", type: "text" },
            { name: "slug", type: "text" },
            { name: "description", type: "text" },
            { name: "examples", type: "text" },
            { name: "display_order", type: "int" },
            { name: "updated_at", type: "timestamptz" }
          ]
        }
      },
      {
        id: "series",
        type: "tableNode",
        position: { x: 740, y: 50 },
        data: {
          title: "series",
          count: counts.series ?? 0,
          columns: [
            { name: "id", type: "uuid", isPk: true },
            { name: "title", type: "text" },
            { name: "slug", type: "text" },
            { name: "description", type: "text" },
            { name: "created_at", type: "timestamptz" },
            { name: "updated_at", type: "timestamptz" }
          ]
        }
      },
      {
        id: "post_tags",
        type: "tableNode",
        position: { x: 380, y: 460 },
        data: {
          title: "post_tags",
          count: counts.post_tags ?? 0,
          columns: [
            { name: "post_id", type: "uuid", isPk: true, isFk: true, fkTarget: "post.id" },
            { name: "tag_id", type: "uuid", isPk: true, isFk: true, fkTarget: "tag.id" }
          ]
        }
      },
      {
        id: "tag",
        type: "tableNode",
        position: { x: 50, y: 460 },
        data: {
          title: "tag",
          count: counts.tag ?? 0,
          columns: [
            { name: "id", type: "uuid", isPk: true },
            { name: "name", type: "text" },
            { name: "slug", type: "text" },
            { name: "created_at", type: "timestamptz" }
          ]
        }
      },
      {
        id: "auth_rate_limits",
        type: "tableNode",
        position: { x: 740, y: 340 },
        data: {
          title: "auth_rate_limits",
          count: counts.auth_rate_limits ?? 0,
          columns: [
            { name: "ip", type: "text", isPk: true },
            { name: "attempt_count", type: "int" },
            { name: "escalation_level", type: "int" },
            { name: "locked_until", type: "timestamptz" },
            { name: "last_attempt_at", type: "timestamptz" },
            { name: "updated_at", type: "timestamptz" }
          ]
        }
      },
      {
        id: "site_settings",
        type: "tableNode",
        position: { x: 740, y: 580 },
        data: {
          title: "site_settings",
          count: counts.site_settings ?? 0,
          columns: [
            { name: "id", type: "text", isPk: true },
            { name: "accent_color", type: "text" },
            { name: "banner_config", type: "jsonb" },
            { name: "updated_at", type: "timestamptz" }
          ]
        }
      }
    ],
    [counts]
  );

  const initialEdges: Edge[] = useMemo(
    () => [
      {
        id: "e-category-post",
        source: "category",
        target: "post",
        animated: true,
        label: "1:N (category)",
        style: { stroke: "var(--accent)", strokeWidth: 2 },
        markerEnd: { type: MarkerType.ArrowClosed, color: "var(--accent)" }
      },
      {
        id: "e-series-post",
        source: "series",
        target: "post",
        animated: true,
        label: "1:N (series_id)",
        style: { stroke: "#3b82f6", strokeWidth: 2 },
        markerEnd: { type: MarkerType.ArrowClosed, color: "#3b82f6" }
      },
      {
        id: "e-post-posttags",
        source: "post",
        target: "post_tags",
        animated: true,
        label: "1:N (post_id)",
        style: { stroke: "#a855f7", strokeWidth: 2 },
        markerEnd: { type: MarkerType.ArrowClosed, color: "#a855f7" }
      },
      {
        id: "e-tag-posttags",
        source: "tag",
        target: "post_tags",
        animated: true,
        label: "1:N (tag_id)",
        style: { stroke: "#10b981", strokeWidth: 2 },
        markerEnd: { type: MarkerType.ArrowClosed, color: "#10b981" }
      }
    ],
    []
  );

  const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes);
  const [edges, , onEdgesChange] = useEdgesState(initialEdges);

  useEffect(() => {
    setNodes((nds) =>
      nds.map((node) => {
        const id = node.id as keyof typeof counts;
        if (id in counts) {
          return {
            ...node,
            data: {
              ...node.data,
              count: counts[id] ?? 0
            }
          };
        }
        return node;
      })
    );
  }, [counts, setNodes]);

  return (
    <div className="h-[650px] w-full rounded-xl border border-(--border-color) bg-background/50 backdrop-blur-xs overflow-hidden shadow-inner">
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        nodeTypes={nodeTypes}
        fitView
        fitViewOptions={{ padding: 0.2 }}
        minZoom={0.3}
        maxZoom={1.5}
        colorMode="system"
        nodesDraggable={true}
        nodesConnectable={false}
        elementsSelectable={true}
        proOptions={{ hideAttribution: true }}
      >
        <Background variant={BackgroundVariant.Dots} gap={16} size={1} color="currentColor" className="opacity-15" />
        <Controls className="!bg-background/80 !border-(--border-color) !rounded-lg !shadow-md [&>button]:!text-foreground [&>button]:!border-b-(--border-color)" />
      </ReactFlow>
    </div>
  );
}
