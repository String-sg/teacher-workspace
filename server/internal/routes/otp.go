package routes

import (
	"fmt"
	"io"
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
