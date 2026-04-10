import { useState, useRef, useEffect, useMemo } from "react";
import { motion, AnimatePresence, useAnimationFrame } from "motion/react";
import { MessageSquare, Send, X, Mic, Volume2, Sparkles, Bot, User } from "lucide-react";
import { GoogleGenAI } from "@google/genai";
import GlassCard from "./GlassCard";
import { UserData, HomeworkData } from "../App";

interface AIAssistantProps {
  user: UserData;
  homework: HomeworkData;
  onAddHomework: (classId: string, task: string) => void;
  tourTrigger?: number;
  signInTrigger?: { name: string; role: string } | null;
  postTrigger?: { classId: string; type: string; isUpdate?: boolean } | null;
}

export default function AIAssistant({ user, homework, onAddHomework, tourTrigger, signInTrigger, postTrigger }: AIAssistantProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isFullScreen, setIsFullScreen] = useState(false);
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });
  const [input, setInput] = useState("");
  const [messages, setMessages] = useState<{ role: "user" | "ai"; content: string }[]>([
    { role: "ai", content: "Assalamu Alaikum! I am your AI Elite Assistant. How can I help you today?" }
  ]);
  const [isTyping, setIsTyping] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

  useEffect(() => {
    if (signInTrigger) {
      const welcomeText = `Welcome to the ELITE team, ${signInTrigger.name}. Your profile has been added to the gallery.`;
      setMessages(prev => [...prev, { role: "ai", content: welcomeText }]);
      speak(welcomeText);
    }
  }, [signInTrigger]);

  useEffect(() => {
    if (postTrigger) {
      const { classId, type, isUpdate } = postTrigger;
      const announceText = isUpdate 
        ? `Update successful! Class ${classId} can now see the revised ${type}.`
        : `Post successful! Class ${classId} can now see the new ${type}.`;
      setMessages(prev => [...prev, { role: "ai", content: announceText }]);
      speak(announceText);
    }
  }, [postTrigger]);

  useEffect(() => {
    if (tourTrigger && tourTrigger > 0) {
      const tourText = `Assalamu Alaikum ${user.name}! Welcome to TNHS ELITE ASK. Let me give you a quick tour. At the bottom, you can navigate between Home, Classes, Notice, Gallery, and About Us. In the Classes section, you'll find your books, results, and routine. I am always here in this floating bubble to help you with homework or any questions. Enjoy your premium academic experience!`;
      
      setMessages(prev => [...prev, { role: "ai", content: tourText }]);
      setIsOpen(true);
      speak(tourText);
    }
  }, [tourTrigger]);

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      setMousePos({ x: e.clientX, y: e.clientY });
    };
    window.addEventListener("mousemove", handleMouseMove);
    return () => window.removeEventListener("mousemove", handleMouseMove);
  }, []);

  const AIBubble = ({ size = "md" }: { size?: "sm" | "md" | "lg" }) => {
    const bubbleSize = size === "sm" ? "w-10 h-10" : size === "md" ? "w-16 h-16" : "w-32 h-32";
    const iconSize = size === "sm" ? "w-5 h-5" : size === "md" ? "w-8 h-8" : "w-16 h-16";
    
    return (
      <div className={`${bubbleSize} relative flex items-center justify-center`}>
        {/* Outer Glow */}
        <div className="absolute inset-0 bg-emerald-400/30 rounded-full blur-xl animate-pulse-soft" />
        
        {/* Bubble Base */}
        <div className="absolute inset-0 bg-gradient-to-br from-emerald-400 to-emerald-600 rounded-full shadow-2xl border-2 border-white/50 overflow-hidden">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_30%,rgba(255,255,255,0.4),transparent)]" />
          <motion.div 
            animate={{ 
              rotate: 360,
              scale: [1, 1.1, 1]
            }}
            transition={{ repeat: Infinity, duration: 10, ease: "linear" }}
            className="absolute inset-0 opacity-20"
          >
            <Sparkles className="w-full h-full text-white" />
          </motion.div>
        </div>
        
        {/* Bot Icon */}
        <div className="relative z-10">
          <Bot className={`${iconSize} text-white drop-shadow-[0_0_8px_rgba(255,255,255,0.5)]`} />
        </div>
      </div>
    );
  };

  const speak = (text: string) => {
    if ("speechSynthesis" in window) {
      const utterance = new SpeechSynthesisUtterance(text);
      // Try to find a Bengali voice if possible, otherwise default
      const voices = window.speechSynthesis.getVoices();
      const bnVoice = voices.find(v => v.lang.includes("bn"));
      if (bnVoice) utterance.voice = bnVoice;
      utterance.rate = 0.9;
      window.speechSynthesis.speak(utterance);
    }
  };

  const handleSend = async () => {
    if (!input.trim()) return;

    const userMsg = input.trim();
    setInput("");
    setMessages(prev => [...prev, { role: "user", content: userMsg }]);
    setIsTyping(true);

    try {
      const systemPrompt = `
        You are 'AI Elite Assistant' for TNHS ELITE ASK school app.
        Current User: ${user.name} (${user.role})
        User's Class: ${user.className || "N/A"}
        
        Current Homework Data: ${JSON.stringify(homework)}
        
        Capabilities:
        1. If a student asks about homework (e.g., "আজকের বাড়ির কাজ কী?" or "What is today's homework?"), 
           look up the homework for their class (${user.className}) and provide it.
        2. If a teacher asks to add homework (e.g., "Add homework for Class 9: Physics Chapter 4"), 
           you must identify the class and the task. 
           If you identify a command to add homework, return a JSON object in your response like this: 
           {"action": "ADD_HOMEWORK", "classId": "9", "task": "Physics Chapter 4", "reply": "Sure! I've added the homework for Class 9."}
        
        Language: Speak in a mix of Bengali and English (Hinglish/Benglish style).
        Tone: Helpful, premium, and respectful.
      `;

      const response = await ai.models.generateContent({
        model: "gemini-3-flash-preview",
        contents: userMsg,
        config: {
          systemInstruction: systemPrompt,
        }
      });

      const aiText = response.text || "I'm sorry, I couldn't process that.";
      
      // Check for JSON action
      try {
        const jsonMatch = aiText.match(/\{.*\}/s);
        if (jsonMatch) {
          const data = JSON.parse(jsonMatch[0]);
          if (data.action === "ADD_HOMEWORK" && user.role === "Teacher") {
            onAddHomework(data.classId, data.task);
            setMessages(prev => [...prev, { role: "ai", content: data.reply }]);
            speak(data.reply);
          } else {
            setMessages(prev => [...prev, { role: "ai", content: aiText }]);
            speak(aiText);
          }
        } else {
          // Check for homework query specifically to read it out loud
          if (userMsg.includes("বাড়ির কাজ") || userMsg.toLowerCase().includes("homework")) {
            const classHomework = homework[user.className || ""] || [];
            const hwText = classHomework.length > 0 
              ? `Class ${user.className} এর আজকের বাড়ির কাজ হলো: ${classHomework.join(", ")}`
              : `Class ${user.className} এর জন্য কোনো বাড়ির কাজ পাওয়া যায়নি।`;
            
            setMessages(prev => [...prev, { role: "ai", content: hwText }]);
            speak(hwText);
          } else {
            setMessages(prev => [...prev, { role: "ai", content: aiText }]);
            speak(aiText);
          }
        }
      } catch (e) {
        setMessages(prev => [...prev, { role: "ai", content: aiText }]);
        speak(aiText);
      }

    } catch (error) {
      console.error("AI Error:", error);
      setMessages(prev => [...prev, { role: "ai", content: "Sorry, I'm having trouble connecting right now." }]);
    } finally {
      setIsTyping(false);
    }
  };

  return (
    <>
      {/* Floating AI Bubble */}
      <motion.button
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.9 }}
        onClick={() => { setIsOpen(true); setIsFullScreen(true); }}
        className="fixed bottom-24 right-6 z-50 p-1 rounded-full animate-float"
      >
        <AIBubble size="md" />
      </motion.button>

      {/* Full-Screen Glass AI Interface */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, backdropFilter: "blur(0px)" }}
            animate={{ opacity: 1, backdropFilter: "blur(20px)" }}
            exit={{ opacity: 0, backdropFilter: "blur(0px)" }}
            className="fixed inset-0 z-[300] flex flex-col bg-emerald-900/40"
          >
            {/* Pulsing Background Animation */}
            <div className="absolute inset-0 overflow-hidden pointer-events-none">
              <motion.div 
                animate={{ 
                  scale: [1, 1.2, 1],
                  opacity: [0.1, 0.2, 0.1]
                }}
                transition={{ repeat: Infinity, duration: 8 }}
                className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-emerald-400 rounded-full blur-[120px]"
              />
            </div>

            <div className="relative flex-1 flex flex-col max-w-4xl mx-auto w-full p-6">
              {/* Header */}
              <div className="flex items-center justify-between mb-8">
                <div className="flex items-center gap-4">
                  <AIBubble size="sm" />
                  <div>
                    <h2 className="text-2xl font-bold text-white">AI Elite Assistant</h2>
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 bg-emerald-400 rounded-full animate-pulse" />
                      <span className="text-xs text-emerald-100/60 font-bold uppercase tracking-widest">Neural Link Active</span>
                    </div>
                  </div>
                </div>
                <button 
                  onClick={() => setIsOpen(false)}
                  className="p-3 rounded-2xl bg-white/10 text-white hover:bg-white/20 transition-all"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>

              {/* Messages Area */}
              <div ref={scrollRef} className="flex-1 overflow-y-auto space-y-6 px-4 mb-6 scrollbar-hide">
                {messages.map((msg, i) => (
                  <motion.div 
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    key={i} 
                    className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}
                  >
                    <div className={`flex gap-3 max-w-[85%] ${msg.role === "user" ? "flex-row-reverse" : "flex-row"}`}>
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${
                        msg.role === "user" ? "bg-emerald-500" : "bg-emerald-900"
                      }`}>
                        {msg.role === "user" ? <User className="w-4 h-4 text-white" /> : <Bot className="w-4 h-4 text-emerald-400" />}
                      </div>
                      <div className={`p-4 rounded-3xl text-sm leading-relaxed ${
                        msg.role === "user" 
                          ? "bg-emerald-600 text-white rounded-tr-none" 
                          : "glass border-white/20 text-emerald-50 text-emerald-900 rounded-tl-none"
                      }`}>
                        {msg.content}
                      </div>
                    </div>
                  </motion.div>
                ))}
                {isTyping && (
                  <div className="flex justify-start">
                    <div className="flex gap-3">
                      <div className="w-8 h-8 rounded-full bg-emerald-900 flex items-center justify-center">
                        <Bot className="w-4 h-4 text-emerald-400" />
                      </div>
                      <div className="glass border-white/20 p-4 rounded-3xl rounded-tl-none">
                        <div className="flex gap-1">
                          <div className="w-1.5 h-1.5 bg-emerald-400 rounded-full animate-bounce" />
                          <div className="w-1.5 h-1.5 bg-emerald-400 rounded-full animate-bounce [animation-delay:0.2s]" />
                          <div className="w-1.5 h-1.5 bg-emerald-400 rounded-full animate-bounce [animation-delay:0.4s]" />
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Quick Actions */}
              <div className="flex gap-3 mb-4 overflow-x-auto pb-2 scrollbar-hide">
                {user.role === "Student" ? (
                  <button 
                    onClick={() => { setInput("Give me all the HW"); handleSend(); }}
                    className="whitespace-nowrap px-4 py-2 rounded-xl glass border-white/20 text-white text-xs font-bold hover:bg-white/10 transition-all"
                  >
                    Give me all the HW 📚
                  </button>
                ) : (
                  <button 
                    onClick={() => { setInput("What about the students?"); handleSend(); }}
                    className="whitespace-nowrap px-4 py-2 rounded-xl glass border-white/20 text-white text-xs font-bold hover:bg-white/10 transition-all"
                  >
                    What about the students? 👨‍🎓
                  </button>
                )}
                <button 
                  onClick={() => setInput("What's the next exam?")}
                  className="whitespace-nowrap px-4 py-2 rounded-xl glass border-white/20 text-white text-xs font-bold hover:bg-white/10 transition-all"
                >
                  Next Exam? ⏳
                </button>
                <button 
                  onClick={() => setInput("Tell me a school tip")}
                  className="whitespace-nowrap px-4 py-2 rounded-xl glass border-white/20 text-white text-xs font-bold hover:bg-white/10 transition-all"
                >
                  Study Tip 💡
                </button>
              </div>

              {/* Input Area */}
              <div className="glass border-white/20 p-4 rounded-[32px] mb-8">
                <div className="flex gap-3">
                  <input
                    type="text"
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    onKeyPress={(e) => e.key === "Enter" && handleSend()}
                    placeholder="Ask Elite AI anything..."
                    className="flex-1 bg-transparent text-white placeholder:text-emerald-100/40 focus:outline-none px-2"
                  />
                  <div className="flex gap-2">
                    <button className="p-3 rounded-2xl hover:bg-white/10 transition-all text-emerald-100">
                      <Mic className="w-5 h-5" />
                    </button>
                    <button 
                      onClick={handleSend}
                      className="p-3 rounded-2xl bg-emerald-500 text-white shadow-lg shadow-emerald-400/20 hover:bg-emerald-400 transition-all"
                    >
                      <Send className="w-5 h-5" />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
