from typing import Dict, Any, List
import numpy as np
import pandas as pd
from app.schemas.dataset import (
    AnalyticsSummaryResponse,
    NumericSummary,
    CategoricalSummary,
    TemporalSummary,
    ChartDataResponse,
    ChartSeries
)
from app.services.quality.auditor import infer_semantic_type


def compute_descriptive_analytics(df: pd.DataFrame) -> AnalyticsSummaryResponse:
    """Computes descriptive statistical metrics across all columns in memory."""
    numeric_summaries: Dict[str, NumericSummary] = {}
    categorical_summaries: Dict[str, CategoricalSummary] = {}
    temporal_summaries: Dict[str, TemporalSummary] = {}

    for col in df.columns:
        series = df[col]
        sem_type = infer_semantic_type(series)

        if sem_type == "numeric":
            clean_num = pd.to_numeric(series, errors="coerce").dropna()
            if not clean_num.empty:
                q25 = float(clean_num.quantile(0.25))
                q75 = float(clean_num.quantile(0.75))
                iqr = float(q75 - q25)
                skew_val = float(clean_num.skew()) if len(clean_num) > 2 else 0.0

                numeric_summaries[col] = NumericSummary(
                    count=int(clean_num.count()),
                    mean=round(float(clean_num.mean()), 2),
                    median=round(float(clean_num.median()), 2),
                    std=round(float(clean_num.std()), 2) if len(clean_num) > 1 else 0.0,
                    min=round(float(clean_num.min()), 2),
                    max=round(float(clean_num.max()), 2),
                    q25=round(q25, 2),
                    q75=round(q75, 2),
                    iqr=round(iqr, 2),
                    skew=round(skew_val, 2) if not np.isnan(skew_val) else 0.0
                )

        elif sem_type == "datetime":
            clean_dates = pd.to_datetime(series, errors="coerce").dropna()
            if not clean_dates.empty:
                min_d = clean_dates.min()
                max_d = clean_dates.max()
                duration = float((max_d - min_d).days)

                # Periodic breakdown (monthly counts)
                periods = clean_dates.dt.to_period("M").value_counts().head(12)
                periodic_map = {str(k): int(v) for k, v in periods.items()}

                temporal_summaries[col] = TemporalSummary(
                    count=int(clean_dates.count()),
                    min_date=min_d.strftime("%Y-%m-%d"),
                    max_date=max_d.strftime("%Y-%m-%d"),
                    duration_days=duration,
                    periodic_counts=periodic_map
                )

        else:
            # Categorical / String / Boolean
            clean_cat = series.dropna().astype(str)
            if not clean_cat.empty:
                val_counts = clean_cat.value_counts().head(10)
                top_vals = [
                    {"label": str(val), "count": int(count), "percentage": round((count / len(clean_cat)) * 100, 1)}
                    for val, count in val_counts.items()
                ]

                categorical_summaries[col] = CategoricalSummary(
                    count=int(clean_cat.count()),
                    unique_count=int(clean_cat.nunique()),
                    top_values=top_vals
                )

    return AnalyticsSummaryResponse(
        row_count=len(df),
        column_count=len(df.columns),
        numeric_columns=numeric_summaries,
        categorical_columns=categorical_summaries,
        temporal_columns=temporal_summaries
    )


def generate_chart_payloads(df: pd.DataFrame) -> ChartDataResponse:
    """Generates structured, validated data series ready for Recharts rendering."""
    charts: List[ChartSeries] = []

    # 1. Categorical Bar Charts (Top categories)
    for col in df.columns:
        if infer_semantic_type(df[col]) == "string" and 2 <= df[col].nunique() <= 20:
            top_items = df[col].dropna().astype(str).value_counts().head(8)
            chart_data = [{"name": str(k), "value": int(v)} for k, v in top_items.items()]
            charts.append(ChartSeries(
                chart_type="bar",
                title=f"Distribution of {col}",
                x_axis=col,
                y_axis="Count",
                data=chart_data
            ))
            if len(charts) >= 2:
                break

    # 2. Numeric Histograms / Distribution
    for col in df.columns:
        if infer_semantic_type(df[col]) == "numeric":
            clean_num = pd.to_numeric(df[col], errors="coerce").dropna()
            if len(clean_num) > 10:
                counts, bin_edges = np.histogram(clean_num, bins=7)
                bin_data = []
                for i in range(len(counts)):
                    label = f"{bin_edges[i]:.1f}-{bin_edges[i+1]:.1f}"
                    bin_data.append({"name": label, "value": int(counts[i])})

                charts.append(ChartSeries(
                    chart_type="histogram",
                    title=f"Histogram: {col}",
                    x_axis="Interval",
                    y_axis="Frequency",
                    data=bin_data
                ))
            if len(charts) >= 4:
                break

    # 3. Categorical Proportions (Pie Chart)
    for col in df.columns:
        if infer_semantic_type(df[col]) in ["string", "boolean"] and 2 <= df[col].nunique() <= 6:
            proportions = df[col].dropna().astype(str).value_counts().head(5)
            pie_data = [{"name": str(k), "value": int(v)} for k, v in proportions.items()]
            charts.append(ChartSeries(
                chart_type="pie",
                title=f"Proportions of {col}",
                x_axis="Category",
                y_axis="Share",
                data=pie_data
            ))
            break

    # 4. Temporal Trend Line Chart (if date exists)
    date_col = next((c for c in df.columns if infer_semantic_type(df[c]) == "datetime"), None)
    num_col = next((c for c in df.columns if infer_semantic_type(df[c]) == "numeric"), None)

    if date_col:
        try:
            temp_df = df[[date_col]].copy()
            temp_df["parsed_date"] = pd.to_datetime(temp_df[date_col], errors="coerce")
            temp_df = temp_df.dropna()
            if num_col:
                temp_df["val"] = pd.to_numeric(df[num_col], errors="coerce")
                grouped = temp_df.groupby(temp_df["parsed_date"].dt.to_period("M"))["val"].mean().head(15)
                line_data = [{"name": str(p), "value": round(float(v), 2)} for p, v in grouped.items() if not np.isnan(v)]
                charts.append(ChartSeries(
                    chart_type="line",
                    title=f"Average {num_col} over Time",
                    x_axis="Date",
                    y_axis=f"Mean {num_col}",
                    data=line_data
                ))
            else:
                grouped = temp_df.groupby(temp_df["parsed_date"].dt.to_period("M")).size().head(15)
                line_data = [{"name": str(p), "value": int(v)} for p, v in grouped.items()]
                charts.append(ChartSeries(
                    chart_type="line",
                    title=f"Record Activity over Time",
                    x_axis="Date",
                    y_axis="Records",
                    data=line_data
                ))
        except Exception:
            pass

    return ChartDataResponse(charts=charts)


def between_range(val: int, low: int, high: int) -> bool:
    return low <= val <= high
