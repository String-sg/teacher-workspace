package routes

import (
	"bytes"
	"crypto/hmac"
	"crypto/rand"
	"crypto/sha256"
	"encoding/base64"
	"encoding/hex"
	"encoding/json"
	"fmt"
	"io"
	"log/slog"
	"net/http"
	"strings"

	"github.com/String-sg/teacher-workspace/server/internal/middleware"
)

var store = make(map[string]map[string]string)

type RequestOTPInput struct {
	Email string `json:"email"`
}

type OTPResponse struct {
	ID string `json:"id"`
}

type VerifyOTPInput struct {
	PIN string `json:"pin"`
}

type VerifyOTPResponse struct {
	ID string `json:"id"`
}

type ErrorResponse struct {
	Code    string      `json:"code"`
	Message string      `json:"message"`
	Errors  []ErrorBody `json:"error,omitempty"`
}

type ErrorResponseNoErrors struct {
	Code    string `json:"code"`
	Message string `json:"message"`
}

type ErrorBody struct {
	Code    string `json:"code"`
	Message string `json:"message"`
}

const (
	ErrorCodeInvalidForm         = "INVALID_FORM"
	ErrorCodeInvalidAuth         = "AUTHORIZATION_FAILED"
	ErrorCodeInternalServerError = "INTERNAL_SERVER_ERROR"
)

func writeErrorResponse(w http.ResponseWriter, logger *slog.Logger, code string, message string, errors ...ErrorBody) {
	if len(errors) == 0 {
		if err := json.NewEncoder(w).Encode(ErrorResponseNoErrors{
			Code:    code,
			Message: message,
		}); err != nil {
			logger.Error("Failed to encode error response", "error", err)
		}
		return
	}

	if err := json.NewEncoder(w).Encode(ErrorResponse{
		Code:    code,
		Message: message,
		Errors:  errors,
	}); err != nil {
		logger.Error("Failed to encode error response", "error", err)
	}
}

func buildAuthToken(appSecret string, appId string, appNamespace string) string {
	h := hmac.New(sha256.New, []byte(appSecret))
	h.Write([]byte(appId))

	secret := hex.EncodeToString(h.Sum(nil))
	combined := appNamespace + ":" + appId + ":" + secret

	return base64.StdEncoding.EncodeToString([]byte(combined))
}

func (h *Handler) RequestOTP(w http.ResponseWriter, r *http.Request) {
	log := middleware.LoggerFromContext(r.Context())
	var otpURL = h.cfg.OTPaas.Host + "/otp"
	var sessionID string

	var input RequestOTPInput
	if err := json.NewDecoder(r.Body).Decode(&input); err != nil {
		w.WriteHeader(http.StatusBadRequest)
		writeErrorResponse(w, log, ErrorCodeInvalidForm, "One or more input has an error")
		log.Error(fmt.Sprintf("[%d]: Email not found in request body", http.StatusBadRequest), "error", err)
		return
	}

	if !strings.HasSuffix(input.Email, ".gov.sg") {
		w.WriteHeader(http.StatusBadRequest)
		writeErrorResponse(w, log, ErrorCodeInvalidForm, "One or more input has an error")
		log.Error(fmt.Sprintf("[%d]: Email is not a valid schools.gov.sg email", http.StatusBadRequest), "error", nil)
		return
	}

	payload, err := json.Marshal(input)
	if err != nil {
		w.WriteHeader(http.StatusInternalServerError)
		writeErrorResponse(w, log, ErrorCodeInternalServerError, "Internal server error")
		log.Error(fmt.Sprintf("[%d]: Failed to marshal request body", http.StatusInternalServerError), "error", err)
		return
	}

	req, err := http.NewRequest("POST", otpURL, bytes.NewReader(payload))
	if err != nil {
		w.WriteHeader(http.StatusInternalServerError)
		writeErrorResponse(w, log, ErrorCodeInternalServerError, "Internal server error")
		log.Error(fmt.Sprintf("[%d]: Failed to create request", http.StatusInternalServerError), "error", err)
		return
	}

	req.Header.Set("Content-Type", "application/json")
	req.Header.Set("Authorization", "Bearer "+buildAuthToken(h.cfg.OTPaas.Secret, h.cfg.OTPaas.ID, h.cfg.OTPaas.Namespace))
	req.Header.Set("X-App-Id", h.cfg.OTPaas.ID)
	req.Header.Set("X-App-Namespace", h.cfg.OTPaas.Namespace)

	resp, err := h.client.Do(req)

	if err != nil {
		w.WriteHeader(http.StatusInternalServerError)
		writeErrorResponse(w, log, ErrorCodeInternalServerError, "Internal server error")
		log.Error(fmt.Sprintf("[%d]: Request timeout", http.StatusInternalServerError), "error", err)
		return
	}

	if resp.StatusCode != http.StatusOK {
		w.WriteHeader(http.StatusInternalServerError)
		// TODO: update the error message from figma when available
		writeErrorResponse(w, log, ErrorCodeInvalidAuth, "Something went wrong. Please try again later.")
		log.Error(fmt.Sprintf("[%d]: Authorization failed", resp.StatusCode), "error", err)
		return
	}

	defer func() {
		if err := resp.Body.Close(); err != nil {
			log.Error("Failed to close response body", "error", err)
		}
	}()

	body, err := io.ReadAll(resp.Body)
	if err != nil {
		w.WriteHeader(http.StatusInternalServerError)
		writeErrorResponse(w, log, ErrorCodeInternalServerError, "Internal server error")
		log.Error(fmt.Sprintf("[%d]: Failed to read response body", resp.StatusCode), "error", err)
		return
	}

	var otpResp OTPResponse
	if err := json.Unmarshal(body, &otpResp); err != nil {
		w.WriteHeader(http.StatusBadGateway)
		writeErrorResponse(w, log, ErrorCodeInternalServerError, "Internal server error")
		log.Error(fmt.Sprintf("[%d]: Failed to unmarshal response body", resp.StatusCode), "error", err)
		return
	}

	c, err := r.Cookie("session_id")
	if err != nil {
		id := make([]byte, 32)
		if _, err := rand.Read(id); err != nil {
			w.WriteHeader(http.StatusInternalServerError)
			writeErrorResponse(w, log, ErrorCodeInternalServerError, "Internal server error")
			log.Error(fmt.Sprintf("[%d]: Failed to generate session ID", resp.StatusCode), "error", err)
			return
		}
		sessionID = base64.RawURLEncoding.EncodeToString(id)
	} else {
		sessionID = c.Value
	}

	if otpResp.ID == "" {
		w.WriteHeader(http.StatusInternalServerError)
		writeErrorResponse(w, log, ErrorCodeInternalServerError, "Internal server error")
		log.Error(fmt.Sprintf("[%d]: Failed to get `otp_flow_id` from OTPaas", resp.StatusCode), "error", err)
		return
	}

	store[sessionID] = map[string]string{"otp_flow_id": otpResp.ID}

	cookie := http.Cookie{
		Name:     "session_id",
		Value:    sessionID,
		Path:     "/",
		Secure:   true,
		HttpOnly: true,
		SameSite: http.SameSiteLaxMode,
	}
	http.SetCookie(w, &cookie)

	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusNoContent)

}

func (h *Handler) VerifyOTP(w http.ResponseWriter, r *http.Request) {
	log := middleware.LoggerFromContext(r.Context())
	var otpURL = h.cfg.OTPaas.Host + "/otp"

	c, err := r.Cookie("session_id")
	if err != nil {
		w.WriteHeader(http.StatusInternalServerError)
		writeErrorResponse(w, log, ErrorCodeInternalServerError, "Internal server error")
		log.Error(fmt.Sprintf("[%d]: Missing session_id in cookie", http.StatusInternalServerError), "error", err)
		return
	}

	var input VerifyOTPInput
	if err := json.NewDecoder(r.Body).Decode(&input); err != nil {
		w.WriteHeader(http.StatusBadRequest)
		writeErrorResponse(w, log, ErrorCodeInvalidForm, "One or more input has an error")
		log.Error(fmt.Sprintf("[%d]: Pin not found in request body", http.StatusBadRequest), "error", err)
		return
	}

	if len(input.PIN) != 6 {
		w.WriteHeader(http.StatusBadRequest)
		writeErrorResponse(w, log, ErrorCodeInvalidForm, "One or more input has an error")
		log.Error(fmt.Sprintf("[%d]: Pin is not a valid 6 digit PIN", http.StatusBadRequest), "error", err)
		return
	}

	session, ok := store[c.Value]
	if !ok || session == nil {
		w.WriteHeader(http.StatusUnauthorized)
		// TODO: update the error message from figma when available
		writeErrorResponse(w, log, ErrorCodeInvalidAuth, "Failed to authenticate session.")
		log.Error(fmt.Sprintf("[%d]: Session not found in store", http.StatusUnauthorized), "error", err)
		return
	}

	otpFlowID := session["otp_flow_id"]

	payload, err := json.Marshal(input)
	if err != nil {
		w.WriteHeader(http.StatusInternalServerError)
		writeErrorResponse(w, log, ErrorCodeInternalServerError, "Internal server error")
		log.Error(fmt.Sprintf("[%d]: Failed to marshal request body", http.StatusInternalServerError), "error", err)
		return
	}

	req, err := http.NewRequest("PUT", otpURL+"/"+otpFlowID, bytes.NewReader(payload))
	if err != nil {
		w.WriteHeader(http.StatusInternalServerError)
		writeErrorResponse(w, log, ErrorCodeInternalServerError, "Internal server error")
		log.Error(fmt.Sprintf("[%d]: Failed to create request", http.StatusInternalServerError), "error", err)
		return
	}

	req.Header.Set("Content-Type", "application/json")
	req.Header.Set("Authorization", "Bearer "+buildAuthToken(h.cfg.OTPaas.Secret, h.cfg.OTPaas.ID, h.cfg.OTPaas.Namespace))
	req.Header.Set("X-App-Id", h.cfg.OTPaas.ID)
	req.Header.Set("X-App-Namespace", h.cfg.OTPaas.Namespace)

	resp, err := h.client.Do(req)

	if err != nil {
		w.WriteHeader(http.StatusInternalServerError)
		writeErrorResponse(w, log, ErrorCodeInternalServerError, "Internal server error")
		log.Error(fmt.Sprintf("[%d]: Client timeout", http.StatusInternalServerError), "error", err)
		return
	}

	if resp.StatusCode != http.StatusOK {
		switch resp.StatusCode {
		case http.StatusUnauthorized:
			w.WriteHeader(http.StatusUnauthorized)
			writeErrorResponse(w, log, ErrorCodeInvalidAuth, "Failed to authenticate session.")
			log.Error(fmt.Sprintf("[%d]: Invalid PIN", resp.StatusCode), "error", err)
		case http.StatusNotFound:
			w.WriteHeader(http.StatusUnauthorized)
			writeErrorResponse(w, log, ErrorCodeInvalidAuth, "Failed to authenticate session.")
			log.Error(fmt.Sprintf("[%d]: Pin expired", resp.StatusCode), "error", err)
		case http.StatusGone:
			w.WriteHeader(http.StatusUnauthorized)
			writeErrorResponse(w, log, ErrorCodeInvalidAuth, "Failed to authenticate session.")
			log.Error(fmt.Sprintf("[%d]", resp.StatusCode), "error", err)
			return
		default:
			w.WriteHeader(http.StatusInternalServerError)
			writeErrorResponse(w, log, ErrorCodeInternalServerError, "Internal server error")
			log.Error(fmt.Sprintf("[%d] Internal server error", resp.StatusCode), "error", err)
			return
		}
	}

	defer func() {
		if err := resp.Body.Close(); err != nil {
			log.Error("Failed to close response body", "error", err)
		}
	}()

	body, err := io.ReadAll(resp.Body)
	if err != nil {
		w.WriteHeader(http.StatusInternalServerError)
		writeErrorResponse(w, log, ErrorCodeInternalServerError, "Internal server error")
		log.Error(fmt.Sprintf("[%d]: Failed to read response body", resp.StatusCode), "error", err)
		return
	}

	var verifyOTPResponse VerifyOTPResponse
	if err := json.Unmarshal(body, &verifyOTPResponse); err != nil {
		w.WriteHeader(http.StatusBadGateway)
		writeErrorResponse(w, log, ErrorCodeInternalServerError, "Internal server error")
		log.Error(fmt.Sprintf("[%d]: Failed to unmarshal response body", resp.StatusCode), "error", err)
		return
	}

	w.WriteHeader(http.StatusNoContent)
}
