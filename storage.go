package main

import (
	"encoding/json"
	"log"
	"os"
	"path/filepath"
)

const (
	dataFile      = "data/invoices.json"
	customersFile = "data/customers.json"
	metaFile      = "data/meta.json"
)

// Storage handles all data persistence operations
type Storage struct{
	dataDir string
}

// NewStorage creates a new storage instance with specified data directory
func NewStorage(dataDir string) *Storage {
	if dataDir == "" {
		dataDir = "data" // fallback to default
	}
	return &Storage{dataDir: dataDir}
}

// SetDataDirectory updates the data directory path
func (s *Storage) SetDataDirectory(dataDir string) {
	if dataDir != "" {
		s.dataDir = dataDir
	}
}

// getFilePath returns the full path for a given filename
func (s *Storage) getFilePath(filename string) string {
	return filepath.Join(s.dataDir, filename)
}

// LoadData loads all data from files
func (s *Storage) LoadData() ([]Invoice, []Customer, int, int, Settings) {
	var invoices []Invoice
	var customers []Customer
	var nextID = 1
	var nextCustomerID = 1
	var settings = Settings{
		Company: CompanyInfo{
			Name:    "Adams Family Household",
			Email:   "jason.k.r.adams@gmail.com",
			Phone:   "(425) 879-9792",
			Website: "",
			Address: "16112 E 23rd Ct, Spokane Valley, WA 99037",
		},
		DataDirectory: "data",
	}

	// Create data directory if it doesn't exist
	if err := os.MkdirAll(s.dataDir, 0755); err != nil {
		log.Printf("Error creating data directory: %v", err)
		return invoices, customers, nextID, nextCustomerID, settings
	}

	// Load invoices
	if data, err := os.ReadFile(s.getFilePath("invoices.json")); err == nil {
		if err := json.Unmarshal(data, &invoices); err != nil {
			log.Printf("Error unmarshaling invoices: %v", err)
		}
	}

	// Load customers
	if data, err := os.ReadFile(s.getFilePath("customers.json")); err == nil {
		if err := json.Unmarshal(data, &customers); err != nil {
			log.Printf("Error unmarshaling customers: %v", err)
		}
	}

	// Load metadata
	if data, err := os.ReadFile(s.getFilePath("meta.json")); err == nil {
		var meta Meta
		if err := json.Unmarshal(data, &meta); err != nil {
			log.Printf("Error unmarshaling metadata: %v", err)
		} else {
			nextID = meta.NextID
			nextCustomerID = meta.NextCustomerID
			if meta.Settings.Company.Name != "" {
				settings = meta.Settings
			}
			// Ensure nextCustomerID is at least 1
			if nextCustomerID == 0 {
				nextCustomerID = 1
			}
		}
	}

	log.Printf("Loaded %d invoices, %d customers, nextID: %d, nextCustomerID: %d", 
		len(invoices), len(customers), nextID, nextCustomerID)
	
	return invoices, customers, nextID, nextCustomerID, settings
}

// SaveData saves all data to files
func (s *Storage) SaveData(invoices []Invoice, customers []Customer, meta Meta) error {
	// Create data directory if it doesn't exist
	if err := os.MkdirAll(s.dataDir, 0755); err != nil {
		log.Printf("Error creating data directory: %v", err)
		return err
	}

	// Save invoices
	if data, err := json.MarshalIndent(invoices, "", "  "); err == nil {
		if err := os.WriteFile(s.getFilePath("invoices.json"), data, 0644); err != nil {
			log.Printf("Error saving invoices: %v", err)
			return err
		}
	}

	// Save customers
	if data, err := json.MarshalIndent(customers, "", "  "); err == nil {
		if err := os.WriteFile(s.getFilePath("customers.json"), data, 0644); err != nil {
			log.Printf("Error saving customers: %v", err)
			return err
		}
	}

	// Save metadata
	if data, err := json.MarshalIndent(meta, "", "  "); err == nil {
		if err := os.WriteFile(s.getFilePath("meta.json"), data, 0644); err != nil {
			log.Printf("Error saving metadata: %v", err)
			return err
		}
	}

	return nil
}
