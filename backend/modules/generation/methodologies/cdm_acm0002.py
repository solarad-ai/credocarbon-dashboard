"""
CDM ACM0002: Grid-connected electricity generation from renewable sources (large-scale)

Applicable to renewable energy projects > 15 MW supplying electricity to the grid.

Reference: https://cdm.unfccc.int/methodologies/DB/N8QWQBT0TP7HQV8W6YWSWGEO4FTRDT
"""
from typing import Dict, List, Any
from .base import BaseMethodology, MethodologyResult
from .registry import MethodologyRegistry


@MethodologyRegistry.register
class CDM_ACM0002(BaseMethodology):
    """
    CDM Large-Scale Methodology ACM0002
    
    Grid-connected electricity generation from renewable sources for large-scale projects.
    
    Core Formula:
        ER_y = BE_y − PE_y − LE_y
        BE_y = EG_pj,y × EF_grid,CM,y
    
    Where:
        - ER_y: Emission reductions in year y (tCO₂e)
        - BE_y: Baseline emissions in year y (tCO₂e)
        - EG_pj,y: Net electricity supplied to grid (MWh)
        - EF_grid,CM,y: Combined Margin grid emission factor (tCO₂/MWh)
        - PE_y: Project emissions
        - LE_y: Leakage emissions
    
    Uses TOOL07 for grid emission factor calculation.
    """
    
    id = "CDM_ACM0002"
    registry = "CDM"
    name = "Grid-connected electricity generation from renewable sources"
    version = "21.0"
    description = (
        "Consolidated methodology for large-scale grid-connected renewable energy projects. "
        "Applies to solar PV, wind, hydro, geothermal, and renewable biomass projects "
        "with no capacity limit."
    )
    
    applicable_project_types = ["solar", "wind", "hydro", "geothermal", "biomass"]
    min_capacity_mw = 15.0  # Use AMS-I.D for smaller projects
    
    methodology_url = "https://cdm.unfccc.int/methodologies/DB/N8QWQBT0TP7HQV8W6YWSWGEO4FTRDT"
    tool_references = ["TOOL07", "TOOL01", "TOOL02", "TOOL03"]
    
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
                "description": "Combined Margin grid emission factor (tCO₂/MWh)"
            },
            "ef_type": {
                "type": "string",
                "required": False,
                "enum": ["CM", "BM", "OM"],
                "default": "CM",
                "description": "Type of emission factor used"
            },
            "project_type": {
                "type": "string",
                "required": True,
                "enum": self.applicable_project_types,
                "description": "Type of renewable energy project"
            },
            "capacity_mw": {
                "type": "number",
                "required": True,
                "description": "Installed capacity (MW)"
            },
            # Biomass-specific
            "biomass_type": {
                "type": "string",
                "required": False,
                "enum": ["agricultural_residue", "forestry", "dedicated_crops"],
                "description": "Type of biomass fuel (required for biomass projects)"
            },
            "biomass_sustainable": {
                "type": "boolean",
                "required": False,
                "default": True,
                "description": "Whether biomass is sustainably sourced"
            },
            # Project emissions inputs
            "auxiliary_power_mwh": {
                "type": "number",
                "required": False,
                "default": 0,
                "description": "Auxiliary power consumption from grid (MWh)"
            },
            "fossil_fuel_consumption_gj": {
                "type": "number",
                "required": False,
                "default": 0,
                "description": "Fossil fuel consumption for project operation (GJ)"
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
        
        if "capacity_mw" not in inputs:
            errors.append("capacity_mw is required")
        
        # Check project type
        project_type = inputs.get("project_type", "")
        if project_type and project_type not in self.applicable_project_types:
            errors.append(f"Invalid project_type: {project_type}")
        
        # Biomass sustainability check
        if project_type == "biomass" and not inputs.get("biomass_sustainable", True):
            errors.append("Biomass must be sustainably sourced for ACM0002 eligibility")
        
        return errors
    
    def compute_emission_reductions(self, inputs: Dict[str, Any]) -> MethodologyResult:
        """
        Calculate emission reductions using ACM0002 formula.
        
        ER = BE - PE - LE
        BE = EG × EF_grid
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
        
        # Calculate project emissions
        project_emissions = self._calculate_project_emissions(inputs)
        
        # Calculate leakage (typically 0 for most RE projects)
        leakage = self._calculate_leakage(inputs)
        
        # Calculate emission reductions
        total_er = baseline_emissions - project_emissions - leakage
        
        # Build assumptions record
        assumptions = {
            "methodology": self.id,
            "version": self.version,
            "formula": "ER = BE - PE - LE; BE = EG × EF_grid",
            "ef_type": inputs.get("ef_type", "CM"),
            "om_bm_weighting": "75% OM / 25% BM" if project_type in ["solar", "wind"] else "50% OM / 50% BM",
            "tool_references": self.tool_references,
        }
        
        if project_emissions > 0:
            assumptions["project_emissions_sources"] = "Auxiliary power and/or fossil fuel consumption"
        
        return MethodologyResult(
            total_er_tco2e=round(total_er, 4),
            baseline_emissions_tco2e=round(baseline_emissions, 4),
            project_emissions_tco2e=round(project_emissions, 4),
            leakage_tco2e=round(leakage, 4),
            assumptions=assumptions,
            methodology_id=self.id,
            registry=self.registry,
        )
    
    def _calculate_project_emissions(self, inputs: Dict[str, Any]) -> float:
        """
        Calculate project emissions from auxiliary consumption and fossil fuels.
        
        PE = PE_auxiliary + PE_fossil
        """
        project_emissions = 0.0
        
        # Auxiliary power consumption
        auxiliary_mwh = inputs.get("auxiliary_power_mwh", 0)
        if auxiliary_mwh > 0:
            ef_grid = inputs.get("ef_grid", 0)
            project_emissions += auxiliary_mwh * ef_grid
        
        # Fossil fuel consumption
        fossil_gj = inputs.get("fossil_fuel_consumption_gj", 0)
        if fossil_gj > 0:
            # Assume diesel/natural gas average EF of 0.074 tCO2/GJ
            ef_fossil = inputs.get("ef_fossil_fuel", 0.074)
            project_emissions += fossil_gj * ef_fossil
        
        return project_emissions
    
    def _calculate_leakage(self, inputs: Dict[str, Any]) -> float:
        """
        Calculate leakage emissions.
        
        For most grid-connected RE projects, leakage = 0.
        Could include upstream emissions for biomass if not accounted elsewhere.
        """
        # For now, assume no leakage for grid-connected RE
        return 0.0
