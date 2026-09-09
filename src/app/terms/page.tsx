import React from 'react';

export default function TermsPage() {
  const points = [
    {
      num: 1,
      title: 'About Purnya',
      content: (
        <>
          <p>Purnya is a multi-category lifestyle brand offering products across:</p>
          <ul className="list-disc list-inside space-y-1 mt-2 text-[#0B241C] font-medium">
            <li>Jewellery &amp; Accessories</li>
            <li>Candle &amp; Home Fragrance</li>
            <li>Home Decor &amp; Lifestyle</li>
            <li>Organic &amp; Wellness</li>
            <li>Gift &amp; Stationery</li>
          </ul>
          <p className="mt-2">
            Purnya operates as an inventory-led seller / marketplace facilitator for the purposes of the Consumer Protection (E-Commerce) Rules, 2020.
          </p>
        </>
      ),
    },
    {
      num: 2,
      title: 'Eligibility & Capacity to Contract',
      content: (
        <p>
          By placing an order on Purnya.in, you confirm that you are at least 18 years of age and competent to enter into a binding contract under the Indian Contract Act, 1872. Orders placed by or on behalf of a minor should be made under the supervision of a parent or legal guardian, who shall be responsible for the transaction.
        </p>
      ),
    },
    {
      num: 3,
      title: 'Product Information, Images & Display',
      content: (
        <div className="space-y-2.5">
          <p>
            We make every reasonable effort to ensure that product descriptions, photographs, specifications and other information displayed on Purnya.in are accurate and helpful.
          </p>
          <div>
            <h4 className="font-semibold text-[#0B241C]">Product Images &amp; Colour Representation</h4>
            <p className="mt-0.5">
              The actual colour, appearance, texture or finish of a product may vary slightly from what you see on your screen, due to differences in device displays, resolution, brightness settings, and photography/lighting conditions. Product images are illustrative. Please review the product description and specifications before ordering.
            </p>
          </div>
          <div>
            <h4 className="font-semibold text-[#0B241C]">Natural &amp; Handmade Variations</h4>
            <p className="mt-0.5">
              Products made using natural, handmade or artisanal materials may show minor variations in colour, texture, shape, dimensions or finish. Such reasonable variations, inherent to the product&apos;s nature, are not treated as a manufacturing defect.
            </p>
          </div>
          <div>
            <h4 className="font-semibold text-[#0B241C]">Country of Origin &amp; Legal Metrology Disclosures</h4>
            <p className="mt-0.5">
              Where required, the country of origin of a product, along with MRP, net quantity, and manufacturer/packer/importer details, will be displayed on the product page and/or product packaging in accordance with the Legal Metrology Act, 2009 and the Consumer Protection (E-Commerce) Rules, 2020.
            </p>
          </div>
        </div>
      ),
    },
    {
      num: 4,
      title: 'Product-Specific Information',
      content: (
        <p>
          Where applicable, additional information may be provided regarding product materials and care, candle usage and safety, dimensions and specifications, ingredients and storage instructions, and personalisation or customisation requirements. Please review this information on the product page or packaging before use.
        </p>
      ),
    },
    {
      num: 5,
      title: 'Pricing, Taxes & Availability',
      content: (
        <div className="space-y-2">
          <p>
            All prices displayed on Purnya.in are in Indian Rupees (INR) and are inclusive of applicable taxes unless stated otherwise. The final checkout page will separately display the product price, applicable taxes, shipping charges, and the total payable amount before payment is completed.
          </p>
          <p>
            A tax invoice will be issued for each order in accordance with applicable GST law, where the seller is a registered entity.
          </p>
          <p>
            In the event of an obvious pricing or product-information error, Purnya reserves the right to correct the error and, where necessary, cancel the affected order. If payment was collected for a cancelled order, a full refund will be processed in accordance with our refund timelines.
          </p>
        </div>
      ),
    },
    {
      num: 6,
      title: 'Orders & Acceptance',
      content: (
        <p>
          An order confirmation acknowledges receipt of the order and does not by itself guarantee acceptance where there is product unavailability, a payment issue, an incorrect price, or suspected fraudulent or unauthorised activity. Where Purnya cancels an order for such reasons, the customer will be notified with the reason for cancellation and any amount paid will be refunded.
        </p>
      ),
    },
    {
      num: 7,
      title: 'Payments',
      content: (
        <p>
          Payment options may include UPI, Credit Cards, Debit Cards, Net Banking, and other methods shown at checkout, subject to availability with our payment service providers. Customers should never share card PINs, OTPs or UPI PINs with anyone, including anyone claiming to represent Purnya.
        </p>
      ),
    },
    {
      num: 8,
      title: 'Order Cancellation',
      content: (
        <p>
          Customers may cancel an order before it has been dispatched by contacting Purnya through our customer care support. Personalised, customised, made-to-order or bulk orders may not be cancellable once production has commenced; this restriction, where applicable, will be clearly stated on the relevant product page before purchase.
        </p>
      ),
    },
    {
      num: 9,
      title: 'Shipping, Returns & Refunds',
      content: (
        <p>
          Shipping and delivery are governed by our Shipping &amp; Delivery Policy. Cancellations, returns, replacements and refunds are governed by our Cancellation, Return &amp; Refund Policy.
        </p>
      ),
    },
    {
      num: 10,
      title: 'Promotions & Offers',
      content: (
        <p>
          Promotional offers, discounts and coupon codes are subject to their specific stated terms and validity periods. Unless stated otherwise, multiple offers may not be combined.
        </p>
      ),
    },
    {
      num: 11,
      title: 'Intellectual Property',
      content: (
        <p>
          All content on Purnya.in — including the Purnya name, logo, website design, photographs, graphics and text — is owned by or used with permission by Purnya and may not be copied, reproduced, or used commercially without prior written permission.
        </p>
      ),
    },
    {
      num: 12,
      title: 'Acceptable Use',
      content: (
        <p>
          You agree to use Purnya.in lawfully and must not attempt unauthorised access to our systems, interfere with website functionality or security, use the website for fraudulent purposes, or misuse our content or intellectual property.
        </p>
      ),
    },
    {
      num: 13,
      title: 'Limitation of Liability',
      content: (
        <p>
          To the extent permitted by applicable law, Purnya&apos;s liability for any claim arising from a product or order shall not exceed the amount paid by the customer for that product or order, except in cases of proven negligence, wilful default, or as otherwise required by applicable law. Purnya is not liable for damage resulting from improper use, handling or storage of a product contrary to the instructions provided. Nothing in this clause limits any statutory right that cannot lawfully be excluded, including rights available to consumers under the Consumer Protection Act, 2019.
        </p>
      ),
    },
    {
      num: 14,
      title: 'Force Majeure',
      content: (
        <p>
          Purnya shall not be liable for any delay or failure in performance resulting from causes beyond its reasonable control, including natural disasters, strikes, pandemics, government action, or disruption to logistics networks. Obligations will resume as soon as reasonably practicable once the event concludes.
        </p>
      ),
    },
    {
      num: 15,
      title: 'Grievance Redressal & Dispute Resolution',
      content: (
        <p>
          Any complaint or dispute regarding orders or services may be submitted through our customer support desk. If a dispute is not resolved within 30 days of being raised, either party may refer it to mediation before pursuing litigation. Subject to the foregoing, these Terms are governed by the laws of India, and disputes shall be subject to the exclusive jurisdiction of the courts at Bengaluru, Karnataka.
        </p>
      ),
    },
    {
      num: 16,
      title: 'Changes to These Terms',
      content: (
        <p>
          Purnya may update these Terms from time to time. The version published on Purnya.in, along with its effective date, applies from that date. Material changes will be highlighted on the website.
        </p>
      ),
    },
  ];

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-10 sm:py-16 space-y-8">
      <div>
        <span className="text-xs font-bold uppercase tracking-[0.25em] text-[#C5A059]">Legal &amp; Policy</span>
        <h1 className="font-serif-title text-3xl sm:text-5xl font-bold text-[#0B241C]">
          Terms &amp; Conditions
        </h1>
        <p className="text-xs sm:text-sm text-[#5A7469] mt-1">Official E-Commerce Terms of Service</p>
      </div>

      <div className="bg-white p-6 sm:p-10 rounded-3xl border border-[#E2DBD0] shadow-sm space-y-6 text-xs sm:text-sm text-[#2C4A3E] leading-relaxed">
        {points.map((point) => (
          <div key={point.num} className="space-y-2 pb-6 border-b border-[#F0ECE4] last:border-b-0 last:pb-0">
            <h2 className="font-serif-title text-base sm:text-lg font-bold text-[#0B241C] flex items-center gap-2.5">
              <span className="inline-flex items-center justify-center w-7 h-7 rounded-full bg-[#FAF5EA] text-[#0C3B2E] border border-[#C5A059]/40 text-xs font-bold shrink-0">
                {point.num}
              </span>
              <span>{point.title}</span>
            </h2>
            <div className="pl-9.5 text-[#2C4A3E]">
              {point.content}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
