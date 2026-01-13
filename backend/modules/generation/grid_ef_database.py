"""
Grid Emission Factor Database
Pre-loaded emission factors from official sources worldwide
"""

from typing import Dict, Optional, List
from dataclasses import dataclass


@dataclass
class GridEFData:
    """Grid Emission Factor data structure"""
    country_code: str
    country_name: str
    combined_margin: float  # tCO2/MWh
    operating_margin: Optional[float] = None
    build_margin: Optional[float] = None
    weighted_average: Optional[float] = None
    source_name: str = ""
    source_url: Optional[str] = None
    data_year: int = 2023
    region_code: Optional[str] = None
    region_name: Optional[str] = None


# Pre-loaded Grid Emission Factors from official sources
GRID_EMISSION_FACTORS: Dict[str, GridEFData] = {
    # ============ South Asia ============
    "IN": GridEFData(
        country_code="IN",
        country_name="India",
        combined_margin=0.757,
        operating_margin=0.825,
        build_margin=0.552,
        weighted_average=0.727,
        source_name="CEA CO2 Baseline Database v20.0",
        source_url="https://cea.nic.in/co2-baseline-database/",
        data_year=2024
    ),
    "PK": GridEFData(
        country_code="PK",
        country_name="Pakistan",
        combined_margin=0.485,
        source_name="NEPRA Annual Report 2023",
        data_year=2023
    ),
    "BD": GridEFData(
        country_code="BD",
        country_name="Bangladesh",
        combined_margin=0.583,
        source_name="SREDA",
        data_year=2023
    ),
    "LK": GridEFData(
        country_code="LK",
        country_name="Sri Lanka",
        combined_margin=0.547,
        source_name="Ceylon Electricity Board",
        data_year=2023
    ),
    "NP": GridEFData(
        country_code="NP",
        country_name="Nepal",
        combined_margin=0.0,  # Almost 100% hydro
        source_name="Nepal Electricity Authority",
        data_year=2023
    ),
    
    # ============ Southeast Asia ============
    "VN": GridEFData(
        country_code="VN",
        country_name="Vietnam",
        combined_margin=0.573,
        source_name="EVN Annual Report",
        data_year=2023
    ),
    "TH": GridEFData(
        country_code="TH",
        country_name="Thailand",
        combined_margin=0.466,
        source_name="EGAT",
        data_year=2023
    ),
    "ID": GridEFData(
        country_code="ID",
        country_name="Indonesia",
        combined_margin=0.844,
        source_name="PLN Statistics",
        data_year=2023
    ),
    "PH": GridEFData(
        country_code="PH",
        country_name="Philippines",
        combined_margin=0.569,
        source_name="DOE Philippines",
        data_year=2023
    ),
    "MY": GridEFData(
        country_code="MY",
        country_name="Malaysia",
        combined_margin=0.585,
        source_name="Energy Commission Malaysia",
        data_year=2023
    ),
    "SG": GridEFData(
        country_code="SG",
        country_name="Singapore",
        combined_margin=0.408,
        source_name="EMA Singapore",
        data_year=2023
    ),
    "MM": GridEFData(
        country_code="MM",
        country_name="Myanmar",
        combined_margin=0.432,
        source_name="MOEE Myanmar",
        data_year=2023
    ),
    "KH": GridEFData(
        country_code="KH",
        country_name="Cambodia",
        combined_margin=0.634,
        source_name="EDC Cambodia",
        data_year=2023
    ),
    
    # ============ East Asia ============
    "CN": GridEFData(
        country_code="CN",
        country_name="China",
        combined_margin=0.581,
        source_name="NDRC China",
        data_year=2023
    ),
    "JP": GridEFData(
        country_code="JP",
        country_name="Japan",
        combined_margin=0.453,
        source_name="MOE Japan",
        data_year=2023
    ),
    "KR": GridEFData(
        country_code="KR",
        country_name="South Korea",
        combined_margin=0.417,
        source_name="KPX",
        data_year=2023
    ),
    "TW": GridEFData(
        country_code="TW",
        country_name="Taiwan",
        combined_margin=0.495,
        source_name="Bureau of Energy Taiwan",
        data_year=2023
    ),
    "MN": GridEFData(
        country_code="MN",
        country_name="Mongolia",
        combined_margin=0.895,
        source_name="Energy Regulatory Commission of Mongolia",
        data_year=2023
    ),
    
    # ============ Middle East / MENA ============
    "AE": GridEFData(
        country_code="AE",
        country_name="United Arab Emirates",
        combined_margin=0.493,
        source_name="EAD UAE",
        data_year=2023
    ),
    "SA": GridEFData(
        country_code="SA",
        country_name="Saudi Arabia",
        combined_margin=0.640,
        source_name="ECRA",
        data_year=2023
    ),
    "EG": GridEFData(
        country_code="EG",
        country_name="Egypt",
        combined_margin=0.459,
        source_name="EEHC",
        data_year=2023
    ),
    "QA": GridEFData(
        country_code="QA",
        country_name="Qatar",
        combined_margin=0.493,
        source_name="Kahramaa",
        data_year=2023
    ),
    "KW": GridEFData(
        country_code="KW",
        country_name="Kuwait",
        combined_margin=0.593,
        source_name="MEW Kuwait",
        data_year=2023
    ),
    "OM": GridEFData(
        country_code="OM",
        country_name="Oman",
        combined_margin=0.545,
        source_name="Authority for Electricity Regulation Oman",
        data_year=2023
    ),
    "BH": GridEFData(
        country_code="BH",
        country_name="Bahrain",
        combined_margin=0.590,
        source_name="EWA Bahrain",
        data_year=2023
    ),
    "JO": GridEFData(
        country_code="JO",
        country_name="Jordan",
        combined_margin=0.521,
        source_name="EMRC Jordan",
        data_year=2023
    ),
    "LB": GridEFData(
        country_code="LB",
        country_name="Lebanon",
        combined_margin=0.645,
        source_name="EDL Lebanon",
        data_year=2023
    ),
    "MA": GridEFData(
        country_code="MA",
        country_name="Morocco",
        combined_margin=0.610,
        source_name="ONEE Morocco",
        data_year=2023
    ),
    "TN": GridEFData(
        country_code="TN",
        country_name="Tunisia",
        combined_margin=0.480,
        source_name="STEG Tunisia",
        data_year=2023
    ),
    "TR": GridEFData(
        country_code="TR",
        country_name="Turkey",
        combined_margin=0.440,
        source_name="EPDK Turkey",
        data_year=2023
    ),
    
    # ============ Africa ============
    "ZA": GridEFData(
        country_code="ZA",
        country_name="South Africa",
        combined_margin=0.928,
        source_name="Eskom",
        data_year=2023
    ),
    "KE": GridEFData(
        country_code="KE",
        country_name="Kenya",
        combined_margin=0.333,  # High hydro and geothermal share
        source_name="KPLC",
        data_year=2023
    ),
    "NG": GridEFData(
        country_code="NG",
        country_name="Nigeria",
        combined_margin=0.450,
        source_name="TCN Nigeria",
        data_year=2023
    ),
    "GH": GridEFData(
        country_code="GH",
        country_name="Ghana",
        combined_margin=0.368,
        source_name="ECG Ghana",
        data_year=2023
    ),
    "ET": GridEFData(
        country_code="ET",
        country_name="Ethiopia",
        combined_margin=0.0,  # Almost 100% hydro
        source_name="EEP Ethiopia",
        data_year=2023
    ),
    "TZ": GridEFData(
        country_code="TZ",
        country_name="Tanzania",
        combined_margin=0.354,
        source_name="TANESCO",
        data_year=2023
    ),
    "UG": GridEFData(
        country_code="UG",
        country_name="Uganda",
        combined_margin=0.184,  # High hydro share
        source_name="UETCL",
        data_year=2023
    ),
    "SN": GridEFData(
        country_code="SN",
        country_name="Senegal",
        combined_margin=0.595,
        source_name="SENELEC",
        data_year=2023
    ),
    
    # ============ Europe ============
    "DE": GridEFData(
        country_code="DE",
        country_name="Germany",
        combined_margin=0.380,
        source_name="UBA Germany",
        data_year=2023
    ),
    "FR": GridEFData(
        country_code="FR",
        country_name="France",
        combined_margin=0.052,  # High nuclear
        source_name="RTE France",
        data_year=2023
    ),
    "GB": GridEFData(
        country_code="GB",
        country_name="United Kingdom",
        combined_margin=0.207,
        source_name="BEIS/DESNZ",
        data_year=2023
    ),
    "ES": GridEFData(
        country_code="ES",
        country_name="Spain",
        combined_margin=0.181,
        source_name="REE",
        data_year=2023
    ),
    "IT": GridEFData(
        country_code="IT",
        country_name="Italy",
        combined_margin=0.316,
        source_name="ISPRA Italy",
        data_year=2023
    ),
    "PL": GridEFData(
        country_code="PL",
        country_name="Poland",
        combined_margin=0.724,  # High coal
        source_name="URE Poland",
        data_year=2023
    ),
    "NL": GridEFData(
        country_code="NL",
        country_name="Netherlands",
        combined_margin=0.328,
        source_name="CBS Netherlands",
        data_year=2023
    ),
    "BE": GridEFData(
        country_code="BE",
        country_name="Belgium",
        combined_margin=0.155,
        source_name="Elia Belgium",
        data_year=2023
    ),
    "AT": GridEFData(
        country_code="AT",
        country_name="Austria",
        combined_margin=0.090,  # High hydro
        source_name="E-Control Austria",
        data_year=2023
    ),
    "CH": GridEFData(
        country_code="CH",
        country_name="Switzerland",
        combined_margin=0.025,  # High hydro + nuclear
        source_name="BFE Switzerland",
        data_year=2023
    ),
    "SE": GridEFData(
        country_code="SE",
        country_name="Sweden",
        combined_margin=0.041,  # Hydro + nuclear
        source_name="Swedish Energy Agency",
        data_year=2023
    ),
    "NO": GridEFData(
        country_code="NO",
        country_name="Norway",
        combined_margin=0.017,  # Almost 100% hydro
        source_name="NVE Norway",
        data_year=2023
    ),
    "DK": GridEFData(
        country_code="DK",
        country_name="Denmark",
        combined_margin=0.140,  # High wind
        source_name="Danish Energy Agency",
        data_year=2023
    ),
    "FI": GridEFData(
        country_code="FI",
        country_name="Finland",
        combined_margin=0.081,
        source_name="Statistics Finland",
        data_year=2023
    ),
    "PT": GridEFData(
        country_code="PT",
        country_name="Portugal",
        combined_margin=0.186,
        source_name="REN Portugal",
        data_year=2023
    ),
    "GR": GridEFData(
        country_code="GR",
        country_name="Greece",
        combined_margin=0.354,
        source_name="ADMIE Greece",
        data_year=2023
    ),
    "CZ": GridEFData(
        country_code="CZ",
        country_name="Czech Republic",
        combined_margin=0.430,
        source_name="ERU Czech Republic",
        data_year=2023
    ),
    "RO": GridEFData(
        country_code="RO",
        country_name="Romania",
        combined_margin=0.295,
        source_name="Transelectrica",
        data_year=2023
    ),
    "HU": GridEFData(
        country_code="HU",
        country_name="Hungary",
        combined_margin=0.244,
        source_name="MAVIR Hungary",
        data_year=2023
    ),
    "SK": GridEFData(
        country_code="SK",
        country_name="Slovakia",
        combined_margin=0.115,  # High nuclear
        source_name="SEPS Slovakia",
        data_year=2023
    ),
    "BG": GridEFData(
        country_code="BG",
        country_name="Bulgaria",
        combined_margin=0.408,
        source_name="ESO Bulgaria",
        data_year=2023
    ),
    "IE": GridEFData(
        country_code="IE",
        country_name="Ireland",
        combined_margin=0.296,
        source_name="EirGrid",
        data_year=2023
    ),
    "UA": GridEFData(
        country_code="UA",
        country_name="Ukraine",
        combined_margin=0.364,
        source_name="Ukrenergo",
        data_year=2023
    ),
    "RU": GridEFData(
        country_code="RU",
        country_name="Russia",
        combined_margin=0.367,
        source_name="System Operator UES",
        data_year=2023
    ),
    
    # ============ Americas ============
    "US": GridEFData(
        country_code="US",
        country_name="United States",
        combined_margin=0.386,  # National average
        source_name="EPA eGRID 2022",
        source_url="https://www.epa.gov/egrid",
        data_year=2022
    ),
    "CA": GridEFData(
        country_code="CA",
        country_name="Canada",
        combined_margin=0.120,  # High hydro
        source_name="Environment Canada",
        data_year=2023
    ),
    "MX": GridEFData(
        country_code="MX",
        country_name="Mexico",
        combined_margin=0.453,
        source_name="CENACE",
        data_year=2023
    ),
    "BR": GridEFData(
        country_code="BR",
        country_name="Brazil",
        combined_margin=0.085,  # High hydro
        source_name="ONS Brazil",
        data_year=2023
    ),
    "AR": GridEFData(
        country_code="AR",
        country_name="Argentina",
        combined_margin=0.368,
        source_name="CAMMESA",
        data_year=2023
    ),
    "CL": GridEFData(
        country_code="CL",
        country_name="Chile",
        combined_margin=0.337,
        source_name="CEN Chile",
        data_year=2023
    ),
    "CO": GridEFData(
        country_code="CO",
        country_name="Colombia",
        combined_margin=0.126,  # High hydro
        source_name="XM Colombia",
        data_year=2023
    ),
    "PE": GridEFData(
        country_code="PE",
        country_name="Peru",
        combined_margin=0.255,
        source_name="COES SINAC",
        data_year=2023
    ),
    "VE": GridEFData(
        country_code="VE",
        country_name="Venezuela",
        combined_margin=0.179,  # High hydro
        source_name="CORPOELEC",
        data_year=2023
    ),
    "EC": GridEFData(
        country_code="EC",
        country_name="Ecuador",
        combined_margin=0.213,  # High hydro
        source_name="ARCONEL Ecuador",
        data_year=2023
    ),
    "PA": GridEFData(
        country_code="PA",
        country_name="Panama",
        combined_margin=0.312,
        source_name="ASEP Panama",
        data_year=2023
    ),
    "CR": GridEFData(
        country_code="CR",
        country_name="Costa Rica",
        combined_margin=0.025,  # Almost 100% renewable
        source_name="ICE Costa Rica",
        data_year=2023
    ),
    "UY": GridEFData(
        country_code="UY",
        country_name="Uruguay",
        combined_margin=0.040,  # High wind + hydro
        source_name="UTE Uruguay",
        data_year=2023
    ),
    
    # ============ Oceania ============
    "AU": GridEFData(
        country_code="AU",
        country_name="Australia",
        combined_margin=0.680,
        source_name="CER Australia",
        data_year=2023
    ),
    "NZ": GridEFData(
        country_code="NZ",
        country_name="New Zealand",
        combined_margin=0.106,  # High hydro/geothermal
        source_name="MBIE New Zealand",
        data_year=2023
    ),
    "FJ": GridEFData(
        country_code="FJ",
        country_name="Fiji",
        combined_margin=0.413,
        source_name="EFL Fiji",
        data_year=2023
    ),
}


# US Regional Grid Emission Factors
US_REGIONAL_GRID_EFS: Dict[str, GridEFData] = {
    "US_WECC": GridEFData(
        country_code="US",
        country_name="United States",
        region_code="WECC",
        region_name="Western Electricity Coordinating Council",
        combined_margin=0.396,
        source_name="EPA eGRID 2022",
        data_year=2022
    ),
    "US_MRO": GridEFData(
        country_code="US",
        country_name="United States",
        region_code="MRO",
        region_name="Midwest Reliability Organization",
        combined_margin=0.556,
        source_name="EPA eGRID 2022",
        data_year=2022
    ),
    "US_NPCC": GridEFData(
        country_code="US",
        country_name="United States",
        region_code="NPCC",
        region_name="Northeast Power Coordinating Council",
        combined_margin=0.221,
        source_name="EPA eGRID 2022",
        data_year=2022
    ),
    "US_RFC": GridEFData(
        country_code="US",
        country_name="United States",
        region_code="RFC",
        region_name="ReliabilityFirst Corporation",
        combined_margin=0.475,
        source_name="EPA eGRID 2022",
        data_year=2022
    ),
    "US_SERC": GridEFData(
        country_code="US",
        country_name="United States",
        region_code="SERC",
        region_name="SERC Reliability Corporation",
        combined_margin=0.423,
        source_name="EPA eGRID 2022",
        data_year=2022
    ),
    "US_TRE": GridEFData(
        country_code="US",
        country_name="United States",
        region_code="TRE",
        region_name="Texas Reliability Entity (ERCOT)",
        combined_margin=0.407,
        source_name="EPA eGRID 2022",
        data_year=2022
    ),
    "US_FRCC": GridEFData(
        country_code="US",
        country_name="United States",
        region_code="FRCC",
        region_name="Florida Reliability Coordinating Council",
        combined_margin=0.419,
        source_name="EPA eGRID 2022",
        data_year=2022
    ),
}


def get_grid_ef(country_code: str, region_code: Optional[str] = None) -> Optional[GridEFData]:
    """
    Get grid emission factor for a country/region
    
    Args:
        country_code: ISO 3166-1 alpha-2 country code
        region_code: Optional region code for sub-national grids
    
    Returns:
        GridEFData or None if not found
    """
    if region_code and country_code == "US":
        key = f"US_{region_code}"
        return US_REGIONAL_GRID_EFS.get(key)
    
    return GRID_EMISSION_FACTORS.get(country_code.upper())


def get_all_grid_efs() -> List[GridEFData]:
    """Get all grid emission factors"""
    all_efs = list(GRID_EMISSION_FACTORS.values())
    all_efs.extend(US_REGIONAL_GRID_EFS.values())
    return all_efs


def get_countries_list() -> List[Dict[str, str]]:
    """Get list of countries with EF data for dropdown"""
    return [
        {"code": ef.country_code, "name": ef.country_name}
        for ef in GRID_EMISSION_FACTORS.values()
    ]
