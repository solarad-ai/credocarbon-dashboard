from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from backend.core.database import get_db
from backend.core.models import Project, ProjectStatus, User
from backend.modules.auth.dependencies import get_current_user 
from pydantic import BaseModel
from typing import Optional, List, Any
from datetime import datetime

router = APIRouter(prefix="/projects", tags=["projects"])

class ProjectCreate(BaseModel):
    # Step 1
    projectType: Optional[str] = None
    registry: Optional[str] = None
    methodology: Optional[str] = None
    # Step 2
    name: Optional[str] = None
    description: Optional[str] = None
    startDate: Optional[str] = None
    creditingPeriodStart: Optional[str] = None
    creditingPeriodEnd: Optional[str] = None
    location: Optional[Any] = None # JSON
    # Step 3
    installedCapacity: Optional[str] = None
    estimatedGeneration: Optional[str] = None
    
    # Allow extra fields for now
    class Config:
        extra = "allow"

class ProjectResponse(BaseModel):
    id: int
    code: Optional[str]
    project_type: str
    status: str
    name: Optional[str]
    wizard_data: Optional[Any]
    created_at: Optional[datetime]
    country: Optional[str]

    class Config:
        from_attributes = True

@router.post("/", response_model=ProjectResponse)
def create_project(project: ProjectCreate, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    if current_user.role != "DEVELOPER":
        raise HTTPException(status_code=403, detail="Only developers can create projects")
    
    # Generate a simple code (C-100X)
    import random
    code = f"C-{random.randint(1000,9999)}"

    new_project = Project(
        developer_id=current_user.id,
        project_type=project.projectType or "solar",  # Default to solar if not provided
        status=ProjectStatus.DRAFT,  # Start as draft
        name=project.name or "New Project",
        code=code,
        wizard_data=project.dict() # Store full wizard payload
    )
    db.add(new_project)
    db.commit()
    db.refresh(new_project)
    return new_project

@router.get("/", response_model=List[ProjectResponse])
def get_projects(current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    if current_user.role == "DEVELOPER":
        return db.query(Project).filter(Project.developer_id == current_user.id).all()
    if current_user.role == "BUYER":
         return db.query(Project).filter(Project.status == ProjectStatus.ISSUED).all() # Buyers see issued projects
    return []

@router.get("/{project_id}", response_model=ProjectResponse)
def get_project(project_id: int, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    project = db.query(Project).filter(Project.id == project_id).first()
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")
    
    # RBAC Check
    if current_user.role == "DEVELOPER" and project.developer_id != current_user.id:
        raise HTTPException(status_code=403, detail="Not authorized to view this project")
    
    return project

class ProjectUpdate(BaseModel):
    projectType: Optional[str] = None
    name: Optional[str] = None
    description: Optional[str] = None
    status: Optional[str] = None
    wizard_step: Optional[str] = None
    wizard_data: Optional[Any] = None
    
    class Config:
        extra = "allow"

@router.put("/{project_id}", response_model=ProjectResponse)
def update_project(project_id: int, project_update: ProjectUpdate, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    project = db.query(Project).filter(Project.id == project_id).first()
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")
        
    if current_user.role == "DEVELOPER" and project.developer_id != current_user.id:
        raise HTTPException(status_code=403, detail="Not authorized to update this project")
        
    # Update fields
    if project_update.name:
        project.name = project_update.name
    if project_update.projectType:
        project.project_type = project_update.projectType
    if project_update.status:
        try:
            # Handle status update if provided
            project.status = ProjectStatus(project_update.status)
        except ValueError:
            pass # Ignore invalid status
            
    # Merge wizard data if provided
    if project_update.wizard_data:
        if not project.wizard_data:
            project.wizard_data = {}
        # Simple merge, in real app might need deep merge
        if isinstance(project.wizard_data, dict) and isinstance(project_update.wizard_data, dict):
            project.wizard_data = {**project.wizard_data, **project_update.wizard_data}
        else:
            project.wizard_data = project_update.wizard_data
            
    db.commit()
    db.refresh(project)
    return project

class WizardUpdate(BaseModel):
    wizard_step: str
    wizard_data: Any

@router.put("/{project_id}/wizard", response_model=ProjectResponse)
def update_project_wizard(project_id: int, wizard_update: WizardUpdate, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    project = db.query(Project).filter(Project.id == project_id).first()
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")
        
    if current_user.role == "DEVELOPER" and project.developer_id != current_user.id:
        raise HTTPException(status_code=403, detail="Not authorized to update this project")
    
    # Update wizard data
    if not project.wizard_data:
        project.wizard_data = {}
        
    if isinstance(project.wizard_data, dict) and isinstance(wizard_update.wizard_data, dict):
        project.wizard_data = {**project.wizard_data, **wizard_update.wizard_data}
    else:
        project.wizard_data = wizard_update.wizard_data
        
    db.commit()
    db.refresh(project)
    return project

@router.delete("/{project_id}", status_code=204)
def delete_project(project_id: int, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    project = db.query(Project).filter(Project.id == project_id).first()
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")
        
    if current_user.role == "DEVELOPER" and project.developer_id != current_user.id:
        raise HTTPException(status_code=403, detail="Not authorized to delete this project")
    
    # Manually delete related records to avoid FK constraint issues
    # Import models here to avoid circular imports
    from backend.modules.generation.models import UploadedFile, DatasetMapping, GenerationTimeseries, CreditEstimation
    
    # Delete credit estimations
    db.query(CreditEstimation).filter(CreditEstimation.project_id == project_id).delete()
    
    # Delete generation timeseries
    db.query(GenerationTimeseries).filter(GenerationTimeseries.project_id == project_id).delete()
    
    # Delete dataset mappings (via uploaded files)
    file_ids = [f.id for f in db.query(UploadedFile.id).filter(UploadedFile.project_id == project_id).all()]
    if file_ids:
        db.query(DatasetMapping).filter(DatasetMapping.file_id.in_(file_ids)).delete(synchronize_session=False)
    
    # Delete uploaded files
    db.query(UploadedFile).filter(UploadedFile.project_id == project_id).delete()
    
    # Finally delete the project
    db.delete(project)
    db.commit()
    return None
