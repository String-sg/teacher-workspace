package routes

import (
	"net/http"
	"net/http/httptest"
	"strings"
	"testing"

	"github.com/String-sg/teacher-workspace/server/internal/config"
	"github.com/String-sg/teacher-workspace/server/pkg/require"
)

func resetStore() {
	store = make(map[string]map[string]string)
}

func TestRequestOTP_WithCookie(t *testing.T) {
	h := &Handler{cfg: config.Default()}
	resetStore()

	req := httptest.NewRequest(http.MethodPost, "/api/otp/request", strings.NewReader("yes"))
	req.AddCookie(&http.Cookie{Name: "session_id", Value: "abc"})
	rec := httptest.NewRecorder()

	h.RequestOTP(rec, req)

	res := rec.Result()
	require.Equal(t, http.StatusOK, res.StatusCode)

	// Should set/refresh the same cookie value.
	var got *http.Cookie
	for _, c := range res.Cookies() {
		if c.Name == "session_id" {
			got = c
			break
		}
	}
	require.True(t, got != nil)
	require.Equal(t, "abc", got.Value)

	session, ok := store["abc"]
	require.True(t, ok)
	require.Equal(t, "123", session["otp_flow_id"])
}

func TestRequestOTP_NoCookie(t *testing.T) {
	h := &Handler{cfg: config.Default()}
	resetStore()

	req := httptest.NewRequest(http.MethodPost, "/api/otp/request", strings.NewReader("yes"))
	rec := httptest.NewRecorder()

	h.RequestOTP(rec, req)

	res := rec.Result()
	require.Equal(t, http.StatusOK, res.StatusCode)
	require.Equal(t, "yes", rec.Body.String())

	cookies := res.Cookies()
	require.True(t, len(cookies) > 0)

	var sessionCookie *http.Cookie
	for _, c := range cookies {
		if c.Name == "session_id" {
			sessionCookie = c
			break
		}
	}
	require.True(t, sessionCookie != nil)
	require.NotEqual(t, "", sessionCookie.Value)

	session, ok := store[sessionCookie.Value]
	require.True(t, ok)
	require.Equal(t, "123", session["otp_flow_id"])
}

func TestVerifyOTP_KnownSession(t *testing.T) {
	h := &Handler{cfg: config.Default()}
	resetStore()
	store["abc"] = map[string]string{"otp_flow_id": "123"}

	req := httptest.NewRequest(http.MethodPost, "/api/otp/verify", nil)
	req.AddCookie(&http.Cookie{Name: "session_id", Value: "abc"})
	rec := httptest.NewRecorder()

	h.VerifyOTP(rec, req)

	res := rec.Result()
	require.Equal(t, http.StatusOK, res.StatusCode)
	require.Equal(t, "123", rec.Body.String())
}

func TestVerifyOTP_MissingCookie(t *testing.T) {
	h := &Handler{cfg: config.Default()}
	resetStore()

	req := httptest.NewRequest(http.MethodPost, "/api/otp/verify", nil)
	rec := httptest.NewRecorder()

	h.VerifyOTP(rec, req)

	res := rec.Result()
	require.Equal(t, http.StatusUnauthorized, res.StatusCode)
}

func TestVerifyOTP_UnknownSession(t *testing.T) {
	h := &Handler{cfg: config.Default()}
	resetStore()

	req := httptest.NewRequest(http.MethodPost, "/api/otp/verify", nil)
	req.AddCookie(&http.Cookie{Name: "session_id", Value: "abc"})
	rec := httptest.NewRecorder()

	h.VerifyOTP(rec, req)

	res := rec.Result()
	require.Equal(t, http.StatusUnauthorized, res.StatusCode)
}
