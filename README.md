# Invoice Generator App

A modern invoice generator built with Go backend and vanilla JavaScript frontend.

## Features

- Create professional invoices with client details
- Add multiple line items with automatic calculations
- Generate PDF invoices
- Modern, responsive web interface
- RESTful API backend

## Prerequisites

- Go 1.24 or higher
- Modern web browser

## Installation

1. Clone the repository
2. Install Go dependencies:
   ```bash
   go mod tidy
   ```

## Running the Application

1. Start the Go server:
   ```bash
   go run main.go
   ```

2. Open your browser and navigate to `http://localhost:8080`

## API Endpoints

- `GET /api/invoices` - Get all invoices
- `POST /api/invoices` - Create a new invoice
- `GET /api/invoices/{id}` - Get a specific invoice
- `GET /api/invoices/{id}/pdf` - Download invoice as PDF

## Usage

1. Fill in the invoice details including client information
2. Add line items with descriptions, quantities, and rates
3. Add tax if applicable
4. Click "Create Invoice" to save
5. View or download invoices as PDF from the invoice list

## Project Structure

```
├── main.go              # Go backend server
├── go.mod              # Go module file
├── static/             # Frontend files
│   ├── index.html      # Main HTML page
│   ├── styles.css      # CSS styles
│   └── app.js          # JavaScript functionality
└── README.md           # This file
```
