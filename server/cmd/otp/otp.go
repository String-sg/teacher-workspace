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
	"fmt"
	"io"
	"mime"
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

// ------------------------------------------- REQUEST OTP -------------------------------------------

func (h *Handler) Request(w http.ResponseWriter, r *http.Request) {
	logger := middleware.LoggerFromContext(r.Context())

	mediaType, _, err := mime.ParseMediaType(r.Header.Get(HeaderContentType))
	if err != nil || mediaType != MIMEApplicationJSON {
		h.renderJSON(r, w, http.StatusUnsupportedMediaType, ErrorResponse{
			Message: http.StatusText(http.StatusUnsupportedMediaType),
		})
		return
	}

	var body struct {
		Email string `json:"email"`
	}

	if err := json.NewDecoder(r.Body).Decode(&body); err != nil {
		h.renderJSON(r, w, http.StatusBadRequest, ErrorResponse{
			Message: "One or more input has an error",
		})
		return
	}

	body.Email = strings.TrimSpace(body.Email)
	if body.Email == "" {
		h.renderJSON(r, w, http.StatusUnprocessableEntity, ErrorResponse{
			Message: "One or more input has an error",
		})
		return
	}

	if !isAllowedEmail(body.Email, h.cfg.Environment) {
		h.renderJSON(r, w, http.StatusUnprocessableEntity, ErrorResponse{
			Message: "One or more input has an error",
		})
		return
	}

	payload, err := json.Marshal(map[string]string{"email": body.Email})
	if err != nil {
		h.renderJSON(r, w, http.StatusInternalServerError, ErrorResponse{
			Message: "Internal server error",
		})
		logger.Error("failed to marshal request body", "err", err)
		return
	}

	req, err := http.NewRequest(http.MethodPost, h.cfg.OTPaaS.Host+"/otp", bytes.NewReader(payload))
	if err != nil {
		h.renderJSON(r, w, http.StatusInternalServerError, ErrorResponse{
			Message: "Internal server error",
		})
		logger.Error("failed to create request", "err", err)
		return
	}

	req.Header.Set("Content-Type", "application/json")
	req.Header.Set("Authorization", "Bearer "+buildAuthToken(h.cfg.OTPaaS.AppID, h.cfg.OTPaaS.AppNamespace, h.cfg.OTPaaS.Secret))
	req.Header.Set("X-App-Id", h.cfg.OTPaaS.AppID)
	req.Header.Set("X-App-Namespace", h.cfg.OTPaaS.AppNamespace)

	resp, err := h.client.Do(req)
	if err != nil {
		if errors.Is(err, context.DeadlineExceeded) {
			h.renderJSON(r, w, http.StatusGatewayTimeout, ErrorResponse{
				Message: "Request timeout. Please try again later.",
			})
			logger.Error("OTPaas request timeout", "err", err)
			return
		}
		h.renderJSON(r, w, http.StatusInternalServerError, ErrorResponse{
			Message: "Internal server error",
		})
		logger.Error("error sending request to OTPaas", "err", err)
		return
	}

	defer func() {
		_ = resp.Body.Close()
	}()

	bodyBytes, err := io.ReadAll(resp.Body)
	if err != nil {
		h.renderJSON(r, w, http.StatusInternalServerError, ErrorResponse{
			Message: "Internal server error",
		})
		logger.Error("failed to read response body", "err", err, "otpaas_status_code", resp.StatusCode)
		return
	}

	if resp.StatusCode != http.StatusOK {
		var detail struct {
			Code    int    `json:"code"`
			Message string `json:"message"`
		}
		_ = json.Unmarshal(bodyBytes, &detail)

		switch resp.StatusCode {
		case http.StatusBadRequest:
			if detail.Code == 2008 {
				h.renderJSON(r, w, http.StatusTooManyRequests, ErrorResponse{
					Message: "Too many requests. Please try again later.",
				})
				return
			}
			h.renderJSON(r, w, http.StatusBadRequest, ErrorResponse{
				Message: fmt.Sprintf("Bad request (code %d): %q", detail.Code, detail.Message),
			})
			return
		case http.StatusUnauthorized:
			h.renderJSON(r, w, http.StatusUnauthorized, ErrorResponse{
				Message: "Unauthorized",
			})
			return
		case http.StatusForbidden:
			if detail.Code == 2005 {
				h.renderJSON(r, w, http.StatusForbidden, ErrorResponse{
					Message: "Forbidden",
				})
				return
			}
			h.renderJSON(r, w, http.StatusForbidden, ErrorResponse{
				Message: fmt.Sprintf("Forbidden (code %d): %q", detail.Code, detail.Message),
			})
			return
		default:
			h.renderJSON(r, w, http.StatusInternalServerError, ErrorResponse{
				Message: fmt.Sprintf("Unexpected status %d (code %d): %q", resp.StatusCode, detail.Code, detail.Message),
			})
			return
		}
	}

	var otpResp struct {
		ID string `json:"id"`
	}

	if err := json.Unmarshal(bodyBytes, &otpResp); err != nil {
		h.renderJSON(r, w, http.StatusInternalServerError, ErrorResponse{
			Message: "Invalid OTPaas response",
		})
		logger.Error("failed to unmarshal response body", "err", err, "otpaas_status_code", resp.StatusCode)
		return
	}

	if otpResp.ID == "" {
		h.renderJSON(r, w, http.StatusInternalServerError, ErrorResponse{
			Message: "Missing id from OTPaas",
		})
		logger.Error("failed to get id from OTPaas", "otpaas_status_code", resp.StatusCode)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusOK)

	if err := json.NewEncoder(w).Encode(map[string]string{"flow_id": otpResp.ID}); err != nil {
		logger.Warn("failed to encode response", "err", err)
	}
}

// ------------------------------------------- VERIFY OTP -------------------------------------------

func (h *Handler) Verify(w http.ResponseWriter, r *http.Request) {
	logger := middleware.LoggerFromContext(r.Context())

	flowID := r.PathValue("flow_id")

	mediaType, _, err := mime.ParseMediaType(r.Header.Get(HeaderContentType))
	if err != nil || mediaType != MIMEApplicationJSON {
		h.renderJSON(r, w, http.StatusUnsupportedMediaType, ErrorResponse{
			Message: http.StatusText(http.StatusUnsupportedMediaType),
		})
		return
	}

	var body struct {
		PIN string `json:"pin"`
	}

	if err := json.NewDecoder(r.Body).Decode(&body); err != nil {
		h.renderJSON(r, w, http.StatusBadRequest, ErrorResponse{
			Message: "One or more input has an error",
		})
		return
	}

	if body.PIN == "" {
		h.renderJSON(r, w, http.StatusUnprocessableEntity, ErrorResponse{
			Message: "One or more input has an error",
		})
		return
	}
	if len(body.PIN) != 6 {
		h.renderJSON(r, w, http.StatusUnprocessableEntity, ErrorResponse{
			Message: "One or more input has an error",
		})
		return
	}

	payload, err := json.Marshal(map[string]string{"pin": body.PIN})
	if err != nil {
		h.renderJSON(r, w, http.StatusInternalServerError, ErrorResponse{
			Message: "Internal server error",
		})
		logger.Error("failed to marshal request body", "err", err)
		return
	}

	req, err := http.NewRequest("PUT", h.cfg.OTPaaS.Host+"/otp/"+flowID, bytes.NewReader(payload))
	if err != nil {
		h.renderJSON(r, w, http.StatusInternalServerError, ErrorResponse{
			Message: "Internal server error",
		})
		logger.Error("failed to create request", "err", err)
		return
	}

	req.Header.Set("Content-Type", "application/json")
	req.Header.Set("Authorization", "Bearer "+buildAuthToken(h.cfg.OTPaaS.AppID, h.cfg.OTPaaS.AppNamespace, h.cfg.OTPaaS.Secret))
	req.Header.Set("X-App-Id", h.cfg.OTPaaS.AppID)
	req.Header.Set("X-App-Namespace", h.cfg.OTPaaS.AppNamespace)

	resp, err := h.client.Do(req)
	if err != nil {
		if errors.Is(err, context.DeadlineExceeded) {
			h.renderJSON(r, w, http.StatusGatewayTimeout, ErrorResponse{
				Message: "Request timeout. Please try again later.",
			})
			logger.Error("OTPaas request timeout", "err", err)
			return
		}
		h.renderJSON(r, w, http.StatusBadGateway, ErrorResponse{
			Message: "Internal server error",
		})
		logger.Error("error sending request to OTPaas", "err", err)
		return
	}

	defer func() {
		_ = resp.Body.Close()
	}()

	if resp.StatusCode != http.StatusOK {
		respBody, err := io.ReadAll(resp.Body)
		if err != nil {
			h.renderJSON(r, w, http.StatusInternalServerError, ErrorResponse{
				Message: "Internal server error",
			})
			logger.Error("failed to read response body", "err", err, "otpaas_status_code", resp.StatusCode)
			return
		}

		var detail struct {
			Code    int    `json:"code"`
			Message string `json:"message"`
		}
		_ = json.Unmarshal(respBody, &detail)

		switch resp.StatusCode {
		case http.StatusUnauthorized:
			if detail.Code == 1006 {
				h.renderJSON(r, w, http.StatusUnprocessableEntity, ErrorResponse{
					Message: "Invalid PIN",
				})
				return
			}
			h.renderJSON(r, w, http.StatusUnauthorized, ErrorResponse{
				Message: "Unauthorized",
			})
			return
		case http.StatusNotFound:
			h.renderJSON(r, w, http.StatusNotFound, ErrorResponse{
				Message: "Flow expired",
			})
			return
		default:
			h.renderJSON(r, w, http.StatusInternalServerError, ErrorResponse{
				Message: fmt.Sprintf("Unexpected status %d (code %d): %q", resp.StatusCode, detail.Code, detail.Message),
			})
			return
		}
	}

	w.WriteHeader(http.StatusNoContent)
}
