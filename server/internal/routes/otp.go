package routes

import (
	"bytes"
	"crypto/hmac"
	"crypto/rand"
	"crypto/sha256"
	"encoding/base64"
	"encoding/hex"
	"encoding/json"
	"io"
	"net/http"
	"strings"
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

func buildAuthToken(appSecret string, appId string, appNamespace string) string {
	h := hmac.New(sha256.New, []byte(appSecret))
	h.Write([]byte(appId))

	secret := hex.EncodeToString(h.Sum(nil))
	combined := appNamespace + ":" + appId + ":" + secret

	return base64.StdEncoding.EncodeToString([]byte(combined))
}

func (h *Handler) RequestOTP(w http.ResponseWriter, r *http.Request) {
	var otpURL = h.cfg.OTPaas.Host + "/otp"
	var sessionID string

	var input RequestOTPInput
	if err := json.NewDecoder(r.Body).Decode(&input); err != nil {
		w.WriteHeader(http.StatusBadRequest)
		w.Write([]byte("Missing email in request body."))
		return
	}

	if !strings.HasSuffix(input.Email, ".gov.sg") {
		w.WriteHeader(http.StatusBadRequest)
		w.Write([]byte("Invalid email"))
		return
	}

	payload, err := json.Marshal(input)
	if err != nil {
		w.WriteHeader(http.StatusInternalServerError)
		return
	}

	req, err := http.NewRequest("POST", otpURL, bytes.NewReader(payload))
	if err != nil {
		w.WriteHeader(http.StatusInternalServerError)
		return
	}

	req.Header.Set("Content-Type", "application/json")
	req.Header.Set("Authorization", "Bearer "+buildAuthToken(h.cfg.OTPaas.Secret, h.cfg.OTPaas.ID, h.cfg.OTPaas.Namespace))
	req.Header.Set("X-App-Id", h.cfg.OTPaas.ID)
	req.Header.Set("X-App-Namespace", h.cfg.OTPaas.Namespace)

	resp, err := h.client.Do(req)

	if resp.StatusCode != http.StatusOK {
		w.WriteHeader(http.StatusInternalServerError)
		w.Write([]byte("Failed to request OTP."))
		return
	}

	if err != nil {
		w.WriteHeader(http.StatusInternalServerError)
		return
	}

	defer resp.Body.Close()

	body, err := io.ReadAll(resp.Body)
	if err != nil {
		w.WriteHeader(http.StatusInternalServerError)
		return
	}

	var otpResp OTPResponse
	if err := json.Unmarshal(body, &otpResp); err != nil {
		w.WriteHeader(http.StatusBadGateway)
		return
	}

	c, err := r.Cookie("session_id")
	if err != nil {
		id := make([]byte, 32)
		if _, err := rand.Read(id); err != nil {
			w.WriteHeader(http.StatusInternalServerError)
			return
		}
		sessionID = base64.RawURLEncoding.EncodeToString(id)
	} else {
		sessionID = c.Value
	}

	if otpResp.ID == "" {
		w.WriteHeader(http.StatusInternalServerError)
		w.Write([]byte("Failed to request OTP."))
		return
	}

	store[sessionID] = map[string]string{"otp_flow_id": otpResp.ID}

	cookie := http.Cookie{
		Name:     "session_id",
		Value:    sessionID,
		Path:     "/",
		Secure:   false,
		HttpOnly: true,
		SameSite: http.SameSiteLaxMode,
	}
	http.SetCookie(w, &cookie)

	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusNoContent)

}

func (h *Handler) VerifyOTP(w http.ResponseWriter, r *http.Request) {
	var otpURL = h.cfg.OTPaas.Host + "/otp"

	c, err := r.Cookie("session_id")
	if err != nil {
		w.WriteHeader(http.StatusInternalServerError)
		w.Write([]byte("Missing session_id in cookie."))
		return
	}

	var input VerifyOTPInput
	if err := json.NewDecoder(r.Body).Decode(&input); err != nil {
		w.WriteHeader(http.StatusBadRequest)
		w.Write([]byte("Missing pin in request body."))
		return
	}

	if len(input.PIN) != 6 {
		w.WriteHeader(http.StatusBadRequest)
		w.Write([]byte("Invalid pin"))
		return
	}

	session, ok := store[c.Value]
	if !ok || session == nil {
		w.WriteHeader(http.StatusUnauthorized)
		w.Write([]byte("Missing session in store."))
		return
	}

	otpFlowID := session["otp_flow_id"]

	payload, err := json.Marshal(input)
	if err != nil {
		w.WriteHeader(http.StatusInternalServerError)
		return
	}

	req, err := http.NewRequest("PUT", otpURL+"/"+otpFlowID, bytes.NewReader(payload))
	if err != nil {
		w.WriteHeader(http.StatusInternalServerError)
		return
	}

	req.Header.Set("Content-Type", "application/json")
	req.Header.Set("Authorization", "Bearer "+buildAuthToken(h.cfg.OTPaas.Secret, h.cfg.OTPaas.ID, h.cfg.OTPaas.Namespace))
	req.Header.Set("X-App-Id", h.cfg.OTPaas.ID)
	req.Header.Set("X-App-Namespace", h.cfg.OTPaas.Namespace)

	resp, err := h.client.Do(req)

	if resp.StatusCode != http.StatusOK {
		switch resp.StatusCode {
		case http.StatusUnauthorized:
			w.WriteHeader(http.StatusUnauthorized)
			w.Write([]byte("Invalid PIN."))
		case http.StatusNotFound:
			w.WriteHeader(http.StatusUnauthorized)
			w.Write([]byte("PIN expired."))
		default:
			w.WriteHeader(http.StatusInternalServerError)
			w.Write([]byte("Failed to verify OTP."))
			return
		}
	}

	if err != nil {
		w.WriteHeader(http.StatusInternalServerError)
		return
	}

	defer resp.Body.Close()

	body, err := io.ReadAll(resp.Body)
	if err != nil {
		w.WriteHeader(http.StatusInternalServerError)
		return
	}

	var verifyOTPResponse VerifyOTPResponse
	if err := json.Unmarshal(body, &verifyOTPResponse); err != nil {
		w.WriteHeader(http.StatusBadGateway)
		return
	}

	w.WriteHeader(http.StatusNoContent)

}
