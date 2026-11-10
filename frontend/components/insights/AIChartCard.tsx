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

const PALETTE = [
  "#EAB308", // Golden Yellow (SochIQ Primary Accent)
  "#64748B", // Slate Grey
  "#F59E0B", // Warm Amber Yellow
  "#94A3B8", // Cool Slate Grey
  "#D97706", // Deep Ochre Yellow
  "#71717A", // Zinc Grey
  "#FACC15", // Bright Sunlight Yellow
  "#A1A1AA", // Soft Zinc Grey
];

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
              <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" />
              <XAxis dataKey={xKey} tick={{ fontSize: 11, fill: "#777777" }} axisLine={{ stroke: "#EAEAEA" }} />
              <YAxis tick={{ fontSize: 11, fill: "#777777" }} axisLine={{ stroke: "#EAEAEA" }} />
              <Tooltip
                contentStyle={{
                  backgroundColor: "#FFFFFF",
                  borderColor: "#EAEAEA",
                  borderRadius: "8px",
                  fontSize: "12px",
                }}
                itemStyle={{ color: "#374151", fontWeight: 600 }}
                labelStyle={{ color: "#6B7280", fontWeight: 500 }}
              />
              <Line
                type="monotone"
                dataKey={yKey}
                stroke="#EAB308"
                strokeWidth={2.5}
                dot={{ fill: "#FFFFFF", stroke: "#EAB308", strokeWidth: 2, r: 4 }}
                activeDot={{ fill: "#EAB308", stroke: "#FFFFFF", r: 6 }}
              />
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
                itemStyle={{ color: "#374151", fontWeight: 600 }}
                labelStyle={{ color: "#6B7280", fontWeight: 500 }}
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
              <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" />
              <XAxis dataKey={xKey} tick={{ fontSize: 11, fill: "#777777" }} axisLine={{ stroke: "#EAEAEA" }} />
              <YAxis tick={{ fontSize: 11, fill: "#777777" }} axisLine={{ stroke: "#EAEAEA" }} />
              <Tooltip
                contentStyle={{
                  backgroundColor: "#FFFFFF",
                  borderColor: "#EAEAEA",
                  borderRadius: "8px",
                  fontSize: "12px",
                }}
                itemStyle={{ color: "#374151", fontWeight: 600 }}
                labelStyle={{ color: "#6B7280", fontWeight: 500 }}
              />
              <Bar dataKey={yKey} fill="#EAB308" radius={[4, 4, 0, 0]}>
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
