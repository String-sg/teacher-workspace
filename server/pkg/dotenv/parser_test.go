package dotenv

import (
	"strings"
	"testing"

	"github.com/String-sg/teacher-workspace/server/pkg/require"
)

func TestParse(t *testing.T) {
	t.Run("parses key value pairs", func(t *testing.T) {
		input := strings.Join([]string{
			`FOO=bar`,
			`SPACED =  hello world  `,
			`QUOTED="hello world"`,
			`SINGLE='hello world'`,
			`INLINE=bar # comment`,
			`EMPTY=`,
			`DOT.KEY=dot`,
			`DASH-KEY=hyphen`,
			`UNDERSCORE_KEY=underscore`,
			`IGNORE_ME`,
			`# IGNORE ME TOO`,
		}, "\n")

		got := parse(input)

		require.Equal(t, 9, len(got))
		require.Equal(t, "bar", got["FOO"])
		require.Equal(t, "hello world", got["SPACED"])
		require.Equal(t, "hello world", got["QUOTED"])
		require.Equal(t, "hello world", got["SINGLE"])
		require.Equal(t, "bar", got["INLINE"])
		require.Equal(t, "", got["EMPTY"])
		require.Equal(t, "dot", got["DOT.KEY"])
		require.Equal(t, "hyphen", got["DASH-KEY"])
		require.Equal(t, "underscore", got["UNDERSCORE_KEY"])
	})

	t.Run("quoted values preserve whitespace", func(t *testing.T) {
		input := strings.Join([]string{
			`DQ="  spaced  "`,
			`SQ='  spaced  '`,
			`U=  spaced  `,
		}, "\n")

		got := parse(input)

		require.Equal(t, 3, len(got))
		require.Equal(t, "  spaced  ", got["DQ"])
		require.Equal(t, "  spaced  ", got["SQ"])
		require.Equal(t, "spaced", got["U"])
	})

	t.Run("duplicate keys last wins", func(t *testing.T) {
		input := strings.Join([]string{
			"KEY=one",
			"KEY=two",
		}, "\n")

		got := parse(input)

		require.Equal(t, "two", got["KEY"])
	})

	t.Run("handles windows newlines", func(t *testing.T) {
		input := strings.Join([]string{
			"A=1",
			"B=2",
			"",
		}, "\r\n")

		got := parse(input)

		require.Equal(t, 2, len(got))
		require.Equal(t, "1", got["A"])
		require.Equal(t, "2", got["B"])
	})
}
