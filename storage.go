package main

import (
	"encoding/json"
	"log"
	"os"
)

const (
	dataFile      = "data/invoices.json"
	customersFile = "data/customers.json"
	metaFile      = "data/meta.json"
)

// Storage handles all data persistence operations
type Storage struct{}

// NewStorage creates a new storage instance
func NewStorage() *Storage {
	return &Storage{}
}

// LoadData loads all data from files
func (s *Storage) LoadData() ([]Invoice, []Customer, int, int) {
	var invoices []Invoice
	var customers []Customer
	var nextID = 1
	var nextCustomerID = 1

	// Create data directory if it doesn't exist
	if err := os.MkdirAll("data", 0755); err != nil {
		log.Printf("Error creating data directory: %v", err)
		return invoices, customers, nextID, nextCustomerID
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

	// Load metadata
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

	log.Printf("Loaded %d invoices, %d customers, nextID: %d, nextCustomerID: %d", 
		len(invoices), len(customers), nextID, nextCustomerID)
	
	return invoices, customers, nextID, nextCustomerID
}

// SaveData saves all data to files
func (s *Storage) SaveData(invoices []Invoice, customers []Customer, nextID, nextCustomerID int) error {
	// Create data directory if it doesn't exist
	if err := os.MkdirAll("data", 0755); err != nil {
		log.Printf("Error creating data directory: %v", err)
		return err
	}

	// Save invoices
	if data, err := json.MarshalIndent(invoices, "", "  "); err == nil {
		if err := os.WriteFile(dataFile, data, 0644); err != nil {
			log.Printf("Error saving invoices: %v", err)
			return err
		}
	}

	// Save customers
	if data, err := json.MarshalIndent(customers, "", "  "); err == nil {
		if err := os.WriteFile(customersFile, data, 0644); err != nil {
			log.Printf("Error saving customers: %v", err)
			return err
		}
	}

	// Save metadata
	meta := Meta{NextID: nextID, NextCustomerID: nextCustomerID}
	if data, err := json.MarshalIndent(meta, "", "  "); err == nil {
		if err := os.WriteFile(metaFile, data, 0644); err != nil {
			log.Printf("Error saving metadata: %v", err)
			return err
		}
	}

	return nil
}
