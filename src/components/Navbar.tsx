import React from 'react';
import {
  Sprout,
  LayoutDashboard,
  Leaf,
  Calendar,
  Bell,
  Sparkles,
  BarChart3,
  Settings,
  Plus,
  PlayCircle,
  Luggage,
} from 'lucide-react';
import { usePlant } from '../context/PlantContext';
import { CATALOG_COUNT_LABEL } from '../data/plantCatalog';

interface NavbarProps {
  currentTab: string;
  setCurrentTab: (tab: string) => void;
  onOpenAddPlant: () => void;
  onOpenSitterMode: () => void;
  onOpenHealthCheck: () => void;
  onShowLanding: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  currentTab,
  setCurrentTab,
  onOpenAddPlant,
  onOpenSitterMode,
  onOpenHealthCheck,
  onShowLanding,
}) => {
  const { setActiveCareSession, routine, userProfile, isDemoMode } = usePlant();

  const navItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'plants', label: `My Plants`, icon: Leaf },
    { id: 'calendar', label: 'Calendar', icon: Calendar },
    { id: 'reminders', label: 'Reminders', icon: Bell },
    { id: 'assistant', label: 'Plantzy AI', icon: Sparkles },
    { id: 'insights', label: 'Insights', icon: BarChart3 },
    { id: 'settings', label: 'Settings', icon: Settings },
  ];

  const pendingRoutineTasks = routine.allTasks.filter((t) => t.status === 'pending');

  return (
    <>
      {/* Top Navbar */}
      <header className="sticky top-0 z-40 bg-[#FAFBF9]/95 backdrop-blur-md border-b border-[#E8EDE9] transition-all">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            {/* Logo */}
            <div className="flex items-center gap-5">
              <button
                onClick={() => setCurrentTab('dashboard')}
                className="flex items-center gap-2.5 group text-left transition"
              >
                <div className="w-10 h-10 rounded-2xl bg-[#143D2B] flex items-center justify-center text-white shadow-sm group-hover:scale-105 transition-transform ring-2 ring-[#D1F5E4]">
                  <Sprout className="w-5 h-5 text-[#86EFAC]" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-serif-plant text-xl font-bold tracking-tight text-[#143D2B]">
                      Plantzy
                    </span>
                    <span className="px-2 py-0.5 text-[10px] font-bold tracking-wider bg-[#FEF9E7] text-[#92400E] rounded-full border border-[#FDE68A]">
                      {CATALOG_COUNT_LABEL} PLANTS
                    </span>
                  </div>
                  <p className="text-[11px] text-[#4A6B56] font-medium hidden sm:block">
                    Your plants have needs. Plantzy remembers.
                  </p>
                </div>
              </button>

              {/* Desktop Nav Links */}
              <nav className="hidden md:flex items-center gap-1 ml-2">
                {navItems.map((item) => {
                  const Icon = item.icon;
                  const isActive = currentTab === item.id;
                  return (
                    <button
                      key={item.id}
                      onClick={() => setCurrentTab(item.id)}
                      className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold transition-all ${
                        isActive
                          ? 'bg-[#E8F8F2] text-[#143D2B] border border-[#A3E9C8] shadow-2xs'
                          : 'text-[#4A6B56] hover:text-[#143D2B] hover:bg-[#F3FAF6]'
                      }`}
                    >
                      <Icon className={`w-3.5 h-3.5 ${isActive ? 'text-[#143D2B]' : 'text-[#648772]'}`} />
                      <span>{item.label}</span>
                    </button>
                  );
                })}
              </nav>
            </div>

            {/* Right Action Buttons */}
            <div className="flex items-center gap-2 sm:gap-2.5">
              {/* Sitter Mode (Pastel Yellow Accent) */}
              <button
                onClick={onOpenSitterMode}
                className="hidden lg:flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-[#854D0E] bg-[#FEF9E7] hover:bg-[#FEF08A] border border-[#FDE68A] rounded-xl transition"
                title="Plant Sitter & Vacation Mode"
              >
                <Luggage className="w-3.5 h-3.5 text-[#B45309]" />
                <span>Sitter Mode</span>
              </button>

              {/* AI Health Check (Pastel Pink Accent) */}
              <button
                onClick={onOpenHealthCheck}
                className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-[#9F1239] bg-[#FFF0F4] hover:bg-[#FCE7EC] border border-[#F9CAD6] rounded-xl shadow-2xs transition"
                title="AI Plant Health Check"
              >
                <Sparkles className="w-3.5 h-3.5 text-[#E11D48]" />
                <span>Health Check</span>
              </button>

              {/* Start Care Session button (Dark Green + Mint ring) */}
              {pendingRoutineTasks.length > 0 && (
                <button
                  onClick={() => setActiveCareSession(true)}
                  className="flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-bold text-white bg-[#143D2B] hover:bg-[#0E2C1E] border border-[#143D2B] rounded-xl shadow-xs transition transform hover:-translate-y-0.5"
                >
                  <PlayCircle className="w-4 h-4 text-[#86EFAC]" />
                  <span className="hidden sm:inline">Start Care</span>
                  <span className="sm:hidden">Care</span>
                  <span className="ml-0.5 px-1.5 py-0.2 rounded-full text-[10px] bg-[#FEF9E7] text-[#92400E] font-extrabold">
                    {pendingRoutineTasks.length}
                  </span>
                </button>
              )}

              {/* Add Plant Button (Mint Green Accent) */}
              <button
                onClick={onOpenAddPlant}
                className="flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-bold text-[#143D2B] bg-[#D1F5E4] hover:bg-[#B4EBD2] border border-[#A3E9C8] rounded-xl transition"
              >
                <Plus className="w-4 h-4 text-[#143D2B]" />
                <span className="hidden sm:inline">Add Plant</span>
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Mobile Bottom Navigation Bar */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-white/95 backdrop-blur-md border-t border-[#E8EDE9] px-2 py-2">
        <div className="flex items-center justify-around max-w-md mx-auto">
          {navItems.slice(0, 5).map((item) => {
            const Icon = item.icon;
            const isActive = currentTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => setCurrentTab(item.id)}
                className={`flex flex-col items-center py-1 px-2.5 rounded-lg text-[10px] font-medium transition ${
                  isActive ? 'text-[#143D2B] font-bold bg-[#E8F8F2]' : 'text-[#648772]'
                }`}
              >
                <Icon className={`w-5 h-5 mb-0.5 ${isActive ? 'text-[#143D2B]' : 'text-[#8AA895]'}`} />
                {item.label}
              </button>
            );
          })}
        </div>
      </div>
    </>
  );
};
