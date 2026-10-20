# frozen_string_literal: true

require "spec_helper"

# HttpClient#put — a JSON PUT (used by reorder_line_item_images), unwrapped like every other call,
# and the 409 a refused quote delete comes back as. Only the network send is stubbed.
RSpec.describe TurboDocxSdk::HttpClient do
  let(:client) { described_class.new(api_key: "test-key", skip_sender_validation: true) }

  it "sends a JSON PUT and unwraps { data }" do
    sent = nil
    ok = Net::HTTPOK.new("1.1", "200", "OK")
    ok["content-type"] = "application/json"
    allow(ok).to receive(:body).and_return(JSON.generate({ "data" => { "results" => [{ "id" => "img-2" }] } }))
    allow(client).to receive(:http_request) do |request, _url|
      sent = request
      ok
    end

    result = client.put("/v1/quotes/q-1/items/li-1/images/order", { "imageIds" => ["img-2"] })

    expect(sent).to be_a(Net::HTTP::Put)
    expect(sent.path).to end_with("/v1/quotes/q-1/items/li-1/images/order")
    expect(JSON.parse(sent.body)).to eq({ "imageIds" => ["img-2"] })
    expect(result["results"]).to eq([{ "id" => "img-2" }])
  end

  it "maps a refused quote delete (409) to ConflictError with its code" do
    message = "A sent quote can't be deleted. Void it instead."
    response = double(code: "409", message: "Conflict", body: JSON.generate({
                                                                                "message" => message,
                                                                                "error" => { "message" => message, "code" => "CANNOT_DELETE_SENT_QUOTE" },
                                                                                "data" => {}
                                                                              }))

    expect { client.send(:handle_error_response, response) }.to raise_error(TurboDocxSdk::ConflictError) { |error|
      expect(error.code).to eq("CANNOT_DELETE_SENT_QUOTE")
      expect(error.message).to eq(message)
    }
  end
end
