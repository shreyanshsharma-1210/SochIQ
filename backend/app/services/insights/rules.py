from typing import List
import numpy as np
import pandas as pd
from app.schemas.dataset import RuleInsight, RuleInsightsResponse
from app.services.quality.auditor import infer_semantic_type


def generate_rule_based_insights(df: pd.DataFrame) -> RuleInsightsResponse:
    """
    Evaluates in-memory dataset against deterministic statistical heuristics:
    - Dominant categories (>50% frequency)
    - High outlier prevalence (IQR rule)
    - Skewness observations
    - High missing data ratios
    - Top performing entity
    """
    insights: List[RuleInsight] = []
    total_rows = len(df)
    if total_rows == 0:
        return RuleInsightsResponse(insights=[])

    # 1. High Missing Data Alert
    for col in df.columns:
        null_count = df[col].isnull().sum()
        pct = (null_count / total_rows) * 100
        if pct > 20:
            insights.append(RuleInsight(
                id=f"missing_{col}",
                category="quality",
                title=f"Significant Incompleteness in '{col}'",
                description=f"Column '{col}' has {pct:.1f}% missing values ({null_count:,} blank cells). Consider imputation or cleaning before critical modeling.",
                severity="warning",
                metric=f"{pct:.1f}% Nulls"
            ))

    # 2. Dominant Category Detection
    for col in df.columns:
        if infer_semantic_type(df[col]) in ["string", "boolean"]:
            counts = df[col].dropna().value_counts()
            if not counts.empty:
                top_item = counts.index[0]
                top_pct = (counts.iloc[0] / len(df[col].dropna())) * 100
                if top_pct > 50 and len(counts) > 1:
                    insights.append(RuleInsight(
                        id=f"dom_{col}",
                        category="dominance",
                        title=f"Category Concentration in '{col}'",
                        description=f"Value '{top_item}' represents {top_pct:.1f}% of all records in column '{col}', indicating potential sample skew.",
                        severity="info",
                        metric=f"{top_pct:.1f}% share"
                    ))

    # 3. High Outlier Ratio via IQR
    for col in df.columns:
        if infer_semantic_type(df[col]) == "numeric":
            clean_num = pd.to_numeric(df[col], errors="coerce").dropna()
            if len(clean_num) > 20:
                q25 = clean_num.quantile(0.25)
                q75 = clean_num.quantile(0.75)
                iqr = q75 - q25
                if iqr > 0:
                    outliers = clean_num[(clean_num < (q25 - 1.5 * iqr)) | (clean_num > (q75 + 1.5 * iqr))]
                    outlier_pct = (len(outliers) / len(clean_num)) * 100
                    if outlier_pct > 5.0:
                        insights.append(RuleInsight(
                            id=f"outlier_{col}",
                            category="distribution",
                            title=f"Extreme Variance in '{col}'",
                            description=f"Detected {len(outliers):,} statistical outliers ({outlier_pct:.1f}% of values) beyond 1.5x IQR in '{col}'.",
                            severity="warning",
                            metric=f"{outlier_pct:.1f}% Outliers"
                        ))

    # 4. Top Performer Benchmark
    cat_cols = [c for c in df.columns if infer_semantic_type(df[c]) == "string" and 2 <= df[c].nunique() <= 30]
    num_cols = [c for c in df.columns if infer_semantic_type(df[c]) == "numeric"]

    if cat_cols and num_cols:
        primary_cat = cat_cols[0]
        primary_num = num_cols[0]
        try:
            grouped = df.groupby(primary_cat)[primary_num].sum().sort_values(ascending=False)
            if not grouped.empty:
                leader = grouped.index[0]
                leader_val = grouped.iloc[0]
                total_val = grouped.sum()
                share = (leader_val / total_val * 100) if total_val > 0 else 0
                insights.append(RuleInsight(
                    id=f"bench_{primary_cat}",
                    category="benchmark",
                    title=f"Leading Contributor: {primary_cat}",
                    description=f"'{leader}' leads '{primary_cat}' generating {leader_val:,.1f} in total {primary_num} ({share:.1f}% share).",
                    severity="success",
                    metric=f"{share:.1f}% share"
                ))
        except Exception:
            pass

    # 5. Perfect Hygiene Insight
    if len(insights) == 0:
        insights.append(RuleInsight(
            id="hygiene_clean",
            category="quality",
            title="Balanced & Consistent Dataset Structure",
            description="No significant data-quality red flags, extreme dominance, or excessive outliers were detected in this dataset.",
            severity="success",
            metric="Optimal Quality"
        ))

    return RuleInsightsResponse(insights=insights)

