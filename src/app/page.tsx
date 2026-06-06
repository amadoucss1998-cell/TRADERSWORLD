import Link from 'next/link'
import { ArrowRight, Search, PenLine, BarChart3, Bell, FileText, LayoutGrid, Check, Star } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { DemoSection } from '@/components/landing/DemoSection'

const FEATURES = [
  { icon: Search, title: 'Smart Search', desc: 'AI finds scholarships matched to your exact profile' },
  { icon: PenLine, title: 'Essay Writer', desc: 'Claude writes personalized essays for each scholarship' },
  { icon: BarChart3, title: 'Match Scoring', desc: 'See exactly why you match each scholarship' },
  { icon: Bell, title: 'Deadline Tracker', desc: 'Never miss a deadline with visual reminders' },
  { icon: FileText, title: 'CV Generator', desc: 'Generate a professional academic CV instantly' },
  { icon: LayoutGrid, title: 'Application Tracker', desc: 'Manage all your applications in one place' },
]

const TESTIMONIALS = [
  {
    name: 'Amara Kamara',
    role: 'Masters Student, UK',
    text: 'ScholarPath helped me find the Commonwealth Scholarship and write my essay. I got accepted within 3 months!',
    rating: 5,
  },
  {
    name: 'Joseph Kollie',
    role: 'Undergraduate, Germany',
    text: 'The AI essay writer is incredible. It understood my background and wrote something truly authentic.',
    rating: 5,
  },
  {
    name: 'Fatu Sheriff',
    role: 'PhD Applicant, Canada',
    text: 'I applied for 12 scholarships using ScholarPath. The match scoring saved me so much time.',
    rating: 5,
  },
]


export default function LandingPage() {
  return (
    <div className="min-h-screen bg-[#0a0a0a]">
      {/* Navbar */}
      <nav className="fixed top-0 left-0 right-0 z-50 border-b border-[#1f1f1f] bg-[#0a0a0a]/90 backdrop-blur-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-2">
              <span className="text-2xl">🎓</span>
              <span className="text-xl font-bold text-white">ScholarPath</span>
            </div>
            <div className="hidden md:flex items-center gap-8">
              <a href="#features" className="text-sm text-[#a1a1aa] hover:text-white transition-colors">Features</a>
              <a href="#how-it-works" className="text-sm text-[#a1a1aa] hover:text-white transition-colors">How It Works</a>
              <a href="#demo" className="text-sm text-green-400 hover:text-green-300 font-medium transition-colors">✨ Try Demo</a>
            </div>
            <div className="flex items-center gap-3">
              <Link href="/login">
                <Button variant="ghost" size="sm">Sign In</Button>
              </Link>
              <Link href="/register">
                <Button size="sm">Get Started Free</Button>
              </Link>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section className="pt-32 pb-20 px-4">
        <div className="max-w-4xl mx-auto text-center">
          <Badge variant="secondary" className="mb-6 text-sm px-4 py-1.5">
            🌍 Built for Liberian Students
          </Badge>
          <h1 className="text-5xl sm:text-6xl font-bold text-white leading-tight mb-6">
            Find Scholarships.<br />
            Write Essays.<br />
            <span className="text-green-500">Change Your Future.</span>
          </h1>
          <p className="text-lg text-[#a1a1aa] mb-10 max-w-2xl mx-auto leading-relaxed">
            AI-powered scholarship search and essay writing for Liberian students seeking opportunities worldwide. Let Claude find and apply for scholarships that match your exact profile.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/register">
              <Button size="lg" className="gap-2 px-8">
                Find My Scholarships <ArrowRight className="h-5 w-5" />
              </Button>
            </Link>
            <a href="#how-it-works">
              <Button variant="outline" size="lg" className="px-8">
                See How It Works
              </Button>
            </a>
          </div>
        </div>
      </section>

      {/* Stats */}
      <section className="py-12 border-y border-[#1f1f1f]">
        <div className="max-w-5xl mx-auto px-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            {[
              { value: '500+', label: 'Scholarships Found' },
              { value: '1,000+', label: 'Essays Generated' },
              { value: '50+', label: 'Countries' },
              { value: 'Free', label: 'To Start' },
            ].map(stat => (
              <div key={stat.label} className="text-center">
                <div className="text-3xl font-bold text-green-500 mb-1">{stat.value}</div>
                <div className="text-sm text-[#a1a1aa]">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features */}
      <section id="features" className="py-20 px-4">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-white mb-4">Everything You Need to Win Scholarships</h2>
            <p className="text-[#a1a1aa] max-w-xl mx-auto">From finding opportunities to writing winning essays — ScholarPath handles the entire scholarship journey.</p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {FEATURES.map(feature => (
              <Card key={feature.title} className="hover:border-green-600/40 transition-colors">
                <CardContent className="p-6">
                  <div className="w-10 h-10 rounded-lg bg-green-600/10 border border-green-600/20 flex items-center justify-center mb-4">
                    <feature.icon className="h-5 w-5 text-green-500" />
                  </div>
                  <h3 className="font-semibold text-white mb-2">{feature.title}</h3>
                  <p className="text-sm text-[#a1a1aa]">{feature.desc}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section id="how-it-works" className="py-20 px-4 bg-[#050505]">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-white mb-4">How It Works</h2>
            <p className="text-[#a1a1aa]">Three simple steps from profile to acceptance letter</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              { step: '1', title: 'Build Your Profile', desc: 'Enter your academic background, achievements, and goals. Takes less than 10 minutes.' },
              { step: '2', title: 'Search & Match', desc: 'AI searches hundreds of scholarships and ranks them by your match score and eligibility.' },
              { step: '3', title: 'Write & Apply', desc: 'Claude writes personalized essays for each scholarship. Edit, improve, and submit.' },
            ].map(item => (
              <div key={item.step} className="text-center">
                <div className="w-14 h-14 rounded-full bg-green-600 text-white text-xl font-bold flex items-center justify-center mx-auto mb-4">
                  {item.step}
                </div>
                <h3 className="font-semibold text-white mb-2">{item.title}</h3>
                <p className="text-sm text-[#a1a1aa]">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Interactive Demo */}
      <DemoSection />

      {/* Free CTA */}
      <section className="py-20 px-4">
        <div className="max-w-lg mx-auto">
          <Card className="border-green-600/40 bg-green-600/5">
            <CardContent className="p-8 text-center">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-green-600/20 border border-green-600/30 text-green-400 text-xs font-medium mb-4">
                100% Free
              </div>
              <h2 className="text-2xl font-bold text-white mb-2">Everything is Free</h2>
              <p className="text-[#a1a1aa] text-sm mb-6">Unlimited scholarship searches, essay generation, CV builder, and application tracking — all free, no credit card needed.</p>
              <ul className="space-y-2 mb-8 text-left">
                {['Unlimited scholarship searches', 'Unlimited AI essay generation', 'CV generator', 'Application tracker', 'Deadline reminders', 'Full analytics'].map(f => (
                  <li key={f} className="flex items-center gap-2 text-sm text-[#a1a1aa]">
                    <Check className="h-4 w-4 text-green-500 shrink-0" />
                    {f}
                  </li>
                ))}
              </ul>
              <Link href="/register">
                <Button size="lg" className="w-full gap-2">
                  Create Free Account <ArrowRight className="h-4 w-4" />
                </Button>
              </Link>
              <p className="text-xs text-[#71717a] mt-3">No credit card · No limits · Always free</p>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* Testimonials */}
      <section className="py-20 px-4 bg-[#050505]">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-white mb-4">Students Who Made It</h2>
            <p className="text-[#a1a1aa]">Real Liberian students who found scholarships with ScholarPath</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {TESTIMONIALS.map(t => (
              <Card key={t.name}>
                <CardContent className="p-6">
                  <div className="flex gap-1 mb-4">
                    {Array.from({ length: t.rating }).map((_, i) => (
                      <Star key={i} className="h-4 w-4 fill-green-500 text-green-500" />
                    ))}
                  </div>
                  <p className="text-sm text-[#a1a1aa] mb-4 leading-relaxed">&ldquo;{t.text}&rdquo;</p>
                  <div>
                    <div className="font-medium text-white text-sm">{t.name}</div>
                    <div className="text-xs text-[#71717a]">{t.role}</div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20 px-4">
        <div className="max-w-2xl mx-auto text-center">
          <h2 className="text-3xl font-bold text-white mb-4">Ready to Find Your Scholarship?</h2>
          <p className="text-[#a1a1aa] mb-8">Join hundreds of Liberian students already using ScholarPath to find and win international scholarships.</p>
          <Link href="/register">
            <Button size="lg" className="px-10 gap-2">
              Get Started Free <ArrowRight className="h-5 w-5" />
            </Button>
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-[#1f1f1f] py-8 px-4">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <span className="text-xl">🎓</span>
            <span className="font-semibold text-white">ScholarPath</span>
          </div>
          <p className="text-sm text-[#71717a]">
            Built for Liberian students, powered by Claude AI + Tavily Search.
          </p>
          <div className="flex gap-6">
            <Link href="/privacy" className="text-sm text-[#71717a] hover:text-white transition-colors">Privacy</Link>
            <Link href="/terms" className="text-sm text-[#71717a] hover:text-white transition-colors">Terms</Link>
          </div>
        </div>
      </footer>
    </div>
  )
}
