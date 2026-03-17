package main

import (
	"bytes"
	"encoding/json"
	"io"
	"net/http"
	"net/http/httptest"
	"testing"

	"github.com/String-sg/teacher-workspace/server/pkg/require"
)

type RoundTripperFunc func(*http.Request) (*http.Response, error)

func (f RoundTripperFunc) RoundTrip(r *http.Request) (*http.Response, error) {
	return f(r)
}

// -------------------- handler tests: Request --------------------

func TestHandlerRequest_Success200(t *testing.T) {
	rt := RoundTripperFunc(func(req *http.Request) (*http.Response, error) {
		return &http.Response{
			StatusCode: http.StatusOK,
			Body:       io.NopCloser(bytes.NewReader([]byte(`{"id":"123"}`))),
		}, nil
	})

	cfg := Default()
	h := &Handler{cfg: cfg, client: &http.Client{Transport: rt, Timeout: cfg.OTPaaS.Timeout}}

	body, _ := json.Marshal(map[string]string{"email": "test@schools.gov.sg"})
	req := httptest.NewRequest(http.MethodPost, "/request", bytes.NewReader(body))
	req.Header.Set("Content-Type", "application/json")
	rec := httptest.NewRecorder()

	h.Request(rec, req)

	res := rec.Result()
	require.Equal(t, http.StatusOK, res.StatusCode)
	require.Equal(t, "application/json", res.Header.Get("Content-Type"))

	var payload map[string]string
	require.NoError(t, json.Unmarshal(rec.Body.Bytes(), &payload))
	require.Equal(t, "123", payload["flow_id"])
}

func TestHandlerRequest_UnsupportedMediaType415(t *testing.T) {
	h := &Handler{cfg: Default(), client: &http.Client{}}

	req := httptest.NewRequest(http.MethodPost, "/request", nil)
	req.Header.Set("Content-Type", "text/plain")
	rec := httptest.NewRecorder()

	h.Request(rec, req)

	res := rec.Result()
	require.Equal(t, http.StatusUnsupportedMediaType, res.StatusCode)

	var errResp ErrorResponse
	require.NoError(t, json.Unmarshal(rec.Body.Bytes(), &errResp))
	require.Equal(t, http.StatusText(http.StatusUnsupportedMediaType), errResp.Message)
}

func TestHandlerRequest_InvalidEmailDomain422(t *testing.T) {
	h := &Handler{cfg: Default(), client: &http.Client{}}

	body, _ := json.Marshal(map[string]string{"email": "test@example.com"})

	req := httptest.NewRequest(http.MethodPost, "/request", bytes.NewReader(body))
	req.Header.Set("Content-Type", "application/json")
	rec := httptest.NewRecorder()

	h.Request(rec, req)

	res := rec.Result()
	require.Equal(t, http.StatusUnprocessableEntity, res.StatusCode)

	var errResp ErrorResponse
	require.NoError(t, json.Unmarshal(rec.Body.Bytes(), &errResp))
	require.Equal(t, "One or more input has an error", errResp.Message)
}

func TestHandlerRequest_InvalidEmailDomainProduction422(t *testing.T) {
	cfg := Default()
	cfg.Environment = EnvProduction
	h := &Handler{cfg: cfg, client: &http.Client{}}

	body, _ := json.Marshal(map[string]string{"email": "test@tech.gov.sg"})

	req := httptest.NewRequest(http.MethodPost, "/request", bytes.NewReader(body))
	req.Header.Set("Content-Type", "application/json")
	rec := httptest.NewRecorder()

	h.Request(rec, req)

	res := rec.Result()
	require.Equal(t, http.StatusUnprocessableEntity, res.StatusCode)

	var errResp ErrorResponse
	require.NoError(t, json.Unmarshal(rec.Body.Bytes(), &errResp))
	require.Equal(t, "One or more input has an error", errResp.Message)
}

func TestHandlerRequest_OTPaasRateLimited429(t *testing.T) {
	rt := RoundTripperFunc(func(req *http.Request) (*http.Response, error) {
		return &http.Response{
			StatusCode: http.StatusBadRequest,
			Body:       io.NopCloser(bytes.NewReader([]byte(`{"code":2008,"message":"rate limited"}`))),
		}, nil
	})

	cfg := Default()
	h := &Handler{cfg: cfg, client: &http.Client{Transport: rt, Timeout: cfg.OTPaaS.Timeout}}

	body, _ := json.Marshal(map[string]string{"email": "test@schools.gov.sg"})
	req := httptest.NewRequest(http.MethodPost, "/request", bytes.NewReader(body))
	req.Header.Set("Content-Type", "application/json")
	rec := httptest.NewRecorder()

	h.Request(rec, req)

	res := rec.Result()
	require.Equal(t, http.StatusTooManyRequests, res.StatusCode)

	var errResp ErrorResponse
	require.NoError(t, json.Unmarshal(rec.Body.Bytes(), &errResp))
	require.Equal(t, "Too many requests. Please try again later.", errResp.Message)
}

func TestHandlerRequest_OTPaasInternal500(t *testing.T) {
	rt := RoundTripperFunc(func(req *http.Request) (*http.Response, error) {
		return &http.Response{
			StatusCode: http.StatusInternalServerError,
			Body:       io.NopCloser(bytes.NewReader([]byte(`{}`))),
		}, nil
	})

	cfg := Default()
	h := &Handler{cfg: cfg, client: &http.Client{Transport: rt, Timeout: cfg.OTPaaS.Timeout}}

	body, _ := json.Marshal(map[string]string{"email": "test@schools.gov.sg"})
	req := httptest.NewRequest(http.MethodPost, "/request", bytes.NewReader(body))
	req.Header.Set("Content-Type", "application/json")
	rec := httptest.NewRecorder()

	h.Request(rec, req)

	res := rec.Result()
	require.Equal(t, http.StatusInternalServerError, res.StatusCode)

	var errResp ErrorResponse
	require.NoError(t, json.Unmarshal(rec.Body.Bytes(), &errResp))
	require.Equal(t, `Unexpected status 500 (code 0): ""`, errResp.Message)
}

// -------------------- handler tests: Verify --------------------

func TestHandlerVerify_Success204(t *testing.T) {
	rt := RoundTripperFunc(func(req *http.Request) (*http.Response, error) {
		return &http.Response{
			StatusCode: http.StatusOK,
			Body:       io.NopCloser(bytes.NewReader([]byte(`{}`))),
		}, nil
	})

	cfg := Default()
	h := &Handler{cfg: cfg, client: &http.Client{Transport: rt, Timeout: cfg.OTPaaS.Timeout}}

	body, _ := json.Marshal(map[string]string{"pin": "123456"})
	req := httptest.NewRequest(http.MethodPost, "/verify/flow123", bytes.NewReader(body))
	req.SetPathValue("flow_id", "flow123")
	req.Header.Set("Content-Type", "application/json")
	rec := httptest.NewRecorder()

	h.Verify(rec, req)

	res := rec.Result()
	require.Equal(t, http.StatusNoContent, res.StatusCode)
}

func TestHandlerVerify_UnsupportedMediaType415(t *testing.T) {
	h := &Handler{cfg: Default(), client: &http.Client{}}

	body, _ := json.Marshal(map[string]string{"pin": "123456"})
	req := httptest.NewRequest(http.MethodPost, "/verify/flow123", bytes.NewReader(body))
	req.SetPathValue("flow_id", "flow123")
	req.Header.Set("Content-Type", "text/plain")
	rec := httptest.NewRecorder()

	h.Verify(rec, req)

	res := rec.Result()
	require.Equal(t, http.StatusUnsupportedMediaType, res.StatusCode)

	var errResp ErrorResponse
	require.NoError(t, json.Unmarshal(rec.Body.Bytes(), &errResp))
}

func TestHandlerVerify_InvalidPin422(t *testing.T) {
	h := &Handler{cfg: Default(), client: &http.Client{}}

	tests := []struct {
		name string
		body []byte
	}{
		{
			name: "empty pin",
			body: []byte(`{"pin":""}`),
		},
		{
			name: "pin longer than 6 digits",
			body: []byte(`{"pin":"1234567"}`),
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			req := httptest.NewRequest(http.MethodPost, "/verify/flow123", bytes.NewReader(tt.body))
			req.SetPathValue("flow_id", "flow123")
			req.Header.Set("Content-Type", "application/json")
			rec := httptest.NewRecorder()

			h.Verify(rec, req)

			res := rec.Result()
			require.Equal(t, http.StatusUnprocessableEntity, res.StatusCode)

			var errResp ErrorResponse
			require.NoError(t, json.Unmarshal(rec.Body.Bytes(), &errResp))
			require.Equal(t, "One or more input has an error", errResp.Message)
		})
	}
}

func TestHandlerVerify_NotFound404(t *testing.T) {
	rt := RoundTripperFunc(func(req *http.Request) (*http.Response, error) {
		return &http.Response{
			StatusCode: http.StatusNotFound,
			Body:       io.NopCloser(bytes.NewReader([]byte(`{}`))),
		}, nil
	})

	cfg := Default()
	h := &Handler{cfg: cfg, client: &http.Client{Transport: rt, Timeout: cfg.OTPaaS.Timeout}}

	body, _ := json.Marshal(map[string]string{"pin": "123456"})
	req := httptest.NewRequest(http.MethodPost, "/verify/flow123", bytes.NewReader(body))
	req.SetPathValue("flow_id", "flow123")
	req.Header.Set("Content-Type", "application/json")
	rec := httptest.NewRecorder()

	h.Verify(rec, req)

	res := rec.Result()
	require.Equal(t, http.StatusNotFound, res.StatusCode)

	var errResp ErrorResponse
	require.NoError(t, json.Unmarshal(rec.Body.Bytes(), &errResp))
	require.Equal(t, "Flow expired", errResp.Message)
}

func TestHandlerVerify_OTPaasInternal500(t *testing.T) {
	rt := RoundTripperFunc(func(req *http.Request) (*http.Response, error) {
		return &http.Response{
			StatusCode: http.StatusInternalServerError,
			Body:       io.NopCloser(bytes.NewReader([]byte(`{}`))),
		}, nil
	})

	cfg := Default()
	h := &Handler{cfg: cfg, client: &http.Client{Transport: rt, Timeout: cfg.OTPaaS.Timeout}}

	body, _ := json.Marshal(map[string]string{"pin": "123456"})
	req := httptest.NewRequest(http.MethodPost, "/verify/flow123", bytes.NewReader(body))
	req.SetPathValue("flow_id", "flow123")
	req.Header.Set("Content-Type", "application/json")
	rec := httptest.NewRecorder()

	h.Verify(rec, req)

	res := rec.Result()
	require.Equal(t, http.StatusInternalServerError, res.StatusCode)

	var errResp ErrorResponse
	require.NoError(t, json.Unmarshal(rec.Body.Bytes(), &errResp))
	require.Equal(t, `Unexpected status 500 (code 0): ""`, errResp.Message)
}
