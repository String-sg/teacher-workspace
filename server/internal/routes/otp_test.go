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
func TestRequestOTP_Success(t *testing.T) {
	rt := RoundTripperFunc(func(req *http.Request) (*http.Response, error) {
		return &http.Response{StatusCode: http.StatusOK, Body: io.NopCloser(bytes.NewReader([]byte(`{"id": "123"}`)))}, nil
	})

	h := &Handler{cfg: config.Default(), client: &http.Client{Transport: rt}}
	resetStore()

	payload := map[string]string{"email": "test@schools.gov.sg"}
	b, _ := json.Marshal(payload)

	req := httptest.NewRequest(http.MethodPost, "/api/otp/request", bytes.NewReader(b))

	req.AddCookie(&http.Cookie{Name: "session_id", Value: "abc"})
	rec := httptest.NewRecorder()

	h.RequestOTP(rec, req)

	res := rec.Result()

	require.Equal(t, http.StatusNoContent, res.StatusCode)

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

	req := httptest.NewRequest(http.MethodPost, "/api/otp/request", nil)
	rec := httptest.NewRecorder()

	h.RequestOTP(rec, req)

	res := rec.Result()
	require.Equal(t, http.StatusBadRequest, res.StatusCode)

	var got ErrorResponseNoErrors
	require.NoError(t, json.Unmarshal(rec.Body.Bytes(), &got))
	require.Equal(t, "INVALID_FORM", got.Code)
	require.Equal(t, "One or more input has an error", got.Message)
}

func TestRequestOTP_InvalidEmail(t *testing.T) {
	h := &Handler{cfg: config.Default(), client: &http.Client{}}
	resetStore()

	payload := map[string]string{"email": "test@example.com"}
	b, _ := json.Marshal(payload)

	req := httptest.NewRequest(http.MethodPost, "/api/otp/request", bytes.NewReader(b))
	rec := httptest.NewRecorder()

	h.RequestOTP(rec, req)

	res := rec.Result()
	require.Equal(t, http.StatusBadRequest, res.StatusCode)

	var got ErrorResponseNoErrors
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

	req := httptest.NewRequest(http.MethodPost, "/api/otp/request", bytes.NewReader(b))

	req.AddCookie(&http.Cookie{Name: "session_id", Value: "abc"})
	rec := httptest.NewRecorder()

	h.RequestOTP(rec, req)

	res := rec.Result()

	require.Equal(t, http.StatusInternalServerError, res.StatusCode)

	var got ErrorResponseNoErrors
	require.NoError(t, json.Unmarshal(rec.Body.Bytes(), &got))
	require.Equal(t, "INTERNAL_SERVER_ERROR", got.Code)
	require.Equal(t, "Internal server error", got.Message)

}

func TestRequestOTP_NotAuthorized(t *testing.T) {
	rt := RoundTripperFunc(func(req *http.Request) (*http.Response, error) {
		return &http.Response{StatusCode: http.StatusUnauthorized, Body: io.NopCloser(bytes.NewReader([]byte(`{}`)))}, nil
	})

	h := &Handler{cfg: config.Default(), client: &http.Client{Transport: rt}}
	resetStore()

	payload := map[string]string{"email": "test@schools.gov.sg"}
	b, _ := json.Marshal(payload)

	req := httptest.NewRequest(http.MethodPost, "/api/otp/request", bytes.NewReader(b))
	rec := httptest.NewRecorder()

	h.RequestOTP(rec, req)

	res := rec.Result()

	require.Equal(t, http.StatusInternalServerError, res.StatusCode)

	var got ErrorResponseNoErrors
	require.NoError(t, json.Unmarshal(rec.Body.Bytes(), &got))
	require.Equal(t, "AUTHORIZATION_FAILED", got.Code)
	require.Equal(t, "Something went wrong. Please try again later.", got.Message)
}

func TestRequestOTP_InternalServerError(t *testing.T) {
	rt := RoundTripperFunc(func(req *http.Request) (*http.Response, error) {
		return &http.Response{StatusCode: http.StatusInternalServerError, Body: io.NopCloser(bytes.NewReader([]byte(`{}`)))}, nil
	})

	h := &Handler{cfg: config.Default(), client: &http.Client{Transport: rt}}
	resetStore()

	payload := map[string]string{"email": "test@schools.gov.sg"}
	b, _ := json.Marshal(payload)

	req := httptest.NewRequest(http.MethodPost, "/api/otp/request", bytes.NewReader(b))
	rec := httptest.NewRecorder()

	h.RequestOTP(rec, req)

	res := rec.Result()
	require.Equal(t, http.StatusInternalServerError, res.StatusCode)

	var got ErrorResponseNoErrors
	require.NoError(t, json.Unmarshal(rec.Body.Bytes(), &got))
	require.Equal(t, "AUTHORIZATION_FAILED", got.Code)
	require.Equal(t, "Something went wrong. Please try again later.", got.Message)
}

func TestRequestOTP_MissingOTPFlowID(t *testing.T) {
	rt := RoundTripperFunc(func(req *http.Request) (*http.Response, error) {
		return &http.Response{StatusCode: http.StatusOK, Body: io.NopCloser(bytes.NewReader([]byte(`{}`)))}, nil
	})

	h := &Handler{cfg: config.Default(), client: &http.Client{Transport: rt}}
	resetStore()

	payload := map[string]string{"email": "test@schools.gov.sg"}
	b, _ := json.Marshal(payload)

	req := httptest.NewRequest(http.MethodPost, "/api/otp/request", bytes.NewReader(b))
	rec := httptest.NewRecorder()

	h.RequestOTP(rec, req)

	res := rec.Result()
	require.Equal(t, http.StatusInternalServerError, res.StatusCode)

	var got ErrorResponseNoErrors
	require.NoError(t, json.Unmarshal(rec.Body.Bytes(), &got))
	require.Equal(t, "INTERNAL_SERVER_ERROR", got.Code)
	require.Equal(t, "Internal server error", got.Message)

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

	req := httptest.NewRequest(http.MethodPost, "/api/otp/verify", bytes.NewReader(b))
	req.AddCookie(&http.Cookie{Name: "session_id", Value: "abc"})
	rec := httptest.NewRecorder()

	h.VerifyOTP(rec, req)

	res := rec.Result()
	require.Equal(t, http.StatusNoContent, res.StatusCode)
}

func TestVerifyOTP_MissingCookie(t *testing.T) {
	h := &Handler{cfg: config.Default()}
	resetStore()

	req := httptest.NewRequest(http.MethodPost, "/api/otp/verify", nil)
	rec := httptest.NewRecorder()

	h.VerifyOTP(rec, req)

	res := rec.Result()
	require.Equal(t, http.StatusInternalServerError, res.StatusCode)

	var got ErrorResponseNoErrors
	require.NoError(t, json.Unmarshal(rec.Body.Bytes(), &got))
	require.Equal(t, "INTERNAL_SERVER_ERROR", got.Code)
	require.Equal(t, "Internal server error", got.Message)
}

func TestVerifyOTP_MissingPin(t *testing.T) {
	h := &Handler{cfg: config.Default()}
	resetStore()

	store["abc"] = map[string]string{"otp_flow_id": "123"}

	req := httptest.NewRequest(http.MethodPost, "/api/otp/verify", nil)
	req.AddCookie(&http.Cookie{Name: "session_id", Value: "abc"})
	rec := httptest.NewRecorder()

	h.VerifyOTP(rec, req)

	res := rec.Result()
	require.Equal(t, http.StatusBadRequest, res.StatusCode)

	var got ErrorResponseNoErrors
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

	req := httptest.NewRequest(http.MethodPost, "/api/otp/verify", bytes.NewReader(b))
	req.AddCookie(&http.Cookie{Name: "session_id", Value: "abc"})
	rec := httptest.NewRecorder()

	h.VerifyOTP(rec, req)

	res := rec.Result()
	require.Equal(t, http.StatusBadRequest, res.StatusCode)

	var got ErrorResponseNoErrors
	require.NoError(t, json.Unmarshal(rec.Body.Bytes(), &got))
	require.Equal(t, "INVALID_FORM", got.Code)
	require.Equal(t, "One or more input has an error", got.Message)
}

func TestVerifyOTP_MissingSession(t *testing.T) {
	rt := RoundTripperFunc(func(req *http.Request) (*http.Response, error) {
		return &http.Response{StatusCode: http.StatusOK, Body: io.NopCloser(bytes.NewReader([]byte(`{}`)))}, nil
	})

	h := &Handler{cfg: config.Default(), client: &http.Client{Transport: rt}}
	resetStore()

	payload := map[string]string{"pin": "123456"}
	b, _ := json.Marshal(payload)

	req := httptest.NewRequest(http.MethodPost, "/api/otp/verify", bytes.NewReader(b))
	req.AddCookie(&http.Cookie{Name: "session_id", Value: "abc"})
	rec := httptest.NewRecorder()

	h.VerifyOTP(rec, req)

	res := rec.Result()
	require.Equal(t, http.StatusUnauthorized, res.StatusCode)

	var got ErrorResponseNoErrors
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

	req := httptest.NewRequest(http.MethodPost, "/api/otp/verify", bytes.NewReader(b))
	req.AddCookie(&http.Cookie{Name: "session_id", Value: "abc"})
	rec := httptest.NewRecorder()

	h.VerifyOTP(rec, req)

	res := rec.Result()
	require.Equal(t, http.StatusInternalServerError, res.StatusCode)

	var got ErrorResponseNoErrors
	require.NoError(t, json.Unmarshal(rec.Body.Bytes(), &got))
	require.Equal(t, "INTERNAL_SERVER_ERROR", got.Code)
	require.Equal(t, "Internal server error", got.Message)
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

	req := httptest.NewRequest(http.MethodPost, "/api/otp/verify", bytes.NewReader(b))
	req.AddCookie(&http.Cookie{Name: "session_id", Value: "abc"})
	rec := httptest.NewRecorder()

	h.VerifyOTP(rec, req)

	res := rec.Result()
	require.Equal(t, http.StatusUnauthorized, res.StatusCode)

	var got ErrorResponseNoErrors
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

	req := httptest.NewRequest(http.MethodPost, "/api/otp/verify", bytes.NewReader(b))
	req.AddCookie(&http.Cookie{Name: "session_id", Value: "abc"})
	rec := httptest.NewRecorder()

	h.VerifyOTP(rec, req)

	res := rec.Result()
	require.Equal(t, http.StatusUnauthorized, res.StatusCode)

	var got ErrorResponseNoErrors
	require.NoError(t, json.Unmarshal(rec.Body.Bytes(), &got))
	require.Equal(t, "AUTHORIZATION_FAILED", got.Code)
	require.Equal(t, "Failed to authenticate session.", got.Message)
}

func TestVerifyOTP_Gone(t *testing.T) {
	rt := RoundTripperFunc(func(req *http.Request) (*http.Response, error) {
		return &http.Response{StatusCode: http.StatusGone, Body: io.NopCloser(bytes.NewReader([]byte(`{}`)))}, nil
	})

	h := &Handler{cfg: config.Default(), client: &http.Client{Transport: rt}}
	resetStore()

	store["abc"] = map[string]string{"otp_flow_id": "123"}

	payload := map[string]string{"pin": "123456"}
	b, _ := json.Marshal(payload)

	req := httptest.NewRequest(http.MethodPost, "/api/otp/verify", bytes.NewReader(b))
	req.AddCookie(&http.Cookie{Name: "session_id", Value: "abc"})
	rec := httptest.NewRecorder()

	h.VerifyOTP(rec, req)

	res := rec.Result()
	require.Equal(t, http.StatusUnauthorized, res.StatusCode)

	var got ErrorResponseNoErrors
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

	req := httptest.NewRequest(http.MethodPost, "/api/otp/verify", bytes.NewReader(b))
	req.AddCookie(&http.Cookie{Name: "session_id", Value: "abc"})
	rec := httptest.NewRecorder()

	h.VerifyOTP(rec, req)

	res := rec.Result()
	require.Equal(t, http.StatusInternalServerError, res.StatusCode)

	var got ErrorResponseNoErrors
	require.NoError(t, json.Unmarshal(rec.Body.Bytes(), &got))
	require.Equal(t, "INTERNAL_SERVER_ERROR", got.Code)
	require.Equal(t, "Internal server error", got.Message)
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

	req := httptest.NewRequest(http.MethodPost, "/api/otp/verify", bytes.NewReader(b))
	req.AddCookie(&http.Cookie{Name: "session_id", Value: "abc"})
	rec := httptest.NewRecorder()

	h.VerifyOTP(rec, req)

	res := rec.Result()
	require.Equal(t, http.StatusInternalServerError, res.StatusCode)

	var got ErrorResponseNoErrors
	require.NoError(t, json.Unmarshal(rec.Body.Bytes(), &got))
	require.Equal(t, "INTERNAL_SERVER_ERROR", got.Code)
	require.Equal(t, "Internal server error", got.Message)
}
