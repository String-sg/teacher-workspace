package dotenv

import (
	"errors"
	"fmt"
	"log/slog"
	"os"
	"path/filepath"
	"reflect"
	"strings"

	"github.com/go-viper/mapstructure/v2"
)

// Load reads a .env file from the working directory if present and decodes its
// values into output using `dotenv` tags. Environment variables that are
// already set take precedence over values defined in the file.
func Load(output any) error {
	cwd, err := os.Getwd()
	if err != nil {
		return fmt.Errorf("get working directory: %w", err)
	}

	path := filepath.Join(cwd, ".env")
	data, err := os.ReadFile(path)
	if err != nil && !errors.Is(err, os.ErrNotExist) {
		return fmt.Errorf("read %q: %w", path, err)
	}

	return decode(data, output)
}

// decode parses dotenv-formatted data, merges the resulting values into the
// current environment, and decodes them into output using `dotenv` tags.
// Environment variables that are already set take precedence over values defined
// in the data.
func decode(data []byte, output any) error {
	val := reflect.ValueOf(output)
	if val.Kind() != reflect.Pointer || val.IsNil() || val.Elem().Kind() != reflect.Struct {
		return fmt.Errorf("invalid ouput: want non-nil pointer to struct, got %T", output)
	}

	environ := environToMap(os.Environ())
	if len(data) > 0 {
		for k, v := range parse(string(data)) {
			if _, exists := environ[k]; !exists {
				_ = os.Setenv(k, v)
				environ[k] = v
			}
		}
	}

	decoder, err := mapstructure.NewDecoder(&mapstructure.DecoderConfig{
		TagName:          "dotenv",
		Result:           output,
		WeaklyTypedInput: true,
		DecodeHook: mapstructure.ComposeDecodeHookFunc(
			mapstructure.StringToTimeDurationHookFunc(),
			stringToLogLevelFunc(),
		),
	})
	if err != nil {
		return fmt.Errorf("create decoder: %w", err)
	}

	if err := decoder.Decode(environ); err != nil {
		return fmt.Errorf("decode %T: %w", output, err)
	}

	return nil
}

// environToMap turns KEY=VALUE strings into a map of key-value pairs.
func environToMap(environ []string) map[string]string {
	m := make(map[string]string, len(environ))
	for _, kv := range environ {
		before, after, ok := strings.Cut(kv, "=")
		if !ok {
			continue
		}

		m[before] = after
	}

	return m
}

// stringToLogLevelFunc converts a string to a slog.Level.
func stringToLogLevelFunc() mapstructure.DecodeHookFunc {
	return func(f reflect.Type, t reflect.Type, data any) (any, error) {
		if f.Kind() != reflect.String {
			return data, nil
		}
		if t != reflect.TypeFor[slog.Level]() {
			return data, nil
		}

		switch strings.ToUpper(data.(string)) {
		case "DEBUG":
			return slog.LevelDebug, nil
		case "INFO":
			return slog.LevelInfo, nil
		case "WARN":
			return slog.LevelWarn, nil
		case "ERROR":
			return slog.LevelError, nil
		default:
			return nil, fmt.Errorf("invalid log level: %q", data)
		}
	}
}
