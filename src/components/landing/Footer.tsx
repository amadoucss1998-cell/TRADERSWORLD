import Link from 'next/link'
import { Zap } from 'lucide-react'

export default function Footer() {
  return (
    <footer className="border-t border-[#2a2a2a] bg-[#0d0d0d] py-16 px-6">
      <div className="max-w-7xl mx-auto">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-12 mb-12">
          <div>
            <Link href="/" className="flex items-center gap-2 mb-4">
              <div className="w-8 h-8 rounded-lg bg-[#7c3aed] flex items-center justify-center">
                <Zap className="w-4 h-4 text-white fill-white" />
              </div>
              <span className="text-white font-bold text-lg">TradeZella</span>
            </Link>
            <p className="text-[#71717a] text-sm">The trading journal that makes you a better trader.</p>
          </div>

          <div>
            <h4 className="text-white font-semibold text-sm mb-4">Product</h4>
            <ul className="space-y-2">
              {['Features', 'Pricing', 'Changelog', 'Roadmap'].map(l => (
                <li key={l}><Link href="#" className="text-[#71717a] hover:text-white text-sm transition-colors">{l}</Link></li>
              ))}
            </ul>
          </div>

          <div>
            <h4 className="text-white font-semibold text-sm mb-4">Company</h4>
            <ul className="space-y-2">
              {['About', 'Blog', 'Careers', 'Contact'].map(l => (
                <li key={l}><Link href="#" className="text-[#71717a] hover:text-white text-sm transition-colors">{l}</Link></li>
              ))}
            </ul>
          </div>

          <div>
            <h4 className="text-white font-semibold text-sm mb-4">Legal</h4>
            <ul className="space-y-2">
              {['Privacy Policy', 'Terms of Service', 'Cookie Policy'].map(l => (
                <li key={l}><Link href="#" className="text-[#71717a] hover:text-white text-sm transition-colors">{l}</Link></li>
              ))}
            </ul>
          </div>
        </div>

        <div className="border-t border-[#2a2a2a] pt-8">
          <p className="text-[#71717a] text-sm text-center">© 2024 TradeZella. All rights reserved.</p>
        </div>
      </div>
    </footer>
  )
}
