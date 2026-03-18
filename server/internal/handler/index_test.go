package handler

import (
	"net/http"
	"net/http/httptest"
	"net/http/httputil"
	"net/url"
	"testing"

	"github.com/String-sg/teacher-workspace/server/internal/config"
	"github.com/String-sg/teacher-workspace/server/pkg/require"
)

func TestHandler_Index(t *testing.T) {
	t.Run("renders HTML for non-asset requests", func(t *testing.T) {
		h := &Handler{
			cfg:      &config.Config{Environment: config.EnvironmentProduction},
			executor: &stubExecutor{body: "<html>Hello World</html>"},
		}

		req := httptest.NewRequest(http.MethodGet, "/", nil)
		rec := httptest.NewRecorder()

		h.Index(rec, req)

		require.Equal(t, http.StatusOK, rec.Code)
		require.Equal(t, "<html>Hello World</html>", rec.Body.String())
	})

	t.Run("delegates asset requests to the asset handler", func(t *testing.T) {
		h := &Handler{
			cfg: &config.Config{Environment: config.EnvironmentProduction},
			assets: http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
				_, _ = w.Write([]byte("console.log('Hello World!');"))
			}),
		}

		req := httptest.NewRequest(http.MethodGet, "/assets/main.js", nil)
		rec := httptest.NewRecorder()

		h.Index(rec, req)

		require.Equal(t, http.StatusOK, rec.Code)
		require.Equal(t, "console.log('Hello World!');", rec.Body.String())
	})

	t.Run("renders HTML for non-Vite requests in development", func(t *testing.T) {
		h := &Handler{
			cfg:      &config.Config{Environment: config.EnvironmentDevelopment},
			executor: &stubExecutor{body: "<html>Hello World</html>"},
		}

		req := httptest.NewRequest(http.MethodGet, "/", nil)
		rec := httptest.NewRecorder()

		h.Index(rec, req)

		require.Equal(t, http.StatusOK, rec.Code)
		require.Equal(t, "<html>Hello World</html>", rec.Body.String())
	})

	t.Run("proxies Vite requests in development", func(t *testing.T) {
		srv := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
			_, _ = w.Write([]byte("vite-client-script"))
		}))
		t.Cleanup(srv.Close)

		srvURL, err := url.Parse(srv.URL)
		require.NoError(t, err)

		h := &Handler{
			cfg:   &config.Config{Environment: config.EnvironmentDevelopment},
			proxy: httputil.NewSingleHostReverseProxy(srvURL),
		}

		req := httptest.NewRequest(http.MethodGet, "/@vite/client", nil)
		rec := httptest.NewRecorder()

		h.Index(rec, req)

		require.Equal(t, http.StatusOK, rec.Code)
		require.Equal(t, "vite-client-script", rec.Body.String())
	})
}

func TestIsViteRequest(t *testing.T) {
	tests := []struct {
		name    string
		path    string
		headers map[string]string
		want    bool
	}{
		{
			name: "matches @vite path prefix",
			path: "/@vite/client",
			want: true,
		},
		{
			name: "matches @fs path prefix",
			path: "/@fs/some/module.js",
			want: true,
		},
		{
			name: "matches @react-refresh path",
			path: "/@react-refresh",
			want: true,
		},
		{
			name: "matches .ts extension",
			path: "/src/main.ts",
			want: true,
		},
		{
			name: "matches .tsx extension",
			path: "/src/App.tsx",
			want: true,
		},
		{
			name: "matches .css extension",
			path: "/src/index.css",
			want: true,
		},
		{
			name: "matches Vite HMR WebSocket headers",
			path: "/",
			headers: map[string]string{
				"Connection":             "Upgrade",
				"Upgrade":                "websocket",
				"Sec-Websocket-Protocol": "vite-hmr",
			},
			want: true,
		},
		{
			name: "matches case-insensitive WebSocket headers",
			path: "/",
			headers: map[string]string{
				"Connection":             "UPGRADE",
				"Upgrade":                "WEBSOCKET",
				"Sec-Websocket-Protocol": "VITE-HMR",
			},
			want: true,
		},
		{
			name: "rejects plain root path",
			path: "/",
			want: false,
		},
		{
			name: "rejects regular application route",
			path: "/dashboard",
			want: false,
		},
		{
			name: "rejects unrecognised file extension",
			path: "/image.png",
			want: false,
		},
		{
			name: "rejects WebSocket without vite-hmr protocol",
			path: "/",
			headers: map[string]string{
				"Connection": "Upgrade",
				"Upgrade":    "websocket",
			},
			want: false,
		},
		{
			name: "rejects partial WebSocket headers with only connection upgrade",
			path: "/",
			headers: map[string]string{
				"Connection": "Upgrade",
			},
			want: false,
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			req := httptest.NewRequest(http.MethodGet, tt.path, nil)
			for k, v := range tt.headers {
				req.Header.Set(k, v)
			}

			require.Equal(t, tt.want, isViteRequest(req))
		})
	}
}
