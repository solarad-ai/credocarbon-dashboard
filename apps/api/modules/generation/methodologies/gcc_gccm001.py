"""
GCC GCCM001: Grid-connected renewable energy generation

Global Carbon Council methodology for grid-connected renewable energy.

Reference: https://globalcarboncouncil.com/gcc-methodologies/
"""
from typing import Dict, List, Any
from .base import BaseMethodology, MethodologyResult
from .registry import MethodologyRegistry


@MethodologyRegistry.register
class GCC_GCCM001(BaseMethodology):
    """
    Global Carbon Council Methodology GCCM001
    
    Grid-connected renewable energy generation.
    
    Core Formula (same as CDM):
        ER_y = EG_pj,y × EF_grid,CM,y − PE_y − LE_y
    
    Where:
        - ER_y: Emission reductions in year y (tCO₂e)
        - EG_pj,y: Net electricity supplied to grid (MWh)
        - EF_grid,CM,y: Combined Margin grid emission factor (tCO₂/MWh)
        - PE_y: Project emissions
        - LE_y: Leakage emissions
    
    Features:
    - Based on CDM methodologies and tools
    - v4.0 includes Battery Energy Storage Systems (BESS)
    - Supports captive consumption
    - Primary market: MENA region
    """
    
    id = "GCC_GCCM001"
    registry = "GCC"
    name = "Grid-connected renewable energy generation"
    version = "4.0"
    description = (
        "Global Carbon Council methodology for grid-connected renewable energy projects. "
        "Supports solar PV, wind (onshore/offshore), tidal, and wave energy. "
        "Version 4.0 includes support for battery storage systems."
    )
    
    applicable_project_types = ["solar", "wind", "tidal", "wave"]
    
    methodology_url = "https://globalcarboncouncil.com/gcc-methodologies/"
    tool_references = ["TOOL07 (CDM)", "TOOL01 (CDM)"]
    
    # v4.0 feature
    supports_bess = True
    
    def required_inputs_schema(self) -> Dict[str, Any]:
        return {
            "generation_mwh": {
                "type": "number",
                "required": True,
                "description": "Net electricity generated and supplied to grid (MWh)"
            },
            "ef_grid": {
                "type": "number",
                "required": True,
                "description": "Grid emission factor (tCO₂/MWh)"
            },
            "project_type": {
                "type": "string",
                "required": True,
                "enum": self.applicable_project_types,
                "description": "Type of renewable energy project"
            },
            "capacity_mw": {
                "type": "number",
                "required": False,
                "description": "Installed capacity (MW)"
            },
            # BESS support (v4.0)
            "has_bess": {
                "type": "boolean",
                "required": False,
                "default": False,
                "description": "Whether project includes battery storage"
            },
            "bess_capacity_mwh": {
                "type": "number",
                "required": False,
                "description": "Battery storage capacity (MWh)"
            },
            # Captive consumption
            "captive_consumption_mwh": {
                "type": "number",
                "required": False,
                "default": 0,
                "description": "Electricity consumed on-site (MWh)"
            },
            # Project emissions
            "onsite_power_consumption_mwh": {
                "type": "number",
                "required": False,
                "default": 0,
                "description": "On-site power consumption from grid (MWh)"
            },
        }
    
    def validate_inputs(self, inputs: Dict[str, Any]) -> List[str]:
        errors = []
        
        # Check required fields
        if "generation_mwh" not in inputs:
            errors.append("generation_mwh is required")
        elif inputs["generation_mwh"] < 0:
            errors.append("generation_mwh must be non-negative")
        
        if "ef_grid" not in inputs:
            errors.append("ef_grid is required")
        elif inputs["ef_grid"] < 0:
            errors.append("ef_grid must be non-negative")
        
        # Check project type
        project_type = inputs.get("project_type", "")
        if project_type and project_type not in self.applicable_project_types:
            errors.append(f"Invalid project_type: {project_type}")
        
        # BESS validation
        if inputs.get("has_bess") and not inputs.get("bess_capacity_mwh"):
            errors.append("bess_capacity_mwh is required when has_bess is true")
        
        return errors
    
    def compute_emission_reductions(self, inputs: Dict[str, Any]) -> MethodologyResult:
        """
        Calculate emission reductions using GCCM001 formula.
        
        ER = EG × EF_grid - PE - LE
        """
        # Validate inputs
        errors = self.validate_inputs(inputs)
        if errors:
            raise ValueError(f"Invalid inputs: {'; '.join(errors)}")
        
        generation_mwh = float(inputs["generation_mwh"])
        ef_grid = float(inputs["ef_grid"])
        project_type = inputs.get("project_type", "solar")
        
        # Calculate baseline emissions
        baseline_emissions = generation_mwh * ef_grid
        
        # Calculate project emissions (on-site consumption)
        onsite_consumption = float(inputs.get("onsite_power_consumption_mwh", 0))
        project_emissions = onsite_consumption * ef_grid
        
        # Leakage (typically 0 for grid-connected RE)
        leakage = 0.0
        
        # Calculate emission reductions
        total_er = baseline_emissions - project_emissions - leakage
        
        # Build assumptions record
        assumptions = {
            "methodology": self.id,
            "version": self.version,
            "registry": self.registry,
            "formula": "ER = EG × EF_grid - PE - LE",
            "om_bm_weighting": "75% OM / 25% BM (solar/wind)",
            "based_on": "CDM methodologies and tools",
        }
        
        if inputs.get("has_bess"):
            assumptions["bess_included"] = True
            assumptions["bess_capacity_mwh"] = inputs.get("bess_capacity_mwh")
        
        captive = inputs.get("captive_consumption_mwh", 0)
        if captive > 0:
            assumptions["captive_consumption_mwh"] = captive
        
        return MethodologyResult(
            total_er_tco2e=round(total_er, 4),
            baseline_emissions_tco2e=round(baseline_emissions, 4),
            project_emissions_tco2e=round(project_emissions, 4),
            leakage_tco2e=leakage,
            assumptions=assumptions,
            methodology_id=self.id,
            registry=self.registry,
        )
