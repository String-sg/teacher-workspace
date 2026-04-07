package pg

import (
	"embed"
	"net/http"
)

//go:embed fixtures
var fixtures embed.FS

func (h *Handler) registerMock(mux *http.ServeMux) {
	mux.HandleFunc("GET /api/web/2/staff/announcements", serveFixture("fixtures/announcements.json"))
}

func serveFixture(path string) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		data, err := fixtures.ReadFile(path)
		if err != nil {
			http.Error(w, "fixture not found", http.StatusNotFound)
			return
		}

		w.Header().Set("Content-Type", "application/json; charset=UTF-8")
		w.Header().Set("X-Content-Type-Options", "nosniff")
		w.WriteHeader(http.StatusOK)
		_, _ = w.Write(data)
	}
}
