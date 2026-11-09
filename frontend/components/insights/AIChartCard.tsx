"use client";

import React from "react";
import { AIChartItem } from "@/types/ai";
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
} from "recharts";
import { BarChart3 } from "lucide-react";

const PALETTE = ["#9B681E", "#C99A3A", "#E9A23B", "#713B36", "#4A6B82", "#2B580C"];

interface AIChartCardProps {
  chart: AIChartItem;
}

export default function AIChartCard({ chart }: AIChartCardProps) {
  const xKey = chart.x_key || "name";
  const yKey = chart.y_key || "value";
  const data = chart.data || [];

  if (!data || data.length === 0) return null;

  return (
    <div className="my-3 p-4 rounded-xl bg-surface border border-border shadow-xs">
      <div className="flex items-center gap-2 mb-3">
        <BarChart3 className="w-4 h-4 text-gold shrink-0" />
        <h4 className="text-xs font-semibold text-text uppercase tracking-wider">{chart.title}</h4>
      </div>

      <div className="h-56 w-full">
        <ResponsiveContainer width="100%" height="100%">
          {chart.chart_type === "line" ? (
            <LineChart data={data} margin={{ top: 10, right: 10, left: -20, bottom: 20 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0ebe1" />
              <XAxis dataKey={xKey} tick={{ fontSize: 11, fill: "#666" }} />
              <YAxis tick={{ fontSize: 11, fill: "#666" }} />
              <Tooltip
                contentStyle={{
                  backgroundColor: "#FFFFFF",
                  borderColor: "#E6DFD5",
                  borderRadius: "8px",
                  fontSize: "12px",
                }}
              />
              <Line type="monotone" dataKey={yKey} stroke="#9B681E" strokeWidth={2} dot={{ fill: "#C99A3A", r: 3 }} />
            </LineChart>
          ) : chart.chart_type === "pie" ? (
            <PieChart>
              <Tooltip
                contentStyle={{
                  backgroundColor: "#FFFFFF",
                  borderColor: "#E6DFD5",
                  borderRadius: "8px",
                  fontSize: "12px",
                }}
              />
              <Pie
                data={data}
                dataKey={yKey}
                nameKey={xKey}
                cx="50%"
                cy="50%"
                outerRadius={70}
                label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                labelLine={false}
              >
                {data.map((_, index) => (
                  <Cell key={`cell-${index}`} fill={PALETTE[index % PALETTE.length]} />
                ))}
              </Pie>
            </PieChart>
          ) : (
            <BarChart data={data} margin={{ top: 10, right: 10, left: -20, bottom: 20 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0ebe1" />
              <XAxis dataKey={xKey} tick={{ fontSize: 11, fill: "#666" }} />
              <YAxis tick={{ fontSize: 11, fill: "#666" }} />
              <Tooltip
                contentStyle={{
                  backgroundColor: "#FFFFFF",
                  borderColor: "#E6DFD5",
                  borderRadius: "8px",
                  fontSize: "12px",
                }}
              />
              <Bar dataKey={yKey} fill="#9B681E" radius={[4, 4, 0, 0]}>
                {data.map((_, index) => (
                  <Cell key={`cell-${index}`} fill={PALETTE[index % PALETTE.length]} />
                ))}
              </Bar>
            </BarChart>
          )}
        </ResponsiveContainer>
      </div>
    </div>
  );
}
