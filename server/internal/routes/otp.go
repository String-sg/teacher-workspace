package routes

import "net/http"

func RequestOTP(w http.ResponseWriter, r *http.Request) {
	w.WriteHeader(http.StatusOK)
	w.Write([]byte("RequestOTP"))
}

func VerifyOTP(w http.ResponseWriter, r *http.Request) {
	w.WriteHeader(http.StatusOK)
	w.Write([]byte("VerifyOTP"))
}
