package require

import (
	"bytes"
	"testing"
)

// Equal is a helper function to assert the two given values are equal.
// It will fail the test if the values are not equal.
func Equal[T comparable](t *testing.T, want, got T) {
	t.Helper()

	if want != got {
		t.Fatalf("\nwant: %v\n got: %v", want, got)
	}
}

// Equalf is a helper function to assert the two given values are equal.
// It will fail the test if the values are not equal.
func Equalf[T comparable](t *testing.T, want, got T, format string, args ...any) {
	t.Helper()

	if want != got {
		t.Fatalf(format, args...)
	}
}

// EqualBytes is a helper function to assert the two given byte slices are equal.
func EqualBytes(t *testing.T, want, got []byte) {
	t.Helper()

	if !bytes.Equal(want, got) {
		t.Fatalf("\nwant: %#v\n got: %#v", want, got)
	}
}

// EqualBytesf is a helper function to assert the two given byte slices are equal.
// It will fail the test if the byte slices are not equal.
func EqualBytesf(t *testing.T, want, got []byte, format string, args ...any) {
	t.Helper()

	if !bytes.Equal(want, got) {
		t.Fatalf(format, args...)
	}
}

// True is a helper function to assert the given boolean is true.
// It will fail the test if the boolean is false.
func True(t *testing.T, got bool) {
	t.Helper()

	if !got {
		t.Fatalf("\nwant: true\n got: false")
	}
}

// Truef is a helper function to assert the given boolean is true.
// It will fail the test if the boolean is false.
func Truef(t *testing.T, got bool, format string, args ...any) {
	t.Helper()

	if !got {
		t.Fatalf(format, args...)
	}
}

// FatalFalse is a helper function to assert the given boolean is false.
// It will fail the test if the boolean is true.
func False(t *testing.T, got bool) {
	t.Helper()

	if got {
		t.Fatalf("\nwant: false\n got: true")
	}
}

func Falsef(t *testing.T, got bool, format string, args ...any) {
	t.Helper()

	if got {
		t.Fatalf(format, args...)
	}
}

// HasError is a helper function to assert the given error is not nil.
// It will fail the test if the error is nil.
func HasError(t *testing.T, err error) {
	t.Helper()

	if err == nil {
		t.Fatalf("\nwant: err\n got: nil")
	}
}

func HasErrorf(t *testing.T, err error, format string, args ...any) {
	t.Helper()

	if err == nil {
		t.Fatalf(format, args...)
	}
}

// NoError is a helper function to assert the given error is nil.
// It will fail the test if the error is not nil.
func NoError(t *testing.T, err error) {
	t.Helper()

	if err != nil {
		t.Fatalf("\nwant: nil\n got: %v", err)
	}
}

func NoErrorf(t *testing.T, err error, format string, args ...any) {
	t.Helper()

	if err != nil {
		t.Fatalf(format, args...)
	}
}
