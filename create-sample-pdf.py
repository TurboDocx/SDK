#!/usr/bin/env python3
"""
Create a sample PDF with template anchors for testing TurboSign
"""

from reportlab.lib.pagesizes import letter
from reportlab.pdfgen import canvas

def create_sample_contract():
    filename = "sample-contract.pdf"
    c = canvas.Canvas(filename, pagesize=letter)
    width, height = letter

    # Title
    c.setFont("Helvetica-Bold", 16)
    c.drawString(72, height - 72, "Sample Service Agreement")

    # Contract text
    c.setFont("Helvetica", 12)
    y = height - 120

    contract_text = [
        "This Service Agreement (\"Agreement\") is entered into as of the date below",
        "by and between the parties identified herein.",
        "",
        "TERMS AND CONDITIONS:",
        "",
        "1. Services: The Provider agrees to provide services as described.",
        "2. Payment: Client agrees to pay the agreed-upon fees.",
        "3. Term: This agreement shall commence upon signing.",
        "",
        "By signing below, the parties agree to the terms and conditions.",
        "",
        "",
        "CLIENT SIGNATURE:",
        "",
        "{signature1}",
        "",
        "",
        "Date: {date1}",
        "",
        "",
        "Print Name: _______________________________",
        "",
        "",
    ]

    for line in contract_text:
        c.drawString(72, y, line)
        y -= 20
        if y < 72:  # Don't go off the page
            break

    c.save()
    print(f"✅ Created {filename} with {{signature1}} and {{date1}} anchors")

if __name__ == "__main__":
    create_sample_contract()
