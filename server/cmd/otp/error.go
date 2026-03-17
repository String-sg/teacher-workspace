package main

import (
	"fmt"
	"strings"
)

// ErrorResponse represents a structured error response.
type ErrorResponse struct {
	Message string       `json:"message"`
	Errors  []FieldError `json:"errors,omitempty"`
}

// Error implements [error].
func (e *ErrorResponse) Error() string {
	if len(e.Errors) == 0 {
		return e.Message
	}

	parts := make([]string, 0, len(e.Errors))
	for _, fe := range e.Errors {
		parts = append(parts, fmt.Sprintf("%s: %s", fe.Field, fe.Message))
	}

	return fmt.Sprintf("%s: %s", e.Message, strings.Join(parts, ", "))
}

// FieldError represents a single field-level validation error.
type FieldError struct {
	Field   string `json:"field"`
	Message string `json:"message"`
}

// Error implements [error].
func (e *FieldError) Error() string {
	return fmt.Sprintf("%s: %s", e.Field, e.Message)
}

// NewValidationError creates a new validation error response.
func NewValidationError(errs []FieldError) error {
	return &ErrorResponse{
		Message: "Validation Failed",
		Errors:  errs,
	}
}
