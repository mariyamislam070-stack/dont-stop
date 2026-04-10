import { Home, BookOpen, Bell, Image, Info } from "lucide-react";
import { motion } from "motion/react";

export type TabType = "Home" | "Classes" | "Notice" | "Gallery" | "About";

interface NavigationProps {
  activeTab: TabType;
  setActiveTab: (tab: TabType) => void;
  hasNewNotices?: boolean;
}

export default function Navigation({ activeTab, setActiveTab, hasNewNotices }: NavigationProps) {
  const tabs = [
    { id: "Home" as TabType, icon: Home, label: "Home" },
    { id: "Classes" as TabType, icon: BookOpen, label: "Classes" },
    { id: "Notice" as TabType, icon: Bell, label: "Notice" },
    { id: "Gallery" as TabType, icon: Image, label: "Gallery" },
    { id: "About" as TabType, icon: Info, label: "About Us" },
  ];

  return (
    <nav className="fixed bottom-6 left-1/2 -translate-x-1/2 w-[90%] max-w-md glass rounded-full px-2 py-2 flex items-center justify-between z-50">
      {tabs.map((tab) => {
        const Icon = tab.icon;
        const isActive = activeTab === tab.id;
        
        return (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`relative flex flex-col items-center justify-center py-2 px-4 rounded-full transition-all duration-300 haptic-glow ${
              isActive ? "text-emerald-700" : "text-slate-500 hover:text-emerald-600"
            }`}
          >
            {isActive && (
              <motion.div
                layoutId="activeTab"
                className="absolute inset-0 bg-white/40 rounded-full -z-10"
                transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
              />
            )}
            <Icon className={`w-5 h-5 ${isActive ? "scale-110" : ""}`} />
            {tab.id === "Notice" && hasNewNotices && (
              <span className="absolute top-2 right-4 w-2 h-2 bg-red-500 rounded-full border border-white animate-pulse" />
            )}
            <span className="text-[10px] font-medium mt-1">{tab.label}</span>
          </button>
        );
      })}
    </nav>
  );
}
