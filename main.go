package main

import (
	"encoding/json"
	"fmt"
	"log"
	"net/http"
	"os"
	"strconv"

	"github.com/gorilla/handlers"
	"github.com/gorilla/mux"
	"github.com/jung-kurt/gofpdf"
)

type Invoice struct {
	ID          int           `json:"id"`
	InvoiceNum  string        `json:"invoiceNum"`
	Date        string        `json:"date"`
	DueDate     string        `json:"dueDate"`
	Client      Client        `json:"client"`
	CustomerID  int           `json:"customerId,omitempty"`
	Items       []InvoiceItem `json:"items"`
	Subtotal    float64       `json:"subtotal"`
	Tax         float64       `json:"tax"`
	Total       float64       `json:"total"`
	Notes       string        `json:"notes"`
}

type Client struct {
	Name    string `json:"name"`
	Email   string `json:"email"`
	Address string `json:"address"`
	Phone   string `json:"phone"`
}

type Customer struct {
	ID      int    `json:"id"`
	Name    string `json:"name"`
	Email   string `json:"email"`
	Address string `json:"address"`
	Phone   string `json:"phone"`
	Company string `json:"company"`
}

type InvoiceItem struct {
	Description string  `json:"description"`
	Quantity    int     `json:"quantity"`
	Rate        float64 `json:"rate"`
	Amount      float64 `json:"amount"`
}

var invoices []Invoice
var customers []Customer
var nextID = 1
var nextCustomerID = 1

const dataFile = "data/invoices.json"
const customersFile = "data/customers.json"
const metaFile = "data/meta.json"

type Meta struct {
	NextID         int `json:"nextId"`
	NextCustomerID int `json:"nextCustomerId"`
}

func main() {
	// Load existing data
	loadData()

	r := mux.NewRouter()

	// API routes
	r.HandleFunc("/api/invoices", getInvoices).Methods("GET")
	r.HandleFunc("/api/invoices", createInvoice).Methods("POST")
	r.HandleFunc("/api/invoices/{id}", getInvoice).Methods("GET")
	r.HandleFunc("/api/invoices/{id}/pdf", generatePDF).Methods("GET")
	
	// Customer routes
	r.HandleFunc("/api/customers", getCustomers).Methods("GET")
	r.HandleFunc("/api/customers", createCustomer).Methods("POST")
	r.HandleFunc("/api/customers/{id}", getCustomer).Methods("GET")
	r.HandleFunc("/api/customers/{id}", updateCustomer).Methods("PUT")
	r.HandleFunc("/api/customers/{id}", deleteCustomer).Methods("DELETE")

	// Serve static files (WebAssembly frontend)
	r.PathPrefix("/").Handler(http.FileServer(http.Dir("./static/")))

	// Enable CORS
	corsHandler := handlers.CORS(
		handlers.AllowedOrigins([]string{"*"}),
		handlers.AllowedMethods([]string{"GET", "POST", "PUT", "DELETE", "OPTIONS"}),
		handlers.AllowedHeaders([]string{"*"}),
	)(r)

	fmt.Println("Server starting on :8080")
	log.Fatal(http.ListenAndServe(":8080", corsHandler))
}

func getInvoices(w http.ResponseWriter, r *http.Request) {
	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(invoices)
}

func createInvoice(w http.ResponseWriter, r *http.Request) {
	var invoice Invoice
	if err := json.NewDecoder(r.Body).Decode(&invoice); err != nil {
		http.Error(w, err.Error(), http.StatusBadRequest)
		return
	}

	// If customerID is provided, populate client info from customer
	if invoice.CustomerID > 0 {
		for _, customer := range customers {
			if customer.ID == invoice.CustomerID {
				invoice.Client = Client{
					Name:    customer.Name,
					Email:   customer.Email,
					Address: customer.Address,
					Phone:   customer.Phone,
				}
				break
			}
		}
	}

	invoice.ID = nextID
	nextID++
	invoice.InvoiceNum = fmt.Sprintf("INV-%04d", invoice.ID)
	
	// Calculate totals
	invoice.Subtotal = 0
	for i := range invoice.Items {
		invoice.Items[i].Amount = float64(invoice.Items[i].Quantity) * invoice.Items[i].Rate
		invoice.Subtotal += invoice.Items[i].Amount
	}
	invoice.Total = invoice.Subtotal + invoice.Tax

	invoices = append(invoices, invoice)

	// Save data to file
	saveData()

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(invoice)
}

func getInvoice(w http.ResponseWriter, r *http.Request) {
	vars := mux.Vars(r)
	id, err := strconv.Atoi(vars["id"])
	if err != nil {
		http.Error(w, "Invalid invoice ID", http.StatusBadRequest)
		return
	}

	for _, invoice := range invoices {
		if invoice.ID == id {
			w.Header().Set("Content-Type", "application/json")
			json.NewEncoder(w).Encode(invoice)
			return
		}
	}

	http.Error(w, "Invoice not found", http.StatusNotFound)
}

func generatePDF(w http.ResponseWriter, r *http.Request) {
	vars := mux.Vars(r)
	id, err := strconv.Atoi(vars["id"])
	if err != nil {
		http.Error(w, "Invalid invoice ID", http.StatusBadRequest)
		return
	}

	var invoice Invoice
	found := false
	for _, inv := range invoices {
		if inv.ID == id {
			invoice = inv
			found = true
			break
		}
	}

	if !found {
		http.Error(w, "Invoice not found", http.StatusNotFound)
		return
	}

	pdf := gofpdf.New("P", "mm", "A4", "")
	pdf.AddPage()
	pdf.SetFont("Arial", "B", 16)

	// Header
	pdf.Cell(40, 10, "INVOICE")
	pdf.Ln(10)

	// Invoice details
	pdf.SetFont("Arial", "", 12)
	pdf.Cell(40, 10, fmt.Sprintf("Invoice #: %s", invoice.InvoiceNum))
	pdf.Ln(5)
	pdf.Cell(40, 10, fmt.Sprintf("Date: %s", invoice.Date))
	pdf.Ln(5)
	pdf.Cell(40, 10, fmt.Sprintf("Due Date: %s", invoice.DueDate))
	pdf.Ln(15)

	// Client details
	pdf.SetFont("Arial", "B", 12)
	pdf.Cell(40, 10, "Bill To:")
	pdf.Ln(5)
	pdf.SetFont("Arial", "", 10)
	pdf.Cell(40, 5, invoice.Client.Name)
	pdf.Ln(4)
	pdf.Cell(40, 5, invoice.Client.Email)
	pdf.Ln(4)
	pdf.Cell(40, 5, invoice.Client.Address)
	pdf.Ln(4)
	pdf.Cell(40, 5, invoice.Client.Phone)
	pdf.Ln(15)

	// Items table header
	pdf.SetFont("Arial", "B", 10)
	pdf.Cell(80, 7, "Description")
	pdf.Cell(20, 7, "Qty")
	pdf.Cell(30, 7, "Rate")
	pdf.Cell(30, 7, "Amount")
	pdf.Ln(7)

	// Items
	pdf.SetFont("Arial", "", 10)
	for _, item := range invoice.Items {
		pdf.Cell(80, 6, item.Description)
		pdf.Cell(20, 6, fmt.Sprintf("%d", item.Quantity))
		pdf.Cell(30, 6, fmt.Sprintf("$%.2f", item.Rate))
		pdf.Cell(30, 6, fmt.Sprintf("$%.2f", item.Amount))
		pdf.Ln(6)
	}

	pdf.Ln(10)

	// Totals
	pdf.SetFont("Arial", "B", 10)
	pdf.Cell(130, 6, "Subtotal:")
	pdf.Cell(30, 6, fmt.Sprintf("$%.2f", invoice.Subtotal))
	pdf.Ln(6)
	pdf.Cell(130, 6, "Tax:")
	pdf.Cell(30, 6, fmt.Sprintf("$%.2f", invoice.Tax))
	pdf.Ln(6)
	pdf.Cell(130, 6, "Total:")
	pdf.Cell(30, 6, fmt.Sprintf("$%.2f", invoice.Total))

	if invoice.Notes != "" {
		pdf.Ln(20)
		pdf.SetFont("Arial", "B", 10)
		pdf.Cell(40, 6, "Notes:")
		pdf.Ln(6)
		pdf.SetFont("Arial", "", 10)
		pdf.MultiCell(0, 5, invoice.Notes, "", "", false)
	}

	w.Header().Set("Content-Type", "application/pdf")
	w.Header().Set("Content-Disposition", fmt.Sprintf("attachment; filename=invoice-%s.pdf", invoice.InvoiceNum))
	
	err = pdf.Output(w)
	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
	}
}

// Customer management functions
func getCustomers(w http.ResponseWriter, r *http.Request) {
	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(customers)
}

func createCustomer(w http.ResponseWriter, r *http.Request) {
	var customer Customer
	if err := json.NewDecoder(r.Body).Decode(&customer); err != nil {
		http.Error(w, err.Error(), http.StatusBadRequest)
		return
	}

	// Ensure nextCustomerID is at least 1
	if nextCustomerID == 0 {
		nextCustomerID = 1
	}
	
	customer.ID = nextCustomerID
	nextCustomerID++

	customers = append(customers, customer)
	saveData()

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(customer)
}

func getCustomer(w http.ResponseWriter, r *http.Request) {
	vars := mux.Vars(r)
	id, err := strconv.Atoi(vars["id"])
	if err != nil {
		http.Error(w, "Invalid customer ID", http.StatusBadRequest)
		return
	}

	for _, customer := range customers {
		if customer.ID == id {
			w.Header().Set("Content-Type", "application/json")
			json.NewEncoder(w).Encode(customer)
			return
		}
	}

	http.Error(w, "Customer not found", http.StatusNotFound)
}

func updateCustomer(w http.ResponseWriter, r *http.Request) {
	vars := mux.Vars(r)
	id, err := strconv.Atoi(vars["id"])
	if err != nil {
		http.Error(w, "Invalid customer ID", http.StatusBadRequest)
		return
	}

	var updatedCustomer Customer
	if err := json.NewDecoder(r.Body).Decode(&updatedCustomer); err != nil {
		http.Error(w, err.Error(), http.StatusBadRequest)
		return
	}

	for i, customer := range customers {
		if customer.ID == id {
			updatedCustomer.ID = id
			customers[i] = updatedCustomer
			saveData()
			w.Header().Set("Content-Type", "application/json")
			json.NewEncoder(w).Encode(updatedCustomer)
			return
		}
	}

	http.Error(w, "Customer not found", http.StatusNotFound)
}

func deleteCustomer(w http.ResponseWriter, r *http.Request) {
	vars := mux.Vars(r)
	id, err := strconv.Atoi(vars["id"])
	if err != nil {
		http.Error(w, "Invalid customer ID", http.StatusBadRequest)
		return
	}

	for i, customer := range customers {
		if customer.ID == id {
			customers = append(customers[:i], customers[i+1:]...)
			saveData()
			w.WriteHeader(http.StatusNoContent)
			return
		}
	}

	http.Error(w, "Customer not found", http.StatusNotFound)
}

func loadData() {
	// Create data directory if it doesn't exist
	if err := os.MkdirAll("data", 0755); err != nil {
		log.Printf("Error creating data directory: %v", err)
		return
	}

	// Load invoices
	if data, err := os.ReadFile(dataFile); err == nil {
		if err := json.Unmarshal(data, &invoices); err != nil {
			log.Printf("Error unmarshaling invoices: %v", err)
		}
	}

	// Load customers
	if data, err := os.ReadFile(customersFile); err == nil {
		if err := json.Unmarshal(data, &customers); err != nil {
			log.Printf("Error unmarshaling customers: %v", err)
		}
	}

	// Load metadata (nextID)
	if data, err := os.ReadFile(metaFile); err == nil {
		var meta Meta
		if err := json.Unmarshal(data, &meta); err != nil {
			log.Printf("Error unmarshaling metadata: %v", err)
		} else {
			nextID = meta.NextID
			nextCustomerID = meta.NextCustomerID
			// Ensure nextCustomerID is at least 1
			if nextCustomerID == 0 {
				nextCustomerID = 1
			}
		}
	}

	log.Printf("Loaded %d invoices, %d customers, nextID: %d, nextCustomerID: %d", len(invoices), len(customers), nextID, nextCustomerID)
}

func saveData() {
	// Create data directory if it doesn't exist
	if err := os.MkdirAll("data", 0755); err != nil {
		log.Printf("Error creating data directory: %v", err)
		return
	}

	// Save invoices
	if data, err := json.MarshalIndent(invoices, "", "  "); err == nil {
		if err := os.WriteFile(dataFile, data, 0644); err != nil {
			log.Printf("Error saving invoices: %v", err)
		}
	}

	// Save customers
	if data, err := json.MarshalIndent(customers, "", "  "); err == nil {
		if err := os.WriteFile(customersFile, data, 0644); err != nil {
			log.Printf("Error saving customers: %v", err)
		}
	}

	// Save metadata
	meta := Meta{NextID: nextID, NextCustomerID: nextCustomerID}
	if data, err := json.MarshalIndent(meta, "", "  "); err == nil {
		if err := os.WriteFile(metaFile, data, 0644); err != nil {
			log.Printf("Error saving metadata: %v", err)
		}
	}
}
