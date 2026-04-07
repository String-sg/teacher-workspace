package pg

import (
	"fmt"
	"log/slog"
	"net/http"
	"net/http/httputil"
	"net/url"
	"time"
)

func (h *Handler) registerProxy(mux *http.ServeMux) {
	target, err := url.Parse(h.cfg.BaseURL)
	if err != nil {
		slog.Error("pg proxy: invalid base URL", "url", h.cfg.BaseURL, "err", err)
		return
	}

	proxy := &httputil.ReverseProxy{
		Director:     h.director(target),
		ErrorHandler: h.proxyErrorHandler,
		Transport: &http.Transport{
			ResponseHeaderTimeout: time.Duration(h.cfg.TimeoutMS) * time.Millisecond,
		},
	}

	routes := []string{
		// Session & config
		"GET /api/web/2/staff/session/current",
		"GET /api/configs",
		// Announcements
		"GET /api/web/2/staff/announcements",
		"GET /api/web/2/staff/announcements/shared",
		"GET /api/web/2/staff/announcements/{postId}",
		"POST /api/web/2/staff/announcements",
		"POST /api/web/2/staff/announcements/drafts",
		"DELETE /api/web/2/staff/announcements/{postId}",
		"DELETE /api/web/2/staff/announcements/drafts/{announcementDraftId}",
		// Consent forms
		"GET /api/web/2/staff/consentForms",
		"GET /api/web/2/staff/consentForms/shared",
		"GET /api/web/2/staff/consentForms/{consentFormId}",
		"POST /api/web/2/staff/consentForms",
		"POST /api/web/2/staff/consentForms/drafts",
		"DELETE /api/web/2/staff/consentForms/{consentFormId}",
		"DELETE /api/web/2/staff/consentForms/drafts/{consentFormDraftId}",
		// Meetings (PTM)
		"GET /api/web/2/staff/ptm",
		"GET /api/web/2/staff/ptm/{eventId}",
		"GET /api/web/2/staff/ptm/timeslots/{eventId}",
		"POST /api/web/2/staff/ptm",
		"DELETE /api/web/2/staff/ptm/{eventId}",
		"POST /api/web/2/staff/ptm/booking/block",
		"POST /api/web/2/staff/ptm/booking/unblock",
		"POST /api/web/2/staff/ptm/booking/add",
		"POST /api/web/2/staff/ptm/booking/change",
		"POST /api/web/2/staff/ptm/booking/remove",
		// Groups
		"GET /api/web/2/staff/groups/assigned",
		"GET /api/web/2/staff/groups/custom",
		"GET /api/web/2/staff/groups/custom/{customGroupId}",
		"POST /api/web/2/staff/groups/custom",
		"PUT /api/web/2/staff/groups/custom/{customGroupId}",
		"DELETE /api/web/2/staff/groups/custom/{customGroupId}",
		// School data
		"GET /api/web/2/staff/school/staff",
		"GET /api/web/2/staff/school/students",
		"GET /api/web/2/staff/school/groups",
		// Account & notification prefs
		"GET /api/web/2/staff/users/me",
		"GET /api/web/2/staff/notificationPreference",
		"PUT /api/web/2/staff/notificationPreference",
	}

	for _, pattern := range routes {
		mux.Handle(pattern, proxy)
	}
}

func (h *Handler) director(target *url.URL) func(*http.Request) {
	return func(r *http.Request) {
		r.URL.Scheme = target.Scheme
		r.URL.Host = target.Host
		r.Host = target.Host

		// Strip any forwarded headers that could leak internal topology.
		r.Header.Del("X-Forwarded-For")
		r.Header.Del("X-Real-IP")

		// Attach staff identity for pgw-web to resolve the authenticated user.
		// pgw-web must whitelist TW's server IP and trust this header.
		r.Header.Del("X-TW-Staff-ID") // prevent spoofing from browser
		if staffID, ok := StaffIDFromContext(r.Context()); ok {
			r.Header.Set("X-TW-Staff-ID", fmt.Sprintf("%d", staffID))
		}
	}
}

func (h *Handler) proxyErrorHandler(w http.ResponseWriter, r *http.Request, err error) {
	slog.Error("pg proxy upstream error",
		"path", r.URL.Path,
		"method", r.Method,
		"err", err,
	)
	w.Header().Set("Content-Type", "application/json; charset=UTF-8")
	w.WriteHeader(http.StatusBadGateway)
	_, _ = w.Write([]byte(`{"error":"pg_unavailable","message":"Parents Gateway is temporarily unavailable"}`))
}
