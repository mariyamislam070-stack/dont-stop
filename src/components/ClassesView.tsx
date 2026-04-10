import { Book, ClipboardList, Lightbulb, Plus, Edit2, BarChart3, Clock, CheckCircle2, ChevronLeft, Send, X, Check, Trash2 } from "lucide-react";
import GlassCard from "./GlassCard";
import { motion, AnimatePresence } from "motion/react";
import { UserRole } from "./LoginView";
import { useState } from "react";
import BookLibrary from "./BookLibrary";
import { BookSuggestionData, HomeworkData } from "../App";

interface ClassesViewProps {
  userRole: UserRole;
  userClass?: string;
  homework: HomeworkData;
  onAddHomework: (classId: string, task: string) => void;
  onUpdateHomework: (classId: string, id: string, newTask: string) => void;
  onDeleteHomework?: (classId: string, id: string) => void;
  bookSuggestions: BookSuggestionData;
  onAddSuggestion: (bookKey: string, suggestion: string) => void;
  onUpdateSuggestion: (bookKey: string, id: string, newText: string) => void;
  onDeleteSuggestion?: (bookKey: string, id: string) => void;
  attendance: any;
  onUpdateAttendance?: (classId: string, percentage: number) => void;
  routines?: any;
  onUpdateRoutine?: (classId: string, day: string, period: string, subject: string) => void;
}

export default function ClassesView({ 
  userRole, 
  userClass, 
  homework, 
  onAddHomework, 
  onUpdateHomework, 
  onDeleteHomework,
  bookSuggestions, 
  onAddSuggestion, 
  onUpdateSuggestion,
  onDeleteSuggestion,
  attendance,
  onUpdateAttendance,
  routines,
  onUpdateRoutine
}: ClassesViewProps) {
  const [view, setView] = useState<"list" | "library" | "result" | "attendance" | "routine" | "homework" | "suggestions">("list");
  const [selectedClass, setSelectedClass] = useState<string | null>(null);
  const [showInputBar, setShowInputBar] = useState(false);
  const [inputText, setInputText] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editText, setEditText] = useState("");
  const [editingCell, setEditingCell] = useState<{ day: string; period: string } | null>(null);
  const [isEditingAttendance, setIsEditingAttendance] = useState(false);

  const classes = Array.from({ length: 10 }, (_, i) => i + 1);
  
  const visibleClasses = userRole === "Teacher" 
    ? classes 
    : classes.filter(c => c.toString() === userClass);

  const handleOpenView = (classId: string, targetView: typeof view) => {
    setSelectedClass(classId);
    setView(targetView);
    setShowInputBar(false);
    setEditingId(null);
  };

  const handlePost = () => {
    if (!inputText.trim()) return;
    
    if (view === "homework") {
      onAddHomework(selectedClass!, inputText.trim());
    } else if (view === "suggestions") {
      onAddSuggestion(`${selectedClass!}-Global`, inputText.trim());
    }
    
    setInputText("");
    setShowInputBar(false);
  };

  const handleUpdate = (id: string) => {
    if (!editText.trim()) return;
    
    if (view === "homework") {
      onUpdateHomework(selectedClass!, id, editText.trim());
    } else if (view === "suggestions") {
      onUpdateSuggestion(`${selectedClass!}-Global`, id, editText.trim());
    }
    
    setEditingId(null);
    setEditText("");
  };

  const startEditing = (id: string, currentText: string) => {
    setEditingId(id);
    setEditText(currentText);
  };

  const renderSubView = () => {
    switch (view) {
      case "library":
        return (
          <BookLibrary 
            classId={selectedClass!} 
            userRole={userRole} 
            suggestions={bookSuggestions}
            onAddSuggestion={onAddSuggestion}
            onUpdateSuggestion={onUpdateSuggestion}
            onDeleteSuggestion={onDeleteSuggestion}
            onBack={() => setView("list")}
          />
        );
      case "homework":
        const classHomework = homework[selectedClass!] || [];
        return (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <button onClick={() => setView("list")} className="p-2 rounded-xl glass text-emerald-700">
                  <ChevronLeft className="w-6 h-6" />
                </button>
                <h2 className="text-2xl font-bold text-emerald-900">Class {selectedClass} Homework</h2>
              </div>
              <AnimatePresence>
                {userRole === "Teacher" && (
                  <motion.button 
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.8 }}
                    onClick={() => setShowInputBar(!showInputBar)}
                    className="p-3 rounded-2xl bg-emerald-600 text-white shadow-lg shadow-emerald-200 hover:bg-emerald-700 transition-all"
                  >
                    <Plus className={`w-6 h-6 transition-transform ${showInputBar ? "rotate-45" : ""}`} />
                  </motion.button>
                )}
              </AnimatePresence>
            </div>

            <AnimatePresence>
              {showInputBar && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: "auto", opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  className="overflow-hidden"
                >
                  <GlassCard className="border-2 border-emerald-500/50 shadow-[0_0_15px_rgba(16,185,129,0.2)] mb-6">
                    <div className="flex gap-3">
                      <input
                        type="text"
                        value={inputText}
                        onChange={(e) => setInputText(e.target.value)}
                        placeholder="Type homework task..."
                        className="flex-1 bg-white/30 border border-white/20 rounded-xl px-4 py-3 text-emerald-900 focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
                      />
                      <button 
                        onClick={handlePost}
                        className="p-3 bg-emerald-600 text-white rounded-xl hover:bg-emerald-700 transition-all flex items-center gap-2 font-bold"
                      >
                        <Send className="w-5 h-5" />
                        Post
                      </button>
                    </div>
                  </GlassCard>
                </motion.div>
              )}
            </AnimatePresence>

            <div className="space-y-4">
              {classHomework.length > 0 ? (
                classHomework.map((hw, i) => (
                  <GlassCard 
                    key={hw.id} 
                    className={`flex flex-col gap-2 transition-all duration-500 ${
                      editingId === hw.id ? "border-2 border-emerald-500 animate-pulse-glow" : ""
                    }`}
                  >
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
                        {editingId === hw.id ? (
                          <div className="space-y-3">
                            <input
                              type="text"
                              value={editText}
                              onChange={(e) => setEditText(e.target.value)}
                              className="w-full bg-white/50 border border-emerald-500/30 rounded-lg px-3 py-2 text-emerald-900 focus:outline-none"
                            />
                            <div className="flex gap-2">
                              <button 
                                onClick={() => handleUpdate(hw.id)}
                                className="flex-1 py-2 bg-emerald-600 text-white rounded-lg text-xs font-bold flex items-center justify-center gap-1"
                              >
                                <Check className="w-3 h-3" /> Update
                              </button>
                              <button 
                                onClick={() => setEditingId(null)}
                                className="flex-1 py-2 bg-white/40 text-emerald-700 rounded-lg text-xs font-bold flex items-center justify-center gap-1"
                              >
                                <X className="w-3 h-3" /> Cancel
                              </button>
                            </div>
                          </div>
                        ) : (
                          <p className="text-emerald-900 font-medium">{hw.task}</p>
                        )}
                      </div>
                      <div className="flex flex-col items-end gap-2">
                        <span className="text-[10px] font-bold text-emerald-700/40 uppercase">{hw.date}</span>
                        <AnimatePresence>
                          {userRole === "Teacher" && editingId !== hw.id && (
                            <motion.div 
                              initial={{ opacity: 0, x: 10 }}
                              animate={{ opacity: 1, x: 0 }}
                              exit={{ opacity: 0, x: 10 }}
                              className="flex gap-1"
                            >
                              <button 
                                onClick={() => startEditing(hw.id, hw.task)}
                                className="p-1.5 rounded-lg hover:bg-white/40 transition-colors text-emerald-700"
                              >
                                <Edit2 className="w-3.5 h-3.5" />
                              </button>
                              <button 
                                onClick={() => onDeleteHomework?.(selectedClass!, hw.id)}
                                className="p-1.5 rounded-lg hover:bg-red-500/10 transition-colors text-red-600"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </motion.div>
                          )}
                        </AnimatePresence>
                      </div>
                    </div>
                  </GlassCard>
                )).reverse()
              ) : (
                <p className="text-emerald-700/50 text-center py-12 italic">No homework assigned yet.</p>
              )}
            </div>
          </div>
        );
      case "suggestions":
        const classSuggestions = bookSuggestions[`${selectedClass!}-Global`] || [];
        return (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <button onClick={() => setView("list")} className="p-2 rounded-xl glass text-emerald-700">
                  <ChevronLeft className="w-6 h-6" />
                </button>
                <h2 className="text-2xl font-bold text-emerald-900">Class {selectedClass} Suggestions</h2>
              </div>
              <AnimatePresence>
                {userRole === "Teacher" && (
                  <motion.button 
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.8 }}
                    onClick={() => setShowInputBar(!showInputBar)}
                    className="p-3 rounded-2xl bg-emerald-600 text-white shadow-lg shadow-emerald-200 hover:bg-emerald-700 transition-all"
                  >
                    <Plus className={`w-6 h-6 transition-transform ${showInputBar ? "rotate-45" : ""}`} />
                  </motion.button>
                )}
              </AnimatePresence>
            </div>

            <AnimatePresence>
              {showInputBar && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: "auto", opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  className="overflow-hidden"
                >
                  <GlassCard className="border-2 border-emerald-500/50 shadow-[0_0_15px_rgba(16,185,129,0.2)] mb-6">
                    <div className="flex gap-3">
                      <input
                        type="text"
                        value={inputText}
                        onChange={(e) => setInputText(e.target.value)}
                        placeholder="Type suggestion or exam tip..."
                        className="flex-1 bg-white/30 border border-white/20 rounded-xl px-4 py-3 text-emerald-900 focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
                      />
                      <button 
                        onClick={handlePost}
                        className="p-3 bg-emerald-600 text-white rounded-xl hover:bg-emerald-700 transition-all flex items-center gap-2 font-bold"
                      >
                        <Send className="w-5 h-5" />
                        Post
                      </button>
                    </div>
                  </GlassCard>
                </motion.div>
              )}
            </AnimatePresence>

            <div className="space-y-4">
              {classSuggestions.length > 0 ? (
                classSuggestions.map((s, i) => (
                  <GlassCard 
                    key={s.id} 
                    className={`flex flex-col gap-2 transition-all duration-500 ${
                      editingId === s.id ? "border-2 border-emerald-500 animate-pulse-glow" : ""
                    }`}
                  >
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
                        {editingId === s.id ? (
                          <div className="space-y-3">
                            <input
                              type="text"
                              value={editText}
                              onChange={(e) => setEditText(e.target.value)}
                              className="w-full bg-white/50 border border-emerald-500/30 rounded-lg px-3 py-2 text-emerald-900 focus:outline-none"
                            />
                            <div className="flex gap-2">
                              <button 
                                onClick={() => handleUpdate(s.id)}
                                className="flex-1 py-2 bg-emerald-600 text-white rounded-lg text-xs font-bold flex items-center justify-center gap-1"
                              >
                                <Check className="w-3 h-3" /> Update
                              </button>
                              <button 
                                onClick={() => setEditingId(null)}
                                className="flex-1 py-2 bg-white/40 text-emerald-700 rounded-lg text-xs font-bold flex items-center justify-center gap-1"
                              >
                                <X className="w-3 h-3" /> Cancel
                              </button>
                            </div>
                          </div>
                        ) : (
                          <div className="flex gap-3 items-start">
                            <Lightbulb className="w-5 h-5 text-amber-500 shrink-0 mt-0.5" />
                            <p className="text-emerald-900 font-medium">{s.text}</p>
                          </div>
                        )}
                      </div>
                      <div className="flex flex-col items-end gap-2">
                        <span className="text-[10px] font-bold text-emerald-700/40 uppercase">{s.date}</span>
                        <AnimatePresence>
                          {userRole === "Teacher" && editingId !== s.id && (
                            <motion.div 
                              initial={{ opacity: 0, x: 10 }}
                              animate={{ opacity: 1, x: 0 }}
                              exit={{ opacity: 0, x: 10 }}
                              className="flex gap-1"
                            >
                              <button 
                                onClick={() => startEditing(s.id, s.text)}
                                className="p-1.5 rounded-lg hover:bg-white/40 transition-colors text-emerald-700"
                              >
                                <Edit2 className="w-3.5 h-3.5" />
                              </button>
                              <button 
                                onClick={() => onDeleteSuggestion?.(`${selectedClass!}-Global`, s.id)}
                                className="p-1.5 rounded-lg hover:bg-red-500/10 transition-colors text-red-600"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </motion.div>
                          )}
                        </AnimatePresence>
                      </div>
                    </div>
                  </GlassCard>
                )).reverse()
              ) : (
                <p className="text-emerald-700/50 text-center py-12 italic">No suggestions added yet.</p>
              )}
            </div>
          </div>
        );
      case "result":
        return (
          <div className="space-y-6">
            <div className="flex items-center gap-4">
              <button onClick={() => setView("list")} className="p-2 rounded-xl glass text-emerald-700">
                <ChevronLeft className="w-6 h-6" />
              </button>
              <h2 className="text-2xl font-bold text-emerald-900">Class {selectedClass} Results</h2>
            </div>
            <GlassCard className="overflow-x-auto p-0">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-emerald-500/10">
                    <th className="p-4 text-xs font-bold text-emerald-800 uppercase">Subject</th>
                    <th className="p-4 text-xs font-bold text-emerald-800 uppercase">Marks</th>
                    <th className="p-4 text-xs font-bold text-emerald-800 uppercase">Grade</th>
                    {userRole === "Teacher" && <th className="p-4 text-xs font-bold text-emerald-800 uppercase">Action</th>}
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/10">
                  {[
                    { sub: "Bangla", marks: 85, grade: "A+" },
                    { sub: "English", marks: 78, grade: "A" },
                    { sub: "Mathematics", marks: 92, grade: "A+" },
                    { sub: "Science", marks: 88, grade: "A+" }
                  ].map((row, i) => (
                    <tr key={i} className="hover:bg-white/10 transition-colors">
                      <td className="p-4 text-emerald-900 font-medium">{row.sub}</td>
                      <td className="p-4 text-emerald-900">{row.marks}</td>
                      <td className="p-4 font-bold text-emerald-700">{row.grade}</td>
                      {userRole === "Teacher" && (
                        <td className="p-4">
                          <AnimatePresence>
                            <motion.button 
                              initial={{ opacity: 0, scale: 0.8 }}
                              animate={{ opacity: 1, scale: 1 }}
                              exit={{ opacity: 0, scale: 0.8 }}
                              className="text-emerald-600 hover:text-emerald-800"
                            >
                              <Edit2 className="w-4 h-4" />
                            </motion.button>
                          </AnimatePresence>
                        </td>
                      )}
                    </tr>
                  ))}
                </tbody>
              </table>
              <div className="p-6 bg-emerald-600/10 flex justify-between items-center">
                <span className="font-bold text-emerald-900">Total GPA</span>
                <span className="text-2xl font-black text-emerald-700">5.00</span>
              </div>
            </GlassCard>
          </div>
        );
      case "attendance":
        const percent = attendance[selectedClass!] || 0;
        return (
          <div className="space-y-6">
            <div className="flex items-center gap-4">
              <button onClick={() => setView("list")} className="p-2 rounded-xl glass text-emerald-700">
                <ChevronLeft className="w-6 h-6" />
              </button>
              <h2 className="text-2xl font-bold text-emerald-900">Class {selectedClass} Attendance</h2>
            </div>
            <div className="flex flex-col items-center gap-8">
              <div 
                className={`relative w-64 h-64 ${userRole === "Teacher" ? "cursor-pointer group" : ""}`}
                onClick={() => userRole === "Teacher" && setIsEditingAttendance(!isEditingAttendance)}
              >
                <svg className="w-full h-full" viewBox="0 0 100 100">
                  <circle className="text-emerald-500/10 stroke-current" strokeWidth="10" fill="transparent" r="40" cx="50" cy="50" />
                  <motion.circle 
                    className="text-emerald-600 stroke-current" 
                    strokeWidth="10" 
                    strokeLinecap="round" 
                    fill="transparent" 
                    r="40" cx="50" cy="50"
                    initial={{ strokeDasharray: "0 251.2" }}
                    animate={{ strokeDasharray: `${(percent / 100) * 251.2} 251.2` }}
                    transition={{ duration: 1.5, ease: "easeOut" }}
                  />
                </svg>
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                  <span className="text-5xl font-black text-emerald-900">{percent}%</span>
                  <span className="text-xs font-bold text-emerald-700/60 uppercase tracking-widest">Monthly</span>
                  {userRole === "Teacher" && (
                    <Edit2 className="w-4 h-4 text-emerald-600 mt-2 opacity-0 group-hover:opacity-100 transition-opacity" />
                  )}
                </div>
              </div>

              <AnimatePresence>
                {isEditingAttendance && userRole === "Teacher" && (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 10 }}
                    className="w-full"
                  >
                    <GlassCard className="p-6 border-2 border-emerald-500/30">
                      <div className="space-y-4">
                        <div className="flex justify-between items-center">
                          <label className="text-sm font-bold text-emerald-900">Adjust Attendance (%)</label>
                          <span className="text-xl font-black text-emerald-600">{percent}%</span>
                        </div>
                        <input 
                          type="range"
                          min="0"
                          max="100"
                          value={percent}
                          onChange={(e) => onUpdateAttendance?.(selectedClass!, parseInt(e.target.value))}
                          className="w-full h-2 bg-emerald-100 rounded-lg appearance-none cursor-pointer accent-emerald-600"
                        />
                        <div className="flex gap-2 pt-2">
                          <input 
                            type="number"
                            min="0"
                            max="100"
                            value={percent}
                            onChange={(e) => onUpdateAttendance?.(selectedClass!, Math.min(100, Math.max(0, parseInt(e.target.value) || 0)))}
                            className="w-20 bg-white/50 border border-emerald-500/30 rounded-xl px-3 py-2 text-emerald-900 focus:outline-none font-bold"
                          />
                          <button 
                            onClick={() => setIsEditingAttendance(false)}
                            className="flex-1 bg-emerald-600 text-white rounded-xl font-bold"
                          >
                            Done
                          </button>
                        </div>
                      </div>
                    </GlassCard>
                  </motion.div>
                )}
              </AnimatePresence>

              <GlassCard className="w-full space-y-4">
                <div className="flex justify-between items-center">
                  <span className="text-emerald-800 font-medium">Total Classes</span>
                  <span className="font-bold text-emerald-900">24</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-emerald-800 font-medium">Present</span>
                  <span className="font-bold text-emerald-900">{Math.round((percent / 100) * 24)}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-emerald-800 font-medium">Absent</span>
                  <span className="font-bold text-red-500">{24 - Math.round((percent / 100) * 24)}</span>
                </div>
              </GlassCard>
            </div>
          </div>
        );
      case "routine":
        const periods = ["09:00 - 10:00", "10:00 - 11:00", "11:00 - 12:00"];
        const days = ["Sat", "Sun", "Mon", "Tue", "Wed", "Thu"];
        const classRoutine = routines?.[selectedClass!] || {};

        return (
          <div className="space-y-6">
            <div className="flex items-center gap-4">
              <button onClick={() => setView("list")} className="p-2 rounded-xl glass text-emerald-700">
                <ChevronLeft className="w-6 h-6" />
              </button>
              <h2 className="text-2xl font-bold text-emerald-900">Class {selectedClass} Routine</h2>
            </div>
            <GlassCard className="overflow-x-auto p-0">
              <table className="w-full text-left border-collapse min-w-[600px]">
                <thead>
                  <tr className="bg-emerald-500/10">
                    <th className="p-4 text-xs font-bold text-emerald-800 uppercase">Day</th>
                    {periods.map(p => (
                      <th key={p} className="p-4 text-xs font-bold text-emerald-800 uppercase">{p}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/10">
                  {days.map((day) => (
                    <tr key={day} className="hover:bg-white/10 transition-colors">
                      <td className="p-4 text-emerald-900 font-bold bg-emerald-500/5">{day}</td>
                      {periods.map(period => {
                        const subject = classRoutine[day]?.[period] || "No Class";
                        const isEditing = editingCell?.day === day && editingCell?.period === period;

                        return (
                          <td 
                            key={period} 
                            className={`p-4 text-sm text-emerald-800 cursor-pointer transition-all ${userRole === "Teacher" ? "hover:bg-emerald-500/10" : ""}`}
                            onClick={() => userRole === "Teacher" && setEditingCell({ day, period })}
                          >
                            {isEditing ? (
                              <div className="flex gap-2">
                                <input 
                                  autoFocus
                                  type="text"
                                  defaultValue={subject === "No Class" ? "" : subject}
                                  onBlur={(e) => {
                                    onUpdateRoutine?.(selectedClass!, day, period, e.target.value || "No Class");
                                    setEditingCell(null);
                                  }}
                                  onKeyDown={(e) => {
                                    if (e.key === "Enter") {
                                      onUpdateRoutine?.(selectedClass!, day, period, (e.target as HTMLInputElement).value || "No Class");
                                      setEditingCell(null);
                                    }
                                  }}
                                  className="w-full bg-white/50 border border-emerald-500/30 rounded px-2 py-1 text-xs focus:outline-none"
                                />
                              </div>
                            ) : (
                              <div className="flex items-center justify-between group">
                                <span>{subject}</span>
                                {userRole === "Teacher" && <Edit2 className="w-3 h-3 opacity-0 group-hover:opacity-40 transition-opacity" />}
                              </div>
                            )}
                          </td>
                        );
                      })}
                    </tr>
                  ))}
                </tbody>
              </table>
            </GlassCard>
          </div>
        );
      default:
        return null;
    }
  };

  return (
    <div className="px-6 pb-32">
      <AnimatePresence mode="wait">
        {view === "list" ? (
          <motion.div
            key="list"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <div className="flex items-center justify-between mb-8">
              <div>
                <h2 className="text-3xl font-bold text-emerald-900">Classes</h2>
                <p className="text-emerald-700/70">
                  {userRole === "Teacher" ? "Manage all academic resources" : `Resources for Class ${userClass}`}
                </p>
              </div>
              <AnimatePresence>
                {userRole === "Teacher" && (
                  <motion.button 
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.8 }}
                    className="p-3 rounded-2xl bg-emerald-600 text-white shadow-lg shadow-emerald-200 hover:bg-emerald-700 transition-all"
                  >
                    <Plus className="w-6 h-6" />
                  </motion.button>
                )}
              </AnimatePresence>
            </div>
            
            <div className="grid grid-cols-1 gap-4">
              {visibleClasses.map((num) => (
                <GlassCard key={num} className="relative overflow-hidden group">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 rounded-2xl bg-emerald-500/20 flex items-center justify-center text-emerald-700 font-bold text-xl">
                        {num}
                      </div>
                      <div>
                        <h3 className="text-xl font-bold text-emerald-900">Class {num}</h3>
                        <p className="text-sm text-emerald-700/60">Academic Session 2026</p>
                      </div>
                    </div>
                    <AnimatePresence>
                      {userRole === "Teacher" && (
                        <motion.button 
                          initial={{ opacity: 0, scale: 0.8 }}
                          animate={{ opacity: 1, scale: 1 }}
                          exit={{ opacity: 0, scale: 0.8 }}
                          className="p-2 rounded-xl hover:bg-white/40 transition-colors text-emerald-700"
                        >
                          <Edit2 className="w-5 h-5" />
                        </motion.button>
                      )}
                    </AnimatePresence>
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mt-4">
                    <button 
                      onClick={() => handleOpenView(num.toString(), "library")}
                      className="flex flex-col items-center gap-2 p-4 rounded-2xl bg-white/30 hover:bg-white/50 transition-all text-emerald-800 text-xs font-bold border border-white/20 haptic-glow"
                    >
                      <Book className="w-5 h-5" />
                      <span>Books</span>
                    </button>
                    <button 
                      onClick={() => handleOpenView(num.toString(), "result")}
                      className="flex flex-col items-center gap-2 p-4 rounded-2xl bg-white/30 hover:bg-white/50 transition-all text-emerald-800 text-xs font-bold border border-white/20 haptic-glow"
                    >
                      <BarChart3 className="w-5 h-5" />
                      <span>Result</span>
                    </button>
                    <button 
                      onClick={() => handleOpenView(num.toString(), "attendance")}
                      className="flex flex-col items-center gap-2 p-4 rounded-2xl bg-white/30 hover:bg-white/50 transition-all text-emerald-800 text-xs font-bold border border-white/20 haptic-glow"
                    >
                      <CheckCircle2 className="w-5 h-5" />
                      <span>Attendance</span>
                    </button>
                    <button 
                      onClick={() => handleOpenView(num.toString(), "routine")}
                      className="flex flex-col items-center gap-2 p-4 rounded-2xl bg-white/30 hover:bg-white/50 transition-all text-emerald-800 text-xs font-bold border border-white/20 haptic-glow"
                    >
                      <Clock className="w-5 h-5" />
                      <span>Routine</span>
                    </button>
                    <button 
                      onClick={() => handleOpenView(num.toString(), "homework")}
                      className="flex flex-col items-center gap-2 p-4 rounded-2xl bg-white/30 hover:bg-white/50 transition-all text-emerald-800 text-xs font-bold border border-white/20 haptic-glow"
                    >
                      <ClipboardList className="w-5 h-5" />
                      <span>Homework</span>
                    </button>
                    <button 
                      onClick={() => handleOpenView(num.toString(), "suggestions")}
                      className="flex flex-col items-center gap-2 p-4 rounded-2xl bg-white/30 hover:bg-white/50 transition-all text-emerald-800 text-xs font-bold border border-white/20 haptic-glow"
                    >
                      <Lightbulb className="w-5 h-5" />
                      <span>Suggestion</span>
                    </button>
                  </div>
                </GlassCard>
              ))}
            </div>
          </motion.div>
        ) : (
          <motion.div
            key="subview"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            {renderSubView()}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
