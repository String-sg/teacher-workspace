package handler_test

import (
	"net/http"
	"net/http/httptest"
	"testing"

	"github.com/String-sg/teacher-workspace/server/internal/handler"
)

func TestNewMux(t *testing.T) {
	mux := handler.NewMux()

	t.Run("GET / returns 200 with body OK", func(t *testing.T) {
		req := httptest.NewRequest(http.MethodGet, "/", nil)
		w := httptest.NewRecorder()
		mux.ServeHTTP(w, req)

		if want, got := http.StatusOK, w.Code; want != got {
			t.Fatalf("want: %d; got: %d", want, got)
		}
		if want, got := "OK", w.Body.String(); want != got {
			t.Fatalf("want: %q; got: %q", want, got)
		}
		if want, got := "text/plain; charset=utf-8", w.Header().Get("Content-Type"); want != got {
			t.Fatalf("want: %q; got: %q", want, got)
		}
	})

	t.Run("GET /unknown returns 404", func(t *testing.T) {
		req := httptest.NewRequest(http.MethodGet, "/unknown", nil)
		w := httptest.NewRecorder()
		mux.ServeHTTP(w, req)

		if want, got := http.StatusNotFound, w.Code; want != got {
			t.Fatalf("want: %d; got: %d", want, got)
		}
	})

	t.Run("POST / returns 405", func(t *testing.T) {
		req := httptest.NewRequest(http.MethodPost, "/", nil)
		w := httptest.NewRecorder()
		mux.ServeHTTP(w, req)

		if want, got := http.StatusMethodNotAllowed, w.Code; want != got {
			t.Fatalf("want: %d; got: %d", want, got)
		}
	})
}
