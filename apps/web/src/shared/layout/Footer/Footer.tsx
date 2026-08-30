"use client"
import Link from "next/link";
import {
  Globe,
  MessageCircle,
  Camera,
  Briefcase,
  Play,
  Mail,
  Phone,
  MapPin,
  GraduationCap,
  Home,
  BookOpen,
  Search,
  Users,
  User,
  Send,
} from "lucide-react";
import { Input } from "@repo/ui/input";
import { Button } from "@repo/ui/button";
import { useState } from "react";
import { usePathname } from "next/navigation";
import { ThemeToggle } from "@/features/theme/ThemeToggle";

const Footer = () => {
  const url = usePathname();
  const [email, setEmail] = useState("");
  const [subscribed, setSubscribed] = useState(false);

  const handleSubscribe = (e: React.FormEvent) => {
    e.preventDefault();
    if (email) {
      setSubscribed(true);
      setEmail("");
      setTimeout(() => setSubscribed(false), 4000);
    }
  };

  const quickLinks = [
    { label: "Home", href: "/" },
    { label: "Courses", href: "/courses" },
    { label: "Blog", href: "/blog" },
    { label: "About Us", href: "/about" },
    { label: "Contact", href: "/contact" },
    { label: "FAQ", href: "/faq" },
  ];

  const categories = [
    { label: "Web Development", href: "/courses" },
    { label: "UI/UX Design", href: "/courses" },
    { label: "Data Science", href: "/courses" },
    { label: "Digital Marketing", href: "/courses" },
    { label: "Mobile Development", href: "/courses" },
    { label: "Graphic Design", href: "/courses" },
  ];

  const mobileNav = [
    { icon: Home, label: "Home", href: "/" },
    { icon: BookOpen, label: "Courses", href: "/courses" },
    { icon: Search, label: "Search", href: "/courses?search=1" },
    { icon: Users, label: "Instructors", href: "/our-instructor" },
    { icon: User, label: "Profile", href: "/profile" },
  ];

  return (
    <>
      {/* ── Mobile Bottom Navigation ──────────────────────────── */}
      <div className="lg:hidden fixed bottom-0 left-0 right-0 z-50 bg-white/95 dark:bg-gray-900/95 backdrop-blur border-t border-gray-100 dark:border-gray-800">
        <div className="grid grid-cols-5 gap-1 px-2 py-1.5">
          {mobileNav.map(({ icon: Icon, label, href }) => (
            <Link
              key={label}
              href={href}
              className={`flex flex-col items-center justify-center py-1.5 px-1 text-[10px] font-semibold transition-colors gap-0.5 ${
                url === href
                  ? "text-brand-600"
                  : "text-gray-400 hover:text-brand-500"
              }`}
            >
              <Icon className="w-5 h-5" />
              {label}
            </Link>
          ))}
        </div>
      </div>

      {/* ── Desktop Footer ────────────────────────────────────── */}
      <footer className="hidden lg:block bg-gray-950 text-white">

        {/* Newsletter Banner */}
        <div className="border-b border-gray-800">
          <div className="container mx-auto px-4 py-10">
            <div className="flex flex-col md:flex-row items-center justify-between gap-6">
              <div>
                <h3 className="text-xl font-extrabold text-white mb-1">
                  Stay updated with{" "}
                  <span className="bg-gradient-to-r from-brand-400 to-pink-400 bg-clip-text text-transparent">
                    LearnHub
                  </span>
                </h3>
                <p className="text-gray-400 text-sm">
                  Get the latest courses, tips, and offers delivered to your inbox.
                </p>
              </div>
              <form onSubmit={handleSubscribe} className="flex gap-2 w-full md:w-auto">
                <Input
                  type="email"
                  placeholder="Enter your email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="bg-gray-800 border-gray-700 text-white placeholder:text-gray-500 rounded-xl focus-visible:ring-brand-500 w-full md:w-64"
                />
                <Button
                  type="submit"
                  className="bg-gradient-to-r from-brand-600 to-pink-500 text-white rounded-xl px-5 hover:opacity-90 shrink-0 gap-2"
                >
                  {subscribed ? "Subscribed!" : (
                    <>
                      <Send className="w-4 h-4" />
                      Subscribe
                    </>
                  )}
                </Button>
              </form>
            </div>
          </div>
        </div>

        {/* Main Footer Grid */}
        <div className="container mx-auto px-4 py-14">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-10">

            {/* Brand */}
            <div className="space-y-5">
              <Link href="/" className="flex items-center gap-2">
                <div className="w-9 h-9 bg-gradient-to-br from-brand-600 to-pink-500 rounded-xl flex items-center justify-center">
                  <GraduationCap className="w-5 h-5 text-white" />
                </div>
                <span className="text-xl font-extrabold bg-gradient-to-r from-brand-400 to-pink-400 bg-clip-text text-transparent">
                  LearnHub
                </span>
              </Link>
              <p className="text-gray-400 text-sm leading-relaxed">
                One of the leading online learning platforms, committed to making quality education accessible to everyone. 200+ expert-led courses across development, design, marketing, and more.
              </p>
              {/* Socials */}
              <div className="flex items-center gap-2">
                {[
                  { icon: Globe, color: "hover:bg-blue-600" },
                  { icon: MessageCircle, color: "hover:bg-sky-500" },
                  { icon: Camera, color: "hover:bg-pink-600" },
                  { icon: Briefcase, color: "hover:bg-blue-700" },
                  { icon: Play, color: "hover:bg-red-600" },
                ].map(({ icon: Icon, color }, i) => (
                  <button
                    key={i}
                    className={`w-9 h-9 rounded-xl bg-gray-800 flex items-center justify-center text-gray-400 hover:text-white transition-all ${color}`}
                  >
                    <Icon className="w-4 h-4" />
                  </button>
                ))}
              </div>
            </div>

            {/* Quick Links */}
            <div>
              <h4 className="font-bold text-white mb-5 text-sm uppercase tracking-wider">
                Quick Links
              </h4>
              <ul className="space-y-3">
                {quickLinks.map(({ label, href }) => (
                  <li key={href}>
                    <Link
                      href={href}
                      className="text-gray-400 hover:text-white text-sm transition-colors hover:translate-x-1 inline-flex items-center gap-1.5 group"
                    >
                      <span className="w-1 h-1 rounded-full bg-brand-500 opacity-0 group-hover:opacity-100 transition-opacity" />
                      {label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>

            {/* Categories */}
            <div>
              <h4 className="font-bold text-white mb-5 text-sm uppercase tracking-wider">
                Categories
              </h4>
              <ul className="space-y-3">
                {categories.map(({ label, href }) => (
                  <li key={label}>
                    <Link
                      href={href}
                      className="text-gray-400 hover:text-white text-sm transition-colors inline-flex items-center gap-1.5 group"
                    >
                      <span className="w-1 h-1 rounded-full bg-pink-500 opacity-0 group-hover:opacity-100 transition-opacity" />
                      {label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>

            {/* Contact */}
            <div>
              <h4 className="font-bold text-white mb-5 text-sm uppercase tracking-wider">
                Contact Us
              </h4>
              <div className="space-y-4">
                {[
                  { icon: MapPin, text: "123 Learning Street, Dhaka, Bangladesh" },
                  { icon: Phone, text: "+880 1700-000000" },
                  { icon: Mail, text: "hello@learnhub.com" },
                ].map(({ icon: Icon, text }) => (
                  <div key={text} className="flex items-start gap-3">
                    <div className="w-8 h-8 rounded-lg bg-gray-800 flex items-center justify-center shrink-0 mt-0.5">
                      <Icon className="w-4 h-4 text-brand-400" />
                    </div>
                    <span className="text-gray-400 text-sm leading-relaxed">{text}</span>
                  </div>
                ))}
              </div>

              {/* Stats row */}
              <div className="mt-6 grid grid-cols-2 gap-3">
                {[
                  { value: "56K+", label: "Students" },
                  { value: "200+", label: "Courses" },
                ].map(({ value, label }) => (
                  <div
                    key={label}
                    className="bg-gray-800 rounded-xl px-3 py-2.5 text-center"
                  >
                    <p className="text-base font-extrabold bg-gradient-to-r from-brand-400 to-pink-400 bg-clip-text text-transparent">
                      {value}
                    </p>
                    <p className="text-xs text-gray-500">{label}</p>
                  </div>
                ))}
              </div>
            </div>

          </div>
        </div>

        {/* Bottom Bar */}
        <div className="border-t border-gray-800">
          <div className="container mx-auto px-4 py-5 flex flex-col md:flex-row items-center justify-between gap-3 text-sm text-gray-500">
            <p>© 2024 LearnHub. All rights reserved.</p>
            <div className="flex items-center gap-5">
              {["Privacy Policy", "Terms of Service", "Cookie Policy"].map((item) => (
                <Link
                  key={item}
                  href="/about"
                  className="hover:text-white transition-colors"
                >
                  {item}
                </Link>
              ))}
              <ThemeToggle />
            </div>
          </div>
        </div>

      </footer>
    </>
  );
};

export default Footer;
