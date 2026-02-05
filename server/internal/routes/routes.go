package routes

import "net/http"

// Register attaches all application routes to the provided ServeMux.
func Register(mux *http.ServeMux) {
	mux.HandleFunc("/", Index)
	mux.HandleFunc("POST /api/otp/request", RequestOTP)
	mux.HandleFunc("POST /api/otp/verify", VerifyOTP)
}
