package otp

import (
	"bytes"
	"context"
	"errors"
	"io"
	"net/http"
	"testing"
	"time"

	"github.com/String-sg/teacher-workspace/server/pkg/require"
)

type roundTripFunc func(*http.Request) (*http.Response, error)

func (f roundTripFunc) RoundTrip(r *http.Request) (*http.Response, error) { return f(r) }

func newTestOTPaaSProvider(rt http.RoundTripper) *OTPaaSProvider {
	p := NewOTPaaSProvider("https://otp.example.com", "app-id", "app-namespace", "secret", 5*time.Second)
	p.client = &http.Client{Transport: rt}
	return p
}

func TestOTPaaSProvider_RequestOTP(t *testing.T) {
	t.Run("sends expected request and returns flow ID", func(t *testing.T) {
		var captured *http.Request
		var capturedBody string
		p := newTestOTPaaSProvider(roundTripFunc(func(r *http.Request) (*http.Response, error) {
			captured = r.Clone(r.Context())

			body, err := io.ReadAll(r.Body)
			if err != nil {
				t.Fatalf("failed to read request body: %v", err)
			}
			capturedBody = string(body)

			return &http.Response{
				StatusCode: http.StatusOK,
				Body:       io.NopCloser(bytes.NewReader([]byte(`{"id":"flow-42"}`))),
			}, nil
		}))

		id, err := p.RequestOTP(context.Background(), "xyz@example.com")

		require.NoError(t, err)
		require.Equal(t, "flow-42", id)

		require.Equal(t, http.MethodPost, captured.Method)
		require.Equal(t, "https://otp.example.com/otp", captured.URL.String())
		require.Equal(t, "application/json", captured.Header.Get("Content-Type"))
		require.Equal(t, "Bearer "+p.token, captured.Header.Get("Authorization"))
		require.Equal(t, "app-id", captured.Header.Get("X-App-Id"))
		require.Equal(t, "app-namespace", captured.Header.Get("X-App-Namespace"))
		require.Equal(t, `{"email":"xyz@example.com"}`, capturedBody)
	})

	t.Run("returns error when provider responds with empty flow ID", func(t *testing.T) {
		p := newTestOTPaaSProvider(roundTripFunc(func(*http.Request) (*http.Response, error) {
			return &http.Response{
				StatusCode: http.StatusOK,
				Body:       io.NopCloser(bytes.NewReader([]byte(`{"id":""}`))),
			}, nil
		}))

		id, err := p.RequestOTP(context.Background(), "xyz@example.com")

		require.HasError(t, err)
		require.Equal(t, "", id)
	})

	t.Run("returns ErrRateLimited when provider responds with 400 and code 2008", func(t *testing.T) {
		p := newTestOTPaaSProvider(roundTripFunc(func(*http.Request) (*http.Response, error) {
			return &http.Response{
				StatusCode: http.StatusBadRequest,
				Body:       io.NopCloser(bytes.NewReader([]byte(`{"code":2008,"message":"rate limited"}`))),
			}, nil
		}))

		id, err := p.RequestOTP(context.Background(), "xyz@example.com")

		require.HasError(t, err)
		require.Equal(t, "", id)
		require.True(t, errors.Is(err, ErrRateLimited))
	})

	t.Run("returns error when provider responds with 400 and other code", func(t *testing.T) {
		p := newTestOTPaaSProvider(roundTripFunc(func(*http.Request) (*http.Response, error) {
			return &http.Response{
				StatusCode: http.StatusBadRequest,
				Body:       io.NopCloser(bytes.NewReader([]byte(`{"code":9999,"message":"something else"}`))),
			}, nil
		}))

		id, err := p.RequestOTP(context.Background(), "xyz@example.com")

		require.HasError(t, err)
		require.Equal(t, "", id)
		require.False(t, errors.Is(err, ErrRateLimited))
	})

	t.Run("returns ErrUnauthorized when provider responds with 401", func(t *testing.T) {
		p := newTestOTPaaSProvider(roundTripFunc(func(*http.Request) (*http.Response, error) {
			return &http.Response{
				StatusCode: http.StatusUnauthorized,
				Body:       io.NopCloser(bytes.NewReader([]byte(`{}`))),
			}, nil
		}))

		id, err := p.RequestOTP(context.Background(), "xyz@example.com")

		require.HasError(t, err)
		require.Equal(t, "", id)
		require.True(t, errors.Is(err, ErrUnauthorized))
	})

	t.Run("returns ErrDomainNotAllowed when provider responds with 403 and code 2005", func(t *testing.T) {
		p := newTestOTPaaSProvider(roundTripFunc(func(*http.Request) (*http.Response, error) {
			return &http.Response{
				StatusCode: http.StatusForbidden,
				Body:       io.NopCloser(bytes.NewReader([]byte(`{"code":2005,"message":"domain not allowed"}`))),
			}, nil
		}))

		id, err := p.RequestOTP(context.Background(), "xyz@example.com")

		require.HasError(t, err)
		require.Equal(t, "", id)
		require.True(t, errors.Is(err, ErrDomainNotAllowed))
	})

	t.Run("returns error when provider responds with 403 and other code", func(t *testing.T) {
		p := newTestOTPaaSProvider(roundTripFunc(func(*http.Request) (*http.Response, error) {
			return &http.Response{
				StatusCode: http.StatusForbidden,
				Body:       io.NopCloser(bytes.NewReader([]byte(`{"code":1234,"message":"other"}`))),
			}, nil
		}))

		id, err := p.RequestOTP(context.Background(), "xyz@example.com")

		require.HasError(t, err)
		require.Equal(t, "", id)
		require.False(t, errors.Is(err, ErrDomainNotAllowed))
	})

	t.Run("returns error when provider responds with unexpected status code", func(t *testing.T) {
		p := newTestOTPaaSProvider(roundTripFunc(func(*http.Request) (*http.Response, error) {
			return &http.Response{
				StatusCode: http.StatusInternalServerError,
				Body:       io.NopCloser(bytes.NewReader([]byte(`{"code":0,"message":"boom"}`))),
			}, nil
		}))

		id, err := p.RequestOTP(context.Background(), "xyz@example.com")

		require.HasError(t, err)
		require.Equal(t, "", id)
		require.False(t, errors.Is(err, ErrRateLimited))
		require.False(t, errors.Is(err, ErrDomainNotAllowed))
		require.False(t, errors.Is(err, ErrUnauthorized))
	})

	t.Run("returns error when request times out", func(t *testing.T) {
		p := newTestOTPaaSProvider(roundTripFunc(func(r *http.Request) (*http.Response, error) {
			<-r.Context().Done()
			return nil, r.Context().Err()
		}))

		ctx, cancel := context.WithTimeout(context.Background(), 1*time.Millisecond)
		defer cancel()

		id, err := p.RequestOTP(ctx, "xyz@example.com")

		require.HasError(t, err)
		require.Equal(t, "", id)
		require.True(t, errors.Is(err, context.DeadlineExceeded))
	})

	t.Run("returns error when transport fails", func(t *testing.T) {
		p := newTestOTPaaSProvider(roundTripFunc(func(*http.Request) (*http.Response, error) {
			return nil, errors.New("connection refused")
		}))

		id, err := p.RequestOTP(context.Background(), "xyz@example.com")

		require.HasError(t, err)
		require.Equal(t, "", id)
		require.False(t, errors.Is(err, context.DeadlineExceeded))
	})
}

func TestOTPaaSProvider_VerifyOTP(t *testing.T) {
	t.Run("sends expected request and returns nil", func(t *testing.T) {
		var captured *http.Request
		var capturedBody string
		p := newTestOTPaaSProvider(roundTripFunc(func(r *http.Request) (*http.Response, error) {
			captured = r.Clone(r.Context())

			body, err := io.ReadAll(r.Body)
			if err != nil {
				t.Fatalf("failed to read request body: %v", err)
			}
			capturedBody = string(body)

			return &http.Response{
				StatusCode: http.StatusOK,
				Body:       io.NopCloser(bytes.NewReader([]byte(`{}`))),
			}, nil
		}))

		err := p.VerifyOTP(context.Background(), "flow-42", "123456")

		require.NoError(t, err)
		require.Equal(t, http.MethodPut, captured.Method)
		require.Equal(t, "https://otp.example.com/otp/flow-42", captured.URL.String())
		require.Equal(t, "application/json", captured.Header.Get("Content-Type"))
		require.Equal(t, "Bearer "+p.token, captured.Header.Get("Authorization"))
		require.Equal(t, "app-id", captured.Header.Get("X-App-Id"))
		require.Equal(t, "app-namespace", captured.Header.Get("X-App-Namespace"))
		require.Equal(t, `{"pin":"123456"}`, capturedBody)
	})

	t.Run("returns ErrInvalidPIN when provider responds with 401 and code 1006", func(t *testing.T) {
		p := newTestOTPaaSProvider(roundTripFunc(func(*http.Request) (*http.Response, error) {
			return &http.Response{
				StatusCode: http.StatusUnauthorized,
				Body:       io.NopCloser(bytes.NewReader([]byte(`{"code":1006,"message":"invalid pin"}`))),
			}, nil
		}))

		err := p.VerifyOTP(context.Background(), "flow-42", "000000")

		require.HasError(t, err)
		require.True(t, errors.Is(err, ErrInvalidPIN))
	})

	t.Run("returns ErrUnauthorized when provider responds with 401 and other code", func(t *testing.T) {
		p := newTestOTPaaSProvider(roundTripFunc(func(*http.Request) (*http.Response, error) {
			return &http.Response{
				StatusCode: http.StatusUnauthorized,
				Body:       io.NopCloser(bytes.NewReader([]byte(`{"code":9999,"message":"bad token"}`))),
			}, nil
		}))

		err := p.VerifyOTP(context.Background(), "flow-42", "123456")

		require.HasError(t, err)
		require.True(t, errors.Is(err, ErrUnauthorized))
		require.False(t, errors.Is(err, ErrInvalidPIN))
	})

	t.Run("returns ErrFlowExpired when provider responds with 404", func(t *testing.T) {
		p := newTestOTPaaSProvider(roundTripFunc(func(*http.Request) (*http.Response, error) {
			return &http.Response{
				StatusCode: http.StatusNotFound,
				Body:       io.NopCloser(bytes.NewReader([]byte(`{}`))),
			}, nil
		}))

		err := p.VerifyOTP(context.Background(), "flow-42", "123456")

		require.HasError(t, err)
		require.True(t, errors.Is(err, ErrFlowExpired))
	})

	t.Run("returns error when provider responds with unexpected status code", func(t *testing.T) {
		p := newTestOTPaaSProvider(roundTripFunc(func(*http.Request) (*http.Response, error) {
			return &http.Response{
				StatusCode: http.StatusInternalServerError,
				Body:       io.NopCloser(bytes.NewReader([]byte(`{"code":0,"message":"oops"}`))),
			}, nil
		}))

		err := p.VerifyOTP(context.Background(), "flow-42", "123456")

		require.HasError(t, err)
		require.False(t, errors.Is(err, ErrInvalidPIN))
		require.False(t, errors.Is(err, ErrUnauthorized))
		require.False(t, errors.Is(err, ErrFlowExpired))
	})

	t.Run("returns error when request times out", func(t *testing.T) {
		p := newTestOTPaaSProvider(roundTripFunc(func(r *http.Request) (*http.Response, error) {
			<-r.Context().Done()
			return nil, r.Context().Err()
		}))

		ctx, cancel := context.WithTimeout(context.Background(), 1*time.Millisecond)
		defer cancel()

		err := p.VerifyOTP(ctx, "flow-42", "123456")

		require.HasError(t, err)
		require.True(t, errors.Is(err, context.DeadlineExceeded))
	})

	t.Run("returns error when transport fails", func(t *testing.T) {
		p := newTestOTPaaSProvider(roundTripFunc(func(*http.Request) (*http.Response, error) {
			return nil, errors.New("connection refused")
		}))

		err := p.VerifyOTP(context.Background(), "flow-42", "123456")

		require.HasError(t, err)
		require.False(t, errors.Is(err, context.DeadlineExceeded))
	})
}
