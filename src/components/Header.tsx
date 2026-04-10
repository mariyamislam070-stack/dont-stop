import { useState, useRef, useEffect } from "react";
import { School, Bell, X, Shield, User as UserIcon, Check } from "lucide-react";
import { UserData } from "../App";
import { motion, AnimatePresence } from "motion/react";

interface HeaderProps {
  user: UserData;
  onProfileClick: () => void;
  onNoticeClick: () => void;
  hasNewNotices: boolean;
  onRoleSwitch: (role: "Teacher" | "Student") => void;
}

export default function Header({ user, onProfileClick, onNoticeClick, hasNewNotices, onRoleSwitch }: HeaderProps) {
  const [showSecretMenu, setShowSecretMenu] = useState(false);
  const [toast, setToast] = useState<string | null>(null);
  const lastTap = useRef<number>(0);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  const handleDoubleTap = () => {
    const now = Date.now();
    if (now - lastTap.current < 300) {
      setShowSecretMenu(true);
    }
    lastTap.current = now;
  };

  const handleLongPressStart = () => {
    timerRef.current = setTimeout(() => {
      setShowSecretMenu(true);
    }, 1000);
  };

  const handleLongPressEnd = () => {
    if (timerRef.current) clearTimeout(timerRef.current);
  };

  const switchRole = (role: "Teacher" | "Student") => {
    onRoleSwitch(role);
    setShowSecretMenu(false);
    setToast(`Access Level: ${role}`);
    setTimeout(() => setToast(null), 3000);
  };

  return (
    <header className="fixed top-0 left-0 right-0 z-[100] px-6 py-4">
      <div className="max-w-4xl mx-auto glass rounded-[24px] px-4 py-3 flex items-center justify-between border-white/40 shadow-2xl backdrop-blur-xl relative">
        {/* Secret Toast */}
        <AnimatePresence>
          {toast && (
            <motion.div 
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="absolute -bottom-16 left-1/2 -translate-x-1/2 glass px-6 py-2 rounded-full border-emerald-500/30 shadow-xl"
            >
              <p className="text-xs font-bold text-emerald-900">{toast}</p>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Secret Menu */}
        <AnimatePresence>
          {showSecretMenu && (
            <motion.div 
              initial={{ opacity: 0, scale: 0.9, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 10 }}
              className="absolute top-full right-4 mt-4 w-64 glass p-4 rounded-3xl border-white/40 shadow-2xl z-[110]"
            >
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-sm font-black text-emerald-900 uppercase tracking-widest">Secret Access</h3>
                <button onClick={() => setShowSecretMenu(false)} className="p-1 hover:bg-white/20 rounded-lg">
                  <X className="w-4 h-4 text-emerald-900" />
                </button>
              </div>
              <div className="space-y-2">
                <button 
                  onClick={() => switchRole("Teacher")}
                  className={`w-full flex items-center justify-between p-3 rounded-2xl transition-all ${user.role === "Teacher" ? "bg-emerald-600 text-white" : "hover:bg-white/20 text-emerald-900"}`}
                >
                  <div className="flex items-center gap-3">
                    <Shield className="w-4 h-4" />
                    <span className="text-xs font-bold">Teacher Mode</span>
                  </div>
                  {user.role === "Teacher" && <Check className="w-4 h-4" />}
                </button>
                <button 
                  onClick={() => switchRole("Student")}
                  className={`w-full flex items-center justify-between p-3 rounded-2xl transition-all ${user.role === "Student" ? "bg-emerald-600 text-white" : "hover:bg-white/20 text-emerald-900"}`}
                >
                  <div className="flex items-center gap-3">
                    <UserIcon className="w-4 h-4" />
                    <span className="text-xs font-bold">Student Mode</span>
                  </div>
                  {user.role === "Student" && <Check className="w-4 h-4" />}
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Top Left: Profile Pic */}
        <button 
          onClick={onProfileClick}
          className="flex items-center gap-3 group pointer-events-auto"
        >
          <div className="w-10 h-10 rounded-full border-2 border-emerald-500/30 overflow-hidden shadow-lg group-hover:scale-110 transition-transform">
            <img 
              src={user.photoURL} 
              alt="Profile" 
              className="w-full h-full object-cover"
              referrerPolicy="no-referrer"
            />
          </div>
          <div className="hidden sm:block text-left">
            <p className="text-[10px] font-bold text-emerald-900 leading-tight">{user.name}</p>
            <p className="text-[8px] text-emerald-700/60 uppercase tracking-wider font-black">
              {user.role === "Student" ? `Roll: ${user.rollId}` : user.designation}
            </p>
          </div>
        </button>

        {/* Top Right: Logo */}
        <div className="flex items-center gap-4">
          <div 
            className="flex items-center gap-2 cursor-pointer pointer-events-auto"
            onClick={handleDoubleTap}
            onMouseDown={handleLongPressStart}
            onMouseUp={handleLongPressEnd}
            onTouchStart={handleLongPressStart}
            onTouchEnd={handleLongPressEnd}
          >
            <div className="w-10 h-10 rounded-xl bg-emerald-600 flex items-center justify-center shadow-lg shadow-emerald-200 relative">
              <School className="w-6 h-6 text-white" />
              {user.role === "Teacher" && (
                <span className="absolute -top-1 -right-1 w-3 h-3 bg-emerald-400 rounded-full border-2 border-white shadow-[0_0_8px_rgba(52,211,153,0.8)] animate-pulse" />
              )}
            </div>
            <h1 className="hidden xs:block text-sm font-black text-emerald-900 tracking-tighter">
              TNHS ELITE
            </h1>
          </div>
        </div>
      </div>
    </header>
  );
}
