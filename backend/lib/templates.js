/**
 * MVP Agreement Templates — Canada-first jurisdiction.
 * Each template has an id, title, description, jurisdiction note,
 * a list of required fields, and a function to generate the full legal text.
 */

const TEMPLATES = {
  bill_of_sale: {
    id: "bill_of_sale",
    title: "Bill of Sale",
    description:
      "Transfer ownership of personal property (e.g., electronics, furniture, vehicles) between two parties.",
    jurisdiction: "Canada",
    fields: [
      { key: "seller_name", label: "Seller Full Legal Name", type: "text", required: true },
      { key: "buyer_name", label: "Buyer Full Legal Name", type: "text", required: true },
      { key: "item_description", label: "Item Description", type: "textarea", required: true },
      { key: "sale_price", label: "Sale Price (CAD)", type: "number", required: true },
      { key: "condition", label: "Item Condition", type: "text", required: false },
    ],
    generate(data) {
      return `BILL OF SALE

This Bill of Sale ("Agreement") is entered into on ${data._date} between:

SELLER: ${data.seller_name} (hereinafter "Seller")
BUYER: ${data.buyer_name} (hereinafter "Buyer")

1. SALE OF GOODS
The Seller agrees to sell, and the Buyer agrees to purchase, the following personal property:

Item Description: ${data.item_description}
${data.condition ? `Condition: ${data.condition}` : "Condition: As-is"}

2. PURCHASE PRICE
The total purchase price is CAD $${Number(data.sale_price).toFixed(2)} (Canadian Dollars), payable upon execution of this Agreement.

3. TRANSFER OF OWNERSHIP
Upon receipt of the full purchase price, the Seller transfers all rights, title, and interest in the above-described property to the Buyer. The property is sold "as-is" unless otherwise specified.

4. WARRANTIES
The Seller warrants that they are the lawful owner of the property and have the right to sell it. The Seller warrants that the property is free and clear of all liens, claims, and encumbrances.

5. GOVERNING LAW
This Agreement shall be governed by and construed in accordance with the laws of the Province in which it is executed and the federal laws of Canada applicable therein.

6. ENTIRE AGREEMENT
This Agreement constitutes the entire agreement between the parties and supersedes all prior negotiations, representations, or agreements relating to this subject matter.

7. DISCLAIMER
This document is generated for informational purposes and does not constitute legal advice. For complex transactions, consult a licensed legal professional.

AGREED AND SIGNED ELECTRONICALLY via Handshake.`;
    },
  },

  roommate_agreement: {
    id: "roommate_agreement",
    title: "Roommate Agreement",
    description:
      "Define shared living arrangements, responsibilities, and financial obligations between roommates.",
    jurisdiction: "Canada",
    fields: [
      { key: "party_a_name", label: "Party A Full Legal Name", type: "text", required: true },
      { key: "party_b_name", label: "Party B Full Legal Name", type: "text", required: true },
      { key: "address", label: "Shared Address", type: "textarea", required: true },
      { key: "monthly_rent", label: "Total Monthly Rent (CAD)", type: "number", required: true },
      { key: "rent_split", label: "Rent Split Description", type: "text", required: true },
      { key: "move_in_date", label: "Move-in Date", type: "date", required: true },
      { key: "term_months", label: "Term (Months)", type: "number", required: true },
    ],
    generate(data) {
      return `ROOMMATE AGREEMENT

This Roommate Agreement ("Agreement") is entered into on ${data._date} between:

PARTY A: ${data.party_a_name}
PARTY B: ${data.party_b_name}

1. PREMISES
The parties agree to share the following residential premises:
${data.address}

2. TERM
This Agreement commences on ${data.move_in_date} and continues for ${data.term_months} month(s), unless terminated earlier by mutual written consent or as permitted by applicable provincial tenancy law.

3. RENT AND FINANCIAL OBLIGATIONS
Total Monthly Rent: CAD $${Number(data.monthly_rent).toFixed(2)}
Rent Split: ${data.rent_split}
Rent is due on the 1st of each month. Late payments may incur additional costs as agreed between the parties.

4. SHARED RESPONSIBILITIES
Both parties agree to maintain the premises in reasonable condition, share common-area cleaning duties equitably, and respect each other's quiet enjoyment of the space.

5. UTILITIES AND EXPENSES
Unless otherwise agreed in writing, utilities and shared household expenses shall be split equally between the parties.

6. TERMINATION
Either party may terminate this Agreement by providing at least 30 days' written notice to the other party, subject to any overriding obligations under the applicable provincial residential tenancy legislation.

7. GOVERNING LAW
This Agreement shall be governed by the laws of the Province in which the premises are located and the federal laws of Canada applicable therein.

8. DISCLAIMER
This document is generated for informational purposes and does not constitute legal advice. For complex arrangements, consult a licensed legal professional.

AGREED AND SIGNED ELECTRONICALLY via Handshake.`;
    },
  },

  proof_of_payment: {
    id: "proof_of_payment",
    title: "Proof of Payment",
    description:
      "Acknowledge receipt of a payment between two parties (e.g., personal loan repayment, deposit).",
    jurisdiction: "Canada",
    fields: [
      { key: "payer_name", label: "Payer Full Legal Name", type: "text", required: true },
      { key: "payee_name", label: "Payee Full Legal Name", type: "text", required: true },
      { key: "amount", label: "Amount Paid (CAD)", type: "number", required: true },
      { key: "payment_method", label: "Payment Method", type: "text", required: true },
      { key: "purpose", label: "Purpose / Description", type: "textarea", required: true },
    ],
    generate(data) {
      return `PROOF OF PAYMENT

This Proof of Payment ("Acknowledgement") is issued on ${data._date}.

PAYER: ${data.payer_name}
PAYEE: ${data.payee_name}

1. PAYMENT DETAILS
Amount: CAD $${Number(data.amount).toFixed(2)} (Canadian Dollars)
Payment Method: ${data.payment_method}
Purpose: ${data.purpose}

2. ACKNOWLEDGEMENT
The Payee acknowledges receipt of the above-stated amount from the Payer for the purpose described. This acknowledgement serves as a record that the specified payment was made and received.

3. NO FURTHER OBLIGATION
Unless otherwise agreed in a separate written agreement, this payment satisfies the obligation described above in full. If partial payment, the remaining balance and terms should be documented separately.

4. GOVERNING LAW
This Acknowledgement shall be governed by the laws of the Province in which it is executed and the federal laws of Canada applicable therein.

5. DISCLAIMER
This document is generated for informational purposes and does not constitute legal advice. Consult a licensed legal professional for complex financial matters.

ACKNOWLEDGED AND SIGNED ELECTRONICALLY via Handshake.`;
    },
  },
};

function getTemplate(id) {
  return TEMPLATES[id] || null;
}

function listTemplates() {
  return Object.values(TEMPLATES).map(({ id, title, description, fields }) => ({
    id,
    title,
    description,
    fields,
  }));
}

module.exports = { getTemplate, listTemplates, TEMPLATES };
