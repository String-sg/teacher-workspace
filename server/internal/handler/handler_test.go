package handler

import (
	"errors"
	"net/http"
	"net/http/httptest"
	"testing"

	"github.com/String-sg/teacher-workspace/server/pkg/require"
)

func TestHandler_renderHTML(t *testing.T) {
	t.Run("renders response with correct status, headers, and body", func(t *testing.T) {
		h := &Handler{
			executor: &stubExecutor{body: "<html>Hello World</html>"},
		}

		req := httptest.NewRequest(http.MethodGet, "/", nil)
		rec := httptest.NewRecorder()

		h.renderHTML(req, rec, nil)

		require.Equal(t, http.StatusOK, rec.Code)
		require.Equal(t, MIMETextHTMLCharsetUTF8, rec.Header().Get(HeaderContentType))
		require.Equal(t, "nosniff", rec.Header().Get(HeaderXContentTypeOptions))
		require.Equal(t, "<html>Hello World</html>", rec.Body.String())
	})

	t.Run("does not panic when executor returns an error", func(t *testing.T) {
		h := &Handler{
			executor: &errorExecutor{err: errors.New("template broken")},
		}

		req := httptest.NewRequest(http.MethodGet, "/", nil)
		rec := httptest.NewRecorder()

		h.renderHTML(req, rec, nil)

		require.Equal(t, http.StatusOK, rec.Code)
	})
}
