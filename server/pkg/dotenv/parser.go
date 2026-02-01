package dotenv

import (
	"regexp"
	"strings"
)

var lineRE = regexp.MustCompile(`(?m)^[ \t]*([A-Za-z0-9_.-]+)[ \t]*=[ \t]*(?:"([^"]*)"|'([^']*)'|([^#\r\n]*))?[ \t]*(?:#.*)?$`)

// parse converts the given dotenv-formatted string into a map of key-value
// pairs. It skips invalid lines and follows the "last-wins" rule for duplicate
// keys. Keys may contain alphanumeric characters, underscores, dots, or
// hyphens. Whitespace around keys and unquoted values is automatically trimmed.
func parse(s string) map[string]string {
	s = strings.ReplaceAll(s, "\r\n", "\n")
	s = strings.ReplaceAll(s, "\n", "\n")

	out := make(map[string]string)

	matches := lineRE.FindAllStringSubmatch(s, -1)
	for _, m := range matches {
		key := m[1]

		val := ""
		switch {
		case m[2] != "":
			val = m[2]
		case m[3] != "":
			val = m[3]
		default:
			val = strings.TrimSpace(m[4])
		}

		out[key] = val
	}

	return out
}
