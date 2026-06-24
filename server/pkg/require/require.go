package require

import "testing"

// Equal is a helper function to assert the two given values are equal.
// It will fail the test if the values are not equal.
func Equal[T comparable](t *testing.T, want, got T) {
	t.Helper()

	if want != got {
		t.Fatalf("\nwant: %v\n got: %v", want, got)
	}
}

// NotEqual is a helper function to assert the two given values are not equal.
// It will fail the test if the values are equal.
func NotEqual[T comparable](t *testing.T, want, got T) {
	t.Helper()

	if want == got {
		t.Fatalf("\nwant: NOT %v\n got: %v", want, got)
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

// False is a helper function to assert the given boolean is false.
// It will fail the test if the boolean is true.
func False(t *testing.T, got bool) {
	t.Helper()

	if got {
		t.Fatalf("\nwant: false\n got: true")
	}
}
