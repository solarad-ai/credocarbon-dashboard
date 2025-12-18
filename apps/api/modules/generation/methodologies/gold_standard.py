"""
Gold Standard Renewable Energy

Gold Standard wrapper that uses CDM methodologies with additional SDG requirements.

Reference: https://globalgoals.goldstandard.org/standards/
"""
from typing import Dict, List, Any
from .base import BaseMethodology, MethodologyResult
from .registry import MethodologyRegistry
from .cdm_ams_id import CDM_AMS_ID
from .cdm_acm0002 import CDM_ACM0002


@MethodologyRegistry.register
class GoldStandard_RE(BaseMethodology):
    """
    Gold Standard Renewable Energy
    
    Gold Standard for the Global Goals uses approved CDM methodologies
    with additional requirements for:
    - Sustainable Development Goals (SDG) contributions
    - Stakeholder consultations
    - Do-no-harm safeguards
    
    Eligible CDM Methodologies:
    - AMS-I.D (small-scale grid RE)
    - ACM0002 (large-scale grid RE)
    - AMS-I.F (small-scale off-grid RE)
    - AMS-III.D (biogas)
    
    Core Formula (inherits from CDM methodology used):
        ER = EG × EF_grid - PE - LE
    """
    
    id = "GS_RE"
    registry = "GOLD_STANDARD"
    name = "Gold Standard Renewable Energy"
    version = "1.0"
    description = (
        "Gold Standard for the Global Goals renewable energy activities. "
        "Uses approved CDM methodologies with additional requirements for SDG impacts, "
        "stakeholder engagement, and environmental/social safeguards."
    )
    
    applicable_project_types = ["solar", "wind", "hydro", "geothermal", "biogas", "biomass"]
    
    methodology_url = "https://globalgoals.goldstandard.org/standards/431_V1.2_AR_Renewable-Energy-Activity-Requirements.pdf"
    tool_references = ["CDM AMS-I.D", "CDM ACM0002", "CDM AMS-III.D"]
    
    # SDG contributions (Gold Standard requirement)
    mandatory_sdgs = [7, 13]  # SDG 7: Clean Energy, SDG 13: Climate Action
    
    def required_inputs_schema(self) -> Dict[str, Any]:
        return {
            "generation_mwh": {
                "type": "number",
                "required": True,
                "description": "Net electricity generated (MWh)"
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
                "required": True,
                "description": "Installed capacity (MW)"
            },
            # Gold Standard specific
            "sdg_contributions": {
                "type": "array",
                "required": False,
                "default": [7, 13],
                "description": "List of SDG numbers the project contributes to"
            },
            "stakeholder_consultation_done": {
                "type": "boolean",
                "required": False,
                "default": False,
                "description": "Whether stakeholder consultation has been completed"
            },
            "safeguards_assessment_done": {
                "type": "boolean",
                "required": False,
                "default": False,
                "description": "Whether safeguards assessment has been completed"
            },
        }
    
    def validate_inputs(self, inputs: Dict[str, Any]) -> List[str]:
        errors = []
        
        # Basic validation
        if "generation_mwh" not in inputs:
            errors.append("generation_mwh is required")
        
        if "ef_grid" not in inputs:
            errors.append("ef_grid is required")
        
        if "capacity_mw" not in inputs:
            errors.append("capacity_mw is required")
        
        # Check project type
        project_type = inputs.get("project_type", "")
        if project_type and project_type not in self.applicable_project_types:
            errors.append(f"Invalid project_type: {project_type}")
        
        # Gold Standard specific: SDG contributions
        sdgs = inputs.get("sdg_contributions", [])
        if sdgs:
            for mandatory in self.mandatory_sdgs:
                if mandatory not in sdgs:
                    errors.append(f"SDG {mandatory} must be included in contributions")
        
        return errors
    
    def compute_emission_reductions(self, inputs: Dict[str, Any]) -> MethodologyResult:
        """
        Calculate emission reductions using appropriate CDM methodology.
        
        Gold Standard uses CDM methodologies as the calculation engine,
        adding additional requirements for SDGs and safeguards.
        """
        # Validate inputs
        errors = self.validate_inputs(inputs)
        if errors:
            raise ValueError(f"Invalid inputs: {'; '.join(errors)}")
        
        capacity_mw = float(inputs.get("capacity_mw", 0))
        project_type = inputs.get("project_type", "solar")
        
        # Determine which CDM methodology to use based on capacity
        if capacity_mw <= 15:
            underlying_methodology = CDM_AMS_ID()
        else:
            underlying_methodology = CDM_ACM0002()
        
        # Prepare inputs for underlying methodology
        cdm_inputs = {
            "generation_mwh": inputs["generation_mwh"],
            "ef_grid": inputs["ef_grid"],
            "project_type": project_type,
            "capacity_mw": capacity_mw,
        }
        
        # Calculate using CDM methodology
        result = underlying_methodology.compute_emission_reductions(cdm_inputs)
        
        # Update result with Gold Standard specific info
        result.methodology_id = self.id
        result.registry = self.registry
        
        # Add Gold Standard specific assumptions
        result.assumptions.update({
            "gold_standard_version": self.version,
            "underlying_cdm_methodology": underlying_methodology.id,
            "sdg_contributions": inputs.get("sdg_contributions", self.mandatory_sdgs),
            "stakeholder_consultation": inputs.get("stakeholder_consultation_done", False),
            "safeguards_assessment": inputs.get("safeguards_assessment_done", False),
        })
        
        return result
    
    def check_eligibility(self, inputs: Dict[str, Any]) -> Dict[str, Any]:
        """
        Check Gold Standard eligibility including SDG requirements.
        """
        issues = []
        
        # Run base eligibility check
        base_result = super().check_eligibility(inputs)
        issues.extend(base_result.get("reasons", []))
        
        # Gold Standard specific checks
        sdgs = inputs.get("sdg_contributions", [])
        if not sdgs or len(sdgs) < 2:
            issues.append("Gold Standard requires contribution to at least 2 SDGs")
        
        # Check if mandatory SDGs are included
        for mandatory in self.mandatory_sdgs:
            if mandatory not in sdgs:
                issues.append(f"Must contribute to SDG {mandatory}")
        
        # Stakeholder consultation warning
        if not inputs.get("stakeholder_consultation_done"):
            issues.append(
                "Warning: Stakeholder consultation must be completed before certification"
            )
        
        return {
            "eligible": len([i for i in issues if not i.startswith("Warning")]) == 0,
            "reasons": issues
        }
