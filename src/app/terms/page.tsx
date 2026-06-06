import Link from 'next/link'

export default function TermsPage() {
  return (
    <div className="min-h-screen bg-[#0a0a0a] py-20 px-4">
      <div className="max-w-2xl mx-auto">
        <div className="mb-8">
          <Link href="/" className="text-green-500 hover:text-green-400 text-sm">← Back to ScholarPath</Link>
        </div>
        <h1 className="text-3xl font-bold text-white mb-2">Terms of Service</h1>
        <p className="text-[#71717a] text-sm mb-10">Last updated: January 2026</p>

        <div className="space-y-8 text-[#a1a1aa] text-sm leading-relaxed">
          <section>
            <h2 className="text-white font-semibold text-base mb-3">1. Acceptance of Terms</h2>
            <p>By using ScholarPath, you agree to these Terms of Service. ScholarPath is a free tool designed to help Liberian students find and apply for international scholarships using AI assistance.</p>
          </section>

          <section>
            <h2 className="text-white font-semibold text-base mb-3">2. Use of the Service</h2>
            <p>ScholarPath is provided for personal, non-commercial use. You agree to use the service only to search for legitimate scholarship opportunities and to create authentic scholarship application materials. You must not use the service to generate misleading or fraudulent application content.</p>
          </section>

          <section>
            <h2 className="text-white font-semibold text-base mb-3">3. AI-Generated Content</h2>
            <p>ScholarPath uses Claude AI to help generate essay drafts and scholarship matches. AI-generated content is provided as a starting point and should be reviewed, personalized, and verified by you before submission. You are responsible for the accuracy and authenticity of your scholarship applications.</p>
          </section>

          <section>
            <h2 className="text-white font-semibold text-base mb-3">4. Scholarship Information</h2>
            <p>Scholarship information is sourced via Tavily web search and AI analysis. While we strive for accuracy, ScholarPath does not guarantee the accuracy, completeness, or availability of any scholarship listed. Always verify scholarship details on the official scholarship website before applying.</p>
          </section>

          <section>
            <h2 className="text-white font-semibold text-base mb-3">5. Account Responsibility</h2>
            <p>You are responsible for maintaining the security of your account credentials. You agree to notify us immediately of any unauthorized use of your account. ScholarPath is not liable for any loss resulting from unauthorized account access.</p>
          </section>

          <section>
            <h2 className="text-white font-semibold text-base mb-3">6. Limitation of Liability</h2>
            <p>ScholarPath is provided &ldquo;as is&rdquo; without warranties of any kind. We are not responsible for scholarship outcomes, application results, or decisions made by scholarship providers. Use of ScholarPath does not guarantee scholarship success.</p>
          </section>

          <section>
            <h2 className="text-white font-semibold text-base mb-3">7. Changes to Terms</h2>
            <p>We may update these terms from time to time. Continued use of ScholarPath after changes constitutes acceptance of the updated terms. We will notify users of significant changes via email when possible.</p>
          </section>
        </div>
      </div>
    </div>
  )
}
