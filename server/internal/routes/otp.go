package routes

import (
	"crypto/rand"
	"encoding/base64"
	"fmt"
	"io"
	"net/http"
)

var store = make(map[string]map[string]string)

func RequestOTP(w http.ResponseWriter, r *http.Request) {
	var sessionID string

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

	store[sessionID] = map[string]string{"otp_flow_id": "123"}

	cookie := http.Cookie{
		Name:     "session_id",
		Value:    sessionID,
		Path:     "/",
		Secure:   false,
		HttpOnly: true,
		SameSite: http.SameSiteLaxMode,
	}
	http.SetCookie(w, &cookie)

	bodyBytes, err := io.ReadAll(r.Body)
	if err != nil {
		fmt.Println("There is an error")
	} else {
		fmt.Println("No error")
	}

	w.WriteHeader(http.StatusOK)
	w.Write(bodyBytes)
}

func VerifyOTP(w http.ResponseWriter, r *http.Request) {
	c, err := r.Cookie("session_id")
	if err != nil {
		w.WriteHeader(http.StatusUnauthorized)
		return
	}

	session, ok := store[c.Value]

	if !ok || session == nil {
		w.WriteHeader(http.StatusUnauthorized)
		return
	}

	otpFlowID := session["otp_flow_id"]

	w.WriteHeader(http.StatusOK)
	w.Write([]byte(otpFlowID))
}
