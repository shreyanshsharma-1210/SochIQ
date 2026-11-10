"use client";

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
import { ChartSeries } from "@/types";

interface ChartViewerProps {
  charts: ChartSeries[];
}

// Modern, soft Yellow & Slate Grey palette (replaces harsh solid black)
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

export default function ChartViewer({ charts }: ChartViewerProps) {
  if (!charts || charts.length === 0) {
    return (
      <div className="sochiq-card p-8 text-center text-xs text-grey-muted">
        No automatic visual series could be generated for this dataset.
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {charts.map((chart, idx) => {
        const isHistogram = chart.chart_type === "histogram";
        const primaryColor = isHistogram ? "#64748B" : "#EAB308";

        return (
          <div key={idx} className="sochiq-card p-5 flex flex-col justify-between">
            <div className="mb-4">
              <h4 className="font-heading text-sm font-bold text-charcoal">{chart.title}</h4>
              <p className="text-xs font-mono text-grey-muted mt-0.5">
                {chart.x_axis} vs {chart.y_axis} ({chart.chart_type.toUpperCase()})
              </p>
            </div>

            <div className="w-full h-64">
              <ResponsiveContainer width="100%" height="100%">
                {chart.chart_type === "bar" || chart.chart_type === "histogram" ? (
                  <BarChart data={chart.data} margin={{ top: 10, right: 10, left: -20, bottom: 25 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" />
                    <XAxis
                      dataKey="name"
                      tick={{ fontSize: 11, fill: "#777777" }}
                      interval={0}
                      angle={-25}
                      textAnchor="end"
                      axisLine={{ stroke: "#EAEAEA" }}
                    />
                    <YAxis tick={{ fontSize: 11, fill: "#777777" }} axisLine={{ stroke: "#EAEAEA" }} />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: "#FFFFFF",
                        borderColor: "#EAEAEA",
                        borderRadius: "10px",
                        fontSize: "12px",
                        boxShadow: "0 4px 12px rgba(0,0,0,0.05)",
                      }}
                      itemStyle={{ color: "#374151", fontWeight: 600 }}
                      labelStyle={{ color: "#6B7280", fontWeight: 500 }}
                    />
                    <Bar dataKey="value" fill={primaryColor} radius={[6, 6, 0, 0]} />
                  </BarChart>
                ) : chart.chart_type === "line" ? (
                  <LineChart data={chart.data} margin={{ top: 10, right: 10, left: -20, bottom: 20 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" />
                    <XAxis dataKey="name" tick={{ fontSize: 11, fill: "#777777" }} axisLine={{ stroke: "#EAEAEA" }} />
                    <YAxis tick={{ fontSize: 11, fill: "#777777" }} axisLine={{ stroke: "#EAEAEA" }} />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: "#FFFFFF",
                        borderColor: "#EAEAEA",
                        borderRadius: "10px",
                        fontSize: "12px",
                        boxShadow: "0 4px 12px rgba(0,0,0,0.05)",
                      }}
                      itemStyle={{ color: "#374151", fontWeight: 600 }}
                      labelStyle={{ color: "#6B7280", fontWeight: 500 }}
                    />
                    <Line
                      type="monotone"
                      dataKey="value"
                      stroke="#EAB308"
                      strokeWidth={3}
                      dot={{ r: 4.5, fill: "#FFFFFF", stroke: "#EAB308", strokeWidth: 2 }}
                      activeDot={{ r: 6.5, fill: "#EAB308", stroke: "#FFFFFF", strokeWidth: 2 }}
                    />
                  </LineChart>
                ) : chart.chart_type === "pie" ? (
                  <PieChart>
                    <Tooltip
                      contentStyle={{
                        backgroundColor: "#FFFFFF",
                        borderColor: "#EAEAEA",
                        borderRadius: "10px",
                        fontSize: "12px",
                        boxShadow: "0 4px 12px rgba(0,0,0,0.05)",
                      }}
                      itemStyle={{ color: "#374151", fontWeight: 600 }}
                      labelStyle={{ color: "#6B7280", fontWeight: 500 }}
                    />
                    <Pie
                      data={chart.data}
                      dataKey="value"
                      nameKey="name"
                      cx="50%"
                      cy="50%"
                      outerRadius={80}
                      label={({ name, percent }) => `${name} (${(percent * 100).toFixed(0)}%)`}
                      labelLine={false}
                    >
                      {chart.data.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={PALETTE[index % PALETTE.length]} />
                      ))}
                    </Pie>
                  </PieChart>
                ) : (
                  <div />
                )}
              </ResponsiveContainer>
            </div>
          </div>
        );
      })}
    </div>
  );
}
