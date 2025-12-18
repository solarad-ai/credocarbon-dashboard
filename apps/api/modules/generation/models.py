"""
Database models for Generation Data module
"""
from sqlalchemy import Column, Integer, String, DateTime, ForeignKey, Text, Numeric, Boolean, JSON
from sqlalchemy.orm import relationship
from datetime import datetime
from apps.api.core.database import Base


class UploadedFile(Base):
    """Stores metadata about uploaded generation data files"""
    __tablename__ = "uploaded_files"

    id = Column(Integer, primary_key=True, index=True)
    project_id = Column(Integer, ForeignKey("projects.id"), nullable=False)
    original_filename = Column(String(255), nullable=False)
    mime_type = Column(String(100), nullable=False)
    storage_uri = Column(Text, nullable=False)  # Local path
    file_size_bytes = Column(Integer, nullable=False)
    checksum = Column(String(64))  # SHA256
    row_count = Column(Integer)
    column_count = Column(Integer)
    detected_columns = Column(JSON)  # [{name, type, sample_values}]
    uploaded_by = Column(Integer, ForeignKey("users.id"))
    uploaded_at = Column(DateTime, default=datetime.utcnow)
    status = Column(String(20), default="pending")  # pending, parsed, mapped, processed, error
    error_message = Column(Text)

    # Relationships
    project = relationship("Project", backref="uploaded_files")
    mapping = relationship("DatasetMapping", back_populates="file", uselist=False)
    timeseries = relationship("GenerationTimeseries", back_populates="file")


class DatasetMapping(Base):
    """Stores user-defined column mapping configuration"""
    __tablename__ = "dataset_mappings"

    id = Column(Integer, primary_key=True, index=True)
    file_id = Column(Integer, ForeignKey("uploaded_files.id"), nullable=False)
    timestamp_column = Column(String(100), nullable=False)
    timestamp_format = Column(String(50))  # e.g., "YYYY-MM-DD HH:mm:ss"
    value_column = Column(String(100), nullable=False)
    unit = Column(String(10), nullable=False)  # kW, MW, kWh, MWh
    value_semantics = Column(String(20), nullable=False)  # POWER or ENERGY_PER_INTERVAL
    frequency_seconds = Column(Integer, nullable=False)  # 3600 for hourly, 86400 for daily
    timezone = Column(String(50), default="UTC")
    start_row = Column(Integer, default=1)  # Skip header rows
    missing_value_treatment = Column(String(20), default="interpolate")
    parse_warnings = Column(JSON, default=[])
    created_at = Column(DateTime, default=datetime.utcnow)

    # Relationships
    file = relationship("UploadedFile", back_populates="mapping")


class GenerationTimeseries(Base):
    """Canonical time-series storage (standardized to MWh)"""
    __tablename__ = "generation_timeseries"

    id = Column(Integer, primary_key=True, index=True)
    project_id = Column(Integer, ForeignKey("projects.id"), nullable=False)
    file_id = Column(Integer, ForeignKey("uploaded_files.id"))
    ts_utc = Column(DateTime, nullable=False, index=True)
    energy_mwh = Column(Numeric(12, 6), nullable=False)  # Canonical unit
    power_mw = Column(Numeric(12, 6))  # Derived if source was power
    quality_flag = Column(String(20), default="OK")  # OK, MISSING, OUTLIER, INTERPOLATED
    original_value = Column(Numeric(16, 6))  # Original value before conversion
    original_unit = Column(String(10))
    created_at = Column(DateTime, default=datetime.utcnow)

    # Relationships
    project = relationship("Project", backref="generation_data")
    file = relationship("UploadedFile", back_populates="timeseries")


class CreditEstimation(Base):
    """Stores results of credit calculations"""
    __tablename__ = "credit_estimations"

    id = Column(Integer, primary_key=True, index=True)
    project_id = Column(Integer, ForeignKey("projects.id"), nullable=False)
    methodology_id = Column(String(50), nullable=False)
    registry = Column(String(50), nullable=False)

    # Input parameters
    country_code = Column(String(2), nullable=False)
    grid_ef_value = Column(Numeric(8, 6), nullable=False)  # tCO2/MWh
    grid_ef_source = Column(String(255))
    grid_ef_year = Column(Integer)

    # Aggregated results
    total_generation_mwh = Column(Numeric(16, 4), nullable=False)
    total_er_tco2e = Column(Numeric(16, 4), nullable=False)
    baseline_emissions_tco2e = Column(Numeric(16, 4))
    project_emissions_tco2e = Column(Numeric(16, 4), default=0)
    leakage_tco2e = Column(Numeric(16, 4), default=0)

    # Breakdowns (stored as JSON for flexibility)
    monthly_breakdown = Column(JSON)
    annual_breakdown = Column(JSON)

    # Metadata
    calculation_date = Column(DateTime, default=datetime.utcnow)
    calculation_inputs = Column(JSON)  # All inputs used
    assumptions = Column(JSON)  # Methodology-specific assumptions

    # Period covered
    period_start = Column(DateTime)
    period_end = Column(DateTime)

    created_by = Column(Integer, ForeignKey("users.id"))

    # Relationships
    project = relationship("Project", backref="credit_estimations")


class GridEmissionFactor(Base):
    """Pre-loaded and user-added grid emission factors"""
    __tablename__ = "grid_emission_factors"

    id = Column(Integer, primary_key=True, index=True)
    country_code = Column(String(2), nullable=False, index=True)
    region_code = Column(String(50))  # For sub-national grids
    country_name = Column(String(100), nullable=False)
    region_name = Column(String(100))

    # Emission factor values (tCO2/MWh)
    combined_margin = Column(Numeric(8, 6))
    operating_margin = Column(Numeric(8, 6))
    build_margin = Column(Numeric(8, 6))
    simple_om = Column(Numeric(8, 6))
    average_ef = Column(Numeric(8, 6))

    # Source information
    source_name = Column(String(255), nullable=False)
    source_url = Column(Text)
    data_year = Column(Integer, nullable=False)
    publication_date = Column(DateTime)

    # Methodology used
    methodology_ref = Column(String(100))  # e.g., "TOOL07 v7.0"

    # Validity
    valid_from = Column(DateTime)
    valid_until = Column(DateTime)
    is_official = Column(Boolean, default=True)
    is_active = Column(Boolean, default=True)

    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
