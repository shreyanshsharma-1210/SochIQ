export type AIResponseType =
  | "greeting"
  | "overview"
  | "analysis"
  | "comparison"
  | "data_quality"
  | "trend"
  | "explanation"
  | "error";

export interface AIMetricItem {
  label: string;
  value: string | number;
  unit?: string | null;
  description?: string | null;
}

export interface AISectionItem {
  title: string;
  content: string;
  type?: "text" | "list" | "callout";
}

export interface AITableItem {
  title?: string | null;
  headers: string[];
  rows: (string | number | boolean | null)[][];
}

export interface AIChartItem {
  chart_type: "bar" | "line" | "pie";
  title: string;
  data: Record<string, any>[];
  x_key?: string;
  y_key?: string;
}

export interface StructuredAIResponse {
  response_type: AIResponseType;
  message: string;
  sections?: AISectionItem[] | null;
  metrics?: AIMetricItem[] | null;
  tables?: AITableItem[] | null;
  charts?: AIChartItem[] | null;
  suggestions?: string[] | null;
  raw_markdown?: string | null;
}

export interface AIQueryResponse {
  answer: string;
  structured?: StructuredAIResponse | null;
  model: string;
  source: string;
  disclaimer: string;
}

export interface ChatMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
  structured?: StructuredAIResponse | null;
  timestamp: string;
}

