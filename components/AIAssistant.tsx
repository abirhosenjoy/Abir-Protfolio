import React, { useState, useRef, useEffect } from 'react';
import { GoogleGenAI } from '@google/genai';
import { ChatMessage, PortfolioData } from '../types';

interface MultimodalMessage extends ChatMessage {
  image?: string; // base64 data
}

interface AIAssistantProps {
  data: PortfolioData;
}

const AIAssistant: React.FC<AIAssistantProps> = ({ data }) => {
  const { profile, projects, skills, timeline } = data;
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<MultimodalMessage[]>([
    { role: 'model', text: `Hello! I'm ${profile.name}'s official AI assistant. I'm trained on ${profile.name}'s professional history. Ask me about specific projects like ${projects[0]?.title || 'my work'} or my expertise in ${skills[0]?.title || 'Biomedical Engineering'}.` }
  ]);
  const [input, setInput] = useState('');
  const [selectedImage, setSelectedImage] = useState<{ data: string, mimeType: string } | null>(null);
  const [isTyping, setIsTyping] = useState(false);
  
  const scrollRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, isTyping]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onloadend = () => {
      const base64Data = (reader.result as string).split(',')[1];
      setSelectedImage({
        data: base64Data,
        mimeType: file.type
      });
    };
    reader.readAsDataURL(file);
  };

  const handleSend = async () => {
    if ((!input.trim() && !selectedImage) || isTyping) return;

    const userText = input.trim();
    const userImage = selectedImage;
    
    setMessages(prev => [...prev, { 
      role: 'user', 
      text: userText || (userImage ? "Sent an image for analysis" : ""),
      image: userImage ? `data:${userImage.mimeType};base64,${userImage.data}` : undefined
    }]);
    
    setInput('');
    setSelectedImage(null);
    setIsTyping(true);

    try {
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
      
      const parts: any[] = [];
      if (userImage) {
        parts.push({
          inlineData: {
            data: userImage.data,
            mimeType: userImage.mimeType
          }
        });
      }
      
      // Constructing deep context for the AI
      const systemContext = `
        You are a high-level professional AI assistant for ${profile.fullName}. 
        Use the following verified data to answer questions about them.
        
        BIO: ${profile.bio}
        
        PROJECTS:
        ${projects.map(p => `- ${p.title} (${p.category}): ${p.description}`).join('\n')}
        
        SKILLS:
        ${skills.map(s => `- ${s.title}: ${s.items.join(', ')}`).join('\n')}
        
        CAREER HIGHLIGHTS:
        ${timeline.slice(0, 5).map(t => `- ${t.date}: ${t.title} at ${t.subtitle}`).join('\n')}

        CONTACT: Email: ${profile.email}, Phone: ${profile.phone}, Location: ${profile.location}
        
        INSTRUCTIONS:
        1. Be professional, innovative, and encouraging.
        2. If asked about a project, provide specific details from the context.
        3. If an image is provided, analyze it through the lens of a Biomedical Engineer if relevant.
        4. Keep responses concise but impactful.
      `;

      parts.push({
        text: `${systemContext}\n\nUser Message: ${userText || "Please analyze this image based on your context."}`
      });

      const response = await ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: { parts },
        config: {
          temperature: 0.7,
          maxOutputTokens: 800,
          thinkingConfig: { thinkingBudget: 400 },
        }
      });

      const responseText = response.text || "I've processed your request. How else can I assist with your inquiry about Abir's portfolio?";
      setMessages(prev => [...prev, { role: 'model', text: responseText }]);
    } catch (error) {
      console.error("Gemini Error:", error);
      setMessages(prev => [...prev, { role: 'model', text: "I encountered an error connecting to my neural core. Please try again in a moment!" }]);
    } finally {
      setIsTyping(false);
    }
  };

  return (
    <div className="fixed bottom-6 right-6 z-[60] print:hidden">
      {isOpen ? (
        <div className="glass-card w-80 md:w-96 h-[550px] flex flex-col rounded-3xl shadow-2xl border border-slate-700 overflow-hidden animate-in slide-in-from-bottom-4 duration-300">
          <div className="bg-brand-600 p-4 flex justify-between items-center">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-white/20 rounded-full flex items-center justify-center">
                <i className="fa-solid fa-robot text-white text-xs"></i>
              </div>
              <div>
                <h3 className="text-white font-bold text-sm">{profile.name}'s Assistant</h3>
                <span className="text-[10px] text-brand-100 flex items-center gap-1">
                  <span className="w-1.5 h-1.5 bg-green-400 rounded-full"></span> Knowledge Base Synced
                </span>
              </div>
            </div>
            <button onClick={() => setIsOpen(false)} className="text-white hover:text-brand-100">
              <i className="fa-solid fa-xmark text-xl"></i>
            </button>
          </div>

          <div 
            ref={scrollRef}
            className="flex-1 overflow-y-auto p-4 space-y-4 bg-dark-900/50"
          >
            {messages.map((m, idx) => (
              <div key={idx} className={`flex flex-col ${m.role === 'user' ? 'items-end' : 'items-start'}`}>
                {m.image && (
                  <img src={m.image} alt="User upload" className="max-w-[70%] rounded-xl mb-2 border border-slate-700 shadow-lg" />
                )}
                <div className={`max-w-[85%] p-3 rounded-2xl text-sm ${
                  m.role === 'user' 
                  ? 'bg-brand-600 text-white rounded-tr-none shadow-lg' 
                  : 'bg-slate-800 text-slate-200 rounded-tl-none border border-slate-700 shadow-sm'
                }`}>
                  {m.text}
                </div>
              </div>
            ))}
            {isTyping && (
              <div className="flex justify-start">
                <div className="bg-slate-800 p-3 rounded-2xl rounded-tl-none border border-slate-700 flex gap-1 items-center">
                  <div className="w-1.5 h-1.5 bg-brand-500 rounded-full animate-bounce"></div>
                  <div className="w-1.5 h-1.5 bg-brand-500 rounded-full animate-bounce delay-100"></div>
                  <div className="w-1.5 h-1.5 bg-brand-500 rounded-full animate-bounce delay-200"></div>
                </div>
              </div>
            )}
          </div>

          <div className="p-4 bg-dark-900 border-t border-slate-800 space-y-3">
            {selectedImage && (
              <div className="relative inline-block animate-in fade-in zoom-in duration-200">
                <img 
                  src={`data:${selectedImage.mimeType};base64,${selectedImage.data}`} 
                  alt="Preview" 
                  className="w-16 h-16 object-cover rounded-lg border-2 border-brand-500"
                />
                <button 
                  onClick={() => setSelectedImage(null)}
                  className="absolute -top-2 -right-2 bg-red-500 text-white w-5 h-5 rounded-full flex items-center justify-center text-[10px] shadow-lg"
                >
                  <i className="fa-solid fa-x"></i>
                </button>
              </div>
            )}
            
            <div className="relative flex items-center gap-2">
              <input 
                type="file" 
                ref={fileInputRef} 
                onChange={handleFileChange} 
                className="hidden" 
                accept="image/*"
              />
              <button 
                onClick={() => fileInputRef.current?.click()}
                className={`w-10 h-10 rounded-full flex items-center justify-center transition ${selectedImage ? 'bg-brand-900 text-brand-400' : 'bg-slate-800 text-slate-400 hover:text-white'}`}
                title="Upload image"
              >
                <i className="fa-solid fa-paperclip"></i>
              </button>
              
              <div className="flex-1 relative">
                <input 
                  type="text"
                  placeholder="Ask about projects..."
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleSend()}
                  className="w-full bg-slate-800 border border-slate-700 rounded-full py-2.5 px-4 text-sm text-white focus:outline-none focus:border-brand-500 transition"
                />
              </div>
              
              <button 
                onClick={handleSend}
                disabled={(!input.trim() && !selectedImage) || isTyping}
                className="w-10 h-10 bg-brand-600 text-white rounded-full flex items-center justify-center hover:bg-brand-700 transition disabled:opacity-50 shrink-0"
              >
                <i className="fa-solid fa-paper-plane text-xs"></i>
              </button>
            </div>
          </div>
        </div>
      ) : (
        <button 
          onClick={() => setIsOpen(true)}
          className="w-14 h-14 bg-brand-600 text-white rounded-full shadow-2xl flex items-center justify-center hover:scale-110 transition duration-300 group relative"
        >
          <i className="fa-solid fa-robot text-xl"></i>
          <span className="absolute -top-1 -right-1 bg-green-500 w-4 h-4 rounded-full border-2 border-dark-900"></span>
          <div className="absolute right-full mr-4 bg-dark-900 px-3 py-1.5 rounded-lg border border-slate-700 text-xs font-bold text-white whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none">
            Ask Portfolio Assistant
          </div>
        </button>
      )}
    </div>
  );
};

export default AIAssistant;