"""
Credit Calculator Service
Core calculation engine for carbon credit estimation
"""
from typing import List, Dict, Any, Optional
from datetime import datetime
from collections import defaultdict

from ..methodologies.registry import MethodologyRegistry
from ..methodologies.base import MethodologyResult
from ..grid_ef_database import get_grid_ef, GridEFData


class CreditCalculator:
    """
    Service for calculating carbon credit estimations.
    
    Usage:
        calculator = CreditCalculator("CDM_AMS_ID")
        result = calculator.calculate(
            generation_data=monthly_generation,
            country_code="IN",
            project_type="solar",
        )
    """
    
    def __init__(self, methodology_id: str):
        """
        Initialize calculator with a specific methodology.
        
        Args:
            methodology_id: ID of the methodology to use
        """
        self.methodology = MethodologyRegistry.get(methodology_id)
    
    def calculate(
        self,
        generation_data: List[Dict[str, Any]],
        country_code: str,
        project_type: str,
        ef_override: Optional[float] = None,
        region_code: Optional[str] = None,
        additional_inputs: Optional[Dict[str, Any]] = None
    ) -> Dict[str, Any]:
        """
        Calculate emission reductions from generation data.
        
        Args:
            generation_data: List of dicts with 'timestamp' and 'energy_mwh'
            country_code: ISO country code for grid EF lookup
            project_type: Type of renewable energy project
            ef_override: Optional manual EF value (overrides database lookup)
            region_code: Optional region code for sub-national grids
            additional_inputs: Additional methodology-specific inputs
            
        Returns:
            Dictionary with estimation results, breakdowns, and metadata
        """
        # Get grid emission factor
        if ef_override is not None:
            ef_grid = ef_override
            ef_source = "Manual override"
            ef_year = datetime.now().year
        else:
            ef_data = get_grid_ef(country_code, region_code)
            if not ef_data:
                raise ValueError(f"No emission factor data for country: {country_code}")
            ef_grid = ef_data.combined_margin
            ef_source = ef_data.source_name
            ef_year = ef_data.data_year
        
        # Calculate total generation
        total_generation = sum(item.get("energy_mwh", 0) for item in generation_data)
        
        # Prepare inputs for methodology with sensible defaults for all methodologies
        inputs = {
            "generation_mwh": total_generation,
            "ef_grid": ef_grid,
            "project_type": project_type,
            # Add default capacity for methodologies that require it (ACM0002, Gold Standard)
            "capacity_mw": additional_inputs.get("capacity_mw", 10) if additional_inputs else 10,
            # Defaults for VERRA AM0123 captive use methodology
            "captive_generation_mwh": additional_inputs.get("captive_generation_mwh", total_generation) if additional_inputs else total_generation,
            "ef_baseline": additional_inputs.get("ef_baseline", ef_grid) if additional_inputs else ef_grid,
            "baseline_type": additional_inputs.get("baseline_type", "grid") if additional_inputs else "grid",
            # Defaults for CDM AMS-III.D biogas methodology
            "biogas_captured_m3": additional_inputs.get("biogas_captured_m3", total_generation * 500) if additional_inputs else total_generation * 500,  # ~500 m3/MWh
            "biogas_utilization": additional_inputs.get("biogas_utilization", "electricity") if additional_inputs else "electricity",
            **(additional_inputs or {})
        }
        
        # Run methodology calculation
        result = self.methodology.compute_emission_reductions(inputs)
        
        # Calculate monthly breakdown
        monthly_breakdown = self._calculate_monthly_breakdown(generation_data, ef_grid)
        
        # Calculate annual breakdown
        annual_breakdown = self._calculate_annual_breakdown(generation_data, ef_grid)
        
        # Build comprehensive result
        return {
            "estimation_id": None,  # Will be set when saved to DB
            "project_type": project_type,
            "methodology_id": self.methodology.id,
            "registry": self.methodology.registry,
            
            # Generation data
            "total_generation_mwh": round(total_generation, 4),
            
            # Emission reductions
            "total_er_tco2e": result.total_er_tco2e,
            "baseline_emissions_tco2e": result.baseline_emissions_tco2e,
            "project_emissions_tco2e": result.project_emissions_tco2e,
            "leakage_tco2e": result.leakage_tco2e,
            
            # Grid EF info
            "country_code": country_code,
            "region_code": region_code,
            "ef_value": ef_grid,
            "ef_source": ef_source,
            "ef_year": ef_year,
            
            # Breakdowns
            "monthly_breakdown": monthly_breakdown,
            "annual_breakdown": annual_breakdown,
            
            # Metadata
            "calculation_date": datetime.utcnow().isoformat(),
            "assumptions": result.assumptions,
            "methodology_info": self.methodology.get_info(),
        }
    
    def calculate_simple(
        self,
        total_generation_mwh: float,
        country_code: str,
        project_type: str,
        ef_override: Optional[float] = None,
    ) -> Dict[str, Any]:
        """
        Simple calculation from total generation (no monthly breakdown).
        
        Args:
            total_generation_mwh: Total electricity generated (MWh)
            country_code: ISO country code
            project_type: Type of project
            ef_override: Optional manual EF value
            
        Returns:
            Dictionary with estimation results
        """
        generation_data = [
            {"timestamp": datetime.utcnow().isoformat(), "energy_mwh": total_generation_mwh}
        ]
        return self.calculate(
            generation_data=generation_data,
            country_code=country_code,
            project_type=project_type,
            ef_override=ef_override
        )
    
    def _calculate_monthly_breakdown(
        self,
        generation_data: List[Dict[str, Any]],
        ef_grid: float
    ) -> List[Dict[str, Any]]:
        """Calculate emission reductions by month."""
        monthly = defaultdict(float)
        
        for item in generation_data:
            ts = item.get("timestamp")
            if ts:
                if isinstance(ts, str):
                    ts = datetime.fromisoformat(ts.replace("Z", "+00:00"))
                key = ts.strftime("%Y-%m")
            else:
                # If no timestamp, use current month
                key = datetime.utcnow().strftime("%Y-%m")
            
            monthly[key] += item.get("energy_mwh", 0)
        
        return [
            {
                "month": month,
                "generation_mwh": round(gen, 4),
                "emission_reductions_tco2e": round(gen * ef_grid, 4)
            }
            for month, gen in sorted(monthly.items())
        ]
    
    def _calculate_annual_breakdown(
        self,
        generation_data: List[Dict[str, Any]],
        ef_grid: float
    ) -> List[Dict[str, Any]]:
        """Calculate emission reductions by year (vintage)."""
        annual = defaultdict(float)
        
        for item in generation_data:
            ts = item.get("timestamp")
            if ts:
                if isinstance(ts, str):
                    ts = datetime.fromisoformat(ts.replace("Z", "+00:00"))
                year = ts.year
            else:
                year = datetime.utcnow().year
            
            annual[year] += item.get("energy_mwh", 0)
        
        return [
            {
                "vintage": year,
                "generation_mwh": round(gen, 4),
                "emission_reductions_tco2e": round(gen * ef_grid, 4)
            }
            for year, gen in sorted(annual.items())
        ]


def quick_estimate(
    generation_mwh: float,
    country_code: str,
    project_type: str = "solar",
    methodology_id: str = "CDM_AMS_ID"
) -> float:
    """
    Quick estimation of carbon credits.
    
    Args:
        generation_mwh: Total electricity generated (MWh)
        country_code: ISO country code
        project_type: Type of project (default: solar)
        methodology_id: Methodology to use (default: CDM_AMS_ID)
        
    Returns:
        Estimated emission reductions (tCO2e)
    """
    calculator = CreditCalculator(methodology_id)
    result = calculator.calculate_simple(
        total_generation_mwh=generation_mwh,
        country_code=country_code,
        project_type=project_type
    )
    return result["total_er_tco2e"]
