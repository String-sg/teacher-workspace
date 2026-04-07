package pg

import (
	"embed"
	"net/http"
)

//go:embed fixtures
var fixtures embed.FS

func (h *Handler) registerMock(mux *http.ServeMux) {
	// Session & config
	mux.HandleFunc("GET /api/web/2/staff/session/current", serveFixture("fixtures/session_current.json"))
	mux.HandleFunc("GET /api/configs", serveFixture("fixtures/configs.json"))

	// Announcements
	mux.HandleFunc("GET /api/web/2/staff/announcements", serveFixture("fixtures/announcements.json"))
	mux.HandleFunc("GET /api/web/2/staff/announcements/shared", serveFixture("fixtures/announcements_shared.json"))
	mux.HandleFunc("GET /api/web/2/staff/announcements/{postId}", serveFixture("fixtures/announcement_detail.json"))

	// Consent forms
	mux.HandleFunc("GET /api/web/2/staff/consentForms", serveFixture("fixtures/consent_forms.json"))
	mux.HandleFunc("GET /api/web/2/staff/consentForms/shared", serveFixture("fixtures/consent_forms.json"))
	mux.HandleFunc("GET /api/web/2/staff/consentForms/{consentFormId}", serveFixture("fixtures/consent_form_detail.json"))

	// Meetings (PTM)
	mux.HandleFunc("GET /api/web/2/staff/ptm", serveFixture("fixtures/meetings.json"))
	mux.HandleFunc("GET /api/web/2/staff/ptm/{eventId}", serveFixture("fixtures/meeting_detail.json"))
	mux.HandleFunc("GET /api/web/2/staff/ptm/timeslots/{eventId}", serveFixture("fixtures/meeting_timeslots.json"))

	// Groups
	mux.HandleFunc("GET /api/web/2/staff/groups/assigned", serveFixture("fixtures/groups_assigned.json"))
	mux.HandleFunc("GET /api/web/2/staff/groups/custom", serveFixture("fixtures/groups_custom.json"))
	mux.HandleFunc("GET /api/web/2/staff/groups/custom/{customGroupId}", serveFixture("fixtures/group_custom_detail.json"))

	// School data
	mux.HandleFunc("GET /api/web/2/staff/school/staff", serveFixture("fixtures/school_staff.json"))
	mux.HandleFunc("GET /api/web/2/staff/school/students", serveFixture("fixtures/school_students.json"))
	mux.HandleFunc("GET /api/web/2/staff/school/groups", serveFixture("fixtures/school_groups.json"))

	// Account & notification prefs
	mux.HandleFunc("GET /api/web/2/staff/users/me", serveFixture("fixtures/users_me.json"))
	mux.HandleFunc("GET /api/web/2/staff/notificationPreference", serveFixture("fixtures/notification_preferences.json"))
}

func serveFixture(path string) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		data, err := fixtures.ReadFile(path)
		if err != nil {
			http.Error(w, "fixture not found", http.StatusNotFound)
			return
		}

		w.Header().Set("Content-Type", "application/json; charset=UTF-8")
		w.Header().Set("X-Content-Type-Options", "nosniff")
		w.WriteHeader(http.StatusOK)
		_, _ = w.Write(data)
	}
}
