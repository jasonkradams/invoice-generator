package main

import (
	"bytes"
	"encoding/json"
	"net/http"
	"net/http/httptest"
	"testing"

	"github.com/gorilla/mux"
)

func TestServer_getInvoices(t *testing.T) {
	server := &Server{
		invoices: []Invoice{
			{ID: 1, InvoiceNum: "INV-001", Client: Client{Name: "Test Client"}, Total: 100.0},
			{ID: 2, InvoiceNum: "INV-002", Client: Client{Name: "Another Client"}, Total: 200.0},
		},
	}

	req, err := http.NewRequest("GET", "/api/invoices", nil)
	if err != nil {
		t.Fatal(err)
	}

	rr := httptest.NewRecorder()
	handler := http.HandlerFunc(server.getInvoices)
	handler.ServeHTTP(rr, req)

	if status := rr.Code; status != http.StatusOK {
		t.Errorf("handler returned wrong status code: got %v want %v", status, http.StatusOK)
	}

	var invoices []Invoice
	err = json.Unmarshal(rr.Body.Bytes(), &invoices)
	if err != nil {
		t.Fatal(err)
	}

	if len(invoices) != 2 {
		t.Errorf("expected 2 invoices, got %d", len(invoices))
	}
}

func TestServer_getInvoice(t *testing.T) {
	server := &Server{
		invoices: []Invoice{
			{ID: 1, InvoiceNum: "INV-001", Client: Client{Name: "Test Client"}, Total: 100.0},
		},
	}

	req, err := http.NewRequest("GET", "/api/invoices/1", nil)
	if err != nil {
		t.Fatal(err)
	}

	rr := httptest.NewRecorder()

	// Use mux to handle the route parameter
	router := mux.NewRouter()
	router.HandleFunc("/api/invoices/{id}", server.getInvoice).Methods("GET")
	router.ServeHTTP(rr, req)

	if status := rr.Code; status != http.StatusOK {
		t.Errorf("handler returned wrong status code: got %v want %v", status, http.StatusOK)
	}

	var invoice Invoice
	err = json.Unmarshal(rr.Body.Bytes(), &invoice)
	if err != nil {
		t.Fatal(err)
	}

	if invoice.ID != 1 {
		t.Errorf("expected invoice ID 1, got %d", invoice.ID)
	}
}

func TestServer_getInvoice_NotFound(t *testing.T) {
	server := &Server{
		invoices: []Invoice{},
	}

	req, err := http.NewRequest("GET", "/api/invoices/999", nil)
	if err != nil {
		t.Fatal(err)
	}

	rr := httptest.NewRecorder()

	router := mux.NewRouter()
	router.HandleFunc("/api/invoices/{id}", server.getInvoice).Methods("GET")
	router.ServeHTTP(rr, req)

	if status := rr.Code; status != http.StatusNotFound {
		t.Errorf("handler returned wrong status code: got %v want %v", status, http.StatusNotFound)
	}
}

func TestServer_createInvoice(t *testing.T) {
	server := &Server{
		invoices: []Invoice{},
		storage:  &Storage{},
		nextID:   1,
	}

	invoice := Invoice{
		Client: Client{Name: "Test Client", Email: "test@example.com"},
		Items:  []InvoiceItem{{Description: "Test Item", Quantity: 1, Rate: 100.0}},
		Tax:    10.0,
	}

	jsonData, _ := json.Marshal(invoice)
	req, err := http.NewRequest("POST", "/api/invoices", bytes.NewBuffer(jsonData))
	if err != nil {
		t.Fatal(err)
	}
	req.Header.Set("Content-Type", "application/json")

	rr := httptest.NewRecorder()
	handler := http.HandlerFunc(server.createInvoice)
	handler.ServeHTTP(rr, req)

	if status := rr.Code; status != http.StatusCreated {
		t.Errorf("handler returned wrong status code: got %v want %v", status, http.StatusCreated)
	}

	var createdInvoice Invoice
	err = json.Unmarshal(rr.Body.Bytes(), &createdInvoice)
	if err != nil {
		t.Fatal(err)
	}

	if createdInvoice.InvoiceNum != "INV-0001" {
		t.Errorf("expected invoice number INV-0001, got %s", createdInvoice.InvoiceNum)
	}

	if len(server.invoices) != 1 {
		t.Errorf("expected 1 invoice in server, got %d", len(server.invoices))
	}
}

func TestServer_toggleTemplate(t *testing.T) {
	server := &Server{
		invoices: []Invoice{
			{ID: 1, InvoiceNum: "INV-001", Template: false},
		},
		storage: &Storage{},
	}

	req, err := http.NewRequest("PUT", "/api/invoices/1/toggle-template", nil)
	if err != nil {
		t.Fatal(err)
	}

	rr := httptest.NewRecorder()

	router := mux.NewRouter()
	router.HandleFunc("/api/invoices/{id}/toggle-template", server.toggleTemplate).Methods("PUT")
	router.ServeHTTP(rr, req)

	if status := rr.Code; status != http.StatusOK {
		t.Errorf("handler returned wrong status code: got %v want %v", status, http.StatusOK)
	}

	var response map[string]interface{}
	err = json.Unmarshal(rr.Body.Bytes(), &response)
	if err != nil {
		t.Fatal(err)
	}

	if response["template"] != true {
		t.Errorf("expected template to be true, got %v", response["template"])
	}

	if !server.invoices[0].Template {
		t.Error("expected invoice template status to be true")
	}
}

func TestServer_getCustomers(t *testing.T) {
	server := &Server{
		customers: []Customer{
			{ID: 1, Name: "Customer 1", Email: "customer1@example.com"},
			{ID: 2, Name: "Customer 2", Email: "customer2@example.com"},
		},
	}

	req, err := http.NewRequest("GET", "/api/customers", nil)
	if err != nil {
		t.Fatal(err)
	}

	rr := httptest.NewRecorder()
	handler := http.HandlerFunc(server.getCustomers)
	handler.ServeHTTP(rr, req)

	if status := rr.Code; status != http.StatusOK {
		t.Errorf("handler returned wrong status code: got %v want %v", status, http.StatusOK)
	}

	var customers []Customer
	err = json.Unmarshal(rr.Body.Bytes(), &customers)
	if err != nil {
		t.Fatal(err)
	}

	if len(customers) != 2 {
		t.Errorf("expected 2 customers, got %d", len(customers))
	}
}

func TestServer_createCustomer(t *testing.T) {
	server := &Server{
		customers: []Customer{},
		storage:   &Storage{},
	}

	customer := Customer{
		Name:    "New Customer",
		Email:   "new@example.com",
		Address: "123 Test St",
		Phone:   "555-1234",
	}

	jsonData, _ := json.Marshal(customer)
	req, err := http.NewRequest("POST", "/api/customers", bytes.NewBuffer(jsonData))
	if err != nil {
		t.Fatal(err)
	}
	req.Header.Set("Content-Type", "application/json")

	rr := httptest.NewRecorder()
	handler := http.HandlerFunc(server.createCustomer)
	handler.ServeHTTP(rr, req)

	if status := rr.Code; status != http.StatusCreated {
		t.Errorf("handler returned wrong status code: got %v want %v", status, http.StatusCreated)
	}

	var createdCustomer Customer
	err = json.Unmarshal(rr.Body.Bytes(), &createdCustomer)
	if err != nil {
		t.Fatal(err)
	}

	if createdCustomer.Name != "New Customer" {
		t.Errorf("expected customer name 'New Customer', got %s", createdCustomer.Name)
	}

	if len(server.customers) != 1 {
		t.Errorf("expected 1 customer in server, got %d", len(server.customers))
	}
}

func TestServer_findInvoiceByID(t *testing.T) {
	server := &Server{
		invoices: []Invoice{
			{ID: 1, InvoiceNum: "INV-001"},
			{ID: 2, InvoiceNum: "INV-002"},
		},
	}

	invoice, index := server.findInvoiceByID(1)
	if invoice == nil {
		t.Error("expected to find invoice with ID 1")
	}
	if index != 0 {
		t.Errorf("expected index 0, got %d", index)
	}

	invoice, index = server.findInvoiceByID(999)
	if invoice != nil {
		t.Error("expected not to find invoice with ID 999")
	}
	if index != -1 {
		t.Errorf("expected index -1, got %d", index)
	}
}

func TestServer_findCustomerByID(t *testing.T) {
	server := &Server{
		customers: []Customer{
			{ID: 1, Name: "Customer 1"},
			{ID: 2, Name: "Customer 2"},
		},
	}

	customer, index := server.findCustomerByID(1)
	if customer == nil {
		t.Error("expected to find customer with ID 1")
	}
	if index != 0 {
		t.Errorf("expected index 0, got %d", index)
	}

	customer, index = server.findCustomerByID(999)
	if customer != nil {
		t.Error("expected not to find customer with ID 999")
	}
	if index != -1 {
		t.Errorf("expected index -1, got %d", index)
	}
}

// MockStorage for testing - implements Storage interface
type MockStorage struct{}

func (m *MockStorage) LoadData() ([]Invoice, []Customer, *Meta, error) {
	return []Invoice{}, []Customer{}, &Meta{NextID: 1, NextCustomerID: 1}, nil
}

func (m *MockStorage) SaveData(invoices []Invoice, customers []Customer, meta *Meta) error {
	return nil
}
