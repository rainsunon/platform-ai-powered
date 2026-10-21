from pydantic import BaseModel
from typing import List, TypeVar, Generic
from datetime import datetime

T = TypeVar('T')

class PaginatedResponse(BaseModel, Generic[T]):
    data: List[T]
    total: int
    page: int
    page_size: int
    total_pages: int

class MessageResponse(BaseModel):
    message: str