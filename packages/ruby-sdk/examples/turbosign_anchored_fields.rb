# frozen_string_literal: true

# Example: Anchored Fields on a Template's Signature Setup
#
# An anchored field ties a signature field to a tag such as {ClientSign} in a Word template, for
# one signer role. Wherever the tag appears in a document generated from the template, the field
# goes there, sized to fit the tag.
#
# If the tag is already a signature field of the role, step 1 returns that saved field and the
# example leaves it in place at the end. It only removes a field this run created.
#
# Before you run it:
#   - A Word template containing the tag, with at least one signer role saved on its Signatures tab.
#   - A deliverable generated from that template in which the tag still appears as text. Generate
#     it after the tag is a signature field, or give the tag's variable its own tag as the value.
#
# Set environment variables before running:
#   export TURBODOCX_API_KEY=your-api-key            # administrator or contributor
#   export TURBODOCX_ORG_ID=your-org-uuid
#   export TURBODOCX_SENDER_EMAIL=support@yourcompany.com
#   export TURBODOCX_BASE_URL=https://api.turbodocx.com   # optional
#   export TEMPLATE_ID=your-template-id
#   export DELIVERABLE_ID=your-deliverable-id
#   export ROLE_KEY=client                           # optional, the role that fills the tag
#   export ANCHOR_TAG="{ClientSign}"                 # optional
#   export SIGNER_NAME="Jane Doe" SIGNER_EMAIL=jane@example.com   # optional
#
# Run with: ruby examples/turbosign_anchored_fields.rb

require "turbodocx_sdk"

TurboDocxSdk::TurboSign.configure(
  api_key:      ENV.fetch("TURBODOCX_API_KEY", "your-api-key-here"),
  org_id:       ENV.fetch("TURBODOCX_ORG_ID", "your-org-id-here"),
  sender_email: ENV.fetch("TURBODOCX_SENDER_EMAIL", "support@yourcompany.com"),
  sender_name:  ENV.fetch("TURBODOCX_SENDER_NAME", "Your Company Name"),
  base_url:     ENV.fetch("TURBODOCX_BASE_URL", "https://api.turbodocx.com")
)

template_id = ENV.fetch("TEMPLATE_ID", "your-template-id-here")
deliverable_id = ENV.fetch("DELIVERABLE_ID", "your-deliverable-id-here")
role_key = ENV.fetch("ROLE_KEY", "client")
anchor = ENV.fetch("ANCHOR_TAG", "{ClientSign}")
signer_name = ENV.fetch("SIGNER_NAME", "Jane Doe")
signer_email = ENV.fetch("SIGNER_EMAIL", "jane@example.com")

begin
  # 1. Save a signature field on the tag for the role. Adding the same type on the same tag
  #    for the same role again returns the existing field (and would update any size, offset,
  #    placement, defaultValue or isReadonly sent, so this sends none).
  added = TurboDocxSdk::TurboSign.add_template_signature_anchor(
    templateId: template_id,
    roleKey: role_key,
    type: "signature",
    anchor: anchor
  )
  field_id = added["fieldId"]
  created = added["tagBecameSignatureField"]
  if created
    puts "1. Anchored field #{field_id} added on #{anchor} for role \"#{role_key}\""
    puts "   The tag is now a signature field: the template's own values for it were cleared"
  else
    puts "1. #{anchor} is already a signature field of role \"#{role_key}\" (field #{field_id})"
  end

  # 2. Read the setup back: every anchored field, and how many each role has.
  setup = TurboDocxSdk::TurboSign.get_template_signature_setup(template_id)
  puts "2. Anchored fields on the template:"
  # "anchors" and "anchoredFieldCount" are absent from older backends
  (setup["anchors"] || []).each do |a|
    missing = a["notFound"] ? ", tag not in the template" : ""
    puts "   #{a['anchor']} -> #{a['roleKey']} (#{a['type']})#{missing}"
  end
  setup["roles"].each do |role|
    puts "   Role #{role['key']}: #{role['anchoredFieldCount'] || 0} anchored of #{role['fieldCount']} field(s)"
  end

  # 3. Prepare the deliverable for signing with your own field on the tag. applySignatureSetup
  #    matches it to the saved anchored field (same tag and type), so it fits the tag and a tag
  #    missing from the document is skipped instead of failing. A review link sends no email;
  #    send_signature takes the same request and emails the signer.
  result = TurboDocxSdk::TurboSign.create_signature_review_link(
    deliverableId: deliverable_id,
    documentName: "Anchored Fields Example",
    applySignatureSetup: true,
    recipients: [{ name: signer_name, email: signer_email, signingOrder: 1 }],
    fields: [{ type: "signature", recipientEmail: signer_email, template: { anchor: anchor } }]
  )
  puts "3. Review link ready for document #{result['documentId']}"
  puts "   Preview: #{result['previewUrl']}"

  # 4. Remove the anchored field, but only if this run created it: a field that was already
  #    saved on the tag is someone's real setup. Removing it does not bring back the values the
  #    template's variable had before the tag became a signature field.
  if created
    removed = TurboDocxSdk::TurboSign.remove_template_signature_anchor(template_id, field_id)
    puts "4. Anchored field #{field_id} removed, #{removed['signatureSetup']['fields'].length} field(s) left in the setup"
  else
    puts "4. Anchored field #{field_id} was already saved before this run, so it was left in place"
  end
rescue TurboDocxSdk::TurboDocxError => e
  # A role the template doesn't have is a NotFoundError (SignerRoleNotFound); a tag held by
  # another role, or already holding a different field, is a ConflictError.
  puts "Error: #{e.message}"
  exit 1
end
