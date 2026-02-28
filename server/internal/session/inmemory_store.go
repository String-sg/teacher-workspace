package session

import (
	"context"
	"encoding/json"
	"fmt"
	"sync"
	"time"
)

// InMemoryStore implements [Store] using in-memory state.
type InMemoryStore struct {
	now func() time.Time
	mu  sync.Mutex

	m map[string]record
}

type record struct {
	data      []byte
	expiresAt time.Time
}

func NewInMemoryStore() *InMemoryStore {
	return &InMemoryStore{
		now: time.Now,
		m:   make(map[string]record),
	}
}

func NewInMemoryStoreWithNow(now func() time.Time) *InMemoryStore {
	return &InMemoryStore{
		now: now,
		m:   make(map[string]record),
	}
}

// Prepare implements [Store.Prepare].
func (s *InMemoryStore) Prepare(ctx context.Context, id string) (*Session, error) {
	if err := ctx.Err(); err != nil {
		return nil, fmt.Errorf("inmemory_store: %w", err)
	}
	if id == "" {
		return New(), nil
	}

	s.mu.Lock()
	rec, ok := s.m[id]
	s.mu.Unlock()

	if !ok {
		return New(), nil
	}

	if !rec.expiresAt.IsZero() && !s.now().Before(rec.expiresAt) {
		s.mu.Lock()
		delete(s.m, id)
		s.mu.Unlock()

		return New(), nil
	}

	var sess Session
	if err := json.Unmarshal(rec.data, &sess); err != nil {
		return nil, fmt.Errorf("inmemory_store: failed to unmarshal session: %w", err)
	}

	return &sess, nil
}

// Commit implements [Store.Commit].
func (s *InMemoryStore) Commit(ctx context.Context, sess *Session, ttl time.Duration) error {
	if err := ctx.Err(); err != nil {
		return fmt.Errorf("inmemory_store: %w", err)
	}
	if sess == nil || sess.ID == "" {
		return nil
	}
	if ttl < 0 {
		ttl = 0
	}

	data, err := json.Marshal(sess)
	if err != nil {
		return fmt.Errorf("inmemory_store: failed to marshal session: %w", err)
	}

	var expiresAt time.Time
	if ttl > 0 {
		expiresAt = s.now().Add(ttl)
	}

	s.mu.Lock()
	s.m[sess.ID] = record{
		data:      data,
		expiresAt: expiresAt,
	}
	s.mu.Unlock()

	return nil
}

// Drop implements [Store.Drop].
func (s *InMemoryStore) Drop(ctx context.Context, id string) error {
	if err := ctx.Err(); err != nil {
		return fmt.Errorf("inmemory_store: %w", err)
	}
	if id == "" {
		return nil
	}

	s.mu.Lock()
	delete(s.m, id)
	s.mu.Unlock()

	return nil
}
