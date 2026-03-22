import { Routes, Route } from "react-router-dom";
import { PrivacyPolicy } from "./pages/PrivacyPolicy";
import { TermsOfUse } from "./pages/TermsOfUse";
import { TranslatorWorkspace } from "./pages/TranslatorWorkspace";

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<TranslatorWorkspace />} />
      <Route path="/privacy" element={<PrivacyPolicy />} />
      <Route path="/terms" element={<TermsOfUse />} />
    </Routes>
  );
}
