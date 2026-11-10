from pydantic import BaseModel, Field, field_validator
from typing import List, Optional, Any, Dict
from datetime import datetime
from uuid import UUID

class SignUpRequest(BaseModel):
    email: str
    password: str
    full_name: str
    role: str = "student"
    bio: Optional[str] = ""
    skills: List[str] = []
    interests: List[str] = []

class LoginRequest(BaseModel):
    email: str
    password: str

class ProfileUpdate(BaseModel):
    full_name: Optional[str] = Field(default=None, min_length=1, max_length=100)
    major: Optional[str] = Field(default=None, min_length=1, max_length=100)
    bio: Optional[str] = Field(default=None, max_length=1000)
    branch: Optional[str] = Field(default=None, min_length=1, max_length=100)
    year: Optional[str] = Field(default=None, max_length=32)
    skills: Optional[List[str]] = Field(default=None, max_length=30)
    github: Optional[str] = Field(default=None, max_length=200)
    linkedin: Optional[str] = Field(default=None, max_length=200)
    interests: Optional[List[str]] = Field(default=None, max_length=30)

    @field_validator("full_name", "major", "branch", "year")
    @classmethod
    def require_nonempty_profile_text(cls, value):
        if value is None:
            return value
        value = value.strip()
        if not value:
            raise ValueError("This profile field cannot be blank.")
        return value

    @field_validator("bio")
    @classmethod
    def trim_bio(cls, value):
        return value.strip() if value is not None else value

    @field_validator("year")
    @classmethod
    def validate_class_year(cls, value):
        if value is not None and value not in {
            "1", "2", "3", "4", "Freshman", "Sophomore", "Junior", "Senior", "Graduate Student"
        }:
            raise ValueError("Choose a supported class year.")
        return value

    @field_validator("skills", "interests")
    @classmethod
    def validate_profile_tags(cls, values):
        if values is None:
            return values
        cleaned = [value.strip() for value in values]
        if any(not value or len(value) > 50 for value in cleaned):
            raise ValueError("Tags must contain 1 to 50 non-whitespace characters.")
        if len({value.casefold() for value in cleaned}) != len(cleaned):
            raise ValueError("Tags must be unique.")
        return cleaned

class SwipeRequest(BaseModel):
    targetUserId: str
    isInterested: bool

class MessageRequest(BaseModel):
    content: str

class MessageCreate(BaseModel):
    content: str

class EventCreate(BaseModel):
    title: str = Field(min_length=3, max_length=200)
    description: Optional[str] = ""
    category: Optional[str] = "Technology"
    club: Optional[str] = "Engineering Council"
    tags: Optional[List[str]] = []
    venue_name: Optional[str] = ""
    venue: Optional[str] = ""
    latitude: Optional[float] = 17.3850
    longitude: Optional[float] = 78.4867
    capacity: int = Field(default=100, gt=0, le=100000)
    is_team_event: Optional[bool] = False
    min_team_size: Optional[int] = Field(default=1, ge=1, le=100)
    max_team_size: Optional[int] = Field(default=4, ge=1, le=100)
    required_registration_fields: Optional[List[str]] = ["Full Name", "Roll Number", "Department", "GitHub URL"]
    start_at: Optional[str] = None
    deadline_at: Optional[str] = None
    expire_at: Optional[str] = None
    event_date: Optional[str] = None
    start_time: Optional[str] = None
    end_time: Optional[str] = None
    registration_deadline: Optional[str] = None
    required_skills: Optional[List[str]] = []
    event_type: Optional[str] = "event"
    banner_url: Optional[str] = ""
    participation_mode: Optional[str] = "Offline"
    registration_start: Optional[str] = None
    eligibility: Optional[str] = ""
    problem_statements: Optional[List[str]] = []
    themes: Optional[List[str]] = []
    prizes: Optional[List[str]] = []
    sponsors: Optional[List[str]] = []
    organizers: Optional[List[str]] = []
    registration_link: Optional[str] = ""
    approval_required: Optional[bool] = False
    status: Optional[str] = "draft"

    @field_validator("status")
    @classmethod
    def validate_status(cls, value):
        allowed = {"draft", "published", "archived", "Active"}
        if value not in allowed:
            raise ValueError("Status must be draft, published or archived.")
        return value

    @field_validator("event_type")
    @classmethod
    def validate_event_type(cls, value):
        allowed = {"hackathon", "workshop", "seminar", "competition", "event"}
        if value not in allowed:
            raise ValueError("Unsupported event type.")
        return value

    @field_validator("max_team_size")
    @classmethod
    def validate_team_range(cls, value, info):
        min_size = info.data.get("min_team_size", 1)
        if value is not None and min_size is not None and value < min_size:
            raise ValueError("Maximum team size cannot be smaller than minimum team size.")
        return value

class AnnouncementCreate(BaseModel):
    title: str = Field(min_length=3, max_length=200)
    body: str = Field(min_length=3, max_length=5000)
    department: Optional[str] = "All"
    year: Optional[str] = "All"
    priority: Optional[str] = "normal"
    status: Optional[str] = "draft"

    @field_validator("status")
    @classmethod
    def validate_announcement_status(cls, value):
        if value not in {"draft", "published"}:
            raise ValueError("Announcement status must be draft or published.")
        return value

    @field_validator("priority")
    @classmethod
    def validate_priority(cls, value):
        if value not in {"normal", "important", "urgent"}:
            raise ValueError("Unsupported announcement priority.")
        return value

class RegistrationStatusUpdate(BaseModel):
    status: str

    @field_validator("status")
    @classmethod
    def validate_registration_status(cls, value):
        if value not in {"approved", "rejected", "pending"}:
            raise ValueError("Registration status must be approved, rejected or pending.")
        return value

class FacultyCreate(BaseModel):
    email: str
    password: str = Field(min_length=8, max_length=128)
    full_name: str = Field(min_length=2, max_length=100)
    role: str = "faculty"

    @field_validator("role")
    @classmethod
    def validate_portal_role(cls, value):
        if value not in {"admin", "faculty"}:
            raise ValueError("Role must be admin or faculty.")
        return value

class AccountStatusUpdate(BaseModel):
    status: str

    @field_validator("status")
    @classmethod
    def validate_account_status(cls, value):
        if value not in {"active", "suspended"}:
            raise ValueError("Status must be active or suspended.")
        return value

class RegistrationRequest(BaseModel):
    credentials: Optional[Dict[str, Any]] = {}

class TeamCreateRequest(BaseModel):
    name: str
    description: Optional[str] = ""
    preferred_skills: Optional[List[str]] = []

class TeamJoinRequest(BaseModel):
    team_code: str

class TeamInviteRequest(BaseModel):
    receiver_id: str
