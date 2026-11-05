"""Schémas des types d'actes et formulaires dynamiques.

Propriétaire : NDOUNGUE ESSOH ABEL THOMAS
TODO réalisé :
  [x] Valider qu'un champ `select` possède des options.
  [x] Refuser les noms de champs dupliqués.
  [x] Tester la sérialisation JSON.
"""

from typing import Any, Literal

from pydantic import BaseModel, Field, model_validator

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

    @model_validator(mode="after")
    def validate_select_options(self) -> "FormField":
        if self.type == "select" and not self.options:
            raise ValueError("Un champ select doit avoir au moins une option.")
        if self.type != "select":
            self.options = None
        return self


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

    @model_validator(mode="after")
    def validate_unique_field_names(self) -> "TypeActeCreate":
        names = [field.name for field in self.form_schema]
        if len(names) != len(set(names)):
            raise ValueError("Les noms de champs du formulaire doivent être uniques.")
        return self


class TypeActeUpdate(BaseModel):
    label: str | None = Field(default=None, min_length=1, max_length=150)
    description: str | None = Field(default=None, max_length=1000)
    form_schema: list[FormField] | None = None
    template_md: str | None = None
    is_active: bool | None = None

    @model_validator(mode="after")
    def validate_unique_field_names(self) -> "TypeActeUpdate":
        if self.form_schema is not None:
            names = [field.name for field in self.form_schema]
            if len(names) != len(set(names)):
                raise ValueError("Les noms de champs du formulaire doivent être uniques.")
        return self
