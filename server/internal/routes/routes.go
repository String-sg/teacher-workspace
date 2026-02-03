package routes

import "net/http"

// Register attaches all application routes to the provided ServeMux.
func Register(mux *http.ServeMux) {
	mux.HandleFunc("/", Index)
}
