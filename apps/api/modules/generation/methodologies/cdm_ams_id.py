"""
CDM AMS-I.D: Grid-connected renewable electricity generation (small-scale)

Applicable to renewable energy projects ≤ 15 MW supplying electricity to the grid.

Reference: https://cdm.unfccc.int/methodologies/DB/GNFWB3Y5IZGG3SHZTJYF8OPHXOGW3U
"""
from typing import Dict, List, Any
from .base import BaseMethodology, MethodologyResult
from .registry import MethodologyRegistry


@MethodologyRegistry.register
class CDM_AMS_ID(BaseMethodology):
    """
    CDM Small-Scale Methodology AMS-I.D
    
    Grid-connected renewable electricity generation for projects ≤ 15 MW.
    
    Core Formula:
        ER_y = EG_pj,y × EF_grid,y − PE_y − LE_y
    
    Where:
        - ER_y: Emission reductions in year y (tCO₂e)
        - EG_pj,y: Net electricity supplied to grid (MWh)
        - EF_grid,y: Grid emission factor (tCO₂/MWh)
        - PE_y: Project emissions (typically 0 for solar/wind)
        - LE_y: Leakage emissions (typically 0 for grid-connected)
    
    OM/BM Weighting: 75% OM / 25% BM for solar and wind
    """
    
    id = "CDM_AMS_ID"
    registry = "CDM"
    name = "Grid-connected renewable electricity generation (small-scale)"
    version = "19.0"
    description = (
        "Applies to renewable energy projects up to 15 MW capacity that supply "
        "electricity to a national or regional grid. Covers solar PV, wind, "
        "hydro (run-of-river), geothermal, and tidal/wave power."
    )
    
    applicable_project_types = ["solar", "wind", "hydro", "geothermal", "tidal", "wave"]
    max_capacity_mw = 15.0
    
    methodology_url = "https://cdm.unfccc.int/methodologies/DB/GNFWB3Y5IZGG3SHZTJYF8OPHXOGW3U"
    tool_references = ["TOOL07", "TOOL01"]
    
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
            # Hydro-specific
            "hydro_type": {
                "type": "string",
                "required": False,
                "enum": ["run_of_river", "reservoir", "pumped_storage"],
                "description": "Type of hydro project (required for hydro)"
            },
            "power_density": {
                "type": "number",
                "required": False,
                "description": "Power density for reservoir projects (W/m²)"
            }
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
        
        # Check capacity limit
        capacity = inputs.get("capacity_mw", 0)
        if capacity > self.max_capacity_mw:
            errors.append(
                f"Capacity {capacity} MW exceeds AMS-I.D limit of {self.max_capacity_mw} MW. "
                "Use ACM0002 for large-scale projects."
            )
        
        # Hydro-specific validation
        if project_type == "hydro":
            hydro_type = inputs.get("hydro_type")
            if hydro_type in ["reservoir"] and inputs.get("power_density", 0) <= 4:
                errors.append(
                    "Reservoir hydro projects require power density > 4 W/m² for eligibility"
                )
        
        return errors
    
    def compute_emission_reductions(self, inputs: Dict[str, Any]) -> MethodologyResult:
        """
        Calculate emission reductions using AMS-I.D formula.
        
        ER_y = EG × EF_grid - PE - LE
        
        For solar/wind: PE = 0, LE = 0
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
        
        # Project emissions (typically 0 for solar/wind)
        # Could include on-site fossil fuel consumption if any
        project_emissions = 0.0
        
        # Leakage emissions (typically 0 for grid-connected RE)
        leakage = 0.0
        
        # Calculate emission reductions
        total_er = baseline_emissions - project_emissions - leakage
        
        # Build assumptions record
        assumptions = {
            "methodology": self.id,
            "version": self.version,
            "formula": "ER = EG × EF_grid - PE - LE",
            "project_emissions_assumption": "Zero direct emissions for renewable generation",
            "leakage_assumption": "No leakage for grid-connected renewable electricity",
            "om_bm_weighting": "75% OM / 25% BM" if project_type in ["solar", "wind"] else "50% OM / 50% BM",
        }
        
        return MethodologyResult(
            total_er_tco2e=round(total_er, 4),
            baseline_emissions_tco2e=round(baseline_emissions, 4),
            project_emissions_tco2e=project_emissions,
            leakage_tco2e=leakage,
            assumptions=assumptions,
            methodology_id=self.id,
            registry=self.registry,
        )
