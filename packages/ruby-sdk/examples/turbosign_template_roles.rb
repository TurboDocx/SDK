# frozen_string_literal: true

# Example: Send a Template Set Up in TurboDocx (Signer Roles)
#
# Set the template up once in TurboDocx:
#   1. Upload a PDF as a template.
#   2. On its Signatures tab, add each signer as a role (e.g. "Client", "Countersigner").
#      Tick "Fill in name and email when sending" for a role that changes every time;
#      give a role a name and email when it's always the same person (e.g. your countersigner).
#   3. Drag each role's fields onto the PDF and save the signature setup.
#
# Then send it from code by naming each recipient's role. The fields saved for that role come
# with it, so you never pass coordinates or anchors.
#
# Use this when: the same document goes out again and again with different signers.
#
# Set environment variables before running:
#   export TURBODOCX_API_KEY=your-api-key
#   export TURBODOCX_ORG_ID=your-org-uuid
#   export TURBODOCX_SENDER_EMAIL=support@yourcompany.com
#   export TURBODOCX_SENDER_NAME="Your Company Name"
#   export TEMPLATE_ID=your-template-id
#
# Run with: ruby examples/turbosign_template_roles.rb

require "turbodocx_sdk"

TurboDocxSdk::TurboSign.configure(
  api_key:      ENV.fetch("TURBODOCX_API_KEY", "your-api-key-here"),
  org_id:       ENV.fetch("TURBODOCX_ORG_ID", "your-org-id-here"),
  sender_email: ENV.fetch("TURBODOCX_SENDER_EMAIL", "support@yourcompany.com"),
  sender_name:  ENV.fetch("TURBODOCX_SENDER_NAME", "Your Company Name")
)

template_id = ENV.fetch("TEMPLATE_ID", "your-template-id-here")

begin
  # 1. See the template's roles. The keys are also shown under "Use via API" on the
  #    template's page in TurboDocx.
  setup = TurboDocxSdk::TurboSign.get_template_signature_setup(template_id)

  puts "Template roles (in signing order):"
  setup["roles"].each do |role|
    signer = if role["hasSavedSigner"]
               "saved signer #{role['defaultName']} <#{role['defaultEmail']}>"
             else
               "filled in when sending"
             end
    puts "  #{role['order']}. #{role['key']} (#{role['label']}): #{signer}, #{role['fieldCount']} field(s)"
  end

  # 2. Pass a recipient for every role filled in when sending. A role with a saved signer can
  #    be left out (its saved signer is used), or passed to send to someone else this time.
  result = TurboDocxSdk::TurboSign.send_signature(
    "templateId" => template_id,
    "recipients" => [
      { "role" => "client", "name" => "Jane Doe", "email" => "jane@client.com" }
      # "countersigner" left out: the signer saved on the template is used
    ]
    # No fields: the template's saved fields come with each role. Any fields you add here
    # are placed in addition to them (e.g. an extra witness signature).
  )

  puts "\n✅ Document sent!"
  puts "Document ID: #{result['documentId']}"

  # 3. Track it like any other document.
  progress = TurboDocxSdk::TurboSign.get_recipients(result["documentId"])
  summary = progress["summary"]
  puts "\n#{summary['completed']} of #{summary['total']} signed, still waiting on #{summary['waitingOn']}"
  progress["recipients"].each do |recipient|
    puts "  #{recipient['name']} <#{recipient['email']}>: #{recipient['effectiveStatus']}"
  end
rescue TurboDocxSdk::TurboDocxError => e
  # A role the template doesn't have, or a role with no saved signer that you left out,
  # comes back as a ValidationError whose message names the role and lists the valid ones.
  puts "Error: #{e.message}"
end
