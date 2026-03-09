package main

import (
	"bytes"
	"context"
	"crypto/hmac"
	"crypto/sha256"
	"encoding/base64"
	"encoding/hex"
	"encoding/json"
	"errors"
	"io"
	"net/http"
	"strings"

	"github.com/String-sg/teacher-workspace/server/internal/middleware"
)

const (
	ErrorCodeInvalidForm         = "INVALID_FORM"
	ErrorCodeAuth                = "AUTHORIZATION_FAILED"
	ErrorCodeInternalServerError = "INTERNAL_SERVER_ERROR"
	ErrorCodeRequestTimeout      = "REQUEST_TIMEOUT"
)

type errorResponse struct {
	Code    string `json:"code"`
	Message string `json:"message"`
}

func writeErrorResponse(w http.ResponseWriter, status int, code, message string) {
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(status)

	_ = json.NewEncoder(w).Encode(errorResponse{
		Code:    code,
		Message: message,
	})
}

type requestOTPRequest struct {
	Email string `json:"email"`
}

type requestOTPResponse struct {
	ID string `json:"id"`
}

func buildAuthToken(appID, appNamespace, appSecret string) string {
	mac := hmac.New(sha256.New, []byte(appSecret))
	mac.Write([]byte(appID))
	sig := hex.EncodeToString(mac.Sum(nil))
	payload := appNamespace + ":" + appID + ":" + sig
	return base64.StdEncoding.EncodeToString([]byte(payload))
}

func isAllowedEmail(email string, env Environment) bool {
	if env == EnvProduction {
		return strings.HasSuffix(email, "@schools.gov.sg")
	}
	return strings.HasSuffix(email, "@schools.gov.sg") || strings.HasSuffix(email, "@tech.gov.sg")
}

func isValidEmailFormat(email string) bool {
	email = strings.TrimSpace(email)
	if len(email) < 5 || len(email) > 254 {
		return false
	}
	return strings.Contains(email, "@")
}

// ------------------------------------------- REQUEST OTP -------------------------------------------
func (h *Handler) Request(w http.ResponseWriter, r *http.Request) {
	logger := middleware.LoggerFromContext(r.Context())

	ct := r.Header.Get("Content-Type")
	if !strings.HasPrefix(ct, "application/json") {
		writeErrorResponse(w, http.StatusUnsupportedMediaType, ErrorCodeInvalidForm, "Content-Type must be application/json")
		logger.Error("Content-Type must be application/json", "content_type", ct)
		return
	}

	var body requestOTPRequest
	if err := json.NewDecoder(r.Body).Decode(&body); err != nil {
		writeErrorResponse(w, http.StatusBadRequest, ErrorCodeInvalidForm, "One or more input has an error")
		logger.Error("email not found in request body", "err", err)
		return
	}

	body.Email = strings.TrimSpace(body.Email)
	if body.Email == "" {
		writeErrorResponse(w, http.StatusUnprocessableEntity, ErrorCodeInvalidForm, "One or more input has an error")
		logger.Error("email required in request body")
		return
	}

	if !isValidEmailFormat(body.Email) {
		writeErrorResponse(w, http.StatusUnprocessableEntity, ErrorCodeInvalidForm, "One or more input has an error")
		logger.Error("email not a valid email format")
		return
	}

	if !isAllowedEmail(body.Email, h.cfg.Environment) {
		writeErrorResponse(w, http.StatusUnprocessableEntity, ErrorCodeInvalidForm, "One or more input has an error")
		logger.Error("email not a valid schools.gov.sg email")
		return
	}

	payload, err := json.Marshal(map[string]string{"email": body.Email})
	if err != nil {
		writeErrorResponse(w, http.StatusInternalServerError, ErrorCodeInternalServerError, "Internal server error")
		logger.Error("failed to marshal request body", "err", err)
		return
	}

	req, err := http.NewRequest(http.MethodPost, h.cfg.OTPaaS.Host+"/otp", bytes.NewReader(payload))
	if err != nil {
		writeErrorResponse(w, http.StatusInternalServerError, ErrorCodeInternalServerError, "Internal server error")
		logger.Error("failed to create request", "err", err)
		return
	}

	req.Header.Set("Content-Type", "application/json")
	req.Header.Set("Authorization", "Bearer "+buildAuthToken(h.cfg.OTPaaS.AppID, h.cfg.OTPaaS.Namespace, h.cfg.OTPaaS.Secret))
	req.Header.Set("X-App-Id", h.cfg.OTPaaS.AppID)
	req.Header.Set("X-App-Namespace", h.cfg.OTPaaS.Namespace)

	resp, err := h.client.Do(req)
	if err != nil {
		if errors.Is(err, context.DeadlineExceeded) {
			writeErrorResponse(w, http.StatusGatewayTimeout, ErrorCodeRequestTimeout, "Request timeout. Please try again later.")
			logger.Error("OTPaas request timeout", "err", err)
			return
		}
		writeErrorResponse(w, http.StatusBadGateway, ErrorCodeInternalServerError, "Internal server error")
		logger.Error("error sending request to OTPaas", "err", err)
		return
	}

	if resp.StatusCode == http.StatusTooManyRequests {
		writeErrorResponse(w, http.StatusTooManyRequests, ErrorCodeInternalServerError, "OTPaas rate limited")
		logger.Error("otpaas rate limited", "otpaas_status_code", resp.StatusCode)
		return
	}

	if resp.StatusCode != http.StatusOK {
		writeErrorResponse(w, http.StatusInternalServerError, ErrorCodeInternalServerError, "Internal server error")
		logger.Error("authorization failed", "otpaas_status_code", resp.StatusCode)
		return
	}

	defer func() {
		if err := resp.Body.Close(); err != nil {
			logger.Error("failed to close response body", "err", err)
		}
	}()

	bodyBytes, err := io.ReadAll(resp.Body)
	if err != nil {
		writeErrorResponse(w, http.StatusInternalServerError, ErrorCodeInternalServerError, "Internal server error")
		logger.Error("failed to read response body", "err", err, "otpaas_status_code", resp.StatusCode)
		return
	}

	var otpResp requestOTPResponse
	if err := json.Unmarshal(bodyBytes, &otpResp); err != nil {
		writeErrorResponse(w, http.StatusInternalServerError, ErrorCodeInternalServerError, "Invalid OTPaas response")
		logger.Error("failed to unmarshal response body", "err", err, "otpaas_status_code", resp.StatusCode)
		return
	}

	if otpResp.ID == "" {
		writeErrorResponse(w, http.StatusInternalServerError, ErrorCodeInternalServerError, "Missing id from OTPaas")
		logger.Error("failed to get id from OTPaas", "otpaas_status_code", resp.StatusCode)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusOK)

	if err := json.NewEncoder(w).Encode(map[string]string{"flow_id": otpResp.ID}); err != nil {
		logger.Error("failed to encode response", "err", err)
	}
}

// ------------------------------------------- VERIFY OTP -------------------------------------------

type verifyOTPRequest struct {
	PIN string `json:"pin"`
}

func (h *Handler) Verify(w http.ResponseWriter, r *http.Request) {
	logger := middleware.LoggerFromContext(r.Context())

	flowID := r.PathValue("flow_id")
	if flowID == "" {
		writeErrorResponse(w, http.StatusBadRequest, ErrorCodeInvalidForm, "One or more input has an error")
		logger.Error("flow_id is required")
		return
	}

	ct := r.Header.Get("Content-Type")
	if !strings.HasPrefix(ct, "application/json") {
		writeErrorResponse(w, http.StatusUnsupportedMediaType, ErrorCodeInvalidForm, "Content-Type must be application/json")
		logger.Error("Content-Type must be application/json", "content_type", ct)
		return
	}

	var body verifyOTPRequest
	if err := json.NewDecoder(r.Body).Decode(&body); err != nil {
		writeErrorResponse(w, http.StatusBadRequest, ErrorCodeInvalidForm, "One or more input has an error")
		logger.Error("pin not found in request body", "err", err)
		return
	}

	if body.PIN == "" {
		writeErrorResponse(w, http.StatusUnprocessableEntity, ErrorCodeInvalidForm, "One or more input has an error")
		logger.Error("pin is required")
		return
	}
	if len(body.PIN) != 6 {
		writeErrorResponse(w, http.StatusUnprocessableEntity, ErrorCodeInvalidForm, "One or more input has an error")
		logger.Error("pin is not a valid 6 digit PIN")
		return
	}

	payload, err := json.Marshal(map[string]string{"pin": body.PIN})
	if err != nil {
		writeErrorResponse(w, http.StatusInternalServerError, ErrorCodeInternalServerError, "Internal server error")
		logger.Error("failed to marshal request body", "err", err)
		return
	}

	req, err := http.NewRequest("PUT", h.cfg.OTPaaS.Host+"/otp/"+flowID, bytes.NewReader(payload))
	if err != nil {
		writeErrorResponse(w, http.StatusInternalServerError, ErrorCodeInternalServerError, "Internal server error")
		logger.Error("failed to create request", "err", err)
		return
	}

	req.Header.Set("Content-Type", "application/json")
	req.Header.Set("Authorization", "Bearer "+buildAuthToken(h.cfg.OTPaaS.AppID, h.cfg.OTPaaS.Namespace, h.cfg.OTPaaS.Secret))
	req.Header.Set("X-App-Id", h.cfg.OTPaaS.AppID)
	req.Header.Set("X-App-Namespace", h.cfg.OTPaaS.Namespace)

	resp, err := h.client.Do(req)
	if err != nil {
		if errors.Is(err, context.DeadlineExceeded) {
			writeErrorResponse(w, http.StatusGatewayTimeout, ErrorCodeRequestTimeout, "Request timeout. Please try again later.")
			logger.Error("OTPaas request timeout", "err", err)
			return
		}
		writeErrorResponse(w, http.StatusBadGateway, ErrorCodeInternalServerError, "Internal server error")
		logger.Error("error sending request to OTPaas", "err", err)
		return
	}

	if resp.StatusCode != http.StatusOK {
		switch resp.StatusCode {
		case http.StatusUnauthorized:
			writeErrorResponse(w, http.StatusUnprocessableEntity, ErrorCodeAuth, "Failed to authenticate session.")
			logger.Error("invalid PIN", "otpaas_status_code", resp.StatusCode)
			return
		case http.StatusNotFound:
			writeErrorResponse(w, http.StatusNotFound, ErrorCodeAuth, "Failed to authenticate session.")
			logger.Error("pin expired", "otpaas_status_code", resp.StatusCode)
			return
		case http.StatusTooManyRequests:
			writeErrorResponse(w, http.StatusTooManyRequests, ErrorCodeAuth, "Too many verification attempts.")
			logger.Error("OTPaas rate limited", "otpaas_status_code", resp.StatusCode)
			return
		default:
			writeErrorResponse(w, http.StatusInternalServerError, ErrorCodeInternalServerError, "Internal server error")
			logger.Error("internal server error", "otpaas_status_code", resp.StatusCode)
			return
		}
	}

	defer func() {
		if err := resp.Body.Close(); err != nil {
			logger.Error("failed to close response body", "err", err)
		}
	}()

	w.WriteHeader(http.StatusNoContent)
}
