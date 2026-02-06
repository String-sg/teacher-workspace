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
	c, err := r.Cookie("session_id")
	store["session_id"] = map[string]string{"otp_flow_id": "123"}
	fmt.Println(store["session_id"])

	if err != nil {
		id := make([]byte, 32)
		if _, err := rand.Read(id); err != nil {
			w.WriteHeader(http.StatusInternalServerError)
			return
		}

		sessionID := base64.RawURLEncoding.EncodeToString(id)

		cookie := http.Cookie{
			Name:     "session_id",
			Value:    sessionID,
			Path:     "/",
			Secure:   true,
			HttpOnly: true,
			SameSite: http.SameSiteLaxMode,
		}
		http.SetCookie(w, &cookie)
	} else {
		cookie := http.Cookie{
			Name:     "session_id",
			Value:    c.Value,
			Path:     "/",
			Secure:   true,
			HttpOnly: true,
			SameSite: http.SameSiteLaxMode,
		}
		http.SetCookie(w, &cookie)
	}

	bodyBytes, err := io.ReadAll(r.Body)
	if err != nil {
		fmt.Println("There is an error")
	} else {
		fmt.Println("No error")
	}

	bodyString := string(bodyBytes)
	fmt.Println("Body String:", bodyString)

	w.WriteHeader(http.StatusOK)
	w.Write(bodyBytes)
}

func VerifyOTP(w http.ResponseWriter, r *http.Request) {
	cookie, err := r.Cookie("session_id")
	if err != nil {
		fmt.Println("There is an error")
	} else {
		fmt.Println(cookie.Value)
	}

	w.WriteHeader(http.StatusOK)
	w.Write([]byte(cookie.Value))
}
