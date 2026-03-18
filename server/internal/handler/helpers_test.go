package handler

import (
	"context"
	"io"
)

type stubExecutor struct {
	body string
}

func (e *stubExecutor) Execute(_ context.Context, w io.Writer, _ any) error {
	_, err := w.Write([]byte(e.body))
	return err
}

type errorExecutor struct {
	err error
}

func (e *errorExecutor) Execute(_ context.Context, _ io.Writer, _ any) error {
	return e.err
}
