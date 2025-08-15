package main

import (
	"fmt"
	"log"
	"net/http"

	"github.com/gorilla/handlers"
	"github.com/gorilla/mux"
)

func main() {
	// Create server instance
	server := NewServer()

	r := mux.NewRouter()

	// Invoice routes
	r.HandleFunc("/api/invoices", server.getInvoices).Methods("GET")
	r.HandleFunc("/api/invoices", server.createInvoice).Methods("POST")
	r.HandleFunc("/api/invoices/{id}", server.getInvoice).Methods("GET")
	r.HandleFunc("/api/invoices/{id}", server.deleteInvoice).Methods("DELETE")
	r.HandleFunc("/api/invoices/{id}/template", server.toggleTemplate).Methods("PUT")
	r.HandleFunc("/api/invoices/{id}/pdf", server.generatePDF).Methods("GET")

	// Customer routes
	r.HandleFunc("/api/customers", server.getCustomers).Methods("GET")
	r.HandleFunc("/api/customers", server.createCustomer).Methods("POST")
	r.HandleFunc("/api/customers/{id}", server.getCustomer).Methods("GET")
	r.HandleFunc("/api/customers/{id}", server.updateCustomer).Methods("PUT")
	r.HandleFunc("/api/customers/{id}", server.deleteCustomer).Methods("DELETE")

	// Settings routes
	r.HandleFunc("/api/settings", server.getSettings).Methods("GET")
	r.HandleFunc("/api/settings", server.updateSettings).Methods("POST")

	// Serve static files
	r.PathPrefix("/").Handler(http.FileServer(http.Dir("./static/")))

	// Enable CORS
	corsHandler := handlers.CORS(
		handlers.AllowedOrigins([]string{"*"}),
		handlers.AllowedMethods([]string{"GET", "POST", "PUT", "DELETE", "OPTIONS"}),
		handlers.AllowedHeaders([]string{"*"}),
	)(r)

	fmt.Println("Invoice Management Server starting on :8080")
	log.Fatal(http.ListenAndServe(":8080", corsHandler))
}
