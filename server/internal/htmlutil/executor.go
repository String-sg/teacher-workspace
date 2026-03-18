package htmlutil

import (
	"context"
	"fmt"
	"html/template"
	"io"
	"net/http"
	"time"
)

// TemplateExecutor renders an HTML template with the given data.
type TemplateExecutor interface {
	Execute(ctx context.Context, w io.Writer, data any) error
}

// DevelopmentTemplateExecutor fetches an HTML template from a remote URL on
// every call to Execute, so that changes to the template are picked up without
// restarting the server.
type DevelopmentTemplateExecutor struct {
	client *http.Client
	url    string
}

// NewDevelopmentTemplateExecutor returns a [DevelopmentTemplateExecutor] that
// fetches the template from the given URL on every call to [DevelopmentTemplateExecutor.Execute].
func NewDevelopmentTemplateExecutor(url string) *DevelopmentTemplateExecutor {
	return &DevelopmentTemplateExecutor{
		client: &http.Client{Timeout: 10 * time.Second},
		url:    url,
	}
}

// Execute implements [TemplateExecutor.Execute].
func (e *DevelopmentTemplateExecutor) Execute(ctx context.Context, w io.Writer, data any) error {
	req, err := http.NewRequestWithContext(ctx, http.MethodGet, e.url, nil)
	if err != nil {
		return fmt.Errorf("create request: %w", err)
	}

	resp, err := e.client.Do(req)
	if err != nil {
		return fmt.Errorf("send request: %w", err)
	}

	defer func() {
		_ = resp.Body.Close()
	}()

	respBody, err := io.ReadAll(resp.Body)
	if err != nil {
		return fmt.Errorf("read response body: %w", err)
	}

	tmpl, err := template.New("index").Parse(string(respBody))
	if err != nil {
		return fmt.Errorf("parse template: %w", err)
	}

	return tmpl.Execute(w, data)
}

// ProductionTemplateExecutor parses an HTML template once at startup and
// reuses it for every call to [ProductionTemplateExecutor.Execute].
type ProductionTemplateExecutor struct {
	tmpl *template.Template
}

// NewProductionTemplateExecutor parses the template file at the given path and
// returns a [ProductionTemplateExecutor] that can be used to render the template.
func NewProductionTemplateExecutor(path string) (*ProductionTemplateExecutor, error) {
	tmpl, err := template.ParseFiles(path)
	if err != nil {
		return nil, fmt.Errorf("parse template: %w", err)
	}
	return &ProductionTemplateExecutor{tmpl: tmpl}, nil
}

// Execute implements [TemplateExecutor.Execute].
func (e *ProductionTemplateExecutor) Execute(ctx context.Context, w io.Writer, data any) error {
	return e.tmpl.Execute(w, data)
}
