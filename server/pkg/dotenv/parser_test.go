package dotenv

import (
	"reflect"
	"strings"
	"testing"

	"github.com/String-sg/teacher-workspace/server/pkg/require"
)

func TestParse(t *testing.T) {
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

	want := map[string]string{
		"FOO":            "bar",
		"SPACED":         "hello world",
		"QUOTED":         "hello world",
		"SINGLE":         "hello world",
		"INLINE":         "bar",
		"EMPTY":          "",
		"DOT.KEY":        "dot",
		"DASH-KEY":       "hyphen",
		"UNDERSCORE_KEY": "underscore",
	}
	got := parse(input)

	if !reflect.DeepEqual(got, want) {
		t.Fatalf("\nwant: %#v\ngot:  %#v", want, got)
	}
}

func TestParse_QuotedPreservesWhitespace(t *testing.T) {
	input := strings.Join([]string{
		`DQ="  spaced  "`,
		`SQ='  spaced  '`,
		`U=  spaced  `,
	}, "\n")

	want := map[string]string{
		"DQ": "  spaced  ",
		"SQ": "  spaced  ",
		"U":  "spaced",
	}
	got := parse(input)

	if !reflect.DeepEqual(got, want) {
		t.Fatalf("\nwant: %#v\ngot:  %#v", want, got)
	}
}

func TestParse_DuplicateKeysLastWins(t *testing.T) {
	input := strings.Join([]string{
		"KEY=one",
		"KEY=two",
	}, "\n")

	want := "two"
	got := parse(input)

	require.Equal(t, want, got["KEY"])
}

func TestParse_WindowsNewlines(t *testing.T) {
	input := strings.Join([]string{
		"A=1",
		"B=2",
		"",
	}, "\r\n")

	want := map[string]string{
		"A": "1",
		"B": "2",
	}
	got := parse(input)

	if !reflect.DeepEqual(got, want) {
		t.Fatalf("\nwant: %#v\ngot:  %#v", want, got)
	}
}
