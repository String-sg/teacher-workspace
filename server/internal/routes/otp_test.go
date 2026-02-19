package routes

import (
	"bytes"
	"encoding/json"
	"io"
	"net/http"
	"net/http/httptest"
	"testing"
	"time"

	"github.com/String-sg/teacher-workspace/server/internal/config"
	"github.com/String-sg/teacher-workspace/server/pkg/require"
)

func resetStore() {
	store = make(map[string]map[string]string)
}

type RoundTripperFunc func(*http.Request) (*http.Response, error)

func (f RoundTripperFunc) RoundTrip(r *http.Request) (*http.Response, error) {
	return f(r)
}
func TestRequestOTP_SuccessProduction(t *testing.T) {
	rt := RoundTripperFunc(func(req *http.Request) (*http.Response, error) {
		return &http.Response{StatusCode: http.StatusOK, Body: io.NopCloser(bytes.NewReader([]byte(`{"id": "123"}`)))}, nil
	})

	cfg := config.Default()
	cfg.Environment = config.EnvironmentProduction
	h := &Handler{cfg: cfg, client: &http.Client{Transport: rt}}
	resetStore()

	payload := map[string]string{"email": "test@schools.gov.sg"}
	b, _ := json.Marshal(payload)

	req := httptest.NewRequest(http.MethodPost, "/otp/request", bytes.NewReader(b))

	req.AddCookie(&http.Cookie{Name: "session_id", Value: "abc"})
	rec := httptest.NewRecorder()

	h.RequestOTP(rec, req)

	res := rec.Result()

	require.Equal(t, http.StatusOK, res.StatusCode)

	var gotOTPResponse requestOTPResponse
	require.NoError(t, json.Unmarshal(rec.Body.Bytes(), &gotOTPResponse))
	require.Equal(t, "123", gotOTPResponse.ID)

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

func TestRequestOTP_SuccessDevelopment(t *testing.T) {
	rt := RoundTripperFunc(func(req *http.Request) (*http.Response, error) {
		return &http.Response{StatusCode: http.StatusOK, Body: io.NopCloser(bytes.NewReader([]byte(`{"id": "123"}`)))}, nil
	})

	cfg := config.Default()
	cfg.Environment = config.EnvironmentDevelopment
	h := &Handler{cfg: cfg, client: &http.Client{Transport: rt}}
	resetStore()

	payload := map[string]string{"email": "test@tech.gov.sg"}
	b, _ := json.Marshal(payload)

	req := httptest.NewRequest(http.MethodPost, "/otp/request", bytes.NewReader(b))

	req.AddCookie(&http.Cookie{Name: "session_id", Value: "abc"})
	rec := httptest.NewRecorder()

	h.RequestOTP(rec, req)

	res := rec.Result()

	require.Equal(t, http.StatusOK, res.StatusCode)

	var gotOTPResponse requestOTPResponse
	require.NoError(t, json.Unmarshal(rec.Body.Bytes(), &gotOTPResponse))
	require.Equal(t, "123", gotOTPResponse.ID)

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

func TestRequestOTP_MissingEmail(t *testing.T) {
	h := &Handler{cfg: config.Default(), client: &http.Client{}}
	resetStore()

	req := httptest.NewRequest(http.MethodPost, "/otp/request", nil)
	rec := httptest.NewRecorder()

	h.RequestOTP(rec, req)

	res := rec.Result()
	require.Equal(t, http.StatusBadRequest, res.StatusCode)

	var got errorResponse
	require.NoError(t, json.Unmarshal(rec.Body.Bytes(), &got))
	require.Equal(t, "INVALID_FORM", got.Code)
	require.Equal(t, "One or more input has an error", got.Message)
}

func TestRequestOTP_InvalidEmail(t *testing.T) {
	h := &Handler{cfg: config.Default(), client: &http.Client{}}
	resetStore()

	payload := map[string]string{"email": "test@example.com"}
	b, _ := json.Marshal(payload)

	req := httptest.NewRequest(http.MethodPost, "/otp/request", bytes.NewReader(b))
	rec := httptest.NewRecorder()

	h.RequestOTP(rec, req)

	res := rec.Result()
	require.Equal(t, http.StatusUnprocessableEntity, res.StatusCode)

	var got errorResponse
	require.NoError(t, json.Unmarshal(rec.Body.Bytes(), &got))
	require.Equal(t, "INVALID_FORM", got.Code)
	require.Equal(t, "One or more input has an error", got.Message)
}

func TestRequestOTP_InvalidEmailProduction(t *testing.T) {
	cfg := config.Default()
	cfg.Environment = config.EnvironmentProduction
	h := &Handler{cfg: cfg, client: &http.Client{}}
	resetStore()

	payload := map[string]string{"email": "test@tech.gov.sg"}
	b, _ := json.Marshal(payload)

	req := httptest.NewRequest(http.MethodPost, "/otp/request", bytes.NewReader(b))
	rec := httptest.NewRecorder()

	h.RequestOTP(rec, req)

	res := rec.Result()
	require.Equal(t, http.StatusUnprocessableEntity, res.StatusCode)

	var got errorResponse
	require.NoError(t, json.Unmarshal(rec.Body.Bytes(), &got))
	require.Equal(t, "INVALID_FORM", got.Code)
	require.Equal(t, "One or more input has an error", got.Message)
}

func TestRequestOTP_Timeout(t *testing.T) {
	rt := RoundTripperFunc(func(req *http.Request) (*http.Response, error) {
		select {
		case <-req.Context().Done():
			return nil, req.Context().Err()
		case <-time.After(200 * time.Millisecond):
			return &http.Response{
				StatusCode: http.StatusOK,
				Body:       io.NopCloser(bytes.NewReader([]byte(`{"id":"123"}`))),
			}, nil
		}
	})

	h := &Handler{cfg: config.Default(), client: &http.Client{Timeout: 10 * time.Millisecond, Transport: rt}}
	resetStore()

	payload := map[string]string{"email": "test@schools.gov.sg"}
	b, _ := json.Marshal(payload)

	req := httptest.NewRequest(http.MethodPost, "/otp/request", bytes.NewReader(b))

	req.AddCookie(&http.Cookie{Name: "session_id", Value: "abc"})
	rec := httptest.NewRecorder()

	h.RequestOTP(rec, req)

	res := rec.Result()

	require.Equal(t, http.StatusGatewayTimeout, res.StatusCode)
	require.Equal(t, "text/plain; charset=utf-8", res.Header.Get("Content-Type"))
	require.Equal(t, "Request timeout. Please try again later.\n", rec.Body.String())
}

func TestRequestOTP_NotAuthorized(t *testing.T) {
	rt := RoundTripperFunc(func(req *http.Request) (*http.Response, error) {
		return &http.Response{StatusCode: http.StatusUnauthorized, Body: io.NopCloser(bytes.NewReader([]byte(`{}`)))}, nil
	})

	h := &Handler{cfg: config.Default(), client: &http.Client{Transport: rt}}
	resetStore()

	payload := map[string]string{"email": "test@schools.gov.sg"}
	b, _ := json.Marshal(payload)

	req := httptest.NewRequest(http.MethodPost, "/otp/request", bytes.NewReader(b))
	rec := httptest.NewRecorder()

	h.RequestOTP(rec, req)

	res := rec.Result()

	require.Equal(t, http.StatusInternalServerError, res.StatusCode)
	require.Equal(t, "text/plain; charset=utf-8", res.Header.Get("Content-Type"))
	require.Equal(t, "Something went wrong. Please try again later.\n", rec.Body.String())
}

func TestRequestOTP_InternalServerError(t *testing.T) {
	rt := RoundTripperFunc(func(req *http.Request) (*http.Response, error) {
		return &http.Response{StatusCode: http.StatusInternalServerError, Body: io.NopCloser(bytes.NewReader([]byte(`{}`)))}, nil
	})

	h := &Handler{cfg: config.Default(), client: &http.Client{Transport: rt}}
	resetStore()

	payload := map[string]string{"email": "test@schools.gov.sg"}
	b, _ := json.Marshal(payload)

	req := httptest.NewRequest(http.MethodPost, "/otp/request", bytes.NewReader(b))
	rec := httptest.NewRecorder()

	h.RequestOTP(rec, req)

	res := rec.Result()
	require.Equal(t, http.StatusInternalServerError, res.StatusCode)
	require.Equal(t, "text/plain; charset=utf-8", res.Header.Get("Content-Type"))
	require.Equal(t, "Something went wrong. Please try again later.\n", rec.Body.String())
}

func TestRequestOTP_MissingOTPFlowID(t *testing.T) {
	rt := RoundTripperFunc(func(req *http.Request) (*http.Response, error) {
		return &http.Response{StatusCode: http.StatusOK, Body: io.NopCloser(bytes.NewReader([]byte(`{}`)))}, nil
	})

	h := &Handler{cfg: config.Default(), client: &http.Client{Transport: rt}}
	resetStore()

	payload := map[string]string{"email": "test@schools.gov.sg"}
	b, _ := json.Marshal(payload)

	req := httptest.NewRequest(http.MethodPost, "/otp/request", bytes.NewReader(b))
	rec := httptest.NewRecorder()

	h.RequestOTP(rec, req)

	res := rec.Result()
	require.Equal(t, http.StatusInternalServerError, res.StatusCode)
	require.Equal(t, "text/plain; charset=utf-8", res.Header.Get("Content-Type"))
	require.Equal(t, "Internal server error\n", rec.Body.String())

	cookies := res.Cookies()
	require.True(t, len(cookies) == 0)
}

func TestVerifyOTP_Success(t *testing.T) {
	rt := RoundTripperFunc(func(req *http.Request) (*http.Response, error) {
		return &http.Response{StatusCode: http.StatusOK, Body: io.NopCloser(bytes.NewReader([]byte(`{"id": "123"}`)))}, nil
	})

	h := &Handler{cfg: config.Default(), client: &http.Client{Transport: rt}}
	resetStore()
	store["abc"] = map[string]string{"otp_flow_id": "123"}

	payload := map[string]string{"pin": "123456"}
	b, _ := json.Marshal(payload)

	req := httptest.NewRequest(http.MethodPost, "/otp/verify", bytes.NewReader(b))
	req.AddCookie(&http.Cookie{Name: "session_id", Value: "abc"})
	rec := httptest.NewRecorder()

	h.VerifyOTP(rec, req)

	res := rec.Result()
	require.Equal(t, http.StatusNoContent, res.StatusCode)
}

func TestVerifyOTP_MissingPin(t *testing.T) {
	h := &Handler{cfg: config.Default()}
	resetStore()

	store["abc"] = map[string]string{"otp_flow_id": "123"}

	req := httptest.NewRequest(http.MethodPost, "/otp/verify", nil)
	req.AddCookie(&http.Cookie{Name: "session_id", Value: "abc"})
	rec := httptest.NewRecorder()

	h.VerifyOTP(rec, req)

	res := rec.Result()
	require.Equal(t, http.StatusBadRequest, res.StatusCode)

	var got errorResponse
	require.NoError(t, json.Unmarshal(rec.Body.Bytes(), &got))
	require.Equal(t, "INVALID_FORM", got.Code)
	require.Equal(t, "One or more input has an error", got.Message)
}

func TestVerifyOTP_InvalidPin(t *testing.T) {
	h := &Handler{cfg: config.Default()}
	resetStore()

	store["abc"] = map[string]string{"otp_flow_id": "123"}

	payload := map[string]string{"pin": "1234567"}
	b, _ := json.Marshal(payload)

	req := httptest.NewRequest(http.MethodPost, "/otp/verify", bytes.NewReader(b))
	req.AddCookie(&http.Cookie{Name: "session_id", Value: "abc"})
	rec := httptest.NewRecorder()

	h.VerifyOTP(rec, req)

	res := rec.Result()
	require.Equal(t, http.StatusUnprocessableEntity, res.StatusCode)

	var got errorResponse
	require.NoError(t, json.Unmarshal(rec.Body.Bytes(), &got))
	require.Equal(t, "INVALID_FORM", got.Code)
	require.Equal(t, "One or more input has an error", got.Message)
}

func TestVerifyOTP_MissingCookie(t *testing.T) {
	h := &Handler{cfg: config.Default()}
	resetStore()

	payload := map[string]string{"pin": "123456"}
	b, _ := json.Marshal(payload)

	req := httptest.NewRequest(http.MethodPost, "/otp/verify", bytes.NewReader(b))
	rec := httptest.NewRecorder()

	h.VerifyOTP(rec, req)

	res := rec.Result()
	require.Equal(t, http.StatusInternalServerError, res.StatusCode)
	require.Equal(t, "text/plain; charset=utf-8", res.Header.Get("Content-Type"))
	require.Equal(t, "Internal server error\n", rec.Body.String())
}

func TestVerifyOTP_MissingSession(t *testing.T) {
	rt := RoundTripperFunc(func(req *http.Request) (*http.Response, error) {
		return &http.Response{StatusCode: http.StatusOK, Body: io.NopCloser(bytes.NewReader([]byte(`{}`)))}, nil
	})

	h := &Handler{cfg: config.Default(), client: &http.Client{Transport: rt}}
	resetStore()

	payload := map[string]string{"pin": "123456"}
	b, _ := json.Marshal(payload)

	req := httptest.NewRequest(http.MethodPost, "/otp/verify", bytes.NewReader(b))
	req.AddCookie(&http.Cookie{Name: "session_id", Value: "abc"})
	rec := httptest.NewRecorder()

	h.VerifyOTP(rec, req)

	res := rec.Result()
	require.Equal(t, http.StatusUnauthorized, res.StatusCode)

	var got errorResponse
	require.NoError(t, json.Unmarshal(rec.Body.Bytes(), &got))
	require.Equal(t, "AUTHORIZATION_FAILED", got.Code)
	require.Equal(t, "Failed to authenticate session.", got.Message)
}

func TestVerifyOTP_Timeout(t *testing.T) {
	rt := RoundTripperFunc(func(req *http.Request) (*http.Response, error) {
		select {
		case <-req.Context().Done():
			return nil, req.Context().Err()
		case <-time.After(200 * time.Millisecond):
			return &http.Response{
				StatusCode: http.StatusOK,
				Body:       io.NopCloser(bytes.NewReader([]byte(`{"id":"123"}`))),
			}, nil
		}
	})

	h := &Handler{cfg: config.Default(), client: &http.Client{Timeout: 10 * time.Millisecond, Transport: rt}}
	resetStore()
	store["abc"] = map[string]string{"otp_flow_id": "123"}

	payload := map[string]string{"pin": "123456"}
	b, _ := json.Marshal(payload)

	req := httptest.NewRequest(http.MethodPost, "/otp/verify", bytes.NewReader(b))
	req.AddCookie(&http.Cookie{Name: "session_id", Value: "abc"})
	rec := httptest.NewRecorder()

	h.VerifyOTP(rec, req)

	res := rec.Result()
	require.Equal(t, http.StatusGatewayTimeout, res.StatusCode)
	require.Equal(t, "text/plain; charset=utf-8", res.Header.Get("Content-Type"))
	require.Equal(t, "Request timeout. Please try again later.\n", rec.Body.String())
}

func TestVerifyOTP_Unauthorized(t *testing.T) {
	rt := RoundTripperFunc(func(req *http.Request) (*http.Response, error) {
		return &http.Response{StatusCode: http.StatusUnauthorized, Body: io.NopCloser(bytes.NewReader([]byte(`{}`)))}, nil
	})

	h := &Handler{cfg: config.Default(), client: &http.Client{Transport: rt}}
	resetStore()

	store["abc"] = map[string]string{"otp_flow_id": "123"}

	payload := map[string]string{"pin": "123456"}
	b, _ := json.Marshal(payload)

	req := httptest.NewRequest(http.MethodPost, "/otp/verify", bytes.NewReader(b))
	req.AddCookie(&http.Cookie{Name: "session_id", Value: "abc"})
	rec := httptest.NewRecorder()

	h.VerifyOTP(rec, req)

	res := rec.Result()
	require.Equal(t, http.StatusUnprocessableEntity, res.StatusCode)

	var got errorResponse
	require.NoError(t, json.Unmarshal(rec.Body.Bytes(), &got))
	require.Equal(t, "AUTHORIZATION_FAILED", got.Code)
	require.Equal(t, "Failed to authenticate session.", got.Message)
}

func TestVerifyOTP_NotFound(t *testing.T) {
	rt := RoundTripperFunc(func(req *http.Request) (*http.Response, error) {
		return &http.Response{StatusCode: http.StatusNotFound, Body: io.NopCloser(bytes.NewReader([]byte(`{}`)))}, nil
	})

	h := &Handler{cfg: config.Default(), client: &http.Client{Transport: rt}}
	resetStore()

	store["abc"] = map[string]string{"otp_flow_id": "123"}

	payload := map[string]string{"pin": "123456"}
	b, _ := json.Marshal(payload)

	req := httptest.NewRequest(http.MethodPost, "/otp/verify", bytes.NewReader(b))
	req.AddCookie(&http.Cookie{Name: "session_id", Value: "abc"})
	rec := httptest.NewRecorder()

	h.VerifyOTP(rec, req)

	res := rec.Result()
	require.Equal(t, http.StatusUnprocessableEntity, res.StatusCode)

	var got errorResponse
	require.NoError(t, json.Unmarshal(rec.Body.Bytes(), &got))
	require.Equal(t, "AUTHORIZATION_FAILED", got.Code)
	require.Equal(t, "Failed to authenticate session.", got.Message)
}

func TestVerifyOTP_BadRequest(t *testing.T) {
	rt := RoundTripperFunc(func(req *http.Request) (*http.Response, error) {
		return &http.Response{StatusCode: http.StatusBadRequest, Body: io.NopCloser(bytes.NewReader([]byte(`{}`)))}, nil
	})

	h := &Handler{cfg: config.Default(), client: &http.Client{Transport: rt}}
	resetStore()

	store["abc"] = map[string]string{"otp_flow_id": "123"}

	payload := map[string]string{"pin": "123456"}
	b, _ := json.Marshal(payload)

	req := httptest.NewRequest(http.MethodPost, "/otp/verify", bytes.NewReader(b))
	req.AddCookie(&http.Cookie{Name: "session_id", Value: "abc"})
	rec := httptest.NewRecorder()

	h.VerifyOTP(rec, req)

	res := rec.Result()
	require.Equal(t, http.StatusInternalServerError, res.StatusCode)
	require.Equal(t, "text/plain; charset=utf-8", res.Header.Get("Content-Type"))
	require.Equal(t, "Internal server error\n", rec.Body.String())
}

func TestVerifyOTP_InternalServerError(t *testing.T) {
	rt := RoundTripperFunc(func(req *http.Request) (*http.Response, error) {
		return &http.Response{StatusCode: http.StatusInternalServerError, Body: io.NopCloser(bytes.NewReader([]byte(`{}`)))}, nil
	})

	h := &Handler{cfg: config.Default(), client: &http.Client{Transport: rt}}
	resetStore()

	store["abc"] = map[string]string{"otp_flow_id": "123"}

	payload := map[string]string{"pin": "123456"}
	b, _ := json.Marshal(payload)

	req := httptest.NewRequest(http.MethodPost, "/otp/verify", bytes.NewReader(b))
	req.AddCookie(&http.Cookie{Name: "session_id", Value: "abc"})
	rec := httptest.NewRecorder()

	h.VerifyOTP(rec, req)

	res := rec.Result()
	require.Equal(t, http.StatusInternalServerError, res.StatusCode)
	require.Equal(t, "text/plain; charset=utf-8", res.Header.Get("Content-Type"))
	require.Equal(t, "Internal server error\n", rec.Body.String())
}
