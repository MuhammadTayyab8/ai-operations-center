from pydantic import BaseModel
from typing import Optional, Dict, Any, Union

class WorkflowTriggerRequest(BaseModel):
    user_input: str

class WorkflowApproveRequest(BaseModel):
    approved: bool

class WorkflowStatusResponse(BaseModel):
    id: Union[int, str]
    status: str
    context_data: Optional[Dict[str, Any]] = None
    action_log: Optional[Dict[str, Any]] = None
