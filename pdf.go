package main

import (
	"fmt"

	"github.com/jung-kurt/gofpdf"
)

// createInvoicePDF creates a PDF for the given invoice
func (s *Server) createInvoicePDF(invoice Invoice) *gofpdf.Fpdf {
	pdf := gofpdf.New("P", "mm", "A4", "")
	pdf.AddPage()

	// Header
	pdf.SetFont("Arial", "B", 16)
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

	// Items table
	s.addItemsTable(pdf, invoice.Items)

	// Totals
	s.addTotalsSection(pdf, invoice)

	// Notes
	if invoice.Notes != "" {
		s.addNotesSection(pdf, invoice.Notes)
	}

	return pdf
}

// addItemsTable adds the items table to the PDF
func (s *Server) addItemsTable(pdf *gofpdf.Fpdf, items []InvoiceItem) {
	// Table header
	pdf.SetFont("Arial", "B", 10)
	pdf.Cell(70, 7, "Description")
	pdf.Cell(15, 7, "Qty")
	pdf.Cell(25, 7, "Rate")
	pdf.Cell(20, 7, "% Total")
	pdf.Cell(30, 7, "Amount")
	pdf.Ln(7)

	// Table rows
	pdf.SetFont("Arial", "", 10)
	for _, item := range items {
		pdf.Cell(70, 6, item.Description)
		pdf.Cell(15, 6, fmt.Sprintf("%d", item.Quantity))
		pdf.Cell(25, 6, fmt.Sprintf("$%.2f", item.Rate))
		pdf.Cell(20, 6, fmt.Sprintf("%.1f%%", item.Percentage))
		pdf.Cell(30, 6, fmt.Sprintf("$%.2f", item.Amount))
		pdf.Ln(6)
	}
	pdf.Ln(10)
}

// addTotalsSection adds the totals section to the PDF
func (s *Server) addTotalsSection(pdf *gofpdf.Fpdf, invoice Invoice) {
	pdf.SetFont("Arial", "B", 10)
	pdf.Cell(130, 6, "Subtotal:")
	pdf.Cell(30, 6, fmt.Sprintf("$%.2f", invoice.Subtotal))
	pdf.Ln(6)
	pdf.Cell(130, 6, "Tax:")
	pdf.Cell(30, 6, fmt.Sprintf("$%.2f", invoice.Tax))
	pdf.Ln(6)
	pdf.Cell(130, 6, "Total:")
	pdf.Cell(30, 6, fmt.Sprintf("$%.2f", invoice.Total))
}

// addNotesSection adds the notes section to the PDF
func (s *Server) addNotesSection(pdf *gofpdf.Fpdf, notes string) {
	pdf.Ln(20)
	pdf.SetFont("Arial", "B", 10)
	pdf.Cell(40, 6, "Notes:")
	pdf.Ln(6)
	pdf.SetFont("Arial", "", 10)
	pdf.MultiCell(0, 5, notes, "", "", false)
}
