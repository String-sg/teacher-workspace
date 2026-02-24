package handler

import (
	"encoding/json"
	"log/slog"
	"net/http"
)

type errorResponse struct {
	Code    string      `json:"code"`
	Message string      `json:"message"`
	Errors  []errorBody `json:"error,omitempty"`
}

type errorBody struct {
	Code    string `json:"code"`
	Message string `json:"message"`
}

const (
	ErrorCodeInvalidForm         = "INVALID_FORM"
	ErrorCodeInvalidAuth         = "AUTHORIZATION_FAILED"
	ErrorCodeInternalServerError = "INTERNAL_SERVER_ERROR"
	ErrorCodeRequestTimeout      = "REQUEST_TIMEOUT"
	ErrorCodeMethodNotAllowed    = "METHOD_NOT_ALLOWED"
)

// writeClientErrorResponse writes a JSON error response for 4xx client errors
func writeClientErrorResponse(w http.ResponseWriter, logger *slog.Logger, statusCode int, code string, message string, errors ...errorBody) {
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(statusCode)
	if err := json.NewEncoder(w).Encode(errorResponse{
		Code:    code,
		Message: message,
		Errors:  errors,
	}); err != nil {
		logger.Error("Failed to encode error response", "err", err)
	}
}

// writeServerErrorResponse writes a plain text error response for 5xx server errors using http.Error
func writeServerErrorResponse(w http.ResponseWriter, statusCode int, message string) {
	http.Error(w, message, statusCode)
}
