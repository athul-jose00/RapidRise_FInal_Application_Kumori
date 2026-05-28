import { motion } from "framer-motion";
import {
  Cloud,
  Users,
  ShieldCheck,
  Play,
  FileText,
  FileSpreadsheet,
  Image as ImageIcon,
  Sparkles,
} from "lucide-react";
import {
  quickHighlights,
  features,
  workflowSteps,
  footerLinks,
  contactLinks,
} from "../../data/landingData.js";
import { Button, SectionHeading, classNames } from "./landingUtils.jsx";
import {
  AccessAnywhereMockup,
  EasyUploadMockup,
  PrivacyFirstMockup,
  SemanticSearchMockup,
  ShareSecurelyMockup,
  SmartTrashMockup,
} from "./FeatureMockups.jsx";

export function HeroSection({ sectionRef }) {
  return (
    <section
      ref={sectionRef}
      className="mx-auto w-[min(1220px,calc(100%-1.5rem))] pb-16 pt-12 sm:pb-20 sm:pt-16 lg:pb-24 lg:pt-20"
    >
      <div className="grid items-center gap-10 lg:grid-cols-[1.05fr_0.95fr] lg:gap-8">
        <div className="max-w-2xl">
          <motion.h1
            initial={{ opacity: 0, y: 22 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, ease: "easeOut" }}
            className="text-balance text-5xl font-extrabold leading-[1.05] tracking-tight text-neutral-900 sm:text-6xl lg:text-7xl"
          >
            Simple. Secure.
            <br />
            Share <span className="text-[#C62828]">Without Limits.</span>
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 18 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, ease: "easeOut", delay: 0.08 }}
            className="mt-6 text-lg font-medium leading-relaxed text-neutral-500 sm:text-xl"
          >
            Kumori makes file storage and sharing effortless, secure, and
            accessible from anywhere.
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 18 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, ease: "easeOut", delay: 0.16 }}
            className="mt-8 flex flex-wrap items-center gap-4"
          >
            <Button variant="accent" href="#/register">
              Get Started Free
            </Button>
            <a
              href="#dashboard"
              className="inline-flex items-center justify-center gap-2 rounded-full border border-[#C62828] bg-white px-5 py-2.5 text-sm font-semibold text-[#C62828] shadow-sm transition-all duration-200 hover:bg-red-50/50 hover:shadow"
            >
              <Play className="h-4 w-4 fill-current" />
              Watch Demo
            </a>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.22 }}
            className="mt-8 flex flex-wrap gap-x-6 gap-y-3.5 border-t border-neutral-100 pt-6"
          >
            <div className="flex items-center gap-2 text-sm font-medium text-neutral-500">
              <ShieldCheck className="h-4 w-4 text-[#C62828]" />
              End-to-end encrypted
            </div>
            <div className="flex items-center gap-2 text-sm font-medium text-neutral-500">
              <Cloud className="h-4 w-4 text-[#C62828]" />
              Access anywhere
            </div>
            <div className="flex items-center gap-2 text-sm font-medium text-neutral-500">
              <Users className="h-4 w-4 text-[#C62828]" />
              Share with anyone
            </div>
          </motion.div>
        </div>

        <div className="relative mx-auto flex w-full max-w-3xl items-center justify-center lg:pl-6">
          <div className="absolute inset-0 rounded-[3rem] bg-[radial-gradient(circle_at_center,rgba(255,183,172,0.4),transparent_68%)]" />
          <div className="relative w-full max-w-125 sm:max-w-140">
            <motion.img
              initial={{ opacity: 0, scale: 0.95, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              transition={{ duration: 0.8, ease: "easeOut" }}
              src="/kumori_mascot.png"
              alt="Kumori red panda mascot hugging a cloud upload button"
              className="relative z-10 w-full object-contain drop-shadow-[0_30px_70px_rgba(42,46,51,0.18)] animate-[float_6.5s_ease-in-out_infinite]"
            />
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.3 }}
              className="absolute -top-3 right-[18%] z-20 flex h-18 w-18 items-center justify-center rounded-2xl border border-neutral-100/80 bg-white/95 shadow-[0_12px_40px_rgba(0,0,0,0.07)] backdrop-blur-sm animate-[float_5.5s_ease-in-out_infinite] [animation-delay:1s]"
            >
              <div className="flex h-14 w-14 items-center justify-center rounded-xl bg-red-50 text-red-500">
                <FileText className="h-8 w-8" />
              </div>
            </motion.div>
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.4 }}
              className="absolute bottom-[22%] left-[4%] z-20 flex h-18 w-18 items-center justify-center rounded-2xl border border-neutral-100/80 bg-white/95 shadow-[0_12px_40px_rgba(0,0,0,0.07)] backdrop-blur-sm animate-[float_6s_ease-in-out_infinite] [animation-delay:2s]"
            >
              <div className="flex h-14 w-14 items-center justify-center rounded-xl bg-emerald-50 text-emerald-500">
                <FileSpreadsheet className="h-8 w-8" />
              </div>
            </motion.div>
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.5 }}
              className="absolute top-[18%] left-[2%] z-20 flex h-18 w-18 items-center justify-center rounded-2xl border border-neutral-100/80 bg-white/95 shadow-[0_12px_40px_rgba(0,0,0,0.07)] backdrop-blur-sm animate-[float_5.5s_ease-in-out_infinite] [animation-delay:1.5s]"
            >
              <div className="flex h-14 w-14 items-center justify-center rounded-xl bg-blue-50 text-blue-500">
                <FileText className="h-8 w-8" />
              </div>
            </motion.div>
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.6 }}
              className="absolute top-[32%] right-[2%] z-20 flex h-18 w-18 items-center justify-center rounded-2xl border border-neutral-100/80 bg-white/95 shadow-[0_12px_40px_rgba(0,0,0,0.07)] backdrop-blur-sm animate-[float_7s_ease-in-out_infinite] [animation-delay:0.5s]"
            >
              <div className="flex h-14 w-14 items-center justify-center rounded-xl bg-purple-50 text-purple-500">
                <ImageIcon className="h-8 w-8" />
              </div>
            </motion.div>
          </div>
        </div>
      </div>
    </section>
  );
}

export function HighlightsSection({ sectionRef }) {
  return (
    <section
      ref={sectionRef}
      className="mx-auto mb-16 w-[min(1220px,calc(100%-1.5rem))] py-4"
    >
      <div
        data-reveal
        className="rounded-[2.5rem] border border-neutral-100/60 bg-white px-8 py-12 shadow-[0_20px_50px_rgba(42,46,51,0.05)] sm:py-16"
      >
        <div className="grid gap-8 divide-y divide-neutral-100 sm:grid-cols-2 sm:divide-y-0 lg:grid-cols-4 lg:divide-x">
          {quickHighlights.map((item, idx) => (
            <div
              key={item.title}
              className={classNames(
                "group flex flex-col items-center px-6 text-center",
                idx > 0 && "pt-8 sm:pt-0 lg:pl-8",
              )}
            >
              <div className="mb-5 flex h-14 w-14 items-center justify-center rounded-2xl border border-[#FFB7AC]/35 bg-[#FFF5F5] text-[#C62828] shadow-sm transition-all duration-300 group-hover:scale-105 group-hover:border-[#C62828]/30 group-hover:bg-[#FFF2F2]">
                <item.icon className="h-6 w-6" />
              </div>
              <h3 className="text-xl font-bold tracking-tight text-neutral-900 sm:text-2xl">
                {item.title}
              </h3>
              <p className="mt-3.5 max-w-57.5 text-sm leading-relaxed text-neutral-500 sm:text-base">
                {item.description}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

export function FeaturesSection({ sectionRef }) {
  return (
    <section
      id="features"
      ref={sectionRef}
      className="mx-auto w-[min(1220px,calc(100%-1.5rem))] border-t border-neutral-100 py-18 sm:py-24"
    >
      <div
        data-reveal
        className="grid items-center gap-10 lg:grid-cols-[1.15fr_0.85fr]"
      >
        <SectionHeading
          eyebrow="FEATURES"
          title="Everything you need,"
          highlightText="built for the way you work."
          description="Kumori brings together powerful storage, seamless sharing, and top-tier security in one simple platform."
        />
        <div className="relative flex items-center justify-center lg:justify-end lg:pr-12 lg:-mt-6">
          <div className="absolute right-[10%] h-65 w-65 rounded-full bg-[radial-gradient(circle_at_center,rgba(255,183,172,0.22),transparent_70%)]" />
          <img
            src="/kumori_package.png"
            alt="Kumori red panda mascot using a laptop"
            className="relative z-10 h-56 w-auto object-contain drop-shadow-[0_12px_36px_rgba(42,46,51,0.09)] animate-[float_7.5s_ease-in-out_infinite] sm:h-64"
          />
        </div>
      </div>

      <div className="mt-12 grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {features.map((feature) => (
          <div key={feature.title} data-reveal>
            <div className="group flex h-full flex-col justify-between rounded-3xl border border-neutral-100/60 bg-white p-6 shadow-[0_12px_32px_rgba(42,46,51,0.03)] transition-all duration-300 hover:-translate-y-1 hover:border-neutral-200 hover:shadow-[0_20px_48px_rgba(42,46,51,0.08)] sm:p-7">
              <div>
                <div className="mb-4 flex h-10 w-10 items-center justify-center rounded-xl bg-[#FFB7AC]/15 text-[#C62828]">
                  <feature.icon className="h-5 w-5" />
                </div>
                <h3 className="text-lg font-bold tracking-tight text-neutral-900">
                  {feature.title}
                </h3>
                <p className="mt-2 text-xs leading-relaxed text-neutral-500">
                  {feature.description}
                </p>
              </div>

              <div className="mt-6 flex min-h-32.5 items-center justify-center rounded-2xl border-t border-neutral-50 bg-neutral-50/20 p-2.5 pt-4">
                {feature.type === "upload" && <EasyUploadMockup />}
                {feature.type === "share" && <ShareSecurelyMockup />}
                {feature.type === "privacy" && <PrivacyFirstMockup />}
                {feature.type === "access" && <AccessAnywhereMockup />}
                {feature.type === "search" && <SemanticSearchMockup />}
                {feature.type === "trash" && <SmartTrashMockup />}
              </div>
            </div>
          </div>
        ))}
      </div>

      <div data-reveal className="mt-16">
        <div className="relative overflow-hidden rounded-4xl border border-neutral-100 bg-[#FFF5F5] p-6 shadow-sm sm:p-8">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(255,183,172,0.12),transparent_35%)]" />
          <div className="relative flex flex-col items-center justify-between gap-6 sm:flex-row">
            <div className="flex items-center gap-4 text-left">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[#C62828] text-white">
                <Cloud className="h-5 w-5" />
              </div>
              <div>
                <h4 className="text-base font-bold leading-tight text-neutral-900">
                  Ready to experience effortless file management?
                </h4>
                <p className="mt-1 text-xs text-neutral-500">
                  Join thousands of teams and individuals who trust Kumori every
                  day.
                </p>
              </div>
            </div>
            <a
              href="#/register"
              className="inline-flex shrink-0 items-center justify-center gap-1.5 rounded-full bg-[#C62828] px-6 py-2.5 text-xs font-semibold text-white shadow-sm transition-all duration-200 hover:bg-[#D32F2F]"
            >
              Get Started Free
              <span className="text-[12px] font-bold">→</span>
            </a>
          </div>
        </div>
      </div>
    </section>
  );
}

export function WorkflowSection({ sectionRef }) {
  return (
    <section
      id="workflow"
      ref={sectionRef}
      className="mx-auto w-[min(1220px,calc(100%-1.5rem))] border-t border-neutral-100 py-18 sm:py-24"
    >
      <div
        data-reveal
        className="grid items-center gap-10 lg:grid-cols-[1.15fr_0.85fr]"
      >
        <SectionHeading
          eyebrow="WORKFLOW"
          title="A refined three-step flow built for"
          highlightText="instant discoverability."
          description="The motion language highlights the journey from upload to automated OCR indexing to secure public sharing."
        />
        <div className="relative flex items-center justify-center lg:justify-end lg:pr-8 lg:-mt-12">
          <div className="absolute right-[5%] h-80 w-80 rounded-full bg-[radial-gradient(circle_at_center,rgba(255,183,172,0.22),transparent_70%)]" />
          <img
            src="/kumoir_laptop.png"
            alt="Kumori red panda mascot using a laptop"
            className="relative z-10 h-64 w-auto object-contain drop-shadow-[0_15px_40px_rgba(42,46,51,0.1)] animate-[float_7.5s_ease-in-out_infinite] sm:h-72 lg:h-80"
          />
        </div>
      </div>

      <div className="mt-12 grid gap-6 md:grid-cols-3">
        {workflowSteps.map((step) => (
          <div key={step.step} data-reveal>
            <div className="relative rounded-3xl border border-neutral-100/60 bg-white p-6 shadow-[0_12px_32px_rgba(42,46,51,0.03)] transition-colors duration-300 hover:border-neutral-200">
              <div className="absolute top-0 left-6 h-0.75 w-10 bg-[#C62828]" />
              <div className="mb-4 flex items-center gap-4">
                <div className="flex h-11 w-11 items-center justify-center rounded-2xl border border-neutral-100 bg-neutral-50 text-sm font-extrabold text-neutral-800">
                  {step.step}
                </div>
                <div className="h-px flex-1 bg-neutral-100" />
              </div>
              <h3 className="text-lg font-bold tracking-tight text-neutral-900">
                {step.title}
              </h3>
              <p className="mt-2 text-xs leading-relaxed text-neutral-500">
                {step.description}
              </p>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}

export function CtaSection({ sectionRef }) {
  return (
    <section
      id="pricing"
      ref={sectionRef}
      className="mx-auto w-[min(1220px,calc(100%-1.5rem))] border-t border-neutral-100 py-16 sm:py-20"
    >
      <div
        data-reveal
        className="relative overflow-hidden rounded-[2.5rem] border border-neutral-100 bg-[#FFF5F5] px-6 py-14 text-center shadow-sm"
      >
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(255,183,172,0.25),transparent_30%),radial-gradient(circle_at_bottom,rgba(198,40,40,0.04),transparent_35%)]" />
        <div className="relative mx-auto flex max-w-3xl flex-col items-center">
          <div className="mb-6 flex h-12 w-12 items-center justify-center rounded-2xl bg-[#C62828] text-white shadow-[0_10px_24px_rgba(198,40,40,0.18)]">
            <Sparkles className="h-5.5 w-5.5" />
          </div>
          <h2 className="text-3xl font-extrabold tracking-tight text-neutral-900 sm:text-4xl">
            Experience Intelligent File Sharing
          </h2>
          <p className="mt-4 max-w-xl text-sm font-medium leading-relaxed text-neutral-500">
            Combine semantic search, automated OCR, secure HMAC sharing, and
            instant opens tracking into a premium collaborative workflow.
          </p>

          <div className="mt-8 flex flex-wrap items-center justify-center gap-3.5">
            <Button variant="accent" href="#/register">
              Get Started Free
            </Button>
            <Button variant="outline" href="#features">
              Explore Features
            </Button>
          </div>
        </div>
      </div>
    </section>
  );
}

export function LandingFooter() {
  return (
    <footer id="contact" className="border-t border-neutral-100 bg-white py-12">
      <div className="mx-auto grid w-[min(1220px,calc(100%-1.5rem))] gap-8 sm:grid-cols-2 lg:grid-cols-[1.3fr_1fr_1fr_1fr]">
        <div>
          <div className="flex items-center gap-1.5 transition-opacity hover:opacity-90">
            <img
              src="/mascot.png"
              alt="Kumori Mascot"
              className="h-8 w-auto object-contain md:h-9"
            />
            <span className="-ml-2.5 translate-y-[-1.5px] text-lg font-extrabold tracking-tight text-neutral-900 md:text-xl">
              Kumori
            </span>
          </div>
          <p className="mt-3 max-w-xs text-xs font-medium leading-relaxed text-neutral-500">
            AI-powered file sharing and semantic document search for modern
            collaborative teams.
          </p>
          <div className="mt-5 space-y-1.5 font-mono text-xs text-neutral-400">
            {contactLinks.map((contact) => (
              <div key={contact}>{contact}</div>
            ))}
          </div>
        </div>

        {Object.entries(footerLinks).map(([title, links]) => (
          <div key={title}>
            <div className="text-[10px] font-bold uppercase tracking-[0.25em] text-neutral-400">
              {title}
            </div>
            <div className="mt-4 flex flex-col gap-2.5 text-xs font-medium text-neutral-500">
              {links.map((link) => (
                <a
                  key={link}
                  href="#top"
                  className="transition-colors hover:text-[#C62828]"
                >
                  {link}
                </a>
              ))}
            </div>
          </div>
        ))}
      </div>
    </footer>
  );
}
