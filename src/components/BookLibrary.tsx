import React, { useState } from "react";
import { Book, Plus, ChevronLeft, Lightbulb, Send, Edit2, X, Check, Trash2 } from "lucide-react";
import GlassCard from "./GlassCard";
import { motion, AnimatePresence } from "motion/react";
import { UserRole } from "./LoginView";
import { BookSuggestionData } from "../App";

interface BookLibraryProps {
  classId: string;
  userRole: UserRole;
  suggestions: BookSuggestionData;
  onAddSuggestion: (bookKey: string, suggestion: string) => void;
  onUpdateSuggestion: (bookKey: string, id: string, newText: string) => void;
  onDeleteSuggestion?: (bookKey: string, id: string) => void;
  onBack: () => void;
}

const NCTB_BOOKS = [
  { id: "Bangla", name: "Bangla (বাংলা)", color: "bg-red-500/20", iconColor: "text-red-600" },
  { id: "English", name: "English", color: "bg-blue-500/20", iconColor: "text-blue-600" },
  { id: "Math", name: "Mathematics (গণিত)", color: "bg-amber-500/20", iconColor: "text-amber-600" },
  { id: "Science", name: "Science (বিজ্ঞান)", color: "bg-emerald-500/20", iconColor: "text-emerald-600" },
  { id: "BGS", name: "BGS (বাংলাদেশ ও বিশ্বপরিচয়)", color: "bg-purple-500/20", iconColor: "text-purple-600" },
  { id: "Religion", name: "Religion (ধর্ম)", color: "bg-teal-500/20", iconColor: "text-teal-600" },
  { id: "ICT", name: "ICT (তথ্য ও যোগাযোগ প্রযুক্তি)", color: "bg-indigo-500/20", iconColor: "text-indigo-600" },
  { id: "Physics", name: "Physics (পদার্থবিজ্ঞান)", color: "bg-cyan-500/20", iconColor: "text-cyan-600" },
  { id: "Chemistry", name: "Chemistry (রসায়ন)", color: "bg-orange-500/20", iconColor: "text-orange-600" },
  { id: "Biology", name: "Biology (জীববিজ্ঞান)", color: "bg-green-500/20", iconColor: "text-green-600" },
];

export default function BookLibrary({ classId, userRole, suggestions, onAddSuggestion, onUpdateSuggestion, onDeleteSuggestion, onBack }: BookLibraryProps) {
  const [selectedBook, setSelectedBook] = useState<string | null>(null);
  const [showInputBar, setShowInputBar] = useState(false);
  const [newSuggestion, setNewSuggestion] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editText, setEditText] = useState("");

  const bookKey = selectedBook ? `${classId}-${selectedBook}` : "";
  const bookSuggestions = suggestions[bookKey] || [];

  const handleAddSuggestion = () => {
    if (newSuggestion.trim() && selectedBook) {
      onAddSuggestion(bookKey, newSuggestion.trim());
      setNewSuggestion("");
      setShowInputBar(false);
    }
  };

  const handleUpdate = (id: string) => {
    if (editText.trim() && selectedBook) {
      onUpdateSuggestion(bookKey, id, editText.trim());
      setEditingId(null);
      setEditText("");
    }
  };

  const startEditing = (id: string, currentText: string) => {
    setEditingId(id);
    setEditText(currentText);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <button onClick={onBack} className="p-2 rounded-xl glass text-emerald-700">
          <ChevronLeft className="w-6 h-6" />
        </button>
        <h2 className="text-2xl font-bold text-emerald-900">Class {classId} Library</h2>
      </div>

      <AnimatePresence mode="wait">
        {!selectedBook ? (
          <motion.div
            key="grid"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="grid grid-cols-2 sm:grid-cols-3 gap-4"
          >
            {NCTB_BOOKS.map((book) => (
              <GlassCard
                key={book.id}
                onClick={() => setSelectedBook(book.id)}
                className="flex flex-col items-center justify-center text-center p-4 gap-3 aspect-square"
              >
                <div className={`w-12 h-12 rounded-2xl ${book.color} flex items-center justify-center`}>
                  <Book className={`w-6 h-6 ${book.iconColor}`} />
                </div>
                <span className="text-sm font-bold text-emerald-900 leading-tight">
                  {book.name}
                </span>
              </GlassCard>
            ))}
          </motion.div>
        ) : (
          <motion.div
            key="details"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="space-y-6"
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <button onClick={() => { setSelectedBook(null); setEditingId(null); }} className="text-emerald-700 font-bold text-sm">
                  Books
                </button>
                <span className="text-emerald-300">/</span>
                <span className="text-emerald-900 font-bold">{selectedBook}</span>
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
                        value={newSuggestion}
                        onChange={(e) => setNewSuggestion(e.target.value)}
                        placeholder="Add important topic or suggestion..."
                        className="flex-1 bg-white/30 border border-white/20 rounded-xl px-4 py-3 text-emerald-900 focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
                      />
                      <button 
                        onClick={handleAddSuggestion}
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

            <GlassCard className="space-y-6">
              <div className="flex items-center gap-3 text-emerald-800">
                <Lightbulb className="w-6 h-6 text-amber-500" />
                <h3 className="text-xl font-bold">Important Topics & Suggestions</h3>
              </div>

              <div className="space-y-3">
                {bookSuggestions.length > 0 ? (
                  bookSuggestions.map((s, i) => (
                    <div 
                      key={s.id} 
                      className={`p-4 rounded-2xl bg-white/30 border border-white/20 text-emerald-900 flex flex-col gap-1 transition-all duration-500 ${
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
                            <div className="flex items-start gap-3">
                              <div className="w-2 h-2 rounded-full bg-emerald-500 mt-2 shrink-0" />
                              <span>{s.text}</span>
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
                                  onClick={() => onDeleteSuggestion?.(bookKey, s.id)}
                                  className="p-1.5 rounded-lg hover:bg-red-500/10 transition-colors text-red-600"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              </motion.div>
                            )}
                          </AnimatePresence>
                        </div>
                      </div>
                    </div>
                  )).reverse()
                ) : (
                  <p className="text-emerald-700/50 text-center py-8 italic">No suggestions added yet.</p>
                )}
              </div>
            </GlassCard>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
