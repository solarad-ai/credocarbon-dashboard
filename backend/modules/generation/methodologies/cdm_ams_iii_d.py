"""
CDM AMS-III.D: Methane recovery in animal manure management systems

Applicable to biogas projects recovering methane from livestock manure.

Reference: https://cdm.unfccc.int/methodologies/DB/
"""
from typing import Dict, List, Any
from .base import BaseMethodology, MethodologyResult
from .registry import MethodologyRegistry


@MethodologyRegistry.register
class CDM_AMS_III_D(BaseMethodology):
    """
    CDM Small-Scale Methodology AMS-III.D
    
    Methane recovery in animal manure management systems.
    
    Core Formula:
        ER_y = BE_y − PE_y − LE_y
        BE_y = MD_baseline,y × GWP_CH4
    
    Where:
        - ER_y: Emission reductions in year y (tCO₂e)
        - BE_y: Baseline emissions (methane that would have been released)
        - MD_baseline,y: Methane that would have been released (tonnes CH4)
        - GWP_CH4: Global Warming Potential of methane = 28 (IPCC AR5)
        - PE_y: Project emissions (leakage, flaring inefficiency, power)
        - LE_y: Leakage emissions
    
    GWP of CH4 = 28 tCO2e/tCH4 (100-year, IPCC AR5)
    """
    
    id = "CDM_AMS_III_D"
    registry = "CDM"
    name = "Methane recovery in animal manure management systems"
    version = "22.0"
    description = (
        "Applies to projects that recover and destroy/utilize methane from "
        "animal manure management systems. Includes anaerobic digesters, "
        "covered lagoons, and biogas capture systems."
    )
    
    applicable_project_types = ["biogas"]
    
    # Constants
    GWP_CH4 = 28  # Global Warming Potential (100-year, IPCC AR5)
    CH4_DENSITY = 0.000717  # tonnes/m³ at STP
    
    methodology_url = "https://cdm.unfccc.int/methodologies/DB/"
    tool_references = ["TOOL03", "Project and leakage emissions from anaerobic digesters"]
    
    def required_inputs_schema(self) -> Dict[str, Any]:
        return {
            "biogas_captured_m3": {
                "type": "number",
                "required": True,
                "description": "Total biogas captured (m³)"
            },
            "methane_fraction": {
                "type": "number",
                "required": False,
                "default": 0.60,
                "description": "Methane fraction in biogas (0-1, typically 0.55-0.65)"
            },
            "biogas_utilization": {
                "type": "string",
                "required": True,
                "enum": ["flared", "electricity", "heat", "upgraded", "combined"],
                "description": "How captured biogas is utilized"
            },
            "electricity_generated_mwh": {
                "type": "number",
                "required": False,
                "description": "Electricity generated from biogas (MWh)"
            },
            "livestock_type": {
                "type": "string",
                "required": False,
                "enum": ["cattle", "swine", "poultry", "mixed"],
                "description": "Type of livestock"
            },
            "livestock_count": {
                "type": "number",
                "required": False,
                "description": "Number of animals"
            },
            "flare_efficiency": {
                "type": "number",
                "required": False,
                "default": 0.98,
                "description": "Flare destruction efficiency (0-1)"
            },
            "physical_leakage_fraction": {
                "type": "number",
                "required": False,
                "default": 0.05,
                "description": "Physical leakage fraction from system (0-1)"
            },
            "average_temperature_c": {
                "type": "number",
                "required": False,
                "description": "Annual average temperature (°C)"
            },
        }
    
    def validate_inputs(self, inputs: Dict[str, Any]) -> List[str]:
        errors = []
        
        # Check required fields
        if "biogas_captured_m3" not in inputs:
            errors.append("biogas_captured_m3 is required")
        elif inputs["biogas_captured_m3"] < 0:
            errors.append("biogas_captured_m3 must be non-negative")
        
        if "biogas_utilization" not in inputs:
            errors.append("biogas_utilization is required")
        
        # Check methane fraction
        ch4_fraction = inputs.get("methane_fraction", 0.60)
        if not (0 < ch4_fraction <= 1):
            errors.append("methane_fraction must be between 0 and 1")
        
        # Temperature check (must be > 5°C for eligibility)
        temp = inputs.get("average_temperature_c")
        if temp is not None and temp <= 5:
            errors.append(
                "AMS-III.D requires annual average temperature > 5°C for eligibility"
            )
        
        return errors
    
    def compute_emission_reductions(self, inputs: Dict[str, Any]) -> MethodologyResult:
        """
        Calculate emission reductions using AMS-III.D formula.
        
        ER = BE - PE - LE
        BE = CH4_captured × GWP_CH4
        """
        # Validate inputs
        errors = self.validate_inputs(inputs)
        if errors:
            raise ValueError(f"Invalid inputs: {'; '.join(errors)}")
        
        biogas_m3 = float(inputs["biogas_captured_m3"])
        ch4_fraction = float(inputs.get("methane_fraction", 0.60))
        utilization = inputs.get("biogas_utilization", "flared")
        
        # Calculate methane captured (tonnes)
        ch4_captured_tonnes = biogas_m3 * ch4_fraction * self.CH4_DENSITY
        
        # Calculate baseline emissions (methane that would have been released)
        baseline_emissions = ch4_captured_tonnes * self.GWP_CH4
        
        # Calculate project emissions
        project_emissions = self._calculate_project_emissions(inputs, ch4_captured_tonnes)
        
        # Calculate leakage (typically 0 for on-site systems)
        leakage = 0.0
        
        # Calculate emission reductions
        total_er = baseline_emissions - project_emissions - leakage
        
        # Build assumptions record
        assumptions = {
            "methodology": self.id,
            "version": self.version,
            "formula": "ER = CH4_captured × GWP - PE - LE",
            "gwp_ch4": self.GWP_CH4,
            "gwp_source": "IPCC AR5 (100-year)",
            "ch4_density_tonnes_per_m3": self.CH4_DENSITY,
            "methane_fraction_used": ch4_fraction,
            "biogas_utilization": utilization,
            "ch4_captured_tonnes": round(ch4_captured_tonnes, 4),
        }
        
        return MethodologyResult(
            total_er_tco2e=round(total_er, 4),
            baseline_emissions_tco2e=round(baseline_emissions, 4),
            project_emissions_tco2e=round(project_emissions, 4),
            leakage_tco2e=leakage,
            assumptions=assumptions,
            methodology_id=self.id,
            registry=self.registry,
        )
    
    def _calculate_project_emissions(
        self, 
        inputs: Dict[str, Any],
        ch4_captured_tonnes: float
    ) -> float:
        """
        Calculate project emissions from various sources.
        
        PE = PE_leakage + PE_flare + PE_power + PE_storage
        """
        project_emissions = 0.0
        
        # 1. Physical leakage from system
        leakage_fraction = float(inputs.get("physical_leakage_fraction", 0.05))
        pe_leakage = ch4_captured_tonnes * leakage_fraction * self.GWP_CH4
        project_emissions += pe_leakage
        
        # 2. Flaring inefficiency (if flared)
        utilization = inputs.get("biogas_utilization", "flared")
        if utilization in ["flared", "combined"]:
            flare_efficiency = float(inputs.get("flare_efficiency", 0.98))
            # Methane that escapes flaring
            unburned_fraction = 1 - flare_efficiency
            pe_flare = ch4_captured_tonnes * (1 - leakage_fraction) * unburned_fraction * self.GWP_CH4
            project_emissions += pe_flare
        
        # 3. Electricity consumption for project operation
        # (Could add if electricity consumption data is provided)
        
        return project_emissions
