import Head from "expo-router/head";

const APP_NAME = "Wealth";
const COMPANY_NAME = "Wealth";
const SUPPORT_EMAIL = "rushikeshbhor1629@gmail.com";
const DEVELOPER_NAME = "Rushikesh Bhor";
const EFFECTIVE_DATE = "19 November 2026";
const LAST_UPDATED = "19 November 2026";

export default function PrivacyPolicyPage() {
  return (
    <>
      <Head>
        <title>Privacy Policy | {APP_NAME}</title>
        <meta
          name="description"
          content={`Read the Privacy Policy for ${APP_NAME} and learn how we collect, use, and protect your personal information.`}
        />
      </Head>
      <main className="min-h-screen bg-gray-50 px-4 py-10 sm:px-6">
        <article className="mx-auto max-w-4xl rounded-xl bg-white p-6 shadow-sm sm:p-10">
          <header className="mb-8 border-b pb-6">
            <h1 className="text-3xl font-bold text-gray-900">Privacy Policy</h1>

            <p className="mt-3 text-sm text-gray-500">
              Effective Date: {EFFECTIVE_DATE}
            </p>
            <p className="text-sm text-gray-500">
              Last Updated: {LAST_UPDATED}
            </p>
          </header>

          <div className="space-y-7 text-sm leading-7 text-gray-700">
            <section>
              <h2 className="mb-2 text-lg font-semibold text-gray-900">
                1. Introduction
              </h2>
              <p>
                Welcome to {APP_NAME} (&quot;we&quot;, &quot;our&quot;, or
                &quot;us&quot;). We respect your privacy and are committed to
                protecting the personal information of users who access or use
                our mobile application.
              </p>
              <p className="mt-2">
                This Privacy Policy explains what information we collect, why we
                collect it, how we use it, and how you can contact us regarding
                your personal information.
              </p>
            </section>

            <section>
              <h2 className="mb-2 text-lg font-semibold text-gray-900">
                2. Information We Collect
              </h2>
              <p>
                When you register for an account or use our application, we may
                collect:
              </p>
              <ul className="mt-2 list-disc space-y-2 pl-6">
                <li>
                  <strong>Name:</strong> To identify your account and
                  personalize your experience.
                </li>
                <li>
                  <strong>Mobile Number:</strong> To identify your account,
                  support login or account verification, and communicate with
                  you.
                </li>
                <li>
                  <strong>Email Address:</strong> To identify your account,
                  communicate important information, and respond to support
                  requests.
                </li>
              </ul>
              <p className="mt-2">
                We collect information that you provide during registration,
                login, or while interacting with our application.
              </p>
            </section>

            <section>
              <h2 className="mb-2 text-lg font-semibold text-gray-900">
                3. How We Use Your Information
              </h2>
              <p>We use your information to:</p>
              <ul className="mt-2 list-disc space-y-2 pl-6">
                <li>Create and manage your user account.</li>
                <li>Authenticate users and provide account access.</li>
                <li>Identify users within the application.</li>
                <li>Provide application features and services.</li>
                <li>Send important account-related notifications.</li>
                <li>Respond to questions and support requests.</li>
                <li>Maintain, troubleshoot, and improve the application.</li>
                <li>Comply with applicable legal obligations.</li>
              </ul>
            </section>

            <section>
              <h2 className="mb-2 text-lg font-semibold text-gray-900">
                4. Data Sharing and Disclosure
              </h2>
              <p>
                We do not sell your personal information. We may share
                information with service providers who help us operate,
                maintain, or support the application, subject to appropriate
                safeguards.
              </p>
              <p className="mt-2">
                We may also disclose information when required by law, to
                protect users or our application, or in connection with a
                business transfer, subject to applicable legal requirements.
              </p>
            </section>

            <section>
              <h2 className="mb-2 text-lg font-semibold text-gray-900">
                5. Data Storage and Security
              </h2>
              <p>
                We take reasonable measures designed to protect personal
                information against unauthorized access, misuse, alteration, or
                disclosure.
              </p>
              <p className="mt-2">
                We retain personal information only for as long as necessary for
                the purposes described in this policy and to meet applicable
                legal obligations. No method of electronic storage or
                transmission can be guaranteed to be completely secure.
              </p>
            </section>

            <section>
              <h2 className="mb-2 text-lg font-semibold text-gray-900">
                6. Data Retention and Account Deletion
              </h2>
              <p>
                We retain your personal information for as long as your account
                remains active or as necessary to provide our services and
                fulfil legal obligations.
              </p>
              <p className="mt-2">
                You may request deletion of your account and associated personal
                information by contacting us at the email address below.
                Requests will be handled in accordance with applicable laws.
              </p>
            </section>

            <section>
              <h2 className="mb-2 text-lg font-semibold text-gray-900">
                7. User Rights and Choices
              </h2>
              <p>Subject to applicable law, you may request to:</p>
              <ul className="mt-2 list-disc space-y-2 pl-6">
                <li>Access your personal information.</li>
                <li>Correct inaccurate or incomplete information.</li>
                <li>Delete your personal information.</li>
                <li>Withdraw consent where processing is based on consent.</li>
                <li>Raise concerns about how your information is handled.</li>
              </ul>
            </section>

            <section>
              <h2 className="mb-2 text-lg font-semibold text-gray-900">
                8. Children&apos;s Privacy
              </h2>
              <p>
                Our application is not intended for children unless expressly
                stated otherwise. If we become aware that personal information
                has been collected from a child without appropriate
                authorization, we will take appropriate steps in accordance with
                applicable laws.
              </p>
            </section>

            <section>
              <h2 className="mb-2 text-lg font-semibold text-gray-900">
                9. Third-Party Services and Links
              </h2>
              <p>
                Our application may use third-party services or contain links to
                external websites. Those services may have their own privacy
                policies. We encourage users to review their privacy practices.
              </p>
            </section>

            <section>
              <h2 className="mb-2 text-lg font-semibold text-gray-900">
                10. Changes to This Privacy Policy
              </h2>
              <p>
                We may update this Privacy Policy to reflect changes in our
                application, business practices, or legal requirements. Updated
                versions will be published on this page with a revised date.
              </p>
            </section>

            <section>
              <h2 className="mb-2 text-lg font-semibold text-gray-900">
                11. Contact Us
              </h2>
              <p>
                For questions, concerns, or requests regarding this Privacy
                Policy, contact us:
              </p>

              <div className="mt-3 rounded-lg bg-gray-50 p-4">
                <p>
                  <strong>Application:</strong> {APP_NAME}
                </p>
                <p>
                  <strong>Developer / Owner:</strong> {DEVELOPER_NAME},{" "}
                  {COMPANY_NAME}
                </p>
                <p>
                  <strong>Grievance Officer:</strong> {DEVELOPER_NAME}
                </p>
                <p>
                  <strong>Developer and Grievance Officer Email:</strong>{" "}
                  <a
                    href={`mailto:${SUPPORT_EMAIL}`}
                    className="text-blue-600 underline"
                  >
                    {SUPPORT_EMAIL}
                  </a>
                </p>
              </div>
            </section>
          </div>

          <footer className="mt-10 border-t pt-5 text-center text-xs text-gray-500">
            © {new Date().getFullYear()} {APP_NAME}. All rights reserved.
          </footer>
        </article>
      </main>
    </>
  );
}
