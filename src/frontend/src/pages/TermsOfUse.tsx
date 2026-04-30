import { Link } from "react-router-dom";

const SHELL = "mx-auto w-full max-w-[min(768px,calc(100vw-1.25rem))] px-4 sm:px-6";

export function TermsOfUse() {
  return (
    <div className="min-h-screen pb-12">
      <header className="sticky top-0 z-10 border-b border-slate-200/70 bg-white/80 backdrop-blur-xl">
        <div className={`${SHELL} bg-mesh-header py-5`}>
          <Link to="/" className="inline-flex items-center gap-3 text-slate-900 transition hover:opacity-90">
            <span className="flex h-10 w-10 items-center justify-center rounded-2xl bg-gradient-to-br from-teal-400 to-teal-600 shadow-lg shadow-teal-500/25 ring-1 ring-white/50">
              <svg className="h-5 w-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden>
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                />
              </svg>
            </span>
            <span className="text-xl font-bold tracking-tight sm:text-2xl">
              AiDoc<span className="text-teal-600">Translation</span>
            </span>
          </Link>
        </div>
      </header>

      <main className={`${SHELL} py-8 sm:py-12`}>
        <div className="surface-card p-6 sm:p-8">
          <h1 className="text-xl font-bold text-slate-900 sm:text-2xl">Terms of Use</h1>
          <p className="mt-2 text-sm text-slate-500">Last updated: March 2025</p>

          <div className="mt-6 space-y-6 text-sm text-slate-700">
            <section>
              <h2 className="text-base font-semibold text-slate-800">Service as-is</h2>
              <p className="mt-2 leading-relaxed">
                AiDocTranslation is provided as-is. We offer OCR, MRZ extraction, and translation assistance for
                document images. Use the service at your own risk.
              </p>
            </section>

            <section>
              <h2 className="text-base font-semibold text-slate-800">Review your results</h2>
              <p className="mt-2 leading-relaxed">
                You are responsible for reviewing all extracted or translated data before using it. We do not
                guarantee perfect OCR or translation accuracy. Output may contain errors and should be verified
                manually before relying on it for important decisions.
              </p>
            </section>

            <section>
              <h2 className="text-base font-semibold text-slate-800">No legal certification</h2>
              <p className="mt-2 leading-relaxed">
                This service is not legal advice and does not constitute official legal certification unless
                explicitly stated. Do not rely on the output as a substitute for professional translation,
                verification, or legal authentication of documents.
              </p>
            </section>

            <section>
              <h2 className="text-base font-semibold text-slate-800">Prohibited use</h2>
              <p className="mt-2 leading-relaxed">
                You may not use the service for illegal purposes, to process documents you are not authorized to use,
                to abuse or attack our systems, or to violate any applicable laws. We may suspend or terminate access
                for violations.
              </p>
            </section>

            <section>
              <h2 className="text-base font-semibold text-slate-800">Limitation of liability</h2>
              <p className="mt-2 leading-relaxed">
                To the fullest extent permitted by law, we are not liable for any damages arising from your use of the
                service or reliance on its output. This includes but is not limited to errors in OCR or translation,
                data loss, or decisions made based on the results.
              </p>
            </section>

            <section>
              <h2 className="text-base font-semibold text-slate-800">Contact</h2>
              <p className="mt-2 leading-relaxed">
                For questions about these terms, please contact us at{" "}
                <a
                  href="mailto:aitenovtolebi050@gmail.com"
                  className="font-medium text-teal-700 underline-offset-2 hover:underline"
                >
                  aitenovtolebi05@gmail.com
                </a>
              </p>
            </section>
          </div>

          <p className="mt-8 border-t border-slate-100 pt-6 text-sm">
            <Link to="/" className="font-semibold text-teal-700 transition hover:text-teal-800">
              ← Назад в приложение
            </Link>
          </p>
        </div>
      </main>
    </div>
  );
}
