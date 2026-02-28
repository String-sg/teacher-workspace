package session

import (
	"crypto/rand"
	"encoding/base64"
)

type Session struct {
	ID          string         `json:"id"`
	CSRFToken   string         `json:"csrf_token"`
	CurrentUser *CurrentUser   `json:"current_user"`
	Data        map[string]any `json:"data"`
}

type CurrentUser struct {
	ID    string `json:"id"`
	Email string `json:"email"`
}

func New() *Session {
	var b [16]byte
	_, _ = rand.Read(b[:])

	return &Session{
		ID: base64.RawURLEncoding.EncodeToString(b[:]),
	}
}

// IsAuthenticated returns [true] if the session has a current user.
func (s *Session) IsAuthenticated() bool {
	return s.CurrentUser != nil
}

// Get retrieves the value of the given key from the session data.
// Returns [nil] if the key is not found.
func (s *Session) Get(k string) (any, bool) {
	if s.Data == nil {
		return nil, false
	}

	v, ok := s.Data[k]
	return v, ok
}

// Set sets the value of the given key in the session data.
func (s *Session) Set(k string, v any) {
	if s.Data == nil {
		s.Data = make(map[string]any)
	}
	s.Data[k] = v
}
