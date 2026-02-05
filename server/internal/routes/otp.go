package routes

import (
	"fmt"
	"net/http"
)

func RequestOTP(w http.ResponseWriter, r *http.Request) {
	cookie := http.Cookie{
		Name:     "session_id",
		Value:    "123456",
		Path:     "/",
		Secure:   true,
		HttpOnly: true,
		SameSite: http.SameSiteLaxMode,
	}
	http.SetCookie(w, &cookie)

	w.WriteHeader(http.StatusOK)
	w.Write([]byte("RequestOTP"))

}

func VerifyOTP(w http.ResponseWriter, r *http.Request) {
	w.WriteHeader(http.StatusOK)
	w.Write([]byte("VerifyOTP"))

	cookie, err := r.Cookie("session_id")
	if err != nil {
		fmt.Println("There is an error")
	} else {
		fmt.Println(cookie.Value)
	}
}
