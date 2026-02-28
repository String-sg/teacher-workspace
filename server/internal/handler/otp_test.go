package handler

import (
	"bytes"
	"context"
	"encoding/json"
	"net/http"
	"net/http/httptest"
	"testing"

	"github.com/String-sg/teacher-workspace/server/internal/config"
	"github.com/String-sg/teacher-workspace/server/internal/httputil"
	"github.com/String-sg/teacher-workspace/server/pkg/require"
)

type stubOTPProvider struct {
	requestOTP func(ctx context.Context, email string) (string, error)
}

func (s stubOTPProvider) RequestOTP(ctx context.Context, email string) (string, error) {
	if s.requestOTP == nil {
		return "", nil
	}

	return s.requestOTP(ctx, email)
}

func (s stubOTPProvider) VerifyOTP(context.Context, string, string) error {
	return nil
}

func TestHandler_RequestOTP(t *testing.T) {
	t.Run("returns 415 when content type is not application/json", func(t *testing.T) {
		h := New(&config.Config{}, stubOTPProvider{})

		req := httptest.NewRequest(http.MethodPost, "/otp/request", bytes.NewBufferString(`{"email":"teacher@schools.gov.sg"}`))
		req.Header.Set(HeaderContentType, MIMETextPlainCharsetUTF8)
		rec := httptest.NewRecorder()

		h.RequestOTP(rec, req)

		res := rec.Result()
		require.Equal(t, http.StatusUnsupportedMediaType, res.StatusCode)
		require.Equal(t, MIMEApplicationJSONCharsetUTF8, res.Header.Get(HeaderContentType))
		require.Equal(t, "nosniff", res.Header.Get(HeaderXContentTypeOptions))

		var body httputil.ErrorResponse
		require.NoError(t, json.Unmarshal(rec.Body.Bytes(), &body))
		require.Equal(t, http.StatusText(http.StatusUnsupportedMediaType), body.Message)
	})

	t.Run("returns 400 when request body is invalid JSON", func(t *testing.T) {
		h := New(&config.Config{}, stubOTPProvider{})

		req := httptest.NewRequest(http.MethodPost, "/otp/request", bytes.NewBufferString(`{`))
		req.Header.Set(HeaderContentType, MIMEApplicationJSON)
		rec := httptest.NewRecorder()

		h.RequestOTP(rec, req)

		res := rec.Result()
		require.Equal(t, http.StatusBadRequest, res.StatusCode)
		require.Equal(t, MIMEApplicationJSONCharsetUTF8, res.Header.Get(HeaderContentType))
		require.Equal(t, "nosniff", res.Header.Get(HeaderXContentTypeOptions))

		var body httputil.ErrorResponse
		require.NoError(t, json.Unmarshal(rec.Body.Bytes(), &body))
		require.Equal(t, "Problem parsing JSON", body.Message)
	})

	t.Run("returns 422 when email domain is not allowed", func(t *testing.T) {
		cfg := &config.Config{
			OTP: config.OTPConfig{
				AllowedEmailDomains: []string{"@schools.gov.sg"},
			},
		}
		h := New(cfg, stubOTPProvider{})

		req := httptest.NewRequest(http.MethodPost, "/otp/request", bytes.NewBufferString(`{"email":"teacher@tech.gov.sg"}`))
		req.Header.Set(HeaderContentType, MIMEApplicationJSON)
		rec := httptest.NewRecorder()

		h.RequestOTP(rec, req)

		res := rec.Result()
		require.Equal(t, http.StatusUnprocessableEntity, res.StatusCode)
		require.Equal(t, MIMEApplicationJSONCharsetUTF8, res.Header.Get(HeaderContentType))
		require.Equal(t, "nosniff", res.Header.Get(HeaderXContentTypeOptions))

		var body httputil.ErrorResponse
		require.NoError(t, json.Unmarshal(rec.Body.Bytes(), &body))
		require.Equal(t, "Validation Failed", body.Message)
		require.Equal(t, 1, len(body.Errors))
		require.Equal(t, "email", body.Errors[0].Field)
		require.Equal(t, "Email domain not allowed", body.Errors[0].Message)
	})

	t.Run("returns 429 when provider is rate-limited", func(t *testing.T) {

	})
}

// func withRequestContext(r *http.Request, sess *session.Session) *http.Request {
// 	ctx := middleware.WithLogger(r.Context(), slog.New(slog.NewTextHandler(io.Discard, nil)))
// 	if sess != nil {
// 		ctx = middleware.WithSession(ctx, sess)
// 	}

// 	return r.WithContext(ctx)
// }

// func TestRequestOTP(t *testing.T) {
// 	baseCfg := config.Default()
// 	baseCfg.OTP.AllowedEmailDomains = []string{"@schools.gov.sg"}

// 	type errorResponse struct {
// 		Message string `json:"message"`
// 	}

// 	type validationResponse struct {
// 		Message string `json:"message"`
// 		Errors  []struct {
// 			Field   string `json:"field"`
// 			Message string `json:"message"`
// 		} `json:"errors"`
// 	}

// 	t.Run("returns 415 when content type is not application/json", func(t *testing.T) {
// 		h := New(baseCfg, stubOTPProvider{})

// 		req := httptest.NewRequest(http.MethodPost, "/otp/request", bytes.NewBufferString(`{"email":"teacher@schools.gov.sg"}`))
// 		req.Header.Set(HeaderContentType, MIMETextPlainCharsetUTF8)
// 		req = withRequestContext(req, &session.Session{ID: "s1"})
// 		rec := httptest.NewRecorder()

// 		h.RequestOTP(rec, req)

// 		res := rec.Result()
// 		require.Equal(t, http.StatusUnsupportedMediaType, res.StatusCode)
// 		require.Equal(t, MIMEApplicationJSONCharsetUTF8, res.Header.Get(HeaderContentType))

// 		var body errorResponse
// 		require.NoError(t, json.Unmarshal(rec.Body.Bytes(), &body))
// 		require.Equal(t, http.StatusText(http.StatusUnsupportedMediaType), body.Message)
// 	})

// 	t.Run("returns 400 when request body is invalid JSON", func(t *testing.T) {
// 		h := New(baseCfg, stubOTPProvider{})

// 		req := httptest.NewRequest(http.MethodPost, "/otp/request", bytes.NewBufferString("{"))
// 		req.Header.Set(HeaderContentType, MIMEApplicationJSON)
// 		req = withRequestContext(req, &session.Session{ID: "s1"})
// 		rec := httptest.NewRecorder()

// 		h.RequestOTP(rec, req)

// 		res := rec.Result()
// 		require.Equal(t, http.StatusBadRequest, res.StatusCode)
// 		require.Equal(t, MIMEApplicationJSONCharsetUTF8, res.Header.Get(HeaderContentType))

// 		var body errorResponse
// 		require.NoError(t, json.Unmarshal(rec.Body.Bytes(), &body))
// 		require.Equal(t, "Problem parsing JSON", body.Message)
// 	})

// 	t.Run("returns 422 when email domain is not allowed", func(t *testing.T) {
// 		h := New(baseCfg, stubOTPProvider{})

// 		req := httptest.NewRequest(http.MethodPost, "/otp/request", bytes.NewBufferString(`{"email":"teacher@example.com"}`))
// 		req.Header.Set(HeaderContentType, MIMEApplicationJSON)
// 		req = withRequestContext(req, &session.Session{ID: "s1"})
// 		rec := httptest.NewRecorder()

// 		h.RequestOTP(rec, req)

// 		res := rec.Result()
// 		require.Equal(t, http.StatusUnprocessableEntity, res.StatusCode)
// 		require.Equal(t, MIMEApplicationJSONCharsetUTF8, res.Header.Get(HeaderContentType))

// 		var body validationResponse
// 		require.NoError(t, json.Unmarshal(rec.Body.Bytes(), &body))
// 		require.Equal(t, "Validation Failed", body.Message)
// 		require.Equal(t, 1, len(body.Errors))
// 		require.Equal(t, "email", body.Errors[0].Field)
// 		require.Equal(t, "Email domain not allowed", body.Errors[0].Message)
// 	})

// 	t.Run("returns 429 when provider is rate-limited", func(t *testing.T) {
// 		h := New(baseCfg, stubOTPProvider{
// 			requestOTP: func(context.Context, string) (string, error) {
// 				return "", otp.ErrRateLimited
// 			},
// 		})

// 		req := httptest.NewRequest(http.MethodPost, "/otp/request", bytes.NewBufferString(`{"email":"teacher@schools.gov.sg"}`))
// 		req.Header.Set(HeaderContentType, MIMEApplicationJSON)
// 		req = withRequestContext(req, &session.Session{ID: "s1"})
// 		rec := httptest.NewRecorder()

// 		h.RequestOTP(rec, req)

// 		res := rec.Result()
// 		require.Equal(t, http.StatusTooManyRequests, res.StatusCode)

// 		var body errorResponse
// 		require.NoError(t, json.Unmarshal(rec.Body.Bytes(), &body))
// 		require.Equal(t, http.StatusText(http.StatusTooManyRequests), body.Message)
// 	})

// 	t.Run("returns 422 when provider rejects domain", func(t *testing.T) {
// 		h := New(baseCfg, stubOTPProvider{
// 			requestOTP: func(context.Context, string) (string, error) {
// 				return "", otp.ErrDomainNotAllowed
// 			},
// 		})

// 		req := httptest.NewRequest(http.MethodPost, "/otp/request", bytes.NewBufferString(`{"email":"teacher@schools.gov.sg"}`))
// 		req.Header.Set(HeaderContentType, MIMEApplicationJSON)
// 		req = withRequestContext(req, &session.Session{ID: "s1"})
// 		rec := httptest.NewRecorder()

// 		h.RequestOTP(rec, req)

// 		res := rec.Result()
// 		require.Equal(t, http.StatusUnprocessableEntity, res.StatusCode)

// 		var body validationResponse
// 		require.NoError(t, json.Unmarshal(rec.Body.Bytes(), &body))
// 		require.Equal(t, "Validation Failed", body.Message)
// 		require.Equal(t, 1, len(body.Errors))
// 		require.Equal(t, "email", body.Errors[0].Field)
// 		require.Equal(t, "Email domain not allowed", body.Errors[0].Message)
// 	})

// 	t.Run("returns 500 when provider fails unexpectedly", func(t *testing.T) {
// 		h := New(baseCfg, stubOTPProvider{
// 			requestOTP: func(context.Context, string) (string, error) {
// 				return "", errors.New("upstream unavailable")
// 			},
// 		})

// 		req := httptest.NewRequest(http.MethodPost, "/otp/request", bytes.NewBufferString(`{"email":"teacher@schools.gov.sg"}`))
// 		req.Header.Set(HeaderContentType, MIMEApplicationJSON)
// 		req = withRequestContext(req, &session.Session{ID: "s1"})
// 		rec := httptest.NewRecorder()

// 		h.RequestOTP(rec, req)

// 		res := rec.Result()
// 		require.Equal(t, http.StatusInternalServerError, res.StatusCode)

// 		var body errorResponse
// 		require.NoError(t, json.Unmarshal(rec.Body.Bytes(), &body))
// 		require.Equal(t, http.StatusText(http.StatusInternalServerError), body.Message)
// 	})

// 	t.Run("returns 500 when session is missing", func(t *testing.T) {
// 		h := New(baseCfg, stubOTPProvider{
// 			requestOTP: func(context.Context, string) (string, error) {
// 				return "flow-123", nil
// 			},
// 		})

// 		req := httptest.NewRequest(http.MethodPost, "/otp/request", bytes.NewBufferString(`{"email":"teacher@schools.gov.sg"}`))
// 		req.Header.Set(HeaderContentType, MIMEApplicationJSON)
// 		req = withRequestContext(req, nil)
// 		rec := httptest.NewRecorder()

// 		h.RequestOTP(rec, req)

// 		res := rec.Result()
// 		require.Equal(t, http.StatusInternalServerError, res.StatusCode)

// 		var body errorResponse
// 		require.NoError(t, json.Unmarshal(rec.Body.Bytes(), &body))
// 		require.Equal(t, http.StatusText(http.StatusInternalServerError), body.Message)
// 	})

// 	t.Run("returns 200 and stores flow ID in session", func(t *testing.T) {
// 		h := New(baseCfg, stubOTPProvider{
// 			requestOTP: func(context.Context, string) (string, error) {
// 				return "flow-123", nil
// 			},
// 		})

// 		sess := &session.Session{ID: "s1"}
// 		req := httptest.NewRequest(http.MethodPost, "/otp/request", bytes.NewBufferString(`{"email":"teacher@schools.gov.sg"}`))
// 		req.Header.Set(HeaderContentType, MIMEApplicationJSON)
// 		req = withRequestContext(req, sess)
// 		rec := httptest.NewRecorder()

// 		h.RequestOTP(rec, req)

// 		res := rec.Result()
// 		require.Equal(t, http.StatusOK, res.StatusCode)
// 		require.Equal(t, MIMEApplicationJSONCharsetUTF8, res.Header.Get(HeaderContentType))

// 		var body struct {
// 			ID string `json:"id"`
// 		}
// 		require.NoError(t, json.Unmarshal(rec.Body.Bytes(), &body))
// 		require.Equal(t, "flow-123", body.ID)

// 		flowID, ok := sess.Get("otp_flow_id")
// 		require.True(t, ok)
// 		require.Equal(t, "flow-123", flowID.(string))
// 	})
// }
