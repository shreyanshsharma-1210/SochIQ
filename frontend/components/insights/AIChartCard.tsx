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

const PALETTE = ["#111111", "#FFDF00", "#777777", "#4A6B82", "#10B981", "#6366F1"];

interface AIChartCardProps {
  chart: AIChartItem;
}

export default function AIChartCard({ chart }: AIChartCardProps) {
  const xKey = chart.x_key || "name";
  const yKey = chart.y_key || "value";
  const data = chart.data || [];

  if (!data || data.length === 0) return null;

  return (
    <div className="my-3 p-4 rounded-xl bg-white border border-grey-border shadow-xs">
      <div className="flex items-center gap-2 mb-3">
        <BarChart3 className="w-4 h-4 text-charcoal shrink-0" />
        <h4 className="text-xs font-heading font-bold text-charcoal uppercase tracking-wider">{chart.title}</h4>
      </div>

      <div className="h-56 w-full">
        <ResponsiveContainer width="100%" height="100%">
          {chart.chart_type === "line" ? (
            <LineChart data={data} margin={{ top: 10, right: 10, left: -20, bottom: 20 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#EAEAEA" />
              <XAxis dataKey={xKey} tick={{ fontSize: 11, fill: "#777777" }} />
              <YAxis tick={{ fontSize: 11, fill: "#777777" }} />
              <Tooltip
                contentStyle={{
                  backgroundColor: "#FFFFFF",
                  borderColor: "#EAEAEA",
                  borderRadius: "8px",
                  fontSize: "12px",
                }}
              />
              <Line type="monotone" dataKey={yKey} stroke="#111111" strokeWidth={2} dot={{ fill: "#FFDF00", stroke: "#111111", r: 4 }} />
            </LineChart>
          ) : chart.chart_type === "pie" ? (
            <PieChart>
              <Tooltip
                contentStyle={{
                  backgroundColor: "#FFFFFF",
                  borderColor: "#EAEAEA",
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
              <CartesianGrid strokeDasharray="3 3" stroke="#EAEAEA" />
              <XAxis dataKey={xKey} tick={{ fontSize: 11, fill: "#777777" }} />
              <YAxis tick={{ fontSize: 11, fill: "#777777" }} />
              <Tooltip
                contentStyle={{
                  backgroundColor: "#FFFFFF",
                  borderColor: "#EAEAEA",
                  borderRadius: "8px",
                  fontSize: "12px",
                }}
              />
              <Bar dataKey={yKey} fill="#111111" radius={[4, 4, 0, 0]}>
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
