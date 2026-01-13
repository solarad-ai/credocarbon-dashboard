"""
Methodology Registry
Central registry for all available carbon credit methodologies
"""
from typing import Dict, List, Type, Optional
from .base import BaseMethodology


class MethodologyRegistry:
    """
    Singleton registry for managing carbon credit calculation methodologies.
    
    Usage:
        # Register a methodology
        @MethodologyRegistry.register
        class MyMethodology(BaseMethodology):
            ...
        
        # Get a methodology instance
        methodology = MethodologyRegistry.get("MY_METHODOLOGY_ID")
        
        # List methodologies for a project type
        methodologies = MethodologyRegistry.list_for_project_type("solar")
    """
    
    _methodologies: Dict[str, Type[BaseMethodology]] = {}
    _initialized: bool = False
    
    @classmethod
    def register(cls, methodology_class: Type[BaseMethodology]) -> Type[BaseMethodology]:
        """
        Decorator to register a methodology class.
        
        Args:
            methodology_class: Class inheriting from BaseMethodology
            
        Returns:
            The registered class (unchanged)
        """
        if not methodology_class.id:
            raise ValueError(f"Methodology class {methodology_class.__name__} must have an 'id' attribute")
        
        cls._methodologies[methodology_class.id] = methodology_class
        return methodology_class
    
    @classmethod
    def get(cls, methodology_id: str) -> BaseMethodology:
        """
        Get an instance of a registered methodology.
        
        Args:
            methodology_id: Unique identifier of the methodology
            
        Returns:
            Instance of the methodology class
            
        Raises:
            ValueError: If methodology_id is not registered
        """
        cls._ensure_initialized()
        
        if methodology_id not in cls._methodologies:
            available = ", ".join(cls._methodologies.keys())
            raise ValueError(
                f"Unknown methodology: {methodology_id}. "
                f"Available: {available}"
            )
        
        return cls._methodologies[methodology_id]()
    
    @classmethod
    def list_all(cls) -> List[Dict]:
        """
        List all registered methodologies.
        
        Returns:
            List of methodology info dictionaries
        """
        cls._ensure_initialized()
        
        return [
            cls._methodologies[m_id]().get_info()
            for m_id in sorted(cls._methodologies.keys())
        ]
    
    @classmethod
    def list_for_project_type(cls, project_type: str) -> List[Dict]:
        """
        List methodologies applicable for a given project type.
        
        Args:
            project_type: Type of project (solar, wind, hydro, biogas, etc.)
            
        Returns:
            List of applicable methodology info dictionaries
        """
        cls._ensure_initialized()
        
        result = []
        for m_id, m_class in cls._methodologies.items():
            instance = m_class()
            if project_type.lower() in [t.lower() for t in instance.applicable_project_types]:
                result.append(instance.get_info())
        
        return result
    
    @classmethod
    def list_for_registry(cls, registry: str) -> List[Dict]:
        """
        List methodologies for a specific registry.
        
        Args:
            registry: Registry name (CDM, VERRA, GOLD_STANDARD, GCC, etc.)
            
        Returns:
            List of methodology info dictionaries for that registry
        """
        cls._ensure_initialized()
        
        result = []
        for m_id, m_class in cls._methodologies.items():
            instance = m_class()
            if instance.registry.upper() == registry.upper():
                result.append(instance.get_info())
        
        return result
    
    @classmethod
    def get_ids(cls) -> List[str]:
        """Get all registered methodology IDs"""
        cls._ensure_initialized()
        return list(cls._methodologies.keys())
    
    @classmethod
    def _ensure_initialized(cls):
        """Ensure all methodology modules are imported"""
        if not cls._initialized:
            # Import all methodology modules to trigger registration
            from . import cdm_ams_id
            from . import cdm_acm0002
            from . import cdm_ams_iii_d
            from . import verra_am0123
            from . import gcc_gccm001
            from . import gold_standard
            cls._initialized = True
