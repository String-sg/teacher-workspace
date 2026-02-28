package session

import (
	"context"
	"time"
)

// Store manages session lifecycle operations.
type Store interface {
	// Prepare returns the existing session for the ID, or creates a new empty session
	// when one does not exist yet.
	Prepare(ctx context.Context, id string) (*Session, error)

	// Commit persists the session with the given TTL.
	Commit(ctx context.Context, sess *Session, ttl time.Duration) error

	// Drop removes the session for the given ID.
	Drop(ctx context.Context, id string) error
}
