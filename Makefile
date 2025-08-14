# Makefile for Invoice Management System

.PHONY: help build run test test-js test-go clean install dev

# Default target
help:
	@echo "Available targets:"
	@echo "  build     - Build the Go server"
	@echo "  run       - Run the Go server"
	@echo "  test      - Run all tests (JS and Go)"
	@echo "  test-js   - Run JavaScript tests with Jest"
	@echo "  test-go   - Run Go tests"
	@echo "  install   - Install dependencies"
	@echo "  dev       - Run in development mode"
	@echo "  clean     - Clean build artifacts"

# Build the Go server
build:
	go build -o invoice-server .

# Run the server
run: build
	./invoice-server

# Install dependencies
install:
	npm install
	go mod tidy

# Run all tests
test: test-js test-go

# Run JavaScript tests
test-js:
	npm test

# Run JavaScript tests in watch mode
test-js-watch:
	npm run test:watch

# Run JavaScript tests with coverage
test-js-coverage:
	npm run test:coverage

# Run Go tests
test-go:
	go test -v .

# Run Go tests with coverage
test-go-coverage:
	go test -v -cover .

# Development mode (run server with auto-reload)
dev:
	go run .

# Clean build artifacts
clean:
	rm -f invoice-server
	rm -rf node_modules
	rm -rf coverage
	rm -rf data/*.json

# Format Go code
fmt:
	go fmt .

# Lint Go code
lint:
	golint .

# Check Go code
vet:
	go vet .

# Full check (format, lint, vet, test)
check: fmt lint vet test
