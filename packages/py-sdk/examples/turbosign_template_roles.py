"""
Example: Send a Template Set Up in TurboDocx (Signer Roles)

Set the template up once in TurboDocx:
  1. Upload a PDF as a template.
  2. On its Signatures tab, add each signer as a role (e.g. "Client", "Countersigner").
     Tick "Fill in name and email when sending" for a role that changes every time;
     give a role a name and email when it's always the same person (e.g. your countersigner).
  3. Drag each role's fields onto the PDF and save the signature setup.

Then send it from code by naming each recipient's role. The fields saved for that role come
with it, so you never pass coordinates or anchors.

Use this when: the same document goes out again and again with different signers.

Run with: TEMPLATE_ID=<your template id> python examples/turbosign_template_roles.py
"""

import asyncio
import os

from turbodocx_sdk import TurboSign


async def send_template_with_roles_example():
    TurboSign.configure(
        api_key=os.getenv("TURBODOCX_API_KEY", "your-api-key-here"),
        org_id=os.getenv("TURBODOCX_ORG_ID", "your-org-id-here"),
        sender_email=os.getenv("TURBODOCX_SENDER_EMAIL", "support@yourcompany.com"),
        sender_name=os.getenv("TURBODOCX_SENDER_NAME", "Your Company Name"),
    )

    template_id = os.getenv("TEMPLATE_ID", "your-template-id-here")

    try:
        # 1. See the template's roles. The keys are also shown under "Use via API" on the
        #    template's page in TurboDocx.
        setup = await TurboSign.get_template_signature_setup(template_id)

        print("Template roles (in signing order):")
        for role in setup["roles"]:
            if role["hasSavedSigner"]:
                signer = f"saved signer {role['defaultName']} <{role['defaultEmail']}>"
            else:
                signer = "filled in when sending"
            print(
                f"  {role['order']}. {role['key']} ({role['label']}): "
                f"{signer}, {role['fieldCount']} field(s)"
            )

        # 2. Pass a recipient for every role filled in when sending. A role with a saved signer can
        #    be left out (its saved signer is used), or passed to send to someone else this time.
        result = await TurboSign.send_signature(
            template_id=template_id,
            recipients=[
                {"role": "client", "name": "Jane Doe", "email": "jane@client.com"},
                # "countersigner" left out: the signer saved on the template is used
            ],
            # No fields: the template's saved fields come with each role. Any fields you add here
            # are placed in addition to them (e.g. an extra witness signature).
        )

        print("\n✅ Document sent!")
        print(f"Document ID: {result['documentId']}")

        # 3. Track it like any other document.
        progress = await TurboSign.get_recipients(result["documentId"])
        summary = progress["summary"]
        print(
            f"\n{summary['completed']} of {summary['total']} signed, "
            f"still waiting on {summary['waitingOn']}"
        )
        for recipient in progress["recipients"]:
            print(f"  {recipient['name']} <{recipient['email']}>: {recipient['effectiveStatus']}")

    except Exception as error:
        # A role the template doesn't have, or a role with no saved signer that you left out,
        # comes back as a ValidationError whose message names the role and lists the valid ones.
        print(f"Error: {error}")


# Run the example
if __name__ == "__main__":
    asyncio.run(send_template_with_roles_example())
