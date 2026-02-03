package routes

import (
	"net/http"
	"net/http/httptest"
	"testing"

	"github.com/String-sg/teacher-workspace/server/pkg/require"
)

func TestIndex(t *testing.T) {
	req := httptest.NewRequest(http.MethodGet, "/", nil)
	rec := httptest.NewRecorder()

	Index(rec, req)

	res := rec.Result()
	require.Equal(t, http.StatusOK, res.StatusCode)
	require.Equal(t, "Hello, World!", rec.Body.String())
}
