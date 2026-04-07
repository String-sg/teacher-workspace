package pg

import "context"

type contextKey struct{}

// StaffIDFromContext returns the authenticated staff ID from the request context.
// Returns (0, false) if no identity is present.
//
// Today this is populated by a stub. When TW auth middleware lands,
// it will call WithStaffID to inject the real session identity.
func StaffIDFromContext(ctx context.Context) (int, bool) {
	id, ok := ctx.Value(contextKey{}).(int)
	return id, ok
}

// WithStaffID returns a new context carrying the given staff ID.
// Called by TW auth middleware once the session is validated.
func WithStaffID(ctx context.Context, staffID int) context.Context {
	return context.WithValue(ctx, contextKey{}, staffID)
}
