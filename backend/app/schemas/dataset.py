from typing import Any, Dict, List, Optional
from pydantic import BaseModel, Field


class HealthResponse(BaseModel):
    status: str = "ok"
    service: str = "SochIQ API"
    version: str = "2.0.0"
    mode: str = "memory-only"
    groq_available: bool = False
    supabase_connected: bool = False


class ColumnSummary(BaseModel):
    name: str
    inferred_type: str
    missing_count: int
    missing_percentage: float
    unique_count: int
    is_empty: bool


class QualityMetrics(BaseModel):
    total_rows: int
    total_columns: int
    missing_cells: int
    missing_percentage: float
    duplicate_rows: int
    duplicate_percentage: float
    empty_columns: int
    cleanliness_score: float = Field(
        ...,
        description="Dataset health score 0-100 calculated as: 100 * (1 - (missing_cells + (duplicate_rows * cols)) / (rows * cols))"
    )
    column_audits: List[ColumnSummary]


class DatasetPreviewResponse(BaseModel):
    filename: str
    file_format: str
    row_count: int
    column_count: int
    columns: List[str]
    inferred_types: Dict[str, str]
    preview_rows: List[Dict[str, Any]]
    quality: QualityMetrics


class NumericSummary(BaseModel):
    count: int
    mean: Optional[float]
    median: Optional[float]
    std: Optional[float]
    min: Optional[float]
    max: Optional[float]
    q25: Optional[float]
    q75: Optional[float]
    iqr: Optional[float]
    skew: Optional[float]


class CategoricalSummary(BaseModel):
    count: int
    unique_count: int
    top_values: List[Dict[str, Any]]


class TemporalSummary(BaseModel):
    count: int
    min_date: Optional[str]
    max_date: Optional[str]
    duration_days: Optional[float]
    periodic_counts: Dict[str, int] = {}


class AnalyticsSummaryResponse(BaseModel):
    row_count: int
    column_count: int
    numeric_columns: Dict[str, NumericSummary]
    categorical_columns: Dict[str, CategoricalSummary]
    temporal_columns: Dict[str, TemporalSummary]


class ChartDataPoint(BaseModel):
    name: str
    value: float
    count: Optional[int] = None


class ChartSeries(BaseModel):
    chart_type: str  # bar, line, pie, histogram
    title: str
    x_axis: str
    y_axis: str
    data: List[Dict[str, Any]]


class ChartDataResponse(BaseModel):
    charts: List[ChartSeries]


class RuleInsight(BaseModel):
    id: str
    category: str  # quality, distribution, dominance, benchmark
    title: str
    description: str
    severity: str  # info, warning, success
    metric: Optional[str] = None


class RuleInsightsResponse(BaseModel):
    insights: List[RuleInsight]


class AIMetric(BaseModel):
    label: str
    value: Any
    unit: Optional[str] = None
    description: Optional[str] = None


class AISection(BaseModel):
    title: str
    content: str
    type: Optional[str] = "text"  # text, list, callout


class AITable(BaseModel):
    title: Optional[str] = None
    headers: List[str]
    rows: List[List[Any]]


class AIChart(BaseModel):
    chart_type: str  # bar, line, pie
    title: str
    data: List[Dict[str, Any]]
    x_key: Optional[str] = "name"
    y_key: Optional[str] = "value"


class StructuredAIResponse(BaseModel):
    response_type: str = "explanation"  # greeting, overview, analysis, comparison, data_quality, trend, explanation, error
    message: str
    sections: Optional[List[AISection]] = None
    metrics: Optional[List[AIMetric]] = None
    tables: Optional[List[AITable]] = None
    charts: Optional[List[AIChart]] = None
    suggestions: Optional[List[str]] = None
    raw_markdown: Optional[str] = None


class AIQueryRequest(BaseModel):
    question: str
    summary_context: Dict[str, Any]
    quality_context: Optional[Dict[str, Any]] = None


class AIQueryResponse(BaseModel):
    answer: str
    structured: Optional[StructuredAIResponse] = None
    model: str
    source: str = "groq"
    disclaimer: str = "Grounded on computed summary statistics. No raw data was transmitted to external servers."


class DatasetMetadataCreate(BaseModel):
    name: str
    original_filename: str
    file_format: str
    row_count: int
    column_count: int
    column_summary: List[Dict[str, Any]]


class DatasetMetadataResponse(BaseModel):
    id: str
    name: str
    original_filename: str
    file_format: str
    row_count: int
    column_count: int
    column_summary: List[Dict[str, Any]]
    created_at: str

