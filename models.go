package main

// Invoice represents an invoice with all its details
type Invoice struct {
	ID           int           `json:"id"`
	InvoiceNum   string        `json:"invoiceNum"`
	Date         string        `json:"date"`
	DueDate      string        `json:"dueDate"`
	Client       Client        `json:"client"`
	CustomerID   int           `json:"customerId,omitempty"`
	Items        []InvoiceItem `json:"items"`
	Subtotal     float64       `json:"subtotal"`
	Tax          float64       `json:"tax"`
	Total        float64       `json:"total"`
	Notes        string        `json:"notes"`
	Template     bool          `json:"template"`
	TemplateName string        `json:"templateName,omitempty"`
}

// Client represents client information for an invoice
type Client struct {
	Name    string `json:"name"`
	Email   string `json:"email"`
	Address string `json:"address"`
	Phone   string `json:"phone"`
}

// Customer represents a customer in the system
type Customer struct {
	ID      int    `json:"id"`
	Name    string `json:"name"`
	Email   string `json:"email"`
	Address string `json:"address"`
	Phone   string `json:"phone"`
	Company string `json:"company"`
}

// InvoiceItem represents a line item in an invoice
type InvoiceItem struct {
	Description string  `json:"description"`
	Quantity    int     `json:"quantity"`
	Rate        float64 `json:"rate"`
	Percentage  float64 `json:"percentage"`
	Amount      float64 `json:"amount"`
}

// CompanyInfo represents company information for invoices
type CompanyInfo struct {
	Name    string `json:"name"`
	Email   string `json:"email"`
	Phone   string `json:"phone"`
	Website string `json:"website"`
	Address string `json:"address"`
}

// Settings represents application settings
type Settings struct {
	Company       CompanyInfo `json:"company"`
	DataDirectory string      `json:"dataDirectory"`
}

// Meta represents metadata for the application
type Meta struct {
	NextID         int      `json:"nextID"`
	NextCustomerID int      `json:"nextCustomerID"`
	Settings       Settings `json:"settings"`
}
