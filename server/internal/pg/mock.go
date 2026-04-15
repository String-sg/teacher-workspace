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
	mux.HandleFunc("GET /api/web/2/staff/announcements/{first}/{second}", func(w http.ResponseWriter, r *http.Request) {
		switch first := r.PathValue("first"); first {
		case "drafts", "prefilled":
			serveFixture("fixtures/announcement_draft.json")(w, r)
		default:
			http.NotFound(w, r)
		}
	})

	// Consent forms
	mux.HandleFunc("GET /api/web/2/staff/consentForms", serveFixture("fixtures/consent_forms.json"))
	mux.HandleFunc("GET /api/web/2/staff/consentForms/shared", serveFixture("fixtures/consent_forms.json"))
	mux.HandleFunc("GET /api/web/2/staff/consentForms/drafts/{consentFormDraftId}", serveFixture("fixtures/consent_form_draft.json"))
	mux.HandleFunc("GET /api/web/2/staff/consentForms/{consentFormId}", serveFixture("fixtures/consent_form_detail.json"))

	// Meetings (PTM)
	mux.HandleFunc("GET /api/web/2/staff/ptm", serveFixture("fixtures/meetings.json"))
	mux.HandleFunc("GET /api/web/2/staff/ptm/serverdatetime", serveFixture("fixtures/ptm_serverdatetime.json"))
	mux.HandleFunc("GET /api/web/2/staff/ptm/timeslots/{eventId}", serveFixture("fixtures/meeting_timeslots.json"))
	mux.HandleFunc("GET /api/web/2/staff/ptm/bookings/{eventId}", serveFixture("fixtures/meeting_bookings.json"))
	mux.HandleFunc("GET /api/web/2/staff/ptm/{eventId}", serveFixture("fixtures/meeting_detail.json"))

	// Groups
	mux.HandleFunc("GET /api/web/2/staff/groups/assigned", serveFixture("fixtures/groups_assigned.json"))
	mux.HandleFunc("GET /api/web/2/staff/groups/custom", serveFixture("fixtures/groups_custom.json"))
	mux.HandleFunc("GET /api/web/2/staff/groups/custom/{customGroupId}", serveFixture("fixtures/group_custom_detail.json"))
	mux.HandleFunc("GET /api/web/2/staff/groups/classes/{classId}", serveFixture("fixtures/class_detail.json"))
	mux.HandleFunc("GET /api/web/2/staff/groups/cca/students/{ccaId}", serveFixture("fixtures/cca_students.json"))

	// School data
	mux.HandleFunc("GET /api/web/2/staff/school/staff", serveFixture("fixtures/school_staff.json"))
	mux.HandleFunc("GET /api/web/2/staff/school/students", serveFixture("fixtures/school_students.json"))
	mux.HandleFunc("GET /api/web/2/staff/school/groups", serveFixture("fixtures/school_groups.json"))

	// Account & notification prefs
	mux.HandleFunc("GET /api/web/2/staff/users/me", serveFixture("fixtures/users_me.json"))
	mux.HandleFunc("GET /api/web/2/staff/notificationPreference", serveFixture("fixtures/notification_preferences.json"))

	// ── Write stubs (stateless — return realistic status codes + shapes) ──

	// Announcements — write
	mux.HandleFunc("POST /api/web/2/staff/announcements", jsonStub(http.StatusCreated, `{"postId":1041}`))
	mux.HandleFunc("POST /api/web/2/staff/announcements/drafts", jsonStub(http.StatusCreated, `{"announcementDraftId":202}`))
	mux.HandleFunc("POST /api/web/2/staff/announcements/drafts/schedule", jsonStub(http.StatusOK, `{}`))
	mux.HandleFunc("POST /api/web/2/staff/announcements/duplicate", jsonStub(http.StatusCreated, `{"postId":1042}`))
	mux.HandleFunc("PUT /api/web/2/staff/announcements/drafts/{announcementDraftId}", jsonStub(http.StatusOK, `{}`))
	mux.HandleFunc("DELETE /api/web/2/staff/announcements/{postId}", noContent)
	mux.HandleFunc("DELETE /api/web/2/staff/announcements/drafts/{announcementDraftId}", noContent)

	// Consent forms — write
	mux.HandleFunc("POST /api/web/2/staff/consentForms", jsonStub(http.StatusCreated, `{"consentFormId":301}`))
	mux.HandleFunc("POST /api/web/2/staff/consentForms/drafts", jsonStub(http.StatusCreated, `{"consentFormDraftId":401}`))
	// Dispatched: Go ServeMux panics on `drafts/{id}` vs `{id}/updateDueDate`.
	mux.HandleFunc("PUT /api/web/2/staff/consentForms/{first}/{second}", func(w http.ResponseWriter, r *http.Request) {
		first, second := r.PathValue("first"), r.PathValue("second")
		if first != "drafts" && second != "updateDueDate" {
			http.NotFound(w, r)
			return
		}
		jsonStub(http.StatusOK, `{}`)(w, r)
	})
	mux.HandleFunc("DELETE /api/web/2/staff/consentForms/{consentFormId}", noContent)
	mux.HandleFunc("DELETE /api/web/2/staff/consentForms/drafts/{consentFormDraftId}", noContent)

	// Meetings (PTM) — write
	mux.HandleFunc("POST /api/web/2/staff/ptm", jsonStub(http.StatusCreated, `{"eventId":1002}`))
	mux.HandleFunc("DELETE /api/web/2/staff/ptm/{eventId}", noContent)
	mux.HandleFunc("POST /api/web/2/staff/ptm/booking/block", jsonStub(http.StatusOK, `{}`))
	mux.HandleFunc("POST /api/web/2/staff/ptm/booking/unblock", jsonStub(http.StatusOK, `{}`))
	mux.HandleFunc("POST /api/web/2/staff/ptm/booking/add", jsonStub(http.StatusOK, `{}`))
	mux.HandleFunc("POST /api/web/2/staff/ptm/booking/change", jsonStub(http.StatusOK, `{}`))
	mux.HandleFunc("POST /api/web/2/staff/ptm/booking/remove", jsonStub(http.StatusOK, `{}`))

	// Groups — write
	mux.HandleFunc("POST /api/web/2/staff/groups/custom", jsonStub(http.StatusCreated, `{"customGroupId":6}`))
	mux.HandleFunc("POST /api/web/2/staff/groups/custom/validateStudents", jsonStub(http.StatusOK, `{"valid":true}`))
	mux.HandleFunc("POST /api/web/2/staff/groups/student/count", jsonStub(http.StatusOK, `{"count":30}`))
	mux.HandleFunc("PUT /api/web/2/staff/groups/custom/{customGroupId}", jsonStub(http.StatusOK, `{}`))
	mux.HandleFunc("PUT /api/web/2/staff/groups/custom/{customGroupId}/share", jsonStub(http.StatusOK, `{}`))
	mux.HandleFunc("PUT /api/web/2/staff/groups/custom/{customGroupId}/removeAccess", jsonStub(http.StatusOK, `{}`))
	mux.HandleFunc("DELETE /api/web/2/staff/groups/custom/{customGroupId}", noContent)

	// School data — write
	mux.HandleFunc("POST /api/web/2/staff/school/travelDeclaration", jsonStub(http.StatusOK, `{}`))
	mux.HandleFunc("GET /api/web/2/staff/school/students/retrieveReport", jsonStub(http.StatusOK, `{}`))

	// Account — write
	mux.HandleFunc("PUT /api/web/2/staff/{staffId}/updateDisplayEmail", jsonStub(http.StatusOK, `{}`))
	mux.HandleFunc("PUT /api/web/2/staff/{staffId}/updateDisplayName", jsonStub(http.StatusOK, `{}`))
	mux.HandleFunc("PUT /api/web/2/staff/notificationPreference", jsonStub(http.StatusOK, `{}`))

	// Files
	mux.HandleFunc("POST /api/files/2/preUploadValidation", jsonStub(http.StatusOK, `{"valid":true}`))
	mux.HandleFunc("GET /api/files/2/postUploadVerification", jsonStub(http.StatusOK, `{}`))
	mux.HandleFunc("GET /api/files/2/handleDownloadAttachment", jsonStub(http.StatusOK, `{}`))
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

func jsonStub(statusCode int, body string) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		w.Header().Set("Content-Type", "application/json; charset=UTF-8")
		w.Header().Set("X-Content-Type-Options", "nosniff")
		w.WriteHeader(statusCode)
		_, _ = w.Write([]byte(body))
	}
}

var noContent http.HandlerFunc = func(w http.ResponseWriter, r *http.Request) {
	w.WriteHeader(http.StatusNoContent)
}
