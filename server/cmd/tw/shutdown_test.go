package main

import (
	"context"
	"errors"
	"net"
	"net/http"
	"testing"
	"time"

	"github.com/String-sg/teacher-workspace/server/internal/handler"
)

// startTestServer binds on a random port and returns the server and its address.
func startTestServer(t *testing.T, h http.Handler) (*http.Server, string) {
	t.Helper()
	ln, err := net.Listen("tcp", "127.0.0.1:0")
	if err != nil {
		t.Fatalf("listen: %v", err)
	}
	srv := &http.Server{Handler: h}
	go srv.Serve(ln) //nolint:errcheck
	t.Cleanup(func() { _ = srv.Close() })
	return srv, "http://" + ln.Addr().String()
}

func TestGracefulShutdown(t *testing.T) {
	t.Run("in-flight request completes before shutdown returns", func(t *testing.T) {
		slow := http.NewServeMux()
		slow.HandleFunc("/slow", func(w http.ResponseWriter, r *http.Request) {
			time.Sleep(150 * time.Millisecond)
			w.WriteHeader(http.StatusOK)
		})

		srv, base := startTestServer(t, slow)

		reqDone := make(chan error, 1)
		go func() {
			resp, err := http.Get(base + "/slow") //nolint:noctx
			if err == nil {
				resp.Body.Close()
			}
			reqDone <- err
		}()

		// yield briefly so the request reaches the handler before we shut down
		time.Sleep(30 * time.Millisecond)

		ctx, cancel := context.WithTimeout(context.Background(), 2*time.Second)
		defer cancel()
		if err := srv.Shutdown(ctx); err != nil {
			t.Fatalf("shutdown: %v", err)
		}

		select {
		case err := <-reqDone:
			if err != nil {
				t.Fatalf("want: in-flight request succeeded; got: %v", err)
			}
		case <-time.After(500 * time.Millisecond):
			t.Fatal("want: in-flight request completed; got: timed out waiting")
		}
	})

	t.Run("shutdown returns when timeout deadline is exceeded", func(t *testing.T) {
		blocked := make(chan struct{})
		hang := http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
			<-blocked
		})

		srv, base := startTestServer(t, hang)
		defer close(blocked)

		go http.Get(base + "/") //nolint:noctx,errcheck

		time.Sleep(30 * time.Millisecond)

		// Very short shutdown timeout - server should not hang.
		ctx, cancel := context.WithTimeout(context.Background(), 50*time.Millisecond)
		defer cancel()

		start := time.Now()
		err := srv.Shutdown(ctx)
		elapsed := time.Since(start)

		if !errors.Is(err, context.DeadlineExceeded) {
			t.Fatalf("want: context.DeadlineExceeded; got: %v", err)
		}
		if elapsed > 500*time.Millisecond {
			t.Fatalf("want: shutdown returned within 500ms; got: %v", elapsed)
		}
	})

	t.Run("listen fails when port is already bound", func(t *testing.T) {
		ln, err := net.Listen("tcp", "127.0.0.1:0")
		if err != nil {
			t.Fatalf("reserve port: %v", err)
		}
		defer ln.Close()

		srv := &http.Server{
			Addr:    ln.Addr().String(),
			Handler: handler.NewMux(),
		}
		err = srv.ListenAndServe()
		if err == nil {
			t.Fatal("want: error binding already-used port; got: nil")
		}
	})
}
