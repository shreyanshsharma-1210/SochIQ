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

const PALETTE = ["#9B681E", "#C99A3A", "#E9A23B", "#713B36", "#D97706", "#B45309", "#059669"];

export default function ChartViewer({ charts }: ChartViewerProps) {
  if (!charts || charts.length === 0) {
    return (
      <div className="diwali-card p-8 text-center text-text-muted">
        No automatic visual series could be generated for this dataset.
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {charts.map((chart, idx) => (
        <div key={idx} className="diwali-card p-5 flex flex-col justify-between">
          <div className="mb-4">
            <h4 className="font-serif text-base font-bold text-text">{chart.title}</h4>
            <p className="text-xs text-text-muted">
              {chart.x_axis} vs {chart.y_axis} ({chart.chart_type.toUpperCase()})
            </p>
          </div>

          <div className="w-full h-64">
            <ResponsiveContainer width="100%" height="100%">
              {chart.chart_type === "bar" || chart.chart_type === "histogram" ? (
                <BarChart data={chart.data} margin={{ top: 10, right: 10, left: -20, bottom: 20 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#EEE7D9" />
                  <XAxis dataKey="name" tick={{ fontSize: 11, fill: "#817B70" }} interval={0} angle={-25} textAnchor="end" />
                  <YAxis tick={{ fontSize: 11, fill: "#817B70" }} />
                  <Tooltip
                    contentStyle={{ backgroundColor: "#FFFFFF", borderColor: "#EEE7D9", borderRadius: "8px" }}
                  />
                  <Bar dataKey="value" fill="#9B681E" radius={[4, 4, 0, 0]} />
                </BarChart>
              ) : chart.chart_type === "line" ? (
                <LineChart data={chart.data} margin={{ top: 10, right: 10, left: -20, bottom: 20 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#EEE7D9" />
                  <XAxis dataKey="name" tick={{ fontSize: 11, fill: "#817B70" }} />
                  <YAxis tick={{ fontSize: 11, fill: "#817B70" }} />
                  <Tooltip
                    contentStyle={{ backgroundColor: "#FFFFFF", borderColor: "#EEE7D9", borderRadius: "8px" }}
                  />
                  <Line type="monotone" dataKey="value" stroke="#C99A3A" strokeWidth={2.5} dot={{ r: 4, fill: "#9B681E" }} />
                </LineChart>
              ) : chart.chart_type === "pie" ? (
                <PieChart>
                  <Tooltip
                    contentStyle={{ backgroundColor: "#FFFFFF", borderColor: "#EEE7D9", borderRadius: "8px" }}
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
      ))}
    </div>
  );
}

