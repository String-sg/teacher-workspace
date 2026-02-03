package middleware

import "net/http"

type Middleware func(http.Handler) http.Handler

// Chain applies the given middleware to the handler in order and returns the
// resulting composed handler. Middleware are applied from left to right, so
// the first middleware in the list is the outermost one.
func Chain(h http.Handler, m ...Middleware) http.Handler {
	for i := len(m) - 1; i >= 0; i-- {
		h = m[i](h)
	}
	return h
}
