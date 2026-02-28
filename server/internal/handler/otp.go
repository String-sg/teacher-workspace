package handler

import (
	"encoding/json"
	"errors"
	"mime"
	"net/http"
	"strings"

	"github.com/String-sg/teacher-workspace/server/internal/httputil"
	"github.com/String-sg/teacher-workspace/server/internal/middleware"
	"github.com/String-sg/teacher-workspace/server/internal/otp"
)

// import (
// 	"bytes"
// 	"context"
// 	"crypto/hmac"
// 	"crypto/rand"
// 	"crypto/sha256"
// 	"encoding/base64"
// 	"encoding/hex"
// 	"encoding/json"
// 	"errors"
// 	"io"
// 	"log/slog"
// 	"net/http"
// 	"strings"

// 	"github.com/String-sg/teacher-workspace/server/internal/config"
// 	"github.com/String-sg/teacher-workspace/server/internal/middleware"
// )

// var store = make(map[string]map[string]string)

// type errorResponse struct {
// 	Code    string      `json:"code"`
// 	Message string      `json:"message"`
// 	Errors  []errorBody `json:"error,omitempty"`
// }

// type errorBody struct {
// 	Code    string `json:"code"`
// 	Message string `json:"message"`
// }

// const (
// 	ErrorCodeInvalidForm         = "INVALID_FORM"
// 	ErrorCodeInvalidAuth         = "AUTHORIZATION_FAILED"
// 	ErrorCodeInternalServerError = "INTERNAL_SERVER_ERROR"
// 	ErrorCodeRequestTimeout      = "REQUEST_TIMEOUT"
// )

// isAllowedEmail returns true if the email domain is allowed for the given environment.
// Production: only @schools.gov.sg. Staging/development: @schools.gov.sg or @tech.gov.sg.
// func isAllowedEmail(email string, env cfg.Environment) bool {
// 	if env == config.EnvironmentProduction {
// 		return strings.HasSuffix(email, "@schools.gov.sg")
// 	}
// 	return strings.HasSuffix(email, "@schools.gov.sg") || strings.HasSuffix(email, "@tech.gov.sg")
// }

// // writeClientErrorResponse writes a JSON error response for 4xx client errors
// func writeClientErrorResponse(w http.ResponseWriter, logger *slog.Logger, statusCode int, code string, message string, errors ...errorBody) {
// 	w.Header().Set("Content-Type", "application/json")
// 	w.WriteHeader(statusCode)
// 	if err := json.NewEncoder(w).Encode(errorResponse{
// 		Code:    code,
// 		Message: message,
// 		Errors:  errors,
// 	}); err != nil {
// 		logger.Error("Failed to encode error response", "err", err)
// 	}
// }

// // writeServerErrorResponse writes a plain text error response for 5xx server errors using http.Error
// func writeServerErrorResponse(w http.ResponseWriter, statusCode int, message string) {
// 	http.Error(w, message, statusCode)
// }

// func buildAuthToken(appId, appNamespace, appSecret string) string {
// 	mac := hmac.New(sha256.New, []byte(appSecret))
// 	mac.Write([]byte(appId))

// 	sig := hex.EncodeToString(mac.Sum(nil))
// 	payload := appNamespace + ":" + appId + ":" + sig

// 	return base64.StdEncoding.EncodeToString([]byte(payload))
// }

// type requestOTPRequest struct {
// 	Email string `json:"email"`
// }

// type requestOTPResponse struct {
// 	ID string `json:"id"`
// }

// type requestOTPOTPaasRequest struct {
// 	Email string `json:"email"`
// }

// type requestOTPPaasResponse struct {
// 	ID string `json:"id"`
// }

// func (h *Handler) RequestOTP(w http.ResponseWriter, r *http.Request) {
// 	logger := middleware.LoggerFromContext(r.Context())

// 	var input requestOTPRequest
// 	if err := json.NewDecoder(r.Body).Decode(&input); err != nil {
// 		writeClientErrorResponse(w, logger, http.StatusBadRequest, ErrorCodeInvalidForm, "One or more input has an error")
// 		logger.Error("Email not found in request body", "err", err)
// 		return
// 	}

// 	if !isAllowedEmail(input.Email, h.cfg.Environment) {
// 		writeClientErrorResponse(w, logger, http.StatusUnprocessableEntity, ErrorCodeInvalidForm, "One or more input has an error")
// 		logger.Error("Email is not a valid schools.gov.sg email")
// 		return
// 	}

// 	otpaasPayload := requestOTPOTPaasRequest(input)
// 	payload, err := json.Marshal(otpaasPayload)
// 	if err != nil {
// 		writeServerErrorResponse(w, http.StatusInternalServerError, "Internal server error")
// 		logger.Error("Failed to marshal request body", "err", err)
// 		return
// 	}

// req, err := http.NewRequest("POST", h.cfg.OTPaaS.Host+"/otp", bytes.NewReader(payload))
// if err != nil {
// 	writeServerErrorResponse(w, http.StatusInternalServerError, "Internal server error")
// 	logger.Error("Failed to create request", "err", err)
// 	return
// }

// req.Header.Set("Content-Type", "application/json")
// req.Header.Set("Authorization", "Bearer "+buildAuthToken(h.cfg.OTPaaS.Secret, h.cfg.OTPaaS.ID, h.cfg.OTPaaS.Namespace))
// req.Header.Set("X-App-Id", h.cfg.OTPaaS.ID)
// req.Header.Set("X-App-Namespace", h.cfg.OTPaaS.Namespace)

// 	resp, err := h.client.Do(req)
// 	if err != nil {
// 		if errors.Is(err, context.DeadlineExceeded) {
// 			writeServerErrorResponse(w, http.StatusGatewayTimeout, "Request timeout. Please try again later.")
// 			logger.Error("OTPaas request timeout", "err", err)
// 			return
// 		}

// 		writeServerErrorResponse(w, http.StatusInternalServerError, "Internal server error")
// 		logger.Error("Error sending request to OTPaas", "err", err)
// 		return
// 	}

// 	if resp.StatusCode != http.StatusOK {
// 		// TODO: update the error message from figma when available
// 		writeServerErrorResponse(w, http.StatusInternalServerError, "Something went wrong. Please try again later.")
// 		logger.Error("Authorization failed", "err", err, "otpaas_status_code", resp.StatusCode)
// 		return
// 	}

// 	defer func() {
// 		if err := resp.Body.Close(); err != nil {
// 			logger.Error("Failed to close response body", "err", err)
// 		}
// 	}()

// 	body, err := io.ReadAll(resp.Body)
// 	if err != nil {
// 		writeServerErrorResponse(w, http.StatusInternalServerError, "Internal server error")
// 		logger.Error("Failed to read response body", "err", err, "otpaas_status_code", resp.StatusCode)
// 		return
// 	}

// 	var otpResp requestOTPPaasResponse
// 	if err := json.Unmarshal(body, &otpResp); err != nil {
// 		writeServerErrorResponse(w, http.StatusInternalServerError, "Internal server error")
// 		logger.Error("Failed to unmarshal response body", "err", err, "otpaas_status_code", resp.StatusCode)
// 		return
// 	}

// 	if otpResp.ID == "" {
// 		writeServerErrorResponse(w, http.StatusInternalServerError, "Internal server error")
// 		logger.Error("Failed to get `otp_flow_id` from OTPaas", "err", err, "otpaas_status_code", resp.StatusCode)
// 		return
// 	}

// 	var sessionID string

// 	c, err := r.Cookie("session_id")
// 	if err != nil {
// 		id := make([]byte, 32)
// 		if _, err := rand.Read(id); err != nil {
// 			writeServerErrorResponse(w, http.StatusInternalServerError, "Internal server error")
// 			logger.Error("Failed to generate session ID", "err", err, "otpaas_status_code", resp.StatusCode)
// 			return
// 		}
// 		sessionID = base64.RawURLEncoding.EncodeToString(id)
// 	} else {
// 		sessionID = c.Value
// 	}

// 	store[sessionID] = map[string]string{"otp_flow_id": otpResp.ID}

// 	cookie := http.Cookie{
// 		Name:     "session_id",
// 		Value:    sessionID,
// 		Path:     "/",
// 		Secure:   h.cfg.Environment == config.EnvironmentProduction || h.cfg.Environment == config.EnvironmentStaging,
// 		HttpOnly: true,
// 		SameSite: http.SameSiteLaxMode,
// 	}
// 	http.SetCookie(w, &cookie)

// 	w.Header().Set("Content-Type", "application/json")
// 	w.WriteHeader(http.StatusOK)

// 	if err := json.NewEncoder(w).Encode(requestOTPResponse(otpResp)); err != nil {
// 		logger.Error("Failed to encode error response", "err", err)
// 	}

// }

// type verifyOTPRequest struct {
// 	PIN string `json:"pin"`
// }

// type verifyOTPOTPaasRequest struct {
// 	PIN string `json:"pin"`
// }

// func (h *Handler) VerifyOTP(w http.ResponseWriter, r *http.Request) {
// 	logger := middleware.LoggerFromContext(r.Context())

// 	var input verifyOTPRequest
// 	if err := json.NewDecoder(r.Body).Decode(&input); err != nil {
// 		writeClientErrorResponse(w, logger, http.StatusBadRequest, ErrorCodeInvalidForm, "One or more input has an error")
// 		logger.Error("Pin not found in request body", "err", err)
// 		return
// 	}

// 	if len(input.PIN) != 6 {
// 		writeClientErrorResponse(w, logger, http.StatusUnprocessableEntity, ErrorCodeInvalidForm, "One or more input has an error")
// 		logger.Error("Pin is not a valid 6 digit PIN")
// 		return
// 	}

// 	c, err := r.Cookie("session_id")
// 	if err != nil {
// 		writeServerErrorResponse(w, http.StatusInternalServerError, "Internal server error")
// 		logger.Error("Missing session_id in cookie", "err", err)
// 		return
// 	}

// 	session, ok := store[c.Value]
// 	if !ok {
// 		// TODO: update the error message from figma when available
// 		writeClientErrorResponse(w, logger, http.StatusUnauthorized, ErrorCodeInvalidAuth, "Failed to authenticate session.")
// 		logger.Error("Session not found in store", "err", err)
// 		return
// 	}

// 	otpaasPayload := verifyOTPOTPaasRequest(input)
// 	payload, err := json.Marshal(otpaasPayload)
// 	if err != nil {
// 		writeServerErrorResponse(w, http.StatusInternalServerError, "Internal server error")
// 		logger.Error("Failed to marshal request body", "err", err)
// 		return
// 	}

// 	otpFlowID := session["otp_flow_id"]

// req, err := http.NewRequest("PUT", h.cfg.OTPaaS.Host+"/otp/"+otpFlowID, bytes.NewReader(payload))
// if err != nil {
// 	writeServerErrorResponse(w, http.StatusInternalServerError, "Internal server error")
// 	logger.Error("Failed to create request", "err", err)
// 	return
// }

// req.Header.Set("Content-Type", "application/json")
// req.Header.Set("Authorization", "Bearer "+buildAuthToken(h.cfg.OTPaaS.Secret, h.cfg.OTPaaS.ID, h.cfg.OTPaaS.Namespace))
// req.Header.Set("X-App-Id", h.cfg.OTPaaS.ID)
// req.Header.Set("X-App-Namespace", h.cfg.OTPaaS.Namespace)

// 	resp, err := h.client.Do(req)
// 	if err != nil {
// 		if errors.Is(err, context.DeadlineExceeded) {
// 			writeServerErrorResponse(w, http.StatusGatewayTimeout, "Request timeout. Please try again later.")
// 			logger.Error("OTPaas request timeout", "err", err)
// 			return
// 		}

// 		writeServerErrorResponse(w, http.StatusInternalServerError, "Internal server error")
// 		logger.Error("Error sending request to OTPaas", "err", err)
// 		return
// 	}

// 	if resp.StatusCode != http.StatusOK {
// 		switch resp.StatusCode {
// 		case http.StatusUnauthorized:
// 			writeClientErrorResponse(w, logger, http.StatusUnprocessableEntity, ErrorCodeInvalidAuth, "Failed to authenticate session.")
// 			logger.Error("Invalid PIN", "err", err, "otpaas_status_code", resp.StatusCode)
// 		case http.StatusNotFound:
// 			writeClientErrorResponse(w, logger, http.StatusUnprocessableEntity, ErrorCodeInvalidAuth, "Failed to authenticate session.")
// 			logger.Error("Pin expired", "err", err, "otpaas_status_code", resp.StatusCode)
// 		default:
// 			writeServerErrorResponse(w, http.StatusInternalServerError, "Internal server error")
// 			logger.Error("Internal server error", "err", err, "otpaas_status_code", resp.StatusCode)
// 			return
// 		}
// 	}

// 	defer func() {
// 		if err := resp.Body.Close(); err != nil {
// 			logger.Error("Failed to close response body", "err", err)
// 		}
// 	}()

// 	w.WriteHeader(http.StatusNoContent)
// }

func (h *Handler) RequestOTP(w http.ResponseWriter, r *http.Request) {
	logger := middleware.LoggerFromContext(r.Context())

	mediaType, _, err := mime.ParseMediaType(r.Header.Get(HeaderContentType))
	if err != nil || mediaType != MIMEApplicationJSON {
		h.renderJSON(r, w, http.StatusUnsupportedMediaType, httputil.ErrorResponse{
			Message: http.StatusText(http.StatusUnsupportedMediaType),
		})
		return
	}

	var payload struct {
		Email string `json:"email"`
	}
	if err := json.NewDecoder(r.Body).Decode(&payload); err != nil {
		h.renderJSON(r, w, http.StatusBadRequest, httputil.ErrorResponse{
			Message: "Problem parsing JSON",
		})
		return
	}

	hasValidDomain := false
	for _, domain := range h.cfg.OTP.AllowedEmailDomains {
		if strings.HasSuffix(payload.Email, domain) {
			hasValidDomain = true
			break
		}
	}
	if !hasValidDomain {
		h.renderJSON(r, w, http.StatusUnprocessableEntity, httputil.NewValidationError([]httputil.FieldError{
			{Field: "email", Message: "Email domain not allowed"},
		}))
		return
	}

	email := strings.TrimSpace(strings.ToLower(payload.Email))
	flowID, err := h.otpProvider.RequestOTP(r.Context(), email)
	if err != nil {
		switch {
		case errors.Is(err, otp.ErrRateLimited):
			h.renderJSON(r, w, http.StatusTooManyRequests, httputil.ErrorResponse{
				Message: http.StatusText(http.StatusTooManyRequests),
			})
			return
		case errors.Is(err, otp.ErrDomainNotAllowed):
			h.renderJSON(r, w, http.StatusUnprocessableEntity, httputil.NewValidationError([]httputil.FieldError{
				{Field: "email", Message: "Email domain not allowed"},
			}))
			return
		default:
			logger.Error("failed to request OTP", "err", err)
			h.renderJSON(r, w, http.StatusInternalServerError, httputil.ErrorResponse{
				Message: http.StatusText(http.StatusInternalServerError),
			})
			return
		}
	}

	sess, ok := middleware.SessionFromContext(r.Context())
	if !ok {
		logger.Error("session not found in context")
		h.renderJSON(r, w, http.StatusInternalServerError, httputil.ErrorResponse{
			Message: http.StatusText(http.StatusInternalServerError),
		})
		return
	}

	sess.Set("otp_flow_id", flowID)

	h.renderJSON(r, w, http.StatusOK, struct {
		ID string `json:"id"`
	}{
		ID: flowID,
	})
}
