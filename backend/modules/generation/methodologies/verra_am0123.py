"""
Verra VCS AM0123: Renewable energy generation for captive use

Applicable to renewable energy projects supplying electricity to captive consumers.

Reference: https://verra.org/methodologies/am0123-renewable-energy-generation-for-captive-use-v1-0/
"""
from typing import Dict, List, Any
from .base import BaseMethodology, MethodologyResult
from .registry import MethodologyRegistry


@MethodologyRegistry.register
class VERRA_AM0123(BaseMethodology):
    """
    Verra VCS Methodology AM0123
    
    Renewable energy generation for captive use.
    
    Core Formula:
        ER_y = BE_y − PE_y − LE_y
        BE_y = EG_captive,y × EF_baseline
    
    Where:
        - ER_y: Emission reductions in year y (tCO₂e)
        - EG_captive,y: Renewable electricity consumed by captive facility (MWh)
        - EF_baseline: Baseline emission factor (grid EF or fossil fuel EF)
        - PE_y: Project emissions
        - LE_y: Leakage emissions
    
    Applicable when:
    - Facility receives renewable electricity via dedicated line or grid wheeling
    - Displaces grid electricity or on-site fossil fuel generation
    """
    
    id = "VERRA_AM0123"
    registry = "VERRA"
    name = "Renewable energy generation for captive use"
    version = "1.0"
    description = (
        "Applies to project activities that generate renewable electricity for captive "
        "consumption at industrial, commercial, or residential facilities. The renewable "
        "energy plant may supply electricity directly via dedicated line or through "
        "the grid via wheeling arrangements."
    )
    
    applicable_project_types = ["solar", "wind", "hydro", "biomass"]
    
    methodology_url = "https://verra.org/methodologies/am0123-renewable-energy-generation-for-captive-use-v1-0/"
    tool_references = ["VT0011", "VT0010"]
    
    def required_inputs_schema(self) -> Dict[str, Any]:
        return {
            "captive_generation_mwh": {
                "type": "number",
                "required": True,
                "description": "Renewable electricity consumed by captive facility (MWh)"
            },
            "ef_baseline": {
                "type": "number",
                "required": True,
                "description": "Baseline emission factor (tCO₂/MWh)"
            },
            "baseline_type": {
                "type": "string",
                "required": True,
                "enum": ["grid", "fossil_fuel", "mixed"],
                "description": "Type of baseline being displaced"
            },
            "project_type": {
                "type": "string",
                "required": True,
                "enum": self.applicable_project_types,
                "description": "Type of renewable energy project"
            },
            "delivery_method": {
                "type": "string",
                "required": False,
                "enum": ["dedicated_line", "grid_wheeling", "on_site"],
                "description": "How electricity is delivered to captive consumer"
            },
            "wheeling_losses_percent": {
                "type": "number",
                "required": False,
                "default": 0,
                "description": "Grid wheeling transmission losses (%)"
            },
            # For fossil fuel baseline
            "fossil_fuel_type": {
                "type": "string",
                "required": False,
                "enum": ["diesel", "natural_gas", "coal", "hfo"],
                "description": "Type of fossil fuel being displaced (if applicable)"
            },
        }
    
    def validate_inputs(self, inputs: Dict[str, Any]) -> List[str]:
        errors = []
        
        # Check required fields
        if "captive_generation_mwh" not in inputs:
            errors.append("captive_generation_mwh is required")
        elif inputs["captive_generation_mwh"] < 0:
            errors.append("captive_generation_mwh must be non-negative")
        
        if "ef_baseline" not in inputs:
            errors.append("ef_baseline is required")
        elif inputs["ef_baseline"] < 0:
            errors.append("ef_baseline must be non-negative")
        
        if "baseline_type" not in inputs:
            errors.append("baseline_type is required")
        
        return errors
    
    def compute_emission_reductions(self, inputs: Dict[str, Any]) -> MethodologyResult:
        """
        Calculate emission reductions using AM0123 formula.
        
        ER = BE - PE - LE
        BE = EG_captive × EF_baseline
        """
        # Validate inputs
        errors = self.validate_inputs(inputs)
        if errors:
            raise ValueError(f"Invalid inputs: {'; '.join(errors)}")
        
        captive_mwh = float(inputs["captive_generation_mwh"])
        ef_baseline = float(inputs["ef_baseline"])
        baseline_type = inputs.get("baseline_type", "grid")
        
        # Account for wheeling losses if applicable
        wheeling_losses = float(inputs.get("wheeling_losses_percent", 0)) / 100
        effective_generation = captive_mwh * (1 - wheeling_losses)
        
        # Calculate baseline emissions
        baseline_emissions = effective_generation * ef_baseline
        
        # Project emissions (typically minimal for RE)
        project_emissions = 0.0
        
        # Leakage (typically 0 for captive use)
        leakage = 0.0
        
        # Calculate emission reductions
        total_er = baseline_emissions - project_emissions - leakage
        
        # Build assumptions record
        assumptions = {
            "methodology": self.id,
            "version": self.version,
            "formula": "ER = EG_captive × EF_baseline - PE - LE",
            "baseline_type": baseline_type,
            "delivery_method": inputs.get("delivery_method", "not_specified"),
            "wheeling_losses_applied": f"{wheeling_losses * 100:.1f}%",
            "effective_generation_mwh": round(effective_generation, 4),
        }
        
        if baseline_type == "fossil_fuel":
            assumptions["fossil_fuel_displaced"] = inputs.get("fossil_fuel_type", "not_specified")
        
        return MethodologyResult(
            total_er_tco2e=round(total_er, 4),
            baseline_emissions_tco2e=round(baseline_emissions, 4),
            project_emissions_tco2e=project_emissions,
            leakage_tco2e=leakage,
            assumptions=assumptions,
            methodology_id=self.id,
            registry=self.registry,
        )
