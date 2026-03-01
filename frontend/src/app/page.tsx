"use client";

import { signIn, useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { motion } from "framer-motion";
import { Shield, Wrench, Bell, BarChart3, ChevronRight, Home, CheckCircle } from "lucide-react";
import "./page.css";

const features = [
  {
    icon: Home,
    title: "Multiple Properties",
    desc: "Track all your homes, rentals, and properties in one place.",
  },
  {
    icon: Wrench,
    title: "Appliance Tracking",
    desc: "Log every appliance with warranty dates, purchase history, and manuals.",
  },
  {
    icon: Bell,
    title: "Smart Reminders",
    desc: "Get notified before tasks are due — never miss an oil change or filter swap.",
  },
  {
    icon: BarChart3,
    title: "Cost Analytics",
    desc: "Visualize your annual maintenance spend and plan budgets with confidence.",
  },
];

export default function HomePage() {
  const { data: session, status } = useSession();
  const router = useRouter();

  useEffect(() => {
    if (session) router.push("/dashboard");
  }, [session, router]);

  if (status === "loading") return null;

  return (
    <div className="min-h-screen flex flex-col">
      {/* Nav */}
      <nav className="navbar">
        <div className="nav-brand">
          <div className="nav-logo">
            <Shield />
          </div>
          <span className="nav-title">HomeGuard</span>
        </div>
      </nav>

      {/* Hero */}
      <main className="hero">
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: "easeOut" }}
        >

          <h1 className="hero-title">
            Your home,{" "}
            <span className="gradient-text">always maintained</span>
          </h1>
          <p className="hero-subtitle">
            Track appliances, schedule maintenance, and get reminders before things break.
            Stop guessing — start knowing.
          </p>

          <button
            onClick={() => signIn("google")}
            className="cta-button"
          >
            <svg className="cta-button-icon" viewBox="0 0 24 24">
              <path fill="currentColor" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
              <path fill="currentColor" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
              <path fill="currentColor" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
              <path fill="currentColor" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
            </svg>
            Continue with Google
            <ChevronRight className="cta-button-icon" />
          </button>
        </motion.div>

        {/* Features grid */}
        <motion.div
          initial={{ opacity: 0, y: 32 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2, ease: "easeOut" }}
          className="features-grid"
        >
          {features.map((f) => (
            <div key={f.title} className="feature-card">
              <f.icon className="feature-icon" />
              <h3 className="feature-title">{f.title}</h3>
              <p className="feature-desc">{f.desc}</p>
            </div>
          ))}
        </motion.div>
      </main>

    </div>
  );
}
