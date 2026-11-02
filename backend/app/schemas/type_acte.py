"""Schémas des types d'actes et formulaires dynamiques.

Propriétaire : NDOUNGUE ESSOH ABEL THOMAS
TODO :
  [ ] Valider qu'un champ `select` possède des options.
  [ ] Refuser les noms de champs dupliqués.
  [ ] Tester la sérialisation JSON.
"""

from typing import Any, Literal

from pydantic import BaseModel, Field

from app.schemas.common import ORMModel

FieldType = Literal["text", "textarea", "date", "number", "select", "checkbox", "file"]


class SelectOption(BaseModel):
    value: str
    label: str


class FormField(BaseModel):
    name: str = Field(pattern=r"^[a-z][a-z0-9_]*$", max_length=80)
    label: str = Field(min_length=1, max_length=150)
    type: FieldType
    required: bool = True
    placeholder: str | None = Field(default=None, max_length=200)
    help: str | None = Field(default=None, max_length=300)
    options: list[SelectOption] | None = None


class TypeActeSummary(ORMModel):
    id: int
    code: str
    label: str


class TypeActeRead(TypeActeSummary):
    description: str
    form_schema: list[dict[str, Any]]
    template_md: str
    is_active: bool


class TypeActeCreate(BaseModel):
    code: str = Field(pattern=r"^[a-z0-9-]+$", min_length=2, max_length=80)
    label: str = Field(min_length=1, max_length=150)
    description: str = Field(default="", max_length=1000)
    form_schema: list[FormField] = Field(default_factory=list)
    template_md: str = ""


class TypeActeUpdate(BaseModel):
    label: str | None = Field(default=None, min_length=1, max_length=150)
    description: str | None = Field(default=None, max_length=1000)
    form_schema: list[FormField] | None = None
    template_md: str | None = None
    is_active: bool | None = None
