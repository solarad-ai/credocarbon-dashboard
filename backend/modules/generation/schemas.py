"""
Pydantic schemas for Generation Data API
"""
from pydantic import BaseModel, Field
from typing import Optional, List, Any, Dict
from datetime import datetime
from decimal import Decimal


# ============ File Upload Schemas ============

class FileUploadResponse(BaseModel):
    id: int
    original_filename: str
    mime_type: str
    file_size_bytes: int
    status: str
    detected_columns: Optional[List[Dict[str, Any]]] = None
    uploaded_at: datetime

    class Config:
        from_attributes = True


class ColumnInfo(BaseModel):
    name: str
    inferred_type: str  # datetime, numeric, string
    sample_values: List[Any]
    null_count: int = 0


class FilePreviewResponse(BaseModel):
    file_id: int
    filename: str
    columns: List[ColumnInfo]
    preview_rows: List[List[Any]]
    total_rows: int
    total_columns: int


# ============ Column Mapping Schemas ============

class DatasetMappingCreate(BaseModel):
    timestamp_column: str
    value_column: str
    unit: str = Field(..., pattern="^(kW|MW|kWh|MWh)$")
    value_semantics: str = Field(..., pattern="^(POWER|ENERGY_PER_INTERVAL)$")
    frequency_seconds: int = Field(..., gt=0)
    timezone: str = "UTC"
    timestamp_format: Optional[str] = None


class DatasetMappingResponse(BaseModel):
    id: int
    file_id: int
    timestamp_column: str
    value_column: str
    unit: str
    value_semantics: str
    frequency_seconds: int
    timezone: str
    created_at: datetime

    class Config:
        from_attributes = True


class MappingValidationResult(BaseModel):
    valid: bool
    warnings: List[str] = []
    errors: List[str] = []
    sample_conversion: Optional[Dict[str, Any]] = None
    detected_frequency: Optional[int] = None


# ============ Methodology Schemas ============

class MethodologyInfo(BaseModel):
    id: str
    registry: str
    name: str
    version: str
    applicable_project_types: List[str]
    min_capacity_mw: Optional[float] = None
    max_capacity_mw: Optional[float] = None
    description: Optional[str] = None


class MethodologyListResponse(BaseModel):
    methodologies: List[MethodologyInfo]


# ============ Grid Emission Factor Schemas ============

class GridEFInfo(BaseModel):
    country_code: str
    country_name: str
    region_code: Optional[str] = None
    region_name: Optional[str] = None
    combined_margin: Optional[float] = None
    operating_margin: Optional[float] = None
    build_margin: Optional[float] = None
    source_name: str
    data_year: int
    source_url: Optional[str] = None


class GridEFListResponse(BaseModel):
    emission_factors: List[GridEFInfo]


# ============ Credit Estimation Schemas ============

class EstimationRequest(BaseModel):
    project_id: int
    methodology_id: str
    country_code: str
    ef_value: Optional[float] = None  # Uses published if not provided
    period_start: Optional[datetime] = None
    period_end: Optional[datetime] = None
    additional_inputs: Optional[Dict[str, Any]] = None


class MonthlyBreakdown(BaseModel):
    month: str  # YYYY-MM format
    generation_mwh: float
    emission_reductions_tco2e: float


class AnnualBreakdown(BaseModel):
    vintage: int  # Year
    generation_mwh: float
    emission_reductions_tco2e: float


class EstimationResponse(BaseModel):
    id: int
    project_id: int
    methodology_id: str
    registry: str
    
    # Generation data
    total_generation_mwh: float
    
    # Emission reductions
    total_er_tco2e: float
    baseline_emissions_tco2e: float
    project_emissions_tco2e: float
    leakage_tco2e: float
    
    # Grid EF info
    country_code: str
    ef_value: float
    ef_source: Optional[str] = None
    ef_year: Optional[int] = None
    
    # Breakdowns
    monthly_breakdown: List[MonthlyBreakdown]
    annual_breakdown: List[AnnualBreakdown]
    
    # Metadata
    calculation_date: datetime
    assumptions: Optional[Dict[str, Any]] = None

    class Config:
        from_attributes = True


# ============ Processing Status ============

class ProcessingStatusResponse(BaseModel):
    file_id: int
    status: str
    progress_percent: Optional[int] = None
    rows_processed: Optional[int] = None
    total_rows: Optional[int] = None
    error_message: Optional[str] = None
