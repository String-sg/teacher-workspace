package random

import (
	"crypto/rand"
	"encoding/base64"
	"strings"
	"testing"
)

func TestAlphanumeric(t *testing.T) {
	t.Run("returns empty string for n=0", func(t *testing.T) {
		result := Alphanumeric(0, AlphabetBase58)

		if result != "" {
			t.Errorf("want: empty; got: %q", result)
		}
	})

	t.Run("returns n characters drawn from the alphabet", func(t *testing.T) {
		const n = 32
		result := Alphanumeric(n, AlphabetBase58)

		if got := len(result); n != got {
			t.Errorf("want: %d; got: %d", n, got)
		}
		for i, c := range result {
			if !strings.ContainsRune(AlphabetBase58, c) {
				t.Errorf("want c: in AlphabetBase58; got: %q (index %d)", c, i)
			}
		}
	})

	t.Run("panics", func(t *testing.T) {
		cases := []struct {
			name     string
			n        int
			alphabet string
		}{
			{name: "empty alphabet", n: 8, alphabet: ""},
			{name: "single-char alphabet", n: 8, alphabet: "X"},
			{name: "negative n", n: -1, alphabet: AlphabetBase58},
		}
		for _, tc := range cases {
			t.Run(tc.name, func(t *testing.T) {
				defer func() {
					if r := recover(); r == nil {
						t.Fatal("want: panic; got: nil")
					}
				}()

				Alphanumeric(tc.n, tc.alphabet)
			})
		}
	})
}

func TestBase62(t *testing.T) {
	t.Run("returns n characters drawn from AlphabetBase62", func(t *testing.T) {
		const n = 32
		result := Base62(n)

		if got := len(result); n != got {
			t.Errorf("want: %d; got: %d", n, got)
		}
		for i, c := range result {
			if !strings.ContainsRune(AlphabetBase62, c) {
				t.Errorf("want c: in AlphabetBase62; got: %q (index %d)", c, i)
			}
		}
	})
}

func TestBase58(t *testing.T) {
	t.Run("returns n characters drawn from AlphabetBase58", func(t *testing.T) {
		const n = 32
		result := Base58(n)

		if got := len(result); n != got {
			t.Errorf("want: %d; got: %d", n, got)
		}
		for i, c := range result {
			if !strings.ContainsRune(AlphabetBase58, c) {
				t.Errorf("want c: in AlphabetBase58; got: %q (index %d)", c, i)
			}
		}
	})
}

func BenchmarkBase62_n32(b *testing.B) {
	for b.Loop() {
		_ = Base62(32)
	}
}

func BenchmarkBase58_n32(b *testing.B) {
	for b.Loop() {
		_ = Base58(32)
	}
}

// BenchmarkBase64URL32 is the baseline against which the design's "within 5% of base64" claim is measured.
func BenchmarkBase64URL32(b *testing.B) {
	var buf [32]byte
	for b.Loop() {
		_, _ = rand.Read(buf[:])
		_ = base64.RawURLEncoding.EncodeToString(buf[:])
	}
}
