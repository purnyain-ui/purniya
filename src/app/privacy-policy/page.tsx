import React from 'react';

export default function PrivacyPolicyPage() {
  const points = [
    {
      num: 1,
      title: 'Information We Collect',
      content: (
        <>
          <p>We may collect personal data necessary to provide our services and products, including:</p>
          <ul className="list-disc list-inside space-y-1 mt-2 text-[#0B241C] font-medium">
            <li>Name, mobile number, and email address</li>
            <li>Billing address and delivery/shipping address</li>
            <li>Order and transaction history</li>
            <li>Customer communications and support inquiries</li>
            <li>Website usage data collected via cookies and analytical tools</li>
          </ul>
        </>
      ),
    },
    {
      num: 2,
      title: 'Purpose of Collection & Use',
      content: (
        <p>
          We use personal data only for specific, explicit, and lawful purposes for which consent is obtained, including: processing and fulfilling orders; sending delivery updates and notifications; providing customer support; managing user accounts; detecting and preventing fraud; improving storefront experiences; complying with applicable legal requirements; and sending promotional communications where permitted.
        </p>
      ),
    },
    {
      num: 3,
      title: 'Consent & Withdrawal',
      content: (
        <p>
          Where consent is the basis for processing, it will be free, specific, informed, unconditional, and unambiguous, given through a clear affirmative action. You may withdraw consent at any time, with the same ease with which it was given, by submitting a request through customer support, without affecting the lawfulness of processing carried out prior to withdrawal.
        </p>
      ),
    },
    {
      num: 4,
      title: 'Sharing of Information',
      content: (
        <p>
          Purnya does not sell personal data to third parties for their independent commercial or marketing purposes. We share necessary data only with trusted partners and service providers who help operate our platform, including payment gateways, logistics and courier partners, cloud hosting services, and communication systems, strictly to the extent required for order fulfilment and platform security.
        </p>
      ),
    },
    {
      num: 5,
      title: 'Cross-Border Data Transfer',
      content: (
        <p>
          Where personal data is stored or processed by technology service providers located outside India, such transfers are conducted in compliance with the Digital Personal Data Protection Act, 2023 and any applicable government guidelines regarding permissible cross-border data transfer.
        </p>
      ),
    },
    {
      num: 6,
      title: 'Payment Information Security',
      content: (
        <p>
          All electronic payments are processed through authorised, PCI-DSS compliant payment gateways. Purnya does not collect, record, or store sensitive financial credentials such as card PINs, CVV numbers, OTPs, or UPI PINs on its servers.
        </p>
      ),
    },
    {
      num: 7,
      title: 'Cookies & Tracking Technologies',
      content: (
        <p>
          Purnya.in uses cookies and similar technologies to support website functionality, remember session preferences, analyze traffic, and enhance your browsing journey. You can manage or disable cookie preferences through your browser settings; disabling certain cookies may limit some features of the storefront.
        </p>
      ),
    },
    {
      num: 8,
      title: 'Data Retention',
      content: (
        <p>
          Personal data is retained only for as long as necessary to fulfill the purposes for which it was collected, including order delivery, warranty, taxation and audit compliance, dispute resolution, and fraud prevention. After the retention period concludes, data is safely deleted or anonymized.
        </p>
      ),
    },
    {
      num: 9,
      title: 'Rights of Data Principals',
      content: (
        <>
          <p>Under applicable data protection laws, customers hold the following rights:</p>
          <ul className="list-disc list-inside space-y-1 mt-2 text-[#0B241C] font-medium">
            <li>Right to access a summary of personal data processed</li>
            <li>Right to correction, completion, and updating of inaccurate data</li>
            <li>Right to erasure of personal data when no longer required for legal purposes</li>
            <li>Right to withdraw consent at any time</li>
            <li>Right to nominate a representative to exercise rights in the event of death or incapacity</li>
            <li>Right of grievance redressal regarding data handling practices</li>
          </ul>
          <p className="mt-2">
            To exercise any of these rights, requests can be submitted via our customer support channels. Valid requests are reviewed and fulfilled within statutory timelines.
          </p>
        </>
      ),
    },
    {
      num: 10,
      title: 'Children&apos;s Data',
      content: (
        <p>
          Purnya.in is intended for adult consumers and does not knowingly solicit or collect personal data from individuals under 18 years of age without verifiable parental or guardian authorization.
        </p>
      ),
    },
    {
      num: 11,
      title: 'Data Security & Breach Protocols',
      content: (
        <p>
          We implement industry-standard physical, technical, and operational safeguards to protect personal data against unauthorized access, alteration, disclosure, or destruction. In the unlikely event of a security breach affecting your data, notifications will be provided to affected users and regulatory authorities in accordance with applicable laws.
        </p>
      ),
    },
    {
      num: 12,
      title: 'Third-Party Links',
      content: (
        <p>
          Our platform may contain links to external third-party sites or services. Purnya is not responsible for the privacy practices, terms, or content of external websites. We encourage you to review their individual privacy policies.
        </p>
      ),
    },
    {
      num: 13,
      title: 'Changes to This Privacy Policy',
      content: (
        <p>
          We may revise this Privacy Policy periodically to reflect changes in our operational practices or legal requirements. Updated versions will be published directly on Purnya.in with an updated revision date.
        </p>
      ),
    },
  ];

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-10 sm:py-16 space-y-8">
      <div>
        <span className="text-xs font-bold uppercase tracking-[0.25em] text-[#C5A059]">Security &amp; Trust</span>
        <h1 className="font-serif-title text-3xl sm:text-5xl font-bold text-[#0B241C]">
          Privacy Policy
        </h1>
        <p className="text-xs sm:text-sm text-[#5A7469] mt-1">
          Digital Personal Data Protection &amp; Privacy Standards
        </p>
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
