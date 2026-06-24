// Package random generates cryptographically random alphanumeric strings.
package random

import (
	"crypto/rand"
	"encoding/binary"
	"math"
	"math/bits"
)

const (
	// AlphabetBase62 is the standard base62 alphabet: A-Z, a-z, 0-9.
	AlphabetBase62 = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789"
	// AlphabetBase58 is AlphabetBase62 minus the visually ambiguous characters: 0, O, I, and l.
	AlphabetBase58 = "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz123456789"
)

// Alphanumeric returns an n-character string drawn uniformly from alphabet.
// It panics when n is negative or alphabet has fewer than 2 characters.
func Alphanumeric(n int, alphabet string) string {
	if n < 0 {
		panic("random: n must be non-negative")
	}
	size := uint64(len(alphabet))
	if size < 2 {
		panic("random: alphabet must have at least 2 characters")
	}

	// Pack as many alphabet draws as fit in a uint64 by repeatedly multiplying
	// `size`; m is the chars-per-draw, limit is `size^m`.
	limit := size
	m := 1
	for {
		hi, lo := bits.Mul64(limit, size)
		if hi != 0 {
			break
		}
		limit = lo
		m++
	}

	// Largest multiple of limit representable in uint64. Drawing above this
	// threshold would bias the modulo, so we reject and redraw.
	threshold := math.MaxUint64 - (math.MaxUint64 % limit)

	// 64-byte batched buffer = 8 uint64 draws per refill. For n up to ~43 this
	// covers a full result plus rejection slack in a single rand.Read.
	var buf [64]byte
	_, _ = rand.Read(buf[:])
	bufPos := 0

	out := make([]byte, n)
	pos := 0
	for pos < n {
		var r uint64

		for {
			if bufPos+8 > len(buf) {
				_, _ = rand.Read(buf[:])
				bufPos = 0
			}
			r = binary.BigEndian.Uint64(buf[bufPos:])
			bufPos += 8
			if r < threshold {
				r %= limit
				break
			}
		}

		batch := m
		if remaining := n - pos; remaining < m {
			batch = remaining
		}

		for i := 0; i < batch; i++ {
			out[pos] = alphabet[r%size]
			r /= size
			pos++
		}
	}

	return string(out)
}

// Base62 is shorthand for Alphanumeric(n, AlphabetBase62).
func Base62(n int) string {
	return Alphanumeric(n, AlphabetBase62)
}

// Base58 is shorthand for Alphanumeric(n, AlphabetBase58).
func Base58(n int) string {
	return Alphanumeric(n, AlphabetBase58)
}
