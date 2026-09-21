import {
    ArrowUpRight,
    CalendarDays,
    CheckCircle2,
    FileText,
    Mail,
    RefreshCcw,
    ShieldCheck,
  } from "lucide-react";
  
  const CONTACT_EMAIL = "support@talenthain.com";
  const ADDRESS = "Payal Flats, Vasna, Ahmedabad, Gujarat, India - 380007";
  
  type PolicySectionProps = {
    number: string;
    title: string;
    icon: React.ReactNode;
    children: React.ReactNode;
  };
  
  function PolicySection({
    number,
    title,
    icon,
    children,
  }: PolicySectionProps) {
    return (
      <section className="border-b border-slate-200 py-10 last:border-b-0 sm:py-12">
        <div className="grid gap-6 sm:grid-cols-[190px_1fr]">
          <div className="flex items-start gap-3">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-slate-100 text-slate-600">
              {icon}
            </div>
  
            <div>
              <p className="text-xs font-semibold tracking-widest text-slate-400">
                {number}
              </p>
  
              <h2 className="mt-1 text-lg font-semibold leading-7 text-slate-900">
                {title}
              </h2>
            </div>
          </div>
  
          <div className="max-w-3xl space-y-5 text-[15px] leading-7 text-slate-600">
            {children}
          </div>
        </div>
      </section>
    );
  }
  
  function BulletList({ children }: { children: React.ReactNode }) {
    return (
      <ul className="list-disc space-y-2.5 pl-5 marker:text-slate-400">
        {children}
      </ul>
    );
  }
  
  export default function RefundPolicy() {
    return (
      <main className="bg-white">
        {/* Header */}
        <section className="border-b border-slate-200 bg-slate-50/60">
          <div className="container-page py-14 sm:py-16">
            <div className="mx-auto max-w-5xl">
              <p className="text-sm font-medium text-blue-600">
                Legal & Payments
              </p>
  
              <h1 className="mt-3 font-display text-4xl font-semibold tracking-tight text-slate-900 sm:text-5xl">
                Refund Policy
              </h1>
  
              <p className="mt-5 max-w-2xl text-base leading-7 text-slate-600">
                This Refund Policy explains the terms under which customers may
                request a refund for paid services purchased through Talent Hai.
              </p>
  
              <p className="mt-4 text-sm text-slate-500">
                Last updated: September 21, 2026
              </p>
            </div>
          </div>
        </section>
  
        {/* Main Policy */}
        <div className="container-page">
          <div className="mx-auto max-w-5xl">
  
            {/* 01 */}
            <PolicySection
              number="01"
              title="7-Day Refund Policy"
              icon={<CalendarDays className="h-4 w-4" />}
            >
              <p>
                Talent Hai provides a <strong className="font-semibold text-slate-900">
                  7-day refund period
                </strong> for eligible paid services.
              </p>
  
              <p>
                If you are not satisfied with an eligible Talent Hai service,
                you may request a refund within 7 calendar days from the date
                of your payment.
              </p>
  
              <div className="rounded-xl border border-blue-100 bg-blue-50 p-5">
                <p className="font-semibold text-slate-900">
                  Refund window: 7 calendar days
                </p>
  
                <p className="mt-1 text-sm leading-6 text-slate-600">
                  The refund request must be submitted within 7 calendar days
                  from the original payment date.
                </p>
              </div>
            </PolicySection>
  
            {/* 02 */}
            <PolicySection
              number="02"
              title="Eligibility for Refund"
              icon={<CheckCircle2 className="h-4 w-4" />}
            >
              <p>
                To be eligible for a refund, the request must be submitted
                within the applicable 7-day refund period.
              </p>
  
              <p>Refund requests may be considered when:</p>
  
              <BulletList>
                <li>
                  The request is submitted within 7 calendar days of payment.
                </li>
                <li>
                  The purchased service has not been substantially used or
                  consumed, where applicable.
                </li>
                <li>
                  The payment can be identified and verified in our records.
                </li>
                <li>
                  The request is not related to fraudulent activity, misuse,
                  or violation of Talent Hai's terms.
                </li>
              </BulletList>
            </PolicySection>
  
            {/* 03 */}
            <PolicySection
              number="03"
              title="How to Request a Refund"
              icon={<Mail className="h-4 w-4" />}
            >
              <p>
                To request a refund, contact our support team using the email
                address below.
              </p>
  
              <div className="rounded-xl border border-slate-200 bg-slate-50 p-5">
                <p className="text-sm font-medium text-slate-900">
                  Refund Support
                </p>
  
                <a
                  href={`mailto:${CONTACT_EMAIL}`}
                  className="mt-2 inline-flex items-center gap-2 text-sm font-semibold text-blue-600 hover:text-blue-700"
                >
                  {CONTACT_EMAIL}
                  <ArrowUpRight className="h-4 w-4" />
                </a>
              </div>
  
              <p>
                Please include your registered email address, transaction or
                order reference, payment date, amount paid, and the reason for
                requesting the refund. This information helps us verify and
                process your request.
              </p>
            </PolicySection>
  
            {/* 04 */}
            <PolicySection
              number="04"
              title="Refund Processing"
              icon={<RefreshCcw className="h-4 w-4" />}
            >
              <p>
                Once a refund request is received, Talent Hai may review the
                transaction and verify whether the request meets the applicable
                refund conditions.
              </p>
  
              <p>
                If the refund is approved, we will initiate the refund to the
                original payment method used for the transaction, wherever
                supported by the payment provider.
              </p>
  
              <p>
                After the refund is initiated by Talent Hai, the time taken for
                the amount to appear in your account may depend on the payment
                gateway, bank, card network, or other financial institution.
              </p>
  
              <p>
                Razorpay states that once a refund is initiated, customers
                generally receive the credit within the applicable banking
                timelines, which can vary by payment method and bank.
              </p>
            </PolicySection>
  
            {/* 05 */}
            <PolicySection
              number="05"
              title="Non-Refundable Situations"
              icon={<ShieldCheck className="h-4 w-4" />}
            >
              <p>
                A refund may not be available in the following circumstances:
              </p>
  
              <BulletList>
                <li>
                  The refund request is submitted after the 7-day refund period.
                </li>
                <li>
                  The purchased service has already been substantially used or
                  consumed.
                </li>
                <li>
                  The account or service has been used for fraudulent, abusive,
                  or unlawful activity.
                </li>
                <li>
                  The request involves a violation of Talent Hai's Terms of
                  Service.
                </li>
                <li>
                  The transaction cannot be reasonably verified.
                </li>
                <li>
                  The refund has already been processed for the same transaction.
                </li>
              </BulletList>
            </PolicySection>
  
            {/* 06 */}
            <PolicySection
              number="06"
              title="Cancellation"
              icon={<FileText className="h-4 w-4" />}
            >
              <p>
                If you wish to cancel a paid service and request a refund,
                please contact Talent Hai as soon as possible.
              </p>
  
              <p>
                Cancellation does not automatically guarantee a refund. Refund
                eligibility will be determined according to the 7-day refund
                policy and the applicable service terms.
              </p>
            </PolicySection>
  
            {/* 07 */}
            <PolicySection
              number="07"
              title="Payment Gateway"
              icon={<ShieldCheck className="h-4 w-4" />}
            >
              <p>
                Payments on Talent Hai may be processed through third-party
                payment service providers such as Razorpay.
              </p>
  
              <p>
                Refunds initiated by Talent Hai are processed through the
                payment infrastructure used for the original transaction,
                subject to the payment provider's processing requirements.
              </p>
  
              <p>
                Razorpay's terms state that merchant-initiated refunds are
                routed to the same payment method through which the transaction
                was processed.
              </p>
            </PolicySection>
  
            {/* 08 */}
            <PolicySection
              number="08"
              title="Contact Us"
              icon={<Mail className="h-4 w-4" />}
            >
              <p>
                For refund requests or questions regarding this policy, please
                contact Talent Hai.
              </p>
  
              <div className="rounded-xl border border-slate-200 bg-slate-50 p-5">
                <p className="text-sm font-semibold text-slate-900">
                  Talent Hai
                </p>
  
                <a
                  href={`mailto:${CONTACT_EMAIL}`}
                  className="mt-2 inline-flex items-center gap-2 text-sm font-semibold text-blue-600 hover:text-blue-700"
                >
                  {CONTACT_EMAIL}
                  <ArrowUpRight className="h-4 w-4" />
                </a>
  
                <p className="mt-3 text-sm leading-6 text-slate-600">
                  {ADDRESS}
                </p>
              </div>
            </PolicySection>
  
          </div>
        </div>
  
        {/* Footer */}
        <section className="border-t border-slate-200 bg-slate-50">
          <div className="container-page py-10">
            <div className="mx-auto max-w-5xl">
              <p className="text-sm leading-6 text-slate-500">
                This Refund Policy should be read together with the Terms of
                Service and Privacy Policy of Talent Hai.
              </p>
            </div>
          </div>
        </section>
      </main>
    );
  }