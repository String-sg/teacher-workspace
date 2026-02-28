package session

import (
	"context"
	"encoding/json"
	"errors"
	"testing"
	"time"

	"github.com/String-sg/teacher-workspace/server/pkg/require"
)

func TestInMemoryStore_Prepare(t *testing.T) {
	t.Run("returns a new session when ID is empty", func(t *testing.T) {
		store := NewInMemoryStore()

		sess, err := store.Prepare(t.Context(), "")

		require.NoError(t, err)
		require.True(t, sess != nil)
		require.NotEqual(t, "", sess.ID)
		require.Equal(t, "", sess.CSRFToken)
		require.True(t, sess.CurrentUser == nil)
	})

	t.Run("returns a new session when ID does not exist", func(t *testing.T) {
		store := NewInMemoryStore()

		sess, err := store.Prepare(t.Context(), "nonexistent")

		require.NoError(t, err)
		require.True(t, sess != nil)
		require.NotEqual(t, "", sess.ID)
		require.NotEqual(t, "nonexistent", sess.ID)
		require.Equal(t, "", sess.CSRFToken)
		require.True(t, sess.CurrentUser == nil)
	})

	t.Run("returns stored session when ID has not expired", func(t *testing.T) {
		key := "prepare:" + t.Name()

		now := time.Date(2026, time.February, 5, 10, 0, 0, 0, time.UTC)
		store := NewInMemoryStoreWithNow(func() time.Time { return now })

		data, err := json.Marshal(&Session{
			ID:        key,
			CSRFToken: "abc",
			CurrentUser: &CurrentUser{
				ID:    "xyz",
				Email: "xyz@example.com",
			},
		})
		if err != nil {
			t.Fatalf("failed to marshal session: %v", err)
		}

		store.m[key] = record{
			data:      data,
			expiresAt: now.Add(5 * time.Second),
		}

		sess, err := store.Prepare(t.Context(), key)

		require.NoError(t, err)
		require.True(t, sess != nil)
		require.Equal(t, key, sess.ID)
		require.Equal(t, "abc", sess.CSRFToken)
		require.True(t, sess.CurrentUser != nil)
		require.Equal(t, "xyz", sess.CurrentUser.ID)
		require.Equal(t, "xyz@example.com", sess.CurrentUser.Email)

		_, ok := store.m[key]

		require.True(t, ok)
	})

	t.Run("returns stored session when ID never expires", func(t *testing.T) {
		key := "prepare:" + t.Name()

		store := NewInMemoryStore()

		data, err := json.Marshal(&Session{
			ID: key,
		})
		if err != nil {
			t.Fatalf("failed to marshal session: %v", err)
		}

		store.m[key] = record{
			data:      data,
			expiresAt: time.Time{},
		}

		sess, err := store.Prepare(t.Context(), key)

		require.NoError(t, err)
		require.True(t, sess != nil)
		require.Equal(t, key, sess.ID)

		_, ok := store.m[key]

		require.True(t, ok)
	})

	t.Run("returns a new session when ID has expired", func(t *testing.T) {
		key := "prepare:" + t.Name()

		now := time.Date(2026, time.February, 5, 10, 0, 0, 0, time.UTC)
		store := NewInMemoryStoreWithNow(func() time.Time { return now })

		data, err := json.Marshal(&Session{
			ID: key,
		})
		if err != nil {
			t.Fatalf("failed to marshal session: %v", err)
		}

		store.m[key] = record{
			data:      data,
			expiresAt: now.Add(-5 * time.Second),
		}

		sess, err := store.Prepare(t.Context(), key)

		require.NoError(t, err)
		require.True(t, sess != nil)
		require.NotEqual(t, key, sess.ID)
		require.NotEqual(t, "", sess.ID)

		_, ok := store.m[key]

		require.False(t, ok)
	})

	t.Run("returns a new session when ID expires at now", func(t *testing.T) {
		key := "prepare:" + t.Name()

		now := time.Date(2026, time.February, 5, 10, 0, 0, 0, time.UTC)
		store := NewInMemoryStoreWithNow(func() time.Time { return now })

		data, err := json.Marshal(&Session{
			ID: key,
		})
		if err != nil {
			t.Fatalf("failed to marshal session: %v", err)
		}

		store.m[key] = record{
			data:      data,
			expiresAt: now,
		}

		sess, err := store.Prepare(t.Context(), key)

		require.NoError(t, err)
		require.True(t, sess != nil)
		require.NotEqual(t, key, sess.ID)
		require.NotEqual(t, "", sess.ID)

		_, ok := store.m[key]

		require.False(t, ok)
	})

	t.Run("returns error when stored session data is malformed", func(t *testing.T) {
		key := "prepare:" + t.Name()

		store := NewInMemoryStore()

		store.m[key] = record{
			data:      []byte("malformed json"),
			expiresAt: time.Time{},
		}

		sess, err := store.Prepare(t.Context(), key)

		require.HasError(t, err)
		require.True(t, sess == nil)
	})

	t.Run("returns error when context is cancelled", func(t *testing.T) {
		store := NewInMemoryStore()

		ctx, cancel := context.WithCancel(context.Background())
		cancel()

		sess, err := store.Prepare(ctx, "123")

		require.HasError(t, err)
		require.True(t, sess == nil)
		require.True(t, errors.Is(err, context.Canceled))
	})
}

func TestInMemoryStore_Commit(t *testing.T) {
	t.Run("no-op when session is nil", func(t *testing.T) {
		store := NewInMemoryStore()

		beforeSize := len(store.m)

		err := store.Commit(t.Context(), nil, 5*time.Second)

		afterSize := len(store.m)

		require.NoError(t, err)
		require.Equal(t, beforeSize, afterSize)
	})

	t.Run("no-op when session has no ID", func(t *testing.T) {
		store := NewInMemoryStore()

		beforeSize := len(store.m)

		err := store.Commit(t.Context(), &Session{}, 5*time.Second)

		afterSize := len(store.m)

		require.NoError(t, err)
		require.Equal(t, beforeSize, afterSize)
	})

	t.Run("stores session data as JSON keyed by ID", func(t *testing.T) {
		store := NewInMemoryStore()

		key := "commit:" + t.Name()

		sess := &Session{
			ID:        key,
			CSRFToken: "abc",
			CurrentUser: &CurrentUser{
				ID:    "xyz",
				Email: "xyz@example.com",
			},
		}

		err := store.Commit(t.Context(), sess, 5*time.Second)

		require.NoError(t, err)

		rec, ok := store.m[key]

		require.True(t, ok)

		var got Session
		require.NoError(t, json.Unmarshal(rec.data, &got))
		require.Equal(t, key, got.ID)
		require.Equal(t, "abc", got.CSRFToken)
		require.True(t, got.CurrentUser != nil)
		require.Equal(t, "xyz", got.CurrentUser.ID)
		require.Equal(t, "xyz@example.com", got.CurrentUser.Email)
	})

	t.Run("overwrites existing session with the same ID", func(t *testing.T) {
		key := "commit:" + t.Name()

		store := NewInMemoryStore()

		sess := &Session{
			ID:        key,
			CSRFToken: "abc",
			CurrentUser: &CurrentUser{
				ID:    "xyz",
				Email: "xyz@example.com",
			},
		}

		data, err := json.Marshal(sess)
		if err != nil {
			t.Fatalf("failed to marshal session: %v", err)
		}

		store.m[key] = record{
			data:      data,
			expiresAt: time.Time{},
		}

		sess.CSRFToken = "def"
		sess.CurrentUser = nil

		err = store.Commit(t.Context(), sess, 5*time.Second)

		require.NoError(t, err)

		rec, ok := store.m[key]

		require.True(t, ok)

		var got Session
		require.NoError(t, json.Unmarshal(rec.data, &got))
		require.Equal(t, key, got.ID)
		require.Equal(t, "def", got.CSRFToken)
		require.True(t, got.CurrentUser == nil)
	})

	t.Run("session expires at now plus TTL", func(t *testing.T) {
		key := "commit:" + t.Name()

		now := time.Date(2026, time.February, 5, 10, 0, 0, 0, time.UTC)
		store := NewInMemoryStoreWithNow(func() time.Time { return now })

		err := store.Commit(t.Context(), &Session{ID: key}, 5*time.Second)

		require.NoError(t, err)

		rec, ok := store.m[key]

		require.True(t, ok)
		require.Equal(t, now.Add(5*time.Second), rec.expiresAt)
	})

	t.Run("session does not expire when TTL is negative", func(t *testing.T) {
		key := "commit:" + t.Name()

		store := NewInMemoryStore()

		err := store.Commit(t.Context(), &Session{ID: key}, -1)
		require.NoError(t, err)

		rec, ok := store.m[key]
		require.True(t, ok)
		require.True(t, rec.expiresAt.IsZero())
	})

	t.Run("session does not expire when TTL is zero", func(t *testing.T) {
		key := "commit:" + t.Name()

		store := NewInMemoryStore()

		err := store.Commit(t.Context(), &Session{ID: key}, 0)

		require.NoError(t, err)

		rec, ok := store.m[key]
		require.True(t, ok)
		require.True(t, rec.expiresAt.IsZero())
	})

	t.Run("returns error when context is cancelled", func(t *testing.T) {
		store := NewInMemoryStore()

		ctx, cancel := context.WithCancel(context.Background())
		cancel()

		err := store.Commit(ctx, &Session{ID: "123"}, 5*time.Second)

		require.HasError(t, err)
		require.True(t, errors.Is(err, context.Canceled))
	})
}

func TestInMemoryStore_Drop(t *testing.T) {
	t.Run("removes the session when ID exists", func(t *testing.T) {
		key := "drop:" + t.Name()

		store := NewInMemoryStore()
		store.m[key] = record{
			data:      []byte("data"),
			expiresAt: time.Time{},
		}

		err := store.Drop(t.Context(), key)

		require.NoError(t, err)

		_, ok := store.m[key]
		require.False(t, ok)
	})

	t.Run("no-op when ID is empty", func(t *testing.T) {
		key := "drop:" + t.Name()

		store := NewInMemoryStore()
		store.m[key] = record{
			data:      []byte("data"),
			expiresAt: time.Time{},
		}

		err := store.Drop(t.Context(), "")

		require.NoError(t, err)

		rec, ok := store.m[key]
		require.True(t, ok)
		require.Equal(t, "data", string(rec.data))
	})

	t.Run("no-op when ID does not exist", func(t *testing.T) {
		key := "drop:" + t.Name()

		store := NewInMemoryStore()
		store.m[key] = record{
			data:      []byte("data"),
			expiresAt: time.Time{},
		}

		err := store.Drop(t.Context(), "nonexistent")

		require.NoError(t, err)

		rec, ok := store.m[key]
		require.True(t, ok)
		require.Equal(t, "data", string(rec.data))
	})

	t.Run("returns error when context is cancelled", func(t *testing.T) {
		key := "drop:" + t.Name()

		store := NewInMemoryStore()
		store.m[key] = record{
			data:      []byte("data"),
			expiresAt: time.Time{},
		}

		ctx, cancel := context.WithCancel(context.Background())
		cancel()

		err := store.Drop(ctx, key)

		require.HasError(t, err)
		require.True(t, errors.Is(err, context.Canceled))
	})
}
