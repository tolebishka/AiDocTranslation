import { Link } from "react-router-dom";

const SHELL = "mx-auto w-full max-w-[min(768px,calc(100vw-1rem))] px-3 sm:px-4";

export function TermsOfUse() {
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
          Terms of Use
        </h1>
        <p className="mt-2 text-sm text-slate-500">Last updated: March 2025</p>

        <div className="mt-6 space-y-6 text-sm text-slate-700">
          <section>
            <h2 className="text-base font-semibold text-slate-800">
              Service as-is
            </h2>
            <p className="mt-2 leading-relaxed">
              AiDocTranslation is provided as-is. We offer OCR, MRZ extraction,
              and translation assistance for document images. Use the service at
              your own risk.
            </p>
          </section>

          <section>
            <h2 className="text-base font-semibold text-slate-800">
              Review your results
            </h2>
            <p className="mt-2 leading-relaxed">
              You are responsible for reviewing all extracted or translated data
              before using it. We do not guarantee perfect OCR or translation
              accuracy. Output may contain errors and should be verified manually
              before relying on it for important decisions.
            </p>
          </section>

          <section>
            <h2 className="text-base font-semibold text-slate-800">
              No legal certification
            </h2>
            <p className="mt-2 leading-relaxed">
              This service is not legal advice and does not constitute official
              legal certification unless explicitly stated. Do not rely on the
              output as a substitute for professional translation, verification,
              or legal authentication of documents.
            </p>
          </section>

          <section>
            <h2 className="text-base font-semibold text-slate-800">
              Prohibited use
            </h2>
            <p className="mt-2 leading-relaxed">
              You may not use the service for illegal purposes, to process
              documents you are not authorized to use, to abuse or attack our
              systems, or to violate any applicable laws. We may suspend or
              terminate access for violations.
            </p>
          </section>

          <section>
            <h2 className="text-base font-semibold text-slate-800">
              Limitation of liability
            </h2>
            <p className="mt-2 leading-relaxed">
              To the fullest extent permitted by law, we are not liable for any
              damages arising from your use of the service or reliance on its
              output. This includes but is not limited to errors in OCR or
              translation, data loss, or decisions made based on the results.
            </p>
          </section>

          <section>
            <h2 className="text-base font-semibold text-slate-800">
              Contact
            </h2>
            <p className="mt-2 leading-relaxed">
              For questions about these terms, please contact us at{" "}
              <a
                href="mailto:aitenovtolebi050@gmail.com"
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
