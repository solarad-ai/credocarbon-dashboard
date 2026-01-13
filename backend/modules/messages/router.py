from fastapi import APIRouter
from pydantic import BaseModel

router = APIRouter(prefix="/messages", tags=["messages"])

class Message(BaseModel):
    id: int
    thread_id: str
    sender_id: int
    content: str
    # and so on

@router.get("/")
def get_messages():
    return {"message": "Messages endpoint"}
