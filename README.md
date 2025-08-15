# Invoice Management System

A comprehensive invoice management system built with Go backend and vanilla JavaScript frontend, featuring professional PDF generation and advanced invoice management capabilities.

## Features

### 🧾 Invoice Management
- Create professional invoices with detailed client information
- **Percentage-based pricing** - Set custom percentage of rate for flexible pricing
- Add multiple line items with automatic calculations
- **Template system** - Save invoices as templates for reuse
- **Keyboard navigation** - Tab through fields with auto-creation of new items
- Modern, responsive tabbed interface

### 👥 Customer Management
- Add and manage customer database
- Auto-populate client details from customer records
- Customer search and selection

### 📄 Professional PDF Generation
- **Beautifully designed PDFs** with company branding
- Bordered tables with alternating row colors
- Professional header with company details
- Highlighted totals section
- Payment terms and footer

### 💾 Data Persistence
- JSON-based data storage
- Auto-save functionality
- Template management with toggle system

## Prerequisites

- Go 1.21 or higher
- Modern web browser

## Installation

1. Clone the repository
2. Install Go dependencies:
   ```bash
   go mod tidy
   ```

## Running the Application

### Development
```bash
make build && make run
```

### Manual
```bash
go build -o invoice-server .
./invoice-server
```

Open your browser and navigate to `http://localhost:8080`

## API Endpoints

### Invoices
- `GET /api/invoices` - Get all invoices
- `POST /api/invoices` - Create a new invoice
- `GET /api/invoices/{id}` - Get a specific invoice
- `GET /api/invoices/{id}/pdf` - Download invoice as PDF

### Customers
- `GET /api/customers` - Get all customers
- `POST /api/customers` - Create a new customer
- `PUT /api/customers/{id}` - Update a customer
- `DELETE /api/customers/{id}` - Delete a customer

## Usage

### Creating Invoices
1. Navigate to the **Invoice** tab
2. Fill in client information or select from customer dropdown
3. Add line items with:
   - Description
   - Quantity
   - Rate (price per unit)
   - **% of Total** (percentage of rate to charge)
4. Add tax if applicable
5. Use **Tab** key to navigate - automatically creates new items
6. Click "Create Invoice" to save

### Managing Templates
1. Create an invoice and save it
2. In the invoice list, click "Use as Template" to mark as template
3. Use "Load from Previous Invoice" dropdown to load templates
4. Templates preserve all field values including percentages

### Customer Management
1. Navigate to the **Customers** tab
2. Add new customers with contact details
3. Edit or delete existing customers
4. Customers auto-populate in invoice creation

## Project Structure

```
├── main.go              # Go backend server
├── handlers.go          # HTTP request handlers
├── models.go            # Data structures
├── pdf.go              # PDF generation logic
├── storage.go          # Data persistence
├── go.mod              # Go module dependencies
├── Makefile            # Build and run commands
├── data/               # JSON data storage
│   ├── invoices.json   # Invoice data
│   ├── customers.json  # Customer data
│   └── meta.json       # Metadata (ID counters)
├── static/             # Frontend files
│   ├── index.html      # Main HTML page
│   ├── styles.css      # Modern CSS styling
│   └── js/             # JavaScript modules
│       ├── api.js      # API communication
│       ├── customer.js # Customer management
│       ├── invoice.js  # Invoice management
│       └── utils.js    # Utility functions
├── tests/              # Test files
└── README.md           # This file
```

## Key Features Explained

### Percentage-Based Pricing
Instead of traditional quantity × rate calculation, this system uses:
**Amount = Rate × (Percentage ÷ 100)**

This allows for flexible pricing scenarios like:
- Partial services (50% of full rate)
- Discounted rates (80% of standard rate)
- Premium services (120% of base rate)

### Keyboard Navigation
- Tab through all invoice fields seamlessly
- When tabbing out of the last "Amount" field, automatically creates a new item
- Cursor jumps to the Description field of the new item
- Enables rapid invoice entry without mouse interaction

### Template System
- Any invoice can be marked as a template
- Templates appear in the "Load from Previous Invoice" dropdown
- All field values are preserved, including custom percentages
- Perfect for recurring billing scenarios
