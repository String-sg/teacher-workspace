package otp

import (
	"context"
	"errors"
)

var (
	// ErrRateLimited indicates the request exceeded the allowed request rate.
	ErrRateLimited = errors.New("too many requests")

	// ErrDomainNotAllowed indicates the email domain is not permitted.
	ErrDomainNotAllowed = errors.New("email domain not allowed")

	// ErrUnauthorized indicates the underlying provider rejected the request due to invalid or missing credentials.
	ErrUnauthorized = errors.New("unauthorized")

	// ErrFlowExpired indicates the OTP flow is no longer valid.
	ErrFlowExpired = errors.New("flow expired")

	// ErrInvalidPIN indicates the provided PIN does not match the flow.
	ErrInvalidPIN = errors.New("invalid PIN")
)

// Provider manages OTP request and verification flows.
type Provider interface {
	// RequestOTP sends an OTP to the given email and returns a flow ID.
	// May return [ErrRateLimited], [ErrDomainNotAllowed], or [ErrUnauthorized].
	// Use [errors.Is] to check; other errors may be returned for unexpected failures.
	RequestOTP(ctx context.Context, email string) (string, error)

	// VerifyOTP validates a PIN against the given flow.
	// May return [ErrInvalidPIN], [ErrFlowExpired], or [ErrUnauthorized].
	// Use [errors.Is] to check; other errors may be returned for unexpected failures.
	VerifyOTP(ctx context.Context, flowID, pin string) error
}
