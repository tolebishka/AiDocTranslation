import { Link } from "react-router-dom";

const SHELL = "mx-auto w-full max-w-[min(768px,calc(100vw-1rem))] px-3 sm:px-4";

export function PrivacyPolicy() {
  return (
    <div className="min-h-screen bg-slate-100/80">
      <header className="border-b border-slate-200 bg-white">
        <div className={`${SHELL} py-4 sm:py-5`}>
          <Link
            to="/"
            className="text-2xl font-bold tracking-tight text-slate-900 hover:text-indigo-600 sm:text-3xl"
          >
            AiDocTranslation
          </Link>
        </div>
      </header>

      <main className={`${SHELL} py-8 sm:py-10`}>
        <h1 className="text-xl font-bold text-slate-900 sm:text-2xl">
          Privacy Policy
        </h1>
        <p className="mt-2 text-sm text-slate-500">Last updated: March 2025</p>

        <div className="mt-6 space-y-6 text-sm text-slate-700">
          <section>
            <h2 className="text-base font-semibold text-slate-800">
              What data you provide
            </h2>
            <p className="mt-2 leading-relaxed">
              When you use our document-processing service, you upload document
              images (e.g., passport scans) for OCR, MRZ extraction, and
              translation assistance. We process these files to produce machine-readable
              text and translated fields.
            </p>
          </section>

          <section>
            <h2 className="text-base font-semibold text-slate-800">
              Technical metadata
            </h2>
            <p className="mt-2 leading-relaxed">
              We may collect technical metadata to operate and improve the service,
              including request identifiers, file size, MIME type, timestamps,
              and error codes. This metadata does not include the contents of
              your documents.
            </p>
          </section>

          <section>
            <h2 className="text-base font-semibold text-slate-800">
              Temporary processing and retention
            </h2>
            <p className="mt-2 leading-relaxed">
              Uploaded files are processed temporarily for your request only. We
              automatically delete files after a short retention period and do
              not intentionally store documents longer than necessary to complete
              the processing.
            </p>
          </section>

          <section>
            <h2 className="text-base font-semibold text-slate-800">
              Your responsibility
            </h2>
            <p className="mt-2 leading-relaxed">
              Please only upload documents that you are authorized to use. Do not
              upload documents containing sensitive personal information of others
              without their consent or legal basis.
            </p>
          </section>

          <section>
            <h2 className="text-base font-semibold text-slate-800">
              Contact
            </h2>
            <p className="mt-2 leading-relaxed">
              For questions about this policy or your data, please contact us at{" "}
              <a
                href="mailto:aitenovtolebi05@gmail.com"
                className="text-indigo-600 hover:underline"
              >
                aitenovtolebi05@gmail.com
              </a>
            </p>
          </section>
        </div>

        <p className="mt-8 text-xs text-slate-400">
          <Link to="/" className="hover:text-slate-600">
            ← Back to app
          </Link>
        </p>
      </main>
    </div>
  );
}
