"""
Base Methodology Class
Abstract interface for all carbon credit calculation methodologies
"""
from abc import ABC, abstractmethod
from typing import Dict, List, Any, Optional
from dataclasses import dataclass, field


@dataclass
class MethodologyResult:
    """Standard result format for methodology calculations"""
    total_er_tco2e: float
    baseline_emissions_tco2e: float
    project_emissions_tco2e: float = 0.0
    leakage_tco2e: float = 0.0
    monthly_breakdown: List[Dict[str, Any]] = field(default_factory=list)
    annual_breakdown: List[Dict[str, Any]] = field(default_factory=list)
    assumptions: Dict[str, Any] = field(default_factory=dict)
    methodology_id: str = ""
    registry: str = ""


class BaseMethodology(ABC):
    """
    Abstract base class for carbon credit calculation methodologies.
    
    All methodology implementations must inherit from this class and implement
    the required abstract methods.
    """
    
    # Methodology identification (override in subclasses)
    id: str = ""
    registry: str = ""
    name: str = ""
    version: str = ""
    description: str = ""
    
    # Applicability constraints
    applicable_project_types: List[str] = []
    min_capacity_mw: Optional[float] = None
    max_capacity_mw: Optional[float] = None
    
    # Reference documents
    methodology_url: Optional[str] = None
    tool_references: List[str] = []
    
    @abstractmethod
    def required_inputs_schema(self) -> Dict[str, Any]:
        """
        Return JSON schema for required inputs.
        
        Returns:
            Dictionary with input field definitions including:
            - type: string, number, boolean, array, object
            - required: bool
            - description: str
            - enum: list of valid values (optional)
            - default: default value (optional)
        """
        pass
    
    @abstractmethod
    def validate_inputs(self, inputs: Dict[str, Any]) -> List[str]:
        """
        Validate inputs against methodology requirements.
        
        Args:
            inputs: Dictionary of input values
            
        Returns:
            List of validation error messages (empty if valid)
        """
        pass
    
    @abstractmethod
    def compute_emission_reductions(
        self,
        inputs: Dict[str, Any]
    ) -> MethodologyResult:
        """
        Calculate emission reductions using methodology formula.
        
        Args:
            inputs: Dictionary containing:
                - generation_mwh: Total energy generated (MWh)
                - ef_grid: Grid emission factor (tCO2/MWh)
                - project_type: Type of project
                - Additional methodology-specific inputs
                
        Returns:
            MethodologyResult with calculated emission reductions
        """
        pass
    
    def check_eligibility(self, inputs: Dict[str, Any]) -> Dict[str, Any]:
        """
        Check if project is eligible for this methodology.
        
        Args:
            inputs: Project parameters including capacity, type, etc.
            
        Returns:
            Dictionary with:
            - eligible: bool
            - reasons: list of eligibility issues (if not eligible)
        """
        issues = []
        
        # Check project type
        project_type = inputs.get("project_type", "")
        if project_type and project_type not in self.applicable_project_types:
            issues.append(
                f"Project type '{project_type}' not supported. "
                f"Eligible types: {', '.join(self.applicable_project_types)}"
            )
        
        # Check capacity limits
        capacity_mw = inputs.get("capacity_mw", 0)
        if self.min_capacity_mw is not None and capacity_mw < self.min_capacity_mw:
            issues.append(
                f"Capacity {capacity_mw} MW below minimum {self.min_capacity_mw} MW"
            )
        if self.max_capacity_mw is not None and capacity_mw > self.max_capacity_mw:
            issues.append(
                f"Capacity {capacity_mw} MW exceeds maximum {self.max_capacity_mw} MW"
            )
        
        return {
            "eligible": len(issues) == 0,
            "reasons": issues
        }
    
    def get_info(self) -> Dict[str, Any]:
        """Get methodology information for display"""
        return {
            "id": self.id,
            "registry": self.registry,
            "name": self.name,
            "version": self.version,
            "description": self.description,
            "applicable_project_types": self.applicable_project_types,
            "min_capacity_mw": self.min_capacity_mw,
            "max_capacity_mw": self.max_capacity_mw,
            "methodology_url": self.methodology_url,
            "tool_references": self.tool_references,
        }
