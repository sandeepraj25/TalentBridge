import {
    ArrowUpRight,
    Database,
    FileText,
    Lock,
    Mail,
    ShieldCheck,
    UserCheck,
  } from "lucide-react";
  
  const CONTACT_EMAIL = "support@talenthain.com";
  
  const ADDRESS = "Payal Flats, Vasna, Ahmedabad, Gujarat, India";
  
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
          {/* Section heading */}
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
  
          {/* Content */}
          <div className="max-w-3xl space-y-5 text-[15px] leading-7 text-slate-600">
            {children}
          </div>
        </div>
      </section>
    );
  }
  
  function BulletList({ children }: { children: React.ReactNode }) {
    return (
      <ul className="space-y-2.5 pl-5 list-disc marker:text-slate-400">
        {children}
      </ul>
    );
  }
  
  export default function Privacy() {
    return (
      <main className="bg-white">
        {/* Header */}
        <section className="border-b border-slate-200 bg-slate-50/60">
          <div className="container-page py-14 sm:py-16">
            <div className="mx-auto max-w-5xl">
              <p className="text-sm font-medium text-blue-600">
                Legal & Privacy
              </p>
  
              <h1 className="mt-3 font-display text-4xl font-semibold tracking-tight text-slate-900 sm:text-5xl">
                Privacy Policy
              </h1>
  
              <p className="mt-5 max-w-2xl text-base leading-7 text-slate-600">
                This Privacy Policy explains how Talent Hai collects, uses,
                protects, and handles information when you use our website and
                services.
              </p>
  
              <p className="mt-4 text-sm text-slate-500">
                Last updated: September 21, 2026
              </p>
            </div>
          </div>
        </section>
  
        {/* Policy */}
        <div className="container-page">
          <div className="mx-auto max-w-5xl">
            
            <PolicySection
              number="01"
              title="Information We Collect"
              icon={<Database className="h-4 w-4" />}
            >
              <p>
                Depending on how you use Talent Hai, we may collect information
                such as your name, email address, mobile number, location,
                professional information, resume or profile information, company
                information, job details, account credentials, and information
                you voluntarily provide to us.
              </p>
  
              <p>
                When you use our website, we may also receive technical
                information such as IP address, browser type, device information,
                operating system, pages visited, and information about how you
                interact with the website.
              </p>
  
              <p>
                If you make a payment for a Talent Hai service, we may receive
                transaction-related information such as payment status,
                transaction reference, amount, date, and payment method.
              </p>
            </PolicySection>
  
            <PolicySection
              number="02"
              title="How We Use Your Information"
              icon={<FileText className="h-4 w-4" />}
            >
              <p>We may use your information to:</p>
  
              <BulletList>
                <li>Create and manage your Talent Hai account.</li>
                <li>Provide job-seeker and recruitment services.</li>
                <li>Allow candidates to apply for jobs.</li>
                <li>Allow recruiters to publish and manage job openings.</li>
                <li>Process subscriptions, packages, credits, and payments.</li>
                <li>Provide customer and technical support.</li>
                <li>Verify accounts and prevent fraud or misuse.</li>
                <li>Maintain the security and reliability of the platform.</li>
                <li>Improve our website, products, and user experience.</li>
                <li>Comply with applicable legal and regulatory requirements.</li>
              </BulletList>
            </PolicySection>
  
            <PolicySection
              number="03"
              title="Payment Information"
              icon={<Lock className="h-4 w-4" />}
            >
              <p>
                Payments for paid Talent Hai services may be processed through
                third-party payment service providers, including Razorpay.
              </p>
  
              <p>
                Talent Hai does not intentionally collect or store complete
                debit card numbers, credit card numbers, CVV/CVC codes, PINs,
                passwords, or other sensitive payment credentials on its own
                servers.
              </p>
  
              <p>
                Payment details are processed by the relevant payment service
                provider in accordance with its applicable terms and privacy
                practices.
              </p>
  
              <p>
                We may retain transaction information required for order
                management, payment reconciliation, customer support, refunds,
                disputes, accounting, fraud prevention, and legal or regulatory
                requirements.
              </p>
            </PolicySection>
  
            <PolicySection
              number="04"
              title="Sharing of Information"
              icon={<ShieldCheck className="h-4 w-4" />}
            >
              <p>
                We do not sell your personal information to third parties.
              </p>
  
              <p>
                We may share information with service providers and business
                partners where reasonably necessary to operate Talent Hai,
                provide services, process payments, maintain security, or comply
                with legal obligations.
              </p>
  
              <BulletList>
                <li>Payment service providers, including Razorpay.</li>
                <li>Hosting, infrastructure, and technology providers.</li>
                <li>Communication and customer-support service providers.</li>
                <li>Professional advisers where necessary.</li>
                <li>Government or law-enforcement authorities where legally required.</li>
              </BulletList>
            </PolicySection>
  
            <PolicySection
              number="05"
              title="Candidate and Recruiter Information"
              icon={<UserCheck className="h-4 w-4" />}
            >
              <p>
                Candidates may provide information such as resumes, education,
                skills, work experience, contact details, and other professional
                information when creating profiles or applying for jobs.
              </p>
  
              <p>
                Recruiters may provide company information, job descriptions,
                hiring requirements, recruiter details, and other information
                required to manage job postings.
              </p>
  
              <p>
                Information shared as part of a job application may be made
                available to the relevant recruiter or employer for recruitment
                purposes.
              </p>
            </PolicySection>
  
            <PolicySection
              number="06"
              title="Cookies and Similar Technologies"
              icon={<Database className="h-4 w-4" />}
            >
              <p>
                Talent Hai may use cookies and similar technologies to maintain
                sessions, remember preferences, understand website usage, improve
                functionality, and help protect our services.
              </p>
  
              <p>
                You can control cookies through your browser settings. Disabling
                certain cookies may affect some features of the website.
              </p>
            </PolicySection>
  
            <PolicySection
              number="07"
              title="Data Security"
              icon={<Lock className="h-4 w-4" />}
            >
              <p>
                We use reasonable technical and organisational measures designed
                to protect information against unauthorized access, alteration,
                disclosure, or destruction.
              </p>
  
              <p>
                However, no method of transmission or electronic storage is
                completely secure. We therefore cannot guarantee absolute
                security of information transmitted to or stored by our
                services.
              </p>
            </PolicySection>
  
            <PolicySection
              number="08"
              title="Data Retention"
              icon={<Database className="h-4 w-4" />}
            >
              <p>
                We retain personal information for as long as reasonably
                necessary to provide our services, maintain business and
                transaction records, resolve disputes, enforce agreements, and
                comply with applicable legal or regulatory requirements.
              </p>
            </PolicySection>
  
            <PolicySection
              number="09"
              title="Your Choices and Rights"
              icon={<UserCheck className="h-4 w-4" />}
            >
              <p>
                Depending on applicable law, you may have rights relating to
                access, correction, updating, or deletion of certain personal
                information.
              </p>
  
              <p>
                You may contact us if you believe information associated with
                your account is inaccurate or if you have a privacy-related
                request.
              </p>
            </PolicySection>
  
            <PolicySection
              number="10"
              title="Account Security"
              icon={<ShieldCheck className="h-4 w-4" />}
            >
              <p>
                You are responsible for keeping your account credentials
                confidential and for taking reasonable steps to prevent
                unauthorized access to your account.
              </p>
  
              <p>
                If you believe that your account has been accessed without
                authorization, please contact us as soon as possible.
              </p>
            </PolicySection>
  
            <PolicySection
              number="11"
              title="Third-Party Services"
              icon={<ArrowUpRight className="h-4 w-4" />}
            >
              <p>
                Talent Hai may use third-party services for payment processing,
                hosting, analytics, communication, authentication, and other
                operational purposes.
              </p>
  
              <p>
                Third-party services may process information according to their
                own terms and privacy policies. We encourage users to review
                those policies where applicable.
              </p>
            </PolicySection>
  
            <PolicySection
              number="12"
              title="Children's Privacy"
              icon={<UserCheck className="h-4 w-4" />}
            >
              <p>
                Talent Hai is intended for users who are legally permitted to
                use employment and recruitment services. We do not knowingly
                collect personal information from children in violation of
                applicable law.
              </p>
            </PolicySection>
  
            <PolicySection
              number="13"
              title="Changes to This Privacy Policy"
              icon={<FileText className="h-4 w-4" />}
            >
              <p>
                We may update this Privacy Policy from time to time to reflect
                changes in our services, legal requirements, or business
                practices.
              </p>
  
              <p>
                Any updated version will be published on this page with a
                revised "Last updated" date.
              </p>
            </PolicySection>
  
            <PolicySection
              number="14"
              title="Contact and Grievance"
              icon={<Mail className="h-4 w-4" />}
            >
              <p>
                If you have questions, concerns, or requests regarding this
                Privacy Policy or the handling of your personal information,
                please contact us.
              </p>
  
              <div className="rounded-xl border border-slate-200 bg-slate-50 p-5">
                <p className="text-sm font-medium text-slate-900">
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
  
        {/* Footer note */}
        <section className="border-t border-slate-200 bg-slate-50">
          <div className="container-page py-10">
            <div className="mx-auto max-w-5xl">
              <p className="text-sm leading-6 text-slate-500">
                This Privacy Policy should be read together with the Terms of
                Service, Refund Policy, and other applicable policies of Talent
                Hai.
              </p>
            </div>
          </div>
        </section>
      </main>
    );
  }