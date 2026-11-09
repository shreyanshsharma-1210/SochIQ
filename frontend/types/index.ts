export interface ColumnSummary {
  name: string;
  inferred_type: string;
  missing_count: number;
  missing_percentage: number;
  unique_count: number;
  is_empty: boolean;
}

export interface QualityMetrics {
  total_rows: number;
  total_columns: number;
  missing_cells: number;
  missing_percentage: number;
  duplicate_rows: number;
  duplicate_percentage: number;
  empty_columns: number;
  cleanliness_score: number;
  column_audits: ColumnSummary[];
}

export interface DatasetPreviewResponse {
  filename: string;
  file_format: string;
  row_count: number;
  column_count: number;
  columns: string[];
  inferred_types: Record<string, string>;
  preview_rows: Record<string, any>[];
  quality: QualityMetrics;
}

export interface NumericSummary {
  count: number;
  mean: number | null;
  median: number | null;
  std: number | null;
  min: number | null;
  max: number | null;
  q25: number | null;
  q75: number | null;
  iqr: number | null;
  skew: number | null;
}

export interface CategoricalSummary {
  count: number;
  unique_count: number;
  top_values: { label: string; count: number; percentage: number }[];
}

export interface TemporalSummary {
  count: number;
  min_date: string | null;
  max_date: string | null;
  duration_days: number | null;
  periodic_counts: Record<string, number>;
}

export interface AnalyticsSummaryResponse {
  row_count: number;
  column_count: number;
  numeric_columns: Record<string, NumericSummary>;
  categorical_columns: Record<string, CategoricalSummary>;
  temporal_columns: Record<string, TemporalSummary>;
}

export interface ChartSeries {
  chart_type: string;
  title: string;
  x_axis: string;
  y_axis: string;
  data: { name: string; value: number }[];
}

export interface ChartDataResponse {
  charts: ChartSeries[];
}

export interface RuleInsight {
  id: string;
  category: string;
  title: string;
  description: string;
  severity: "info" | "warning" | "success";
  metric?: string;
}

export interface RuleInsightsResponse {
  insights: RuleInsight[];
}

export interface DatasetMetadata {
  id: string;
  name: string;
  original_filename: string;
  file_format: string;
  row_count: number;
  column_count: number;
  column_summary: any;
  created_at: string;
  storage_path?: string;
  file_size_bytes?: number;
  status?: string;
}

export interface AnalysisRun {
  id: string;
  dataset_id: string;
  analysis_type: string;
  parameters: Record<string, any>;
  result_summary: Record<string, any>;
  created_at: string;
}

export interface SessionStatus {
  status: "active" | "expired" | "revoked";
  session_id: string;
  owner_id: string;
  created_at: string;
  last_activity_at: string;
  expires_at: string;
  remaining_seconds: number;
  dataset_count: number;
  analysis_count: number;
}


