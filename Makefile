SHELL := /bin/bash
BIN   := $(CURDIR)/bin

GOLANGCI_VERSION := v2.12.2
GOLANGCI_LINT    := $(BIN)/golangci-lint-$(GOLANGCI_VERSION)

$(BIN):
	mkdir -p $(BIN)

$(GOLANGCI_LINT): | $(BIN)
	curl -sSfL https://golangci-lint.run/install.sh | sh -s -- -b $(BIN) $(GOLANGCI_VERSION)
	mv $(BIN)/golangci-lint $@

.PHONY: install-tools
install-tools: $(GOLANGCI_LINT)

.PHONY: lint
lint: $(GOLANGCI_LINT)
	$(GOLANGCI_LINT) run
