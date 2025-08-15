package main

import (
	"fmt"

	"github.com/jung-kurt/gofpdf"
)

// createInvoicePDF creates a PDF for the given invoice
func (s *Server) createInvoicePDF(invoice Invoice) *gofpdf.Fpdf {
	pdf := gofpdf.New("P", "mm", "A4", "")
	pdf.AddPage()
	pdf.SetMargins(20, 20, 20)

	// Header with company branding
	s.addHeader(pdf, invoice)

	// Invoice and client details in two columns
	s.addInvoiceAndClientDetails(pdf, invoice)

	// Items table with borders
	s.addItemsTable(pdf, invoice.Items)

	// Totals section with better alignment
	s.addTotalsSection(pdf, invoice)

	// Notes section
	if invoice.Notes != "" {
		s.addNotesSection(pdf, invoice.Notes)
	}

	// Footer
	s.addFooter(pdf)

	return pdf
}

// addHeader adds a professional header to the PDF
func (s *Server) addHeader(pdf *gofpdf.Fpdf, invoice Invoice) {
	// Company name/logo area
	pdf.SetFont("Arial", "B", 24)
	pdf.SetTextColor(51, 51, 51)
	pdf.Cell(0, 12, "Adams Family Household")
	pdf.Ln(15)

	pdf.SetFont("Arial", "", 10)
	pdf.SetTextColor(102, 102, 102)
	pdf.Cell(0, 5, "16112 E 23rd Ct, Spokane Valley, WA 99037")
	pdf.Ln(4)
	pdf.Cell(0, 5, "Phone: (425) 879-9792 | Email: jason.k.r.adams@gmail.com")
	pdf.Ln(15)

	// INVOICE title with background
	pdf.SetFillColor(102, 126, 234)
	pdf.SetTextColor(255, 255, 255)
	pdf.SetFont("Arial", "B", 20)
	pdf.CellFormat(0, 12, "INVOICE", "", 1, "C", true, 0, "")
	pdf.Ln(10)

	// Reset colors
	pdf.SetTextColor(0, 0, 0)
}

// addInvoiceAndClientDetails adds invoice details and client info in two columns
func (s *Server) addInvoiceAndClientDetails(pdf *gofpdf.Fpdf, invoice Invoice) {
	// Invoice details (left column)
	pdf.SetFont("Arial", "B", 11)
	pdf.Cell(95, 6, "Invoice Details")
	pdf.Cell(95, 6, "Bill To")
	pdf.Ln(8)

	// Invoice info
	pdf.SetFont("Arial", "", 10)
	pdf.Cell(25, 5, "Invoice #:")
	pdf.SetFont("Arial", "B", 10)
	pdf.Cell(70, 5, invoice.InvoiceNum)

	// Client info
	pdf.SetFont("Arial", "B", 11)
	pdf.Cell(95, 5, invoice.Client.Name)
	pdf.Ln(5)

	pdf.SetFont("Arial", "", 10)
	pdf.Cell(25, 5, "Date:")
	pdf.SetFont("Arial", "", 10)
	pdf.Cell(70, 5, invoice.Date)

	pdf.SetFont("Arial", "", 10)
	pdf.Cell(95, 5, invoice.Client.Email)
	pdf.Ln(5)

	pdf.SetFont("Arial", "", 10)
	pdf.Cell(25, 5, "Due Date:")
	pdf.SetFont("Arial", "", 10)
	pdf.Cell(70, 5, invoice.DueDate)

	pdf.Cell(95, 5, invoice.Client.Address)
	pdf.Ln(5)

	pdf.Cell(95, 5, "")
	pdf.Cell(95, 5, invoice.Client.Phone)
	pdf.Ln(20)
}

// addFooter adds a footer to the PDF
func (s *Server) addFooter(pdf *gofpdf.Fpdf) {
	pdf.Ln(20)
	pdf.SetFont("Arial", "I", 8)
	pdf.SetTextColor(128, 128, 128)
	pdf.Cell(0, 5, "Thank you for your business!")
	pdf.Ln(3)
	pdf.Cell(0, 5, "Payment is due within 30 days of invoice date.")
}

// addItemsTable adds the items table to the PDF
func (s *Server) addItemsTable(pdf *gofpdf.Fpdf, items []InvoiceItem) {
	// Table header with background and borders
	pdf.SetFillColor(240, 240, 240)
	pdf.SetTextColor(0, 0, 0)
	pdf.SetFont("Arial", "B", 10)
	pdf.SetDrawColor(200, 200, 200)
	pdf.SetLineWidth(0.1)

	pdf.CellFormat(70, 8, "Description", "1", 0, "L", true, 0, "")
	pdf.CellFormat(15, 8, "Qty", "1", 0, "C", true, 0, "")
	pdf.CellFormat(25, 8, "Rate", "1", 0, "C", true, 0, "")
	pdf.CellFormat(20, 8, "% Total", "1", 0, "C", true, 0, "")
	pdf.CellFormat(30, 8, "Amount", "1", 0, "R", true, 0, "")
	pdf.Ln(8)

	// Table rows with alternating colors
	pdf.SetFont("Arial", "", 9)
	for i, item := range items {
		// Alternating row colors
		if i%2 == 0 {
			pdf.SetFillColor(250, 250, 250)
		} else {
			pdf.SetFillColor(255, 255, 255)
		}

		pdf.CellFormat(70, 7, item.Description, "1", 0, "L", true, 0, "")
		pdf.CellFormat(15, 7, fmt.Sprintf("%d", item.Quantity), "1", 0, "C", true, 0, "")
		pdf.CellFormat(25, 7, fmt.Sprintf("$%.2f", item.Rate), "1", 0, "C", true, 0, "")
		pdf.CellFormat(20, 7, fmt.Sprintf("%.1f%%", item.Percentage), "1", 0, "C", true, 0, "")
		pdf.CellFormat(30, 7, fmt.Sprintf("$%.2f", item.Amount), "1", 0, "R", true, 0, "")
		pdf.Ln(7)
	}
	pdf.Ln(15)
}

// addTotalsSection adds the totals section to the PDF
func (s *Server) addTotalsSection(pdf *gofpdf.Fpdf, invoice Invoice) {
	// Create a bordered totals section
	pdf.SetDrawColor(200, 200, 200)
	pdf.SetLineWidth(0.1)

	// Subtotal
	pdf.SetFont("Arial", "", 10)
	pdf.CellFormat(130, 7, "Subtotal:", "1", 0, "R", false, 0, "")
	pdf.CellFormat(30, 7, fmt.Sprintf("$%.2f", invoice.Subtotal), "1", 0, "R", false, 0, "")
	pdf.Ln(7)

	// Tax
	pdf.CellFormat(130, 7, "Tax:", "1", 0, "R", false, 0, "")
	pdf.CellFormat(30, 7, fmt.Sprintf("$%.2f", invoice.Tax), "1", 0, "R", false, 0, "")
	pdf.Ln(7)

	// Total with emphasis
	pdf.SetFillColor(102, 126, 234)
	pdf.SetTextColor(255, 255, 255)
	pdf.SetFont("Arial", "B", 12)
	pdf.CellFormat(130, 9, "TOTAL:", "1", 0, "R", true, 0, "")
	pdf.CellFormat(30, 9, fmt.Sprintf("$%.2f", invoice.Total), "1", 0, "R", true, 0, "")

	// Reset colors
	pdf.SetTextColor(0, 0, 0)
}

// addNotesSection adds the notes section to the PDF
func (s *Server) addNotesSection(pdf *gofpdf.Fpdf, notes string) {
	pdf.Ln(20)
	pdf.SetFont("Arial", "B", 11)
	pdf.SetTextColor(51, 51, 51)
	pdf.Cell(40, 8, "Notes:")
	pdf.Ln(8)

	// Add a subtle border around notes
	pdf.SetDrawColor(220, 220, 220)
	pdf.SetFillColor(248, 248, 248)
	pdf.SetFont("Arial", "", 10)
	pdf.SetTextColor(0, 0, 0)

	// Calculate the height needed for the notes
	lines := pdf.SplitLines([]byte(notes), 170)
	height := float64(len(lines))*5 + 6

	pdf.Rect(10, pdf.GetY()-2, 170, height, "FD")
	pdf.SetXY(15, pdf.GetY()+2)
	pdf.MultiCell(160, 5, notes, "", "", false)
}
