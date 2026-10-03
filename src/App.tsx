import React, { useState } from 'react';
import { PlantProvider, usePlant } from './context/PlantContext';
import { Navbar } from './components/Navbar';
import { LandingHero } from './components/LandingHero';
import { DashboardView } from './components/DashboardView';
import { PlantsView } from './components/PlantsView';
import { CalendarView } from './components/CalendarView';
import { RemindersView } from './components/RemindersView';
import { AssistantView } from './components/AssistantView';
import { InsightsView } from './components/InsightsView';
import { SettingsView } from './components/SettingsView';
import { PlantDetailModal } from './components/PlantDetailModal';
import { AddPlantModal } from './components/AddPlantModal';
import { MyPlantDayModal } from './components/MyPlantDayModal';
import { PlantSitterModal } from './components/PlantSitterModal';
import { HealthCheckModal } from './components/HealthCheckModal';
import { OnboardingModal } from './components/OnboardingModal';
import { Sprout } from 'lucide-react';

function PlantzyApp() {
  const { activeCareSession, setActiveCareSession, userProfile } = usePlant();

  // Navigation tab state
  const [currentTab, setCurrentTab] = useState<string>('dashboard');
  const [showLanding, setShowLanding] = useState<boolean>(false);

  // Modals state
  const [selectedPlantId, setSelectedPlantId] = useState<string | null>(null);
  const [isAddPlantOpen, setIsAddPlantOpen] = useState<boolean>(false);
  const [isSitterModeOpen, setIsSitterModeOpen] = useState<boolean>(false);
  const [isHealthCheckOpen, setIsHealthCheckOpen] = useState<boolean>(false);
  const [isOnboardingOpen, setIsOnboardingOpen] = useState<boolean>(false);

  // If landing page is toggled on
  if (showLanding) {
    return (
      <div className="min-h-screen bg-[#F8F9F6] text-[#1E2922]">
        <LandingHero
          onStartOnboarding={() => {
            setShowLanding(false);
            setIsOnboardingOpen(true);
          }}
          onExploreDemo={() => {
            setShowLanding(false);
            setCurrentTab('dashboard');
          }}
          onEnterDashboard={() => {
            setShowLanding(false);
            setCurrentTab('dashboard');
          }}
        />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F8F9F6] text-[#1E2922] flex flex-col font-sans pb-16 md:pb-8">
      {/* Top Navigation */}
      <Navbar
        currentTab={currentTab}
        setCurrentTab={setCurrentTab}
        onOpenAddPlant={() => setIsAddPlantOpen(true)}
        onOpenSitterMode={() => setIsSitterModeOpen(true)}
        onOpenHealthCheck={() => setIsHealthCheckOpen(true)}
        onShowLanding={() => setShowLanding(true)}
      />

      {/* Main View Router */}
      <main className="flex-1">
        {currentTab === 'dashboard' && (
          <DashboardView
            onSelectPlant={(plantId) => setSelectedPlantId(plantId)}
            onOpenAddPlant={() => setIsAddPlantOpen(true)}
            onOpenCareSession={() => setActiveCareSession(true)}
            onNavigateTab={(tab) => setCurrentTab(tab)}
          />
        )}

        {currentTab === 'plants' && (
          <PlantsView
            onSelectPlant={(plantId) => setSelectedPlantId(plantId)}
            onOpenAddPlant={() => setIsAddPlantOpen(true)}
          />
        )}

        {currentTab === 'calendar' && <CalendarView />}

        {currentTab === 'reminders' && <RemindersView />}

        {currentTab === 'assistant' && <AssistantView />}

        {currentTab === 'insights' && <InsightsView />}

        {currentTab === 'settings' && <SettingsView />}
      </main>

      {/* Global Modals */}
      <PlantDetailModal
        plantId={selectedPlantId}
        onClose={() => setSelectedPlantId(null)}
      />

      <AddPlantModal
        isOpen={isAddPlantOpen}
        onClose={() => setIsAddPlantOpen(false)}
        onPlantAdded={(plantId) => {
          setIsAddPlantOpen(false);
          setSelectedPlantId(plantId);
        }}
      />

      <MyPlantDayModal
        isOpen={activeCareSession}
        onClose={() => setActiveCareSession(false)}
      />

      <PlantSitterModal
        isOpen={isSitterModeOpen}
        onClose={() => setIsSitterModeOpen(false)}
      />

      <HealthCheckModal
        isOpen={isHealthCheckOpen}
        onClose={() => setIsHealthCheckOpen(false)}
      />

      <OnboardingModal
        isOpen={isOnboardingOpen}
        onClose={() => setIsOnboardingOpen(false)}
        onComplete={() => {
          setIsOnboardingOpen(false);
          setCurrentTab('dashboard');
        }}
      />

      {/* Subtle Footer with Landing Page Link & Brand Credit */}
      <footer className="mt-auto py-6 border-t border-[#E5EDE6] text-center text-xs text-[#6B8072]">
        <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <Sprout className="w-4 h-4 text-[#2D5A3C]" />
            <span className="font-serif-plant font-bold text-[#1E3A2B]">Plantzy</span>
            <span>— “One routine for all your plants.”</span>
          </div>

          <div className="flex items-center gap-4">
            <button
              onClick={() => setShowLanding(true)}
              className="text-[#2D5A3C] hover:underline font-semibold"
            >
              View Landing Page
            </button>
            <button
              onClick={() => setIsOnboardingOpen(true)}
              className="text-[#2D5A3C] hover:underline font-semibold"
            >
              Run Setup Wizard
            </button>
          </div>
        </div>
      </footer>
    </div>
  );
}

export default function App() {
  return (
    <PlantProvider>
      <PlantzyApp />
    </PlantProvider>
  );
}
