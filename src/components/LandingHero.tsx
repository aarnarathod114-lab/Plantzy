import React from 'react';
import {
  Sprout,
  Sun,
  Droplets,
  Sparkles,
  CalendarCheck,
  Brain,
  ShieldCheck,
  ArrowRight,
  CheckCircle2,
  ThermometerSun,
  RotateCw,
} from 'lucide-react';
import { CATALOG_COUNT_LABEL } from '../data/plantCatalog';

interface LandingHeroProps {
  onStartOnboarding: () => void;
  onExploreDemo: () => void;
  onEnterDashboard: () => void;
}

export const LandingHero: React.FC<LandingHeroProps> = ({
  onStartOnboarding,
  onExploreDemo,
  onEnterDashboard,
}) => {
  return (
    <div className="min-h-screen bg-[#FAFBF9] text-[#143D2B] pb-24">
      {/* Hero Section */}
      <section className="relative overflow-hidden pt-12 pb-20 md:pt-20 md:pb-28 border-b border-[#E8EDE9]">
        {/* Pastel gradient backdrop blending pink, mint, and yellow */}
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-[#FCE7EC]/70 rounded-full blur-3xl pointer-events-none -z-10" />
        <div className="absolute top-10 right-1/4 w-96 h-96 bg-[#D1F5E4]/70 rounded-full blur-3xl pointer-events-none -z-10" />
        <div className="absolute top-40 left-1/2 -translate-x-1/2 w-80 h-80 bg-[#FEF9E7]/80 rounded-full blur-3xl pointer-events-none -z-10" />

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
            {/* Left Column: Brand Copy & CTAs */}
            <div className="lg:col-span-7 space-y-6 text-center lg:text-left">
              <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-[#E8F8F2] border border-[#A3E9C8] text-[#143D2B] text-xs font-bold tracking-wide">
                <Sprout className="w-3.5 h-3.5 text-[#10B981]" />
                <span>{CATALOG_COUNT_LABEL} Indian & Global Plants</span>
              </div>

              <h1 className="font-serif-plant text-4xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight text-[#0D2E1E] leading-[1.12]">
                Your plants have needs.{' '}
                <span className="text-[#143D2B] block sm:inline">Plantzy remembers.</span>
              </h1>

              <p className="text-xl sm:text-2xl text-[#245E3F] font-medium font-serif-plant italic">
                “One routine for all your plants.”
              </p>

              <p className="text-base sm:text-lg text-[#3D634B] max-w-2xl leading-relaxed">
                From Tulsi, Mogra, and Kadi Patta on your sunny balcony to Monstera and Snake Plants in your living room. Plantzy turns different watering rhythms and weather shifts into one simple daily checklist.
              </p>

              {/* CTAs */}
              <div className="pt-2 flex flex-col sm:flex-row items-center justify-center lg:justify-start gap-3 sm:gap-4">
                <button
                  onClick={onStartOnboarding}
                  className="w-full sm:w-auto px-7 py-3.5 rounded-2xl bg-[#143D2B] hover:bg-[#0E2C1E] text-white font-bold text-base shadow-sm hover:shadow-md transition-all flex items-center justify-center gap-2.5 group"
                >
                  <span>Build My Plant Routine</span>
                  <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                </button>

                <button
                  onClick={onExploreDemo}
                  className="w-full sm:w-auto px-6 py-3.5 rounded-2xl bg-[#FFF0F4] hover:bg-[#FCE7EC] text-[#9F1239] font-bold text-base border border-[#F9CAD6] shadow-2xs transition-all flex items-center justify-center gap-2"
                >
                  <Sparkles className="w-4 h-4 text-[#E11D48]" />
                  <span>Try Demo Collection</span>
                </button>

                <button
                  onClick={onEnterDashboard}
                  className="text-sm font-semibold text-[#143D2B] hover:underline underline-offset-4 py-2"
                >
                  Go to Dashboard →
                </button>
              </div>

              {/* Trust markers */}
              <div className="pt-4 flex flex-wrap items-center justify-center lg:justify-start gap-5 text-xs text-[#4A6B56] font-semibold">
                <div className="flex items-center gap-1.5 bg-[#E8F8F2] px-3 py-1 rounded-full border border-[#A3E9C8]">
                  <CheckCircle2 className="w-3.5 h-3.5 text-[#10B981]" />
                  <span>Monsoon & Summer Weather Aware</span>
                </div>
                <div className="flex items-center gap-1.5 bg-[#FFF0F4] px-3 py-1 rounded-full border border-[#F9CAD6] text-[#9F1239]">
                  <CheckCircle2 className="w-3.5 h-3.5 text-[#E11D48]" />
                  <span>Adapts to Soil Moisture Depth</span>
                </div>
                <div className="flex items-center gap-1.5 bg-[#FEF9E7] px-3 py-1 rounded-full border border-[#FDE68A] text-[#92400E]">
                  <CheckCircle2 className="w-3.5 h-3.5 text-[#D97706]" />
                  <span>{CATALOG_COUNT_LABEL} Indian & Global Varieties</span>
                </div>
              </div>
            </div>

            {/* Right Column: Visual Preview with Pastel Cards */}
            <div className="lg:col-span-5">
              <div className="relative mx-auto max-w-md bg-white rounded-3xl p-5 shadow-xl border border-[#E2EAE3]">
                {/* Floating Weather Tag (Pastel Yellow) */}
                <div className="flex items-center justify-between pb-3.5 border-b border-[#F0F4F1]">
                  <div className="flex items-center gap-2.5">
                    <div className="w-9 h-9 rounded-xl bg-[#FEF9E7] text-[#D97706] border border-[#FDE68A] flex items-center justify-center">
                      <ThermometerSun className="w-4 h-4" />
                    </div>
                    <div>
                      <div className="text-xs font-bold text-[#143D2B]">Mumbai / Delhi — 31°C</div>
                      <div className="text-[11px] text-[#557863]">Warm afternoon • Humidity 58%</div>
                    </div>
                  </div>
                  <span className="text-[10px] px-2.5 py-0.5 rounded-full bg-[#E8F8F2] text-[#065F46] font-bold border border-[#A3E9C8]">
                    Live Weather
                  </span>
                </div>

                {/* Dashboard Card Header */}
                <div className="mt-4 mb-3">
                  <div className="text-[10px] font-bold uppercase tracking-wider text-[#143D2B]">
                    Today's Consolidated Routine
                  </div>
                  <div className="text-lg font-bold font-serif-plant text-[#0D2E1E]">
                    Good morning, plant parent 🌱
                  </div>
                  <div className="text-xs text-[#4A6B56]">
                    Estimated care time: <span className="font-bold text-[#143D2B]">~10 minutes</span>
                  </div>
                </div>

                {/* Task list preview in Pastel Tones */}
                <div className="space-y-2.5">
                  {/* Task 1: Mint Green */}
                  <div className="p-3 rounded-2xl bg-[#E8F8F2] border border-[#A3E9C8] flex items-start gap-3">
                    <div className="w-8 h-8 rounded-xl bg-white text-[#059669] flex items-center justify-center shrink-0 mt-0.5 shadow-2xs">
                      <Droplets className="w-4 h-4" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-[#065F46]">
                          💧 Water / Soil Check — 3 plants
                        </span>
                        <span className="text-[10px] bg-white text-[#065F46] px-1.5 py-0.5 rounded-md font-bold">
                          Priority
                        </span>
                      </div>
                      <p className="text-[11px] text-[#245E3F] mt-0.5 truncate">
                        Tulsi • Mogra • Monstera
                      </p>
                      <div className="mt-1 text-[10px] text-[#143D2B] bg-white/80 p-1.5 rounded-lg border border-[#A3E9C8]">
                        <span className="font-bold">Why today?</span> Warm 31°C afternoon increases balcony transpiration. Check top inch before watering.
                      </div>
                    </div>
                  </div>

                  {/* Task 2: Pastel Yellow */}
                  <div className="p-3 rounded-2xl bg-[#FEF9E7] border border-[#FDE68A] flex items-start gap-3">
                    <div className="w-8 h-8 rounded-xl bg-white text-[#D97706] flex items-center justify-center shrink-0 mt-0.5 shadow-2xs">
                      <Sun className="w-4 h-4" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-[#92400E]">
                          ☀️ Light Rotation — 2 plants
                        </span>
                      </div>
                      <p className="text-[11px] text-[#78350F] mt-0.5">
                        Aloe Vera • Hallway Snake Plant
                      </p>
                    </div>
                  </div>

                  {/* Task 3: Pastel Pink */}
                  <div className="p-3 rounded-2xl bg-[#FFF0F4] border border-[#F9CAD6] flex items-start gap-3">
                    <div className="w-8 h-8 rounded-xl bg-white text-[#E11D48] flex items-center justify-center shrink-0 mt-0.5 shadow-2xs">
                      <RotateCw className="w-4 h-4" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-[#9F1239]">
                          ✂️ Deadhead & Grooming — 1 plant
                        </span>
                      </div>
                      <p className="text-[11px] text-[#881337] mt-0.5">
                        Desi Gulab (snip spent fragrant petals)
                      </p>
                    </div>
                  </div>
                </div>

                <div className="mt-4 pt-3 border-t border-[#F0F4F1] flex items-center justify-between">
                  <div className="text-[11px] text-[#3D634B] font-semibold flex items-center gap-1.5">
                    <Brain className="w-3.5 h-3.5 text-[#143D2B]" />
                    <span>Plantzy learns from your soil feedback</span>
                  </div>
                  <button
                    onClick={onExploreDemo}
                    className="text-xs font-bold text-[#143D2B] hover:underline"
                  >
                    Explore Demo →
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 6 Core Product Features Section with Pastel Cards */}
      <section className="py-16 md:py-24 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-3xl mx-auto mb-14">
          <div className="text-xs font-bold uppercase tracking-wider text-[#143D2B] mb-2">
            Intelligent Plant Care
          </div>
          <h2 className="font-serif-plant text-3xl sm:text-4xl font-bold text-[#0D2E1E]">
            What do <span className="italic">my</span> plants need <span className="underline decoration-[#FDE68A] decoration-4">today</span>?
          </h2>
          <p className="text-base sm:text-lg text-[#3D634B] mt-3">
            Plantzy isn’t just a static encyclopedia. It synthesizes your microclimate, species, pot drainage, and recent observations into one morning routine.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {/* Card 1: Mint Green */}
          <div className="p-6 rounded-3xl bg-[#E8F8F2] border border-[#A3E9C8] hover:shadow-md transition-shadow">
            <div className="w-12 h-12 rounded-2xl bg-white text-[#10B981] flex items-center justify-center mb-4 shadow-2xs">
              <Sprout className="w-6 h-6 text-[#143D2B]" />
            </div>
            <h3 className="text-lg font-bold text-[#143D2B] mb-2">🌱 {CATALOG_COUNT_LABEL} Plant Knowledge</h3>
            <p className="text-xs sm:text-sm text-[#245E3F] leading-relaxed">
              From Holy Basil and Mogra to Fiddle Leaf Figs and Rare Orchids. Every plant gets care tailored to its species and pot conditions.
            </p>
          </div>

          {/* Card 2: Pastel Yellow */}
          <div className="p-6 rounded-3xl bg-[#FEF9E7] border border-[#FDE68A] hover:shadow-md transition-shadow">
            <div className="w-12 h-12 rounded-2xl bg-white text-[#D97706] flex items-center justify-center mb-4 shadow-2xs">
              <Sun className="w-6 h-6 text-[#D97706]" />
            </div>
            <h3 className="text-lg font-bold text-[#92400E] mb-2">☀️ Smart Indian Environment</h3>
            <p className="text-xs sm:text-sm text-[#78350F] leading-relaxed">
              Monsoon humidity, dry summer heatwaves (Loo), and winter dips actively adjust watering schedules. No watering outdoors if heavy rain is due.
            </p>
          </div>

          {/* Card 3: Pastel Pink */}
          <div className="p-6 rounded-3xl bg-[#FFF0F4] border border-[#F9CAD6] hover:shadow-md transition-shadow">
            <div className="w-12 h-12 rounded-2xl bg-white text-[#E11D48] flex items-center justify-center mb-4 shadow-2xs">
              <CalendarCheck className="w-6 h-6 text-[#E11D48]" />
            </div>
            <h3 className="text-lg font-bold text-[#9F1239] mb-2">📅 One Simple Routine</h3>
            <p className="text-xs sm:text-sm text-[#881337] leading-relaxed">
              Manage your entire balcony or terrace in 10 minutes. Group similar tasks: check 3 soils, rotate 2 pots, groom 1 rose.
            </p>
          </div>

          {/* Card 4: Dark Green */}
          <div className="p-6 rounded-3xl bg-[#143D2B] text-white border border-[#143D2B] hover:shadow-md transition-shadow">
            <div className="w-12 h-12 rounded-2xl bg-white/15 text-[#86EFAC] flex items-center justify-center mb-4">
              <Brain className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-bold text-white mb-2">🧠 Learns Over Time</h3>
            <p className="text-xs sm:text-sm text-[#D1F5E4] leading-relaxed">
              If your Monstera soil stays moist after 4 days, Plantzy automatically spaces out checks. If your Basil dries out fast, it alerts you sooner.
            </p>
          </div>

          {/* Card 5: Mint Green */}
          <div className="p-6 rounded-3xl bg-[#E8F8F2] border border-[#A3E9C8] hover:shadow-md transition-shadow">
            <div className="w-12 h-12 rounded-2xl bg-white text-[#10B981] flex items-center justify-center mb-4 shadow-2xs">
              <Sparkles className="w-6 h-6 text-[#143D2B]" />
            </div>
            <h3 className="text-lg font-bold text-[#143D2B] mb-2">🤖 Plantzy AI Assistant</h3>
            <p className="text-xs sm:text-sm text-[#245E3F] leading-relaxed">
              Ask questions about your real collection. It references your plant species, care history, and local forecast for calm botanical advice.
            </p>
          </div>

          {/* Card 6: Pastel Yellow */}
          <div className="p-6 rounded-3xl bg-[#FEF9E7] border border-[#FDE68A] hover:shadow-md transition-shadow">
            <div className="w-12 h-12 rounded-2xl bg-white text-[#D97706] flex items-center justify-center mb-4 shadow-2xs">
              <ShieldCheck className="w-6 h-6 text-[#D97706]" />
            </div>
            <h3 className="text-lg font-bold text-[#92400E] mb-2">🛡️ Vacation & Sitter Mode</h3>
            <p className="text-xs sm:text-sm text-[#78350F] leading-relaxed">
              Traveling during festive holidays? Plantzy creates a clean, 1-2-3 step list for your plant sitter without confusing jargon.
            </p>
          </div>
        </div>

        {/* Bottom CTA Banner (Dark green + mint + pastel yellow accents) */}
        <div className="mt-16 p-8 sm:p-12 rounded-3xl bg-[#143D2B] text-white flex flex-col md:flex-row items-center justify-between gap-8 shadow-xl border border-[#245E3F]">
          <div className="space-y-2 text-center md:text-left">
            <h3 className="font-serif-plant text-2xl sm:text-3xl font-bold">
              Give your plants the care they deserve 🌱
            </h3>
            <p className="text-sm sm:text-base text-[#D1F5E4]">
              Explore our database of {CATALOG_COUNT_LABEL} plants or start with pre-loaded demo plants right now.
            </p>
          </div>
          <div className="flex flex-col sm:flex-row gap-3 w-full sm:w-auto">
            <button
              onClick={onStartOnboarding}
              className="px-6 py-3 rounded-2xl bg-[#FEF9E7] text-[#92400E] hover:bg-[#FEF08A] font-bold text-sm shadow-md transition"
            >
              Build My Routine
            </button>
            <button
              onClick={onExploreDemo}
              className="px-6 py-3 rounded-2xl bg-[#D1F5E4] hover:bg-[#B4EBD2] text-[#143D2B] font-bold text-sm transition"
            >
              Explore Demo Plants
            </button>
          </div>
        </div>
      </section>
    </div>
  );
};
