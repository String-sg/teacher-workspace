package session

import (
	"context"
	"encoding/json"
	"fmt"
	"time"

	glide "github.com/valkey-io/valkey-glide/go/v2"
	glideopts "github.com/valkey-io/valkey-glide/go/v2/options"
)

// ValkeyStore implements [Store] using the Valkey Glide API.
type ValkeyStore struct {
	client *glide.Client
}

func NewValkeyStore(client *glide.Client) *ValkeyStore {
	return &ValkeyStore{client: client}
}

// Prepare implements [Store.Prepare].
func (s *ValkeyStore) Prepare(ctx context.Context, id string) (*Session, error) {
	if id == "" {
		return New(), nil
	}

	result, err := s.client.Get(ctx, id)
	if err != nil {
		return nil, fmt.Errorf("valkey_store: failed to get session: %w", err)
	}

	if result.IsNil() {
		return New(), nil
	}

	var sess Session
	if err := json.Unmarshal([]byte(result.Value()), &sess); err != nil {
		return nil, fmt.Errorf("valkey_store: failed to unmarshal session: %w", err)
	}

	return &sess, nil
}

// Commit implements [Store.Commit].
func (s *ValkeyStore) Commit(ctx context.Context, sess *Session, ttl time.Duration) error {
	if sess == nil || sess.ID == "" {
		return nil
	}
	if ttl < 0 {
		ttl = 0
	}

	data, err := json.Marshal(sess)
	if err != nil {
		return fmt.Errorf("valkey_store: failed to marshal session: %w", err)
	}

	if _, err = s.client.SetWithOptions(ctx, sess.ID, string(data), glideopts.SetOptions{
		Expiry: glideopts.NewExpiryIn(ttl),
	}); err != nil {
		return fmt.Errorf("valkey_store: failed to set session: %w", err)
	}

	return nil
}

// Drop implements [Store.Drop].
func (s *ValkeyStore) Drop(ctx context.Context, id string) error {
	if id == "" {
		return nil
	}

	if _, err := s.client.Del(ctx, []string{id}); err != nil {
		return fmt.Errorf("valkey_store: failed to drop session: %w", err)
	}

	return nil
}
