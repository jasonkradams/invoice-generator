package main

import (
	"encoding/json"
	"fmt"
	"net/http"
	"strconv"

	"github.com/gorilla/mux"
)

// Server holds the application state and dependencies
type Server struct {
	invoices       []Invoice
	customers      []Customer
	nextID         int
	nextCustomerID int
	meta           Meta
	storage        *Storage
}

// NewServer creates a new server instance
func NewServer() *Server {
	storage := NewStorage("data") // Start with default, will be updated from settings
	invoices, customers, nextID, nextCustomerID, settings := storage.LoadData()

	// Update storage with configured data directory
	if settings.DataDirectory != "" {
		storage.SetDataDirectory(settings.DataDirectory)
	}

	return &Server{
		invoices:       invoices,
		customers:      customers,
		nextID:         nextID,
		nextCustomerID: nextCustomerID,
		meta:           Meta{NextID: nextID, NextCustomerID: nextCustomerID, Settings: settings},
		storage:        storage,
	}
}

// saveData is a helper method to save data
func (s *Server) saveData() {
	s.meta.NextID = s.nextID
	s.meta.NextCustomerID = s.nextCustomerID
	s.storage.SaveData(s.invoices, s.customers, s.meta)
}

// findInvoiceByID finds an invoice by ID
func (s *Server) findInvoiceByID(id int) (*Invoice, int) {
	for i, invoice := range s.invoices {
		if invoice.ID == id {
			return &invoice, i
		}
	}
	return nil, -1
}

// findCustomerByID finds a customer by ID
func (s *Server) findCustomerByID(id int) (*Customer, int) {
	for i, customer := range s.customers {
		if customer.ID == id {
			return &customer, i
		}
	}
	return nil, -1
}

// calculateInvoiceTotals calculates subtotal and total for an invoice
func (s *Server) calculateInvoiceTotals(invoice *Invoice) {
	invoice.Subtotal = 0
	for i := range invoice.Items {
		// Amount = Rate * (Percentage / 100)
		invoice.Items[i].Amount = invoice.Items[i].Rate * (invoice.Items[i].Percentage / 100)
		invoice.Subtotal += invoice.Items[i].Amount
	}
	invoice.Total = invoice.Subtotal + invoice.Tax
}

// Invoice handlers
func (s *Server) getInvoices(w http.ResponseWriter, r *http.Request) {
	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(s.invoices)
}

func (s *Server) createInvoice(w http.ResponseWriter, r *http.Request) {
	var invoice Invoice
	if err := json.NewDecoder(r.Body).Decode(&invoice); err != nil {
		http.Error(w, "Invalid JSON: "+err.Error(), http.StatusBadRequest)
		return
	}

	// If customerID is provided, populate client info from customer
	if invoice.CustomerID > 0 {
		if customer, _ := s.findCustomerByID(invoice.CustomerID); customer != nil {
			invoice.Client = Client{
				Name:    customer.Name,
				Email:   customer.Email,
				Address: customer.Address,
				Phone:   customer.Phone,
			}
		}
	}

	// Ensure nextID is at least 1
	if s.nextID == 0 {
		s.nextID = 1
	}

	invoice.ID = s.nextID
	s.nextID++
	invoice.InvoiceNum = fmt.Sprintf("INV-%04d", invoice.ID)

	s.calculateInvoiceTotals(&invoice)
	s.invoices = append(s.invoices, invoice)
	s.saveData()

	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusCreated)
	json.NewEncoder(w).Encode(invoice)
}

func (s *Server) getInvoice(w http.ResponseWriter, r *http.Request) {
	vars := mux.Vars(r)
	id, err := strconv.Atoi(vars["id"])
	if err != nil {
		http.Error(w, "Invalid invoice ID", http.StatusBadRequest)
		return
	}

	if invoice, _ := s.findInvoiceByID(id); invoice != nil {
		w.Header().Set("Content-Type", "application/json")
		json.NewEncoder(w).Encode(invoice)
		return
	}

	http.Error(w, "Invoice not found", http.StatusNotFound)
}

func (s *Server) deleteInvoice(w http.ResponseWriter, r *http.Request) {
	vars := mux.Vars(r)
	id, err := strconv.Atoi(vars["id"])
	if err != nil {
		http.Error(w, "Invalid invoice ID", http.StatusBadRequest)
		return
	}

	if _, index := s.findInvoiceByID(id); index != -1 {
		s.invoices = append(s.invoices[:index], s.invoices[index+1:]...)
		s.saveData()

		w.Header().Set("Content-Type", "application/json")
		json.NewEncoder(w).Encode(map[string]string{"message": "Invoice deleted successfully"})
		return
	}

	http.Error(w, "Invoice not found", http.StatusNotFound)
}

func (s *Server) toggleTemplate(w http.ResponseWriter, r *http.Request) {
	vars := mux.Vars(r)
	id, err := strconv.Atoi(vars["id"])
	if err != nil {
		http.Error(w, "Invalid invoice ID", http.StatusBadRequest)
		return
	}

	// Parse request body for template name
	var requestData struct {
		TemplateName string `json:"templateName"`
	}
	if r.Body != nil {
		json.NewDecoder(r.Body).Decode(&requestData)
	}

	if _, index := s.findInvoiceByID(id); index != -1 {
		s.invoices[index].Template = !s.invoices[index].Template
		
		// Set template name when making it a template, clear when removing
		if s.invoices[index].Template {
			s.invoices[index].TemplateName = requestData.TemplateName
		} else {
			s.invoices[index].TemplateName = ""
		}
		
		s.saveData()

		w.Header().Set("Content-Type", "application/json")
		json.NewEncoder(w).Encode(map[string]interface{}{
			"message":      "Template status updated",
			"template":     s.invoices[index].Template,
			"templateName": s.invoices[index].TemplateName,
		})
		return
	}

	http.Error(w, "Invoice not found", http.StatusNotFound)
}

func (s *Server) generatePDF(w http.ResponseWriter, r *http.Request) {
	vars := mux.Vars(r)
	id, err := strconv.Atoi(vars["id"])
	if err != nil {
		http.Error(w, "Invalid invoice ID", http.StatusBadRequest)
		return
	}

	invoice, _ := s.findInvoiceByID(id)
	if invoice == nil {
		http.Error(w, "Invoice not found", http.StatusNotFound)
		return
	}

	pdf := s.createInvoicePDF(*invoice)

	w.Header().Set("Content-Type", "application/pdf")
	w.Header().Set("Content-Disposition", fmt.Sprintf("attachment; filename=invoice-%s.pdf", invoice.InvoiceNum))

	if err := pdf.Output(w); err != nil {
		http.Error(w, "Error generating PDF: "+err.Error(), http.StatusInternalServerError)
	}
}

// Customer handlers
func (s *Server) getCustomers(w http.ResponseWriter, r *http.Request) {
	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(s.customers)
}

func (s *Server) createCustomer(w http.ResponseWriter, r *http.Request) {
	var customer Customer
	if err := json.NewDecoder(r.Body).Decode(&customer); err != nil {
		http.Error(w, "Invalid JSON: "+err.Error(), http.StatusBadRequest)
		return
	}

	// Ensure nextCustomerID is at least 1
	if s.nextCustomerID == 0 {
		s.nextCustomerID = 1
	}

	customer.ID = s.nextCustomerID
	s.nextCustomerID++

	s.customers = append(s.customers, customer)
	s.saveData()

	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusCreated)
	json.NewEncoder(w).Encode(customer)
}

func (s *Server) getCustomer(w http.ResponseWriter, r *http.Request) {
	vars := mux.Vars(r)
	id, err := strconv.Atoi(vars["id"])
	if err != nil {
		http.Error(w, "Invalid customer ID", http.StatusBadRequest)
		return
	}

	if customer, _ := s.findCustomerByID(id); customer != nil {
		w.Header().Set("Content-Type", "application/json")
		json.NewEncoder(w).Encode(customer)
		return
	}

	http.Error(w, "Customer not found", http.StatusNotFound)
}

func (s *Server) updateCustomer(w http.ResponseWriter, r *http.Request) {
	vars := mux.Vars(r)
	id, err := strconv.Atoi(vars["id"])
	if err != nil {
		http.Error(w, "Invalid customer ID", http.StatusBadRequest)
		return
	}

	var updatedCustomer Customer
	if err := json.NewDecoder(r.Body).Decode(&updatedCustomer); err != nil {
		http.Error(w, "Invalid JSON: "+err.Error(), http.StatusBadRequest)
		return
	}

	if _, index := s.findCustomerByID(id); index != -1 {
		updatedCustomer.ID = id
		s.customers[index] = updatedCustomer
		s.saveData()

		w.Header().Set("Content-Type", "application/json")
		json.NewEncoder(w).Encode(updatedCustomer)
		return
	}

	http.Error(w, "Customer not found", http.StatusNotFound)
}

func (s *Server) deleteCustomer(w http.ResponseWriter, r *http.Request) {
	vars := mux.Vars(r)
	id, err := strconv.Atoi(vars["id"])
	if err != nil {
		http.Error(w, "Invalid customer ID", http.StatusBadRequest)
		return
	}

	if _, index := s.findCustomerByID(id); index != -1 {
		s.customers = append(s.customers[:index], s.customers[index+1:]...)
		s.saveData()

		w.Header().Set("Content-Type", "application/json")
		json.NewEncoder(w).Encode(map[string]string{
			"message": "Customer deleted successfully",
		})
		return
	}
	http.Error(w, "Customer not found", http.StatusNotFound)
}

// Settings handlers
func (s *Server) getSettings(w http.ResponseWriter, r *http.Request) {
	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(s.meta.Settings)
}

func (s *Server) updateSettings(w http.ResponseWriter, r *http.Request) {
	var settings Settings
	if err := json.NewDecoder(r.Body).Decode(&settings); err != nil {
		http.Error(w, "Invalid JSON: "+err.Error(), http.StatusBadRequest)
		return
	}

	// Update settings in memory
	s.meta.Settings = settings

	// Update storage data directory if it changed
	if settings.DataDirectory != "" {
		s.storage.SetDataDirectory(settings.DataDirectory)
	}

	// Save to storage
	s.saveData()

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(map[string]string{"status": "success"})
}
