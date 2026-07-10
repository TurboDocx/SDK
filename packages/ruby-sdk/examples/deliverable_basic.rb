# frozen_string_literal: true

# Deliverable SDK - Basic Usage Example
#
# This example demonstrates the complete deliverable workflow:
# 1. Configure the SDK
# 2. Generate a deliverable from a template
# 3. List deliverables
# 4. Get deliverable details
# 5. Download the source file and PDF
# 6. Update a deliverable
#
# Set environment variables before running:
#   export TURBODOCX_API_KEY=your-api-key
#   export TURBODOCX_ORG_ID=your-org-uuid

require "turbodocx_sdk"

# 1. Configure with your API credentials
TurboDocxSdk::Deliverable.configure(
  api_key: ENV.fetch("TURBODOCX_API_KEY"),
  org_id:  ENV.fetch("TURBODOCX_ORG_ID")
)

# 2. Generate a deliverable from a template
puts "Generating deliverable..."
created = TurboDocxSdk::Deliverable.generate_deliverable(
  "templateId"  => "YOUR_TEMPLATE_ID",
  "name"        => "Employee Contract - John Smith",
  "description" => "Employment contract for senior developer",
  "variables"   => [
    { "placeholder" => "{EmployeeName}", "text" => "John Smith", "mimeType" => "text" },
    { "placeholder" => "{CompanyName}", "text" => "TechCorp Solutions Inc.", "mimeType" => "text" },
    { "placeholder" => "{JobTitle}", "text" => "Senior Software Engineer", "mimeType" => "text" }
  ],
  "tags"        => %w[hr contract employee]
)
deliverable_id = created["results"]["deliverable"]["id"]
puts "Created deliverable: #{deliverable_id}"

# 3. List deliverables
puts "\nListing deliverables..."
listing = TurboDocxSdk::Deliverable.list_deliverables(
  limit:     5,
  show_tags: true
)
puts "Found #{listing['totalRecords']} deliverables"
listing["results"].each do |d|
  puts "  - #{d['name']} (#{d['id']})"
end

# 4. Get full details
puts "\nGetting deliverable details..."
details = TurboDocxSdk::Deliverable.get_deliverable_details(deliverable_id, show_tags: true)
puts "Name: #{details['name']}"
puts "Template: #{details['templateName']}"
puts "Variables: #{(details['variables'] || []).length}"
tags = details["tags"] || []
puts "Tags: #{tags.map { |t| t['label'] }.join(', ')}"

# 5. Download files
puts "\nDownloading source file..."
source_file = TurboDocxSdk::Deliverable.download_source_file(deliverable_id)
File.binwrite("contract.docx", source_file)
puts "Saved contract.docx"

puts "Downloading PDF..."
pdf_file = TurboDocxSdk::Deliverable.download_pdf(deliverable_id)
File.binwrite("contract.pdf", pdf_file)
puts "Saved contract.pdf"

# 6. Update the deliverable
puts "\nUpdating deliverable..."
updated = TurboDocxSdk::Deliverable.update_deliverable_info(
  deliverable_id,
  "name" => "Employee Contract - John Smith (Final)",
  "tags" => %w[hr contract finalized]
)
puts updated["message"]

# 7. Delete the deliverable (soft delete)
# deleted = TurboDocxSdk::Deliverable.delete_deliverable(deliverable_id)
# puts deleted["message"]

puts "\nDone!"
