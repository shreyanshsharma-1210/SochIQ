from typing import Dict, List, Tuple
import numpy as np
import pandas as pd
from app.schemas.dataset import ColumnSummary, QualityMetrics


def infer_semantic_type(series: pd.Series) -> str:
    """Infers high-level semantic type: numeric, datetime, boolean, or string."""
    non_null = series.dropna()
    if non_null.empty:
        return "string"

    # Boolean check
    if pd.api.types.is_bool_dtype(series):
        return "boolean"
    if non_null.isin([True, False, 0, 1, "true", "false", "True", "False"]).all() and len(non_null.unique()) <= 2:
        return "boolean"

    # Numeric check
    if pd.api.types.is_numeric_dtype(series):
        return "numeric"

    # Datetime check (sample first 100 non-nulls)
    sample = non_null.head(100).astype(str)
    try:
        converted = pd.to_datetime(sample, errors="coerce", format="mixed")
        if converted.notnull().sum() / len(sample) > 0.8:
            return "datetime"
    except Exception:
        pass

    # Try converting strings to numeric
    try:
        numeric_test = pd.to_numeric(sample, errors="coerce")
        if numeric_test.notnull().sum() / len(sample) > 0.8:
            return "numeric"
    except Exception:
        pass

    return "string"


def audit_dataset_quality(df: pd.DataFrame) -> Tuple[QualityMetrics, Dict[str, str]]:
    """
    Performs comprehensive quality inspection on the in-memory DataFrame:
    - Missing cells per column and dataset
    - Duplicate row detection
    - Empty columns
    - Inferred data types
    - Cleanliness score (0-100)
    """
    total_rows = len(df)
    total_columns = len(df.columns)

    if total_rows == 0 or total_columns == 0:
        return QualityMetrics(
            total_rows=0,
            total_columns=0,
            missing_cells=0,
            missing_percentage=0.0,
            duplicate_rows=0,
            duplicate_percentage=0.0,
            empty_columns=0,
            cleanliness_score=100.0,
            column_audits=[]
        ), {}

    # Total missing cells
    missing_cells = int(df.isnull().sum().sum())
    total_cells = total_rows * total_columns
    missing_pct = round((missing_cells / total_cells) * 100, 2) if total_cells > 0 else 0.0

    # Duplicate rows
    duplicate_rows = int(df.duplicated().sum())
    duplicate_pct = round((duplicate_rows / total_rows) * 100, 2) if total_rows > 0 else 0.0

    # Per-column audit
    column_audits: List[ColumnSummary] = []
    inferred_types: Dict[str, str] = {}
    empty_columns_count = 0

    for col in df.columns:
        series = df[col]
        missing_count = int(series.isnull().sum())
        col_missing_pct = round((missing_count / total_rows) * 100, 2)
        unique_count = int(series.nunique(dropna=True))
        is_empty = missing_count == total_rows
        if is_empty:
            empty_columns_count += 1

        sem_type = infer_semantic_type(series)
        inferred_types[col] = sem_type

        column_audits.append(ColumnSummary(
            name=str(col),
            inferred_type=sem_type,
            missing_count=missing_count,
            missing_percentage=col_missing_pct,
            unique_count=unique_count,
            is_empty=is_empty
        ))

    # Cleanliness score calculation:
    # 100 * (1 - (missing_cells + (duplicate_rows * cols)) / (rows * cols))
    penalty_cells = missing_cells + (duplicate_rows * total_columns)
    cleanliness = max(0.0, min(100.0, round(100.0 * (1.0 - (penalty_cells / (total_cells * 1.5))), 1)))

    metrics = QualityMetrics(
        total_rows=total_rows,
        total_columns=total_columns,
        missing_cells=missing_cells,
        missing_percentage=missing_pct,
        duplicate_rows=duplicate_rows,
        duplicate_percentage=duplicate_pct,
        empty_columns=empty_columns_count,
        cleanliness_score=cleanliness,
        column_audits=column_audits
    )

    return metrics, inferred_types

