import io
import json
import logging
from typing import Tuple, Dict, Any
import pandas as pd
from fastapi import HTTPException, UploadFile, status
from app.core.config import settings

logger = logging.getLogger(__name__)


def validate_file_size_and_read(file_bytes: bytes) -> bytes:
    """Ensures file does not exceed configured memory limit."""
    if len(file_bytes) > settings.max_upload_bytes:
        raise HTTPException(
            status_code=status.HTTP_413_REQUEST_ENTITY_TOO_LARGE,
            detail=f"File exceeds maximum upload limit of {settings.MAX_UPLOAD_SIZE_MB} MB."
        )
    if len(file_bytes) == 0:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail="The uploaded file is empty."
        )
    return file_bytes


def parse_csv_in_memory(file_bytes: bytes) -> pd.DataFrame:
    """
    Parses CSV in-memory with automatic encoding detection and delimiter sniffing.
    """
    encodings = ["utf-8", "utf-8-sig", "latin-1", "cp1252"]
    df = None
    last_err = None

    for enc in encodings:
        try:
            # Sniff delimiter from first 4KB
            sample = file_bytes[:4096].decode(enc, errors="ignore")
            sep = ","
            if sample.count(";") > sample.count(","):
                sep = ";"
            elif sample.count("\t") > sample.count(","):
                sep = "\t"
            elif sample.count("|") > sample.count(","):
                sep = "|"

            buffer = io.BytesIO(file_bytes)
            df = pd.read_csv(buffer, encoding=enc, sep=sep, on_bad_lines="skip")
            break
        except Exception as e:
            last_err = e
            continue

    if df is None or df.empty:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail=f"Unable to parse CSV file: {last_err or 'Invalid format or empty rows'}"
        )
    return df


def parse_excel_in_memory(file_bytes: bytes) -> pd.DataFrame:
    """
    Parses Excel (.xlsx) workbook safely in-memory using openpyxl.
    """
    try:
        buffer = io.BytesIO(file_bytes)
        # Read the first active worksheet
        df = pd.read_excel(buffer, engine="openpyxl")
        if df.empty:
            raise ValueError("Workbook contains no data records.")
        return df
    except Exception as e:
        logger.error(f"Excel parsing failure: {e}")
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail=f"Invalid or corrupted Excel workbook: {str(e)}"
        )


def parse_json_in_memory(file_bytes: bytes) -> pd.DataFrame:
    """
    Parses JSON records/array of objects into a normalized tabular dataframe.
    """
    try:
        raw_text = file_bytes.decode("utf-8")
        data = json.loads(raw_text)

        if isinstance(data, list):
            df = pd.json_normalize(data)
        elif isinstance(data, dict):
            # Try records orientation or find the first list of dicts
            list_key = next((k for k, v in data.items() if isinstance(v, list)), None)
            if list_key and len(data[list_key]) > 0 and isinstance(data[list_key][0], dict):
                df = pd.json_normalize(data[list_key])
            else:
                df = pd.DataFrame([data])
        else:
            raise ValueError("JSON content must be an array of objects or key-value dictionary.")

        if df.empty:
            raise ValueError("JSON file yielded an empty table.")
        return df
    except Exception as e:
        logger.error(f"JSON parsing error: {e}")
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail=f"Unable to parse JSON dataset: {str(e)}"
        )


def load_file_to_dataframe(filename: str, file_bytes: bytes) -> Tuple[pd.DataFrame, str]:
    """
    Orchestrates format detection and memory-only parsing into a Pandas DataFrame.
    Returns (DataFrame, file_format).
    """
    validate_file_size_and_read(file_bytes)
    ext = filename.lower().split(".")[-1] if "." in filename else ""

    if ext == "csv":
        df = parse_csv_in_memory(file_bytes)
        fmt = "csv"
    elif ext in ["xlsx", "xls"]:
        df = parse_excel_in_memory(file_bytes)
        fmt = "xlsx"
    elif ext == "json":
        df = parse_json_in_memory(file_bytes)
        fmt = "json"
    else:
        raise HTTPException(
            status_code=status.HTTP_415_UNSUPPORTED_MEDIA_TYPE,
            detail=f"Unsupported file format '.{ext}'. Supported formats are: CSV (.csv), Excel (.xlsx), and JSON (.json)."
        )

    # Standardize column names (strip whitespace, stringify)
    df.columns = [str(col).strip() for col in df.columns]

    return df, fmt

