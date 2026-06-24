package require

import (
	"bytes"
	"testing"
)

// Equal asserts that want == got, failing the test if not.
func Equal[T comparable](t *testing.T, want, got T) {
	t.Helper()

	if want != got {
		t.Fatalf("\nwant: %v\n got: %v", want, got)
	}
}

// NotEqual asserts that want != got, failing the test if they are equal.
func NotEqual[T comparable](t *testing.T, want, got T) {
	t.Helper()

	if want == got {
		t.Fatalf("\nwant: NOT %v\n got: %v", want, got)
	}
}

// EqualBytes asserts that the two byte slices are equal.
func EqualBytes(t *testing.T, want, got []byte) {
	t.Helper()

	if !bytes.Equal(want, got) {
		t.Fatalf("\nwant: %#v\n got: %#v", want, got)
	}
}

// True asserts that got is true.
func True(t *testing.T, got bool) {
	t.Helper()

	if !got {
		t.Fatalf("\nwant: true\n got: false")
	}
}

// False asserts that got is false.
func False(t *testing.T, got bool) {
	t.Helper()

	if got {
		t.Fatalf("\nwant: false\n got: true")
	}
}

// NoError asserts that err is nil.
func NoError(t *testing.T, err error) {
	t.Helper()

	if err != nil {
		t.Fatalf("\nwant: nil\n got: %v", err)
	}
}

// HasError asserts that err is not nil.
func HasError(t *testing.T, err error) {
	t.Helper()

	if err == nil {
		t.Fatalf("\nwant: err\n got: nil")
	}
}
