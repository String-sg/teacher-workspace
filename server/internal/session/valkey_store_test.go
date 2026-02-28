package session

import (
	"context"
	"encoding/json"
	"errors"
	"net/url"
	"strconv"
	"testing"
	"time"

	"github.com/String-sg/teacher-workspace/server/pkg/require"
	tcvalkey "github.com/testcontainers/testcontainers-go/modules/valkey"
	glide "github.com/valkey-io/valkey-glide/go/v2"
	glideconfig "github.com/valkey-io/valkey-glide/go/v2/config"
	glideopts "github.com/valkey-io/valkey-glide/go/v2/options"
)

func newTestValkeyStore(t *testing.T) (*ValkeyStore, *glide.Client) {
	t.Helper()

	container, err := tcvalkey.Run(t.Context(), "valkey/valkey:8.1.5-alpine3.23")
	if err != nil {
		t.Fatalf("failed to run valkey container: %v", err)
	}

	t.Cleanup(func() {
		if err := container.Terminate(context.Background()); err != nil {
			t.Logf("failed to terminate valkey container: %v", err)
		}
	})

	connStr, err := container.ConnectionString(t.Context())
	if err != nil {
		t.Fatalf("failed to get connection string: %v", err)
	}

	u, err := url.Parse(connStr)
	if err != nil {
		t.Fatalf("failed to parse connection string %q: %v", connStr, err)
	}

	host := u.Hostname()
	port, err := strconv.Atoi(u.Port())
	if err != nil {
		t.Fatalf("failed to convert port %q to int: %v", u.Port(), err)
	}

	vcfg := glideconfig.NewClientConfiguration().
		WithAddress(&glideconfig.NodeAddress{Host: host, Port: port})

	client, err := glide.NewClient(vcfg)
	if err != nil {
		t.Fatalf("failed to create valkey client: %v", err)
	}

	t.Cleanup(func() {
		client.Close()
	})

	return NewValkeyStore(client), client
}

func TestValkeyStore_Prepare(t *testing.T) {
	store, client := newTestValkeyStore(t)

	t.Run("returns a new session when ID is empty", func(t *testing.T) {
		sess, err := store.Prepare(t.Context(), "")

		require.NoError(t, err)
		require.True(t, sess != nil)
		require.NotEqual(t, "", sess.ID)
		require.Equal(t, "", sess.CSRFToken)
		require.True(t, sess.CurrentUser == nil)
	})

	t.Run("returns a new session when ID does not exist", func(t *testing.T) {
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

		t.Cleanup(func() {
			if _, cerr := client.Del(context.Background(), []string{key}); cerr != nil {
				t.Logf("failed to delete key %q from Valkey: %v", key, cerr)
			}
		})

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

		if _, cerr := client.Set(t.Context(), key, string(data)); cerr != nil {
			t.Fatalf("failed to seed key %q in Valkey: %v", key, cerr)
		}

		sess, err := store.Prepare(t.Context(), key)

		require.NoError(t, err)
		require.True(t, sess != nil)
		require.Equal(t, key, sess.ID)
		require.Equal(t, "abc", sess.CSRFToken)
		require.True(t, sess.CurrentUser != nil)
		require.Equal(t, "xyz", sess.CurrentUser.ID)
		require.Equal(t, "xyz@example.com", sess.CurrentUser.Email)
	})

	t.Run("returns a new session when session ID has expired", func(t *testing.T) {
		key := "prepare:" + t.Name()

		t.Cleanup(func() {
			if _, cerr := client.Del(context.Background(), []string{key}); cerr != nil {
				t.Logf("failed to delete key %q from Valkey: %v", key, cerr)
			}
		})

		data, err := json.Marshal(&Session{
			ID: key,
		})
		if err != nil {
			t.Fatalf("failed to marshal session: %v", err)
		}

		if _, cerr := client.SetWithOptions(t.Context(), key, string(data), glideopts.SetOptions{
			Expiry: glideopts.NewExpiryIn(time.Second),
		}); cerr != nil {
			t.Fatalf("failed to seed session to valkey: %v", cerr)
		}

		deadline := time.Now().Add(3 * time.Second)
		for {
			result, cerr := client.Get(t.Context(), key)
			if cerr != nil {
				t.Fatalf("failed to read key %q from valkey: %v", key, cerr)
			}

			if result.IsNil() {
				break
			}

			if time.Now().After(deadline) {
				t.Fatalf("session key %q did not expire before deadline", key)
			}

			time.Sleep(100 * time.Millisecond)
		}

		sess, err := store.Prepare(t.Context(), key)

		require.NoError(t, err)
		require.True(t, sess != nil)
		require.NotEqual(t, key, sess.ID)
		require.NotEqual(t, "", sess.ID)
	})

	t.Run("returns error when stored session data is malformed", func(t *testing.T) {
		key := "prepare:" + t.Name()

		t.Cleanup(func() {
			if _, cerr := client.Del(context.Background(), []string{key}); cerr != nil {
				t.Logf("failed to delete key %q from Valkey: %v", key, cerr)
			}
		})

		if _, cerr := client.Set(t.Context(), key, "malformed json"); cerr != nil {
			t.Fatalf("failed to seed key %q in Valkey: %v", key, cerr)
		}

		sess, err := store.Prepare(t.Context(), key)

		require.HasError(t, err)
		require.True(t, sess == nil)
	})

	t.Run("returns error when context is cancelled", func(t *testing.T) {
		key := "prepare:" + t.Name()

		ctx, cancel := context.WithCancel(context.Background())
		cancel()

		sess, err := store.Prepare(ctx, key)

		require.HasError(t, err)
		require.True(t, sess == nil)
	})
}

func TestValkeyStore_Commit(t *testing.T) {
	store, client := newTestValkeyStore(t)

	t.Run("no-op when session is nil", func(t *testing.T) {
		beforeSize, cerr := client.DBSize(t.Context())
		if cerr != nil {
			t.Fatalf("failed to get database size before commit: %v", cerr)
		}

		err := store.Commit(t.Context(), nil, 5*time.Second)

		afterSize, cerr := client.DBSize(t.Context())
		if cerr != nil {
			t.Fatalf("failed to get database size after commit: %v", cerr)
		}

		require.NoError(t, err)
		require.Equal(t, beforeSize, afterSize)

	})

	t.Run("no-op when session has no ID", func(t *testing.T) {
		beforeSize, cerr := client.DBSize(t.Context())
		if cerr != nil {
			t.Fatalf("failed to get database size before commit: %v", cerr)
		}

		err := store.Commit(t.Context(), &Session{}, 5*time.Second)

		afterSize, cerr := client.DBSize(t.Context())
		if cerr != nil {
			t.Fatalf("failed to get database size after commit: %v", cerr)
		}

		require.NoError(t, err)
		require.Equal(t, beforeSize, afterSize)
	})

	t.Run("stores session data as JSON keyed by ID", func(t *testing.T) {
		key := "commit:" + t.Name()

		t.Cleanup(func() {
			if _, cerr := client.Del(context.Background(), []string{key}); cerr != nil {
				t.Logf("failed to delete key %q from Valkey: %v", key, cerr)
			}
		})

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

		result, cerr := client.Get(t.Context(), key)
		if cerr != nil {
			t.Fatalf("failed to read key %q from Valkey: %v", key, cerr)
		}

		require.False(t, result.IsNil())

		var got Session
		if err := json.Unmarshal([]byte(result.Value()), &got); err != nil {
			t.Fatalf("failed to unmarshal session: %v", err)
		}

		require.Equal(t, key, got.ID)
		require.Equal(t, "abc", got.CSRFToken)
		require.True(t, got.CurrentUser != nil)
		require.Equal(t, "xyz", got.CurrentUser.ID)
		require.Equal(t, "xyz@example.com", got.CurrentUser.Email)
	})

	t.Run("overwrites existing session with the same ID", func(t *testing.T) {
		key := "commit:" + t.Name()

		t.Cleanup(func() {
			if _, cerr := client.Del(context.Background(), []string{key}); cerr != nil {
				t.Logf("failed to delete key %q from Valkey: %v", key, cerr)
			}
		})

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

		if _, cerr := client.Set(t.Context(), key, string(data)); cerr != nil {
			t.Fatalf("failed to seed key %q in Valkey: %v", key, cerr)
		}

		sess.CSRFToken = "def"
		sess.CurrentUser = nil

		err = store.Commit(t.Context(), sess, 5*time.Second)

		require.NoError(t, err)

		result, cerr := client.Get(t.Context(), key)
		if cerr != nil {
			t.Fatalf("failed to read key %q from Valkey: %v", key, cerr)
		}

		require.False(t, result.IsNil())

		var got Session
		if err := json.Unmarshal([]byte(result.Value()), &got); err != nil {
			t.Fatalf("failed to unmarshal session: %v", err)
		}

		require.Equal(t, key, got.ID)
		require.Equal(t, "def", got.CSRFToken)
		require.True(t, got.CurrentUser == nil)
	})

	t.Run("session expires after TTL", func(t *testing.T) {
		key := "commit:" + t.Name()

		t.Cleanup(func() {
			if _, cerr := client.Del(context.Background(), []string{key}); cerr != nil {
				t.Logf("failed to delete key %q from Valkey: %v", key, cerr)
			}
		})

		err := store.Commit(t.Context(), &Session{ID: key}, time.Second)

		require.NoError(t, err)

		expired := false
		deadline := time.Now().Add(3 * time.Second)
		for {
			result, cerr := client.Get(t.Context(), key)
			if cerr != nil {
				t.Fatalf("failed to get session from valkey: %v", cerr)
			}

			if result.IsNil() {
				expired = true
				break
			}

			if time.Now().After(deadline) {
				t.Fatalf("session key %q did not expire before deadline", key)
			}

			time.Sleep(100 * time.Millisecond)
		}

		require.True(t, expired)
	})

	t.Run("returns error when context is cancelled", func(t *testing.T) {
		key := "commit:" + t.Name()

		t.Cleanup(func() {
			if _, cerr := client.Del(context.Background(), []string{key}); cerr != nil {
				t.Logf("failed to delete key %q from Valkey: %v", key, cerr)
			}
		})

		ctx, cancel := context.WithCancel(context.Background())
		cancel()

		err := store.Commit(ctx, &Session{ID: key}, 5*time.Second)

		require.HasError(t, err)
		require.True(t, errors.Is(err, context.Canceled))
	})
}

func TestValkeyStore_Drop(t *testing.T) {
	store, client := newTestValkeyStore(t)

	t.Run("removes the session when ID exists", func(t *testing.T) {
		key := "drop:" + t.Name()

		t.Cleanup(func() {
			if _, cerr := client.Del(context.Background(), []string{key}); cerr != nil {
				t.Logf("failed to delete key %q from Valkey: %v", key, cerr)
			}
		})

		if _, cerr := client.Set(t.Context(), key, "data"); cerr != nil {
			t.Fatalf("failed to seed key %q in Valkey: %v", key, cerr)
		}

		err := store.Drop(t.Context(), key)

		require.NoError(t, err)

		result, cerr := client.Get(t.Context(), key)
		if cerr != nil {
			t.Fatalf("failed to read key %q from Valkey: %v", key, cerr)
		}

		require.True(t, result.IsNil())
	})

	t.Run("no-op when ID is empty", func(t *testing.T) {
		key := "drop:" + t.Name()

		t.Cleanup(func() {
			if _, cerr := client.Del(context.Background(), []string{key}); cerr != nil {
				t.Logf("failed to delete key %q from Valkey: %v", key, cerr)
			}
		})

		if _, cerr := client.Set(t.Context(), key, "data"); cerr != nil {
			t.Fatalf("failed to seed key %q in Valkey: %v", key, cerr)
		}

		err := store.Drop(t.Context(), "")

		require.NoError(t, err)

		result, cerr := client.Get(t.Context(), key)
		if cerr != nil {
			t.Fatalf("failed to read key %q from Valkey: %v", key, cerr)
		}

		require.False(t, result.IsNil())
		require.Equal(t, "data", result.Value())
	})

	t.Run("no-op when ID does not exist", func(t *testing.T) {
		key := "drop:" + t.Name()

		t.Cleanup(func() {
			if _, cerr := client.Del(context.Background(), []string{key}); cerr != nil {
				t.Logf("failed to delete key %q from Valkey: %v", key, cerr)
			}
		})

		if _, cerr := client.Set(t.Context(), key, "data"); cerr != nil {
			t.Fatalf("failed to seed key %q in Valkey: %v", key, cerr)
		}

		err := store.Drop(t.Context(), "nonexistent")

		require.NoError(t, err)

		result, cerr := client.Get(t.Context(), key)
		if cerr != nil {
			t.Fatalf("failed to read key %q from Valkey: %v", key, cerr)
		}

		require.False(t, result.IsNil())
		require.Equal(t, "data", result.Value())
	})

	t.Run("returns error when context is cancelled", func(t *testing.T) {
		key := "drop:" + t.Name()

		t.Cleanup(func() {
			if _, cerr := client.Del(context.Background(), []string{key}); cerr != nil {
				t.Logf("failed to delete key %q from Valkey: %v", key, cerr)
			}
		})

		if _, cerr := client.Set(t.Context(), key, "data"); cerr != nil {
			t.Fatalf("failed to seed key %q in Valkey: %v", key, cerr)
		}

		ctx, cancel := context.WithCancel(context.Background())
		cancel()

		err := store.Drop(ctx, key)

		require.HasError(t, err)
		require.True(t, errors.Is(err, context.Canceled))
	})
}
