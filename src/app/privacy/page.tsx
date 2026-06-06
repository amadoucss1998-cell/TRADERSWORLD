import Link from 'next/link'

export default function PrivacyPage() {
  return (
    <div className="min-h-screen bg-[#0a0a0a] py-20 px-4">
      <div className="max-w-2xl mx-auto">
        <div className="mb-8">
          <Link href="/" className="text-green-500 hover:text-green-400 text-sm">← Back to ScholarPath</Link>
        </div>
        <h1 className="text-3xl font-bold text-white mb-2">Privacy Policy</h1>
        <p className="text-[#71717a] text-sm mb-10">Last updated: January 2026</p>

        <div className="space-y-8 text-[#a1a1aa] text-sm leading-relaxed">
          <section>
            <h2 className="text-white font-semibold text-base mb-3">1. Information We Collect</h2>
            <p>We collect information you provide directly to us when creating an account, including your name, email address, and profile information (academic background, field of study, GPA, etc.). This information is used solely to provide personalized scholarship recommendations and AI-generated essays.</p>
          </section>

          <section>
            <h2 className="text-white font-semibold text-base mb-3">2. How We Use Your Information</h2>
            <p>Your profile data is used to search for relevant scholarships and generate personalized application essays using Claude AI. We do not sell your personal information to third parties. We may use anonymized, aggregated data to improve our scholarship matching algorithms.</p>
          </section>

          <section>
            <h2 className="text-white font-semibold text-base mb-3">3. Data Storage</h2>
            <p>Your data is stored securely. When Supabase is configured, data is stored in encrypted databases. Authentication tokens are stored in httpOnly cookies and expire after 7 days. We implement industry-standard security measures to protect your information.</p>
          </section>

          <section>
            <h2 className="text-white font-semibold text-base mb-3">4. Third-Party Services</h2>
            <p>We use Claude AI (Anthropic) for scholarship matching and essay generation, and Tavily for scholarship search. These services process your anonymized profile data to provide results. Please review their respective privacy policies for more information.</p>
          </section>

          <section>
            <h2 className="text-white font-semibold text-base mb-3">5. Your Rights</h2>
            <p>You have the right to access, correct, or delete your personal information at any time. You may delete your account and all associated data by contacting us. We will process deletion requests within 30 days.</p>
          </section>

          <section>
            <h2 className="text-white font-semibold text-base mb-3">6. Contact</h2>
            <p>If you have questions about this Privacy Policy, please contact us. ScholarPath is built for Liberian students and is committed to protecting your privacy.</p>
          </section>
        </div>
      </div>
    </div>
  )
}
