"use client";

import { useState, useRef } from "react";
import { MessageSquare, Send, Mail, User, ShieldAlert, CheckCircle2, ChevronDown, Paperclip, X } from "lucide-react";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";

export default function SupportPage() {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState("");
  const [attachment, setAttachment] = useState<File | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [formData, setFormData] = useState({
    name: "",
    email: "",
    topic: "Вопрос",
    message: "",
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const file = e.target.files[0];
      // Простая проверка (например, до 10MB)
      if (file.size > 10 * 1024 * 1024) {
        setError("Размер файла не должен превышать 10 МБ");
        return;
      }
      setAttachment(file);
      setError("");
    }
  };

  const removeAttachment = () => {
    setAttachment(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError("");

    try {
      const submitData = new FormData();
      submitData.append("name", formData.name);
      submitData.append("email", formData.email);
      submitData.append("topic", formData.topic);
      submitData.append("message", formData.message);
      
      if (attachment) {
        submitData.append("attachment", attachment);
      }

      const res = await fetch("/api/support", {
        method: "POST",
        // При отправке FormData браузер сам установит нужный Content-Type boundary
        body: submitData,
      });

      const data = await res.json();

      if (!res.ok || !data.success) {
        throw new Error(data.error || "Не удалось отправить сообщение");
      }

      setSuccess(true);
      setFormData({ name: "", email: "", topic: "Вопрос", message: "" });
      setAttachment(null);
    } catch (err: any) {
      setError(err.message || "Произошла ошибка при отправке. Пожалуйста, попробуйте позже.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#fafcff] flex flex-col font-sans">
      <main className="flex-1 max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-12 lg:py-20 relative">
        
        {/* Background decorative elements */}
        <div className="absolute top-0 right-0 w-1/2 h-full bg-blue-50/50 -z-10 rounded-l-[5rem] hidden lg:block"></div>
        
        <Link href="/" className="inline-flex items-center text-slate-500 hover:text-blue-600 transition-colors mb-10 font-medium">
          <ArrowLeft className="w-4 h-4 mr-2" />
          Вернуться на главную
        </Link>
        
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-24 items-start">
          
          {/* Left Column: Info */}
          <div className="lg:col-span-5 flex flex-col pt-4">
            <div className="mb-6 inline-block self-start">
              <span className="text-xs font-bold uppercase tracking-widest text-blue-600 bg-blue-50 px-4 py-2 rounded-full">СЛУЖБА ПОДДЕРЖКИ</span>
            </div>
            
            <h1 className="text-4xl sm:text-5xl font-extrabold text-slate-900 mb-6 leading-tight tracking-tight">
              Как мы можем <br /> <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-indigo-600">вам помочь?</span>
            </h1>
            
            <p className="text-lg text-slate-600 leading-relaxed mb-10 font-medium">
              Остались вопросы по работе платформы? Столкнулись с технической проблемой или у вас есть предложения по сотрудничеству? Напишите нам, и наша команда свяжется с вами в ближайшее время.
            </p>
            
            <div className="space-y-8">
              <div className="flex gap-4 items-start">
                <div className="w-12 h-12 rounded-2xl bg-blue-100/50 text-blue-600 flex items-center justify-center shrink-0">
                  <Mail className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="text-lg font-bold text-slate-900 mb-1">Время ответа</h4>
                  <p className="text-slate-500 text-sm leading-relaxed">Обычно мы отвечаем в течение 24 часов в рабочие дни.</p>
                </div>
              </div>
              
              <div className="flex gap-4 items-start">
                <div className="w-12 h-12 rounded-2xl bg-indigo-100/50 text-indigo-600 flex items-center justify-center shrink-0">
                  <ShieldAlert className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="text-lg font-bold text-slate-900 mb-1">Технические проблемы</h4>
                  <p className="text-slate-500 text-sm leading-relaxed">Пожалуйста, прикладывайте к сообщению максимум деталей или скриншотов, если вы столкнулись с ошибкой в системе.</p>
                </div>
              </div>
            </div>
          </div>
          
          {/* Right Column: Form */}
          <div className="lg:col-span-7 w-full relative z-10">
            {/* Background Offset Card (Подложка) */}
            <div className="absolute inset-0 bg-blue-100/50 rounded-[3rem] -z-10 translate-x-4 translate-y-4 sm:translate-x-6 sm:translate-y-6"></div>
            
            <div className="bg-white p-8 sm:p-12 rounded-[3rem] shadow-[0_20px_50px_-15px_rgba(0,0,0,0.05)] border border-slate-50">
              
              {success ? (
                <div className="flex flex-col items-center justify-center text-center py-12">
                  <div className="w-20 h-20 bg-green-50 rounded-full flex items-center justify-center mb-6">
                    <CheckCircle2 className="w-10 h-10 text-green-500" />
                  </div>
                  <h3 className="text-2xl font-bold text-slate-900 mb-4">Сообщение отправлено!</h3>
                  <p className="text-slate-600 mb-8 max-w-md">
                    Спасибо, что написали нам. Мы получили ваше обращение и ответим вам на указанный email в ближайшее время.
                  </p>
                  <button 
                    onClick={() => setSuccess(false)}
                    className="px-6 py-3 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl transition-colors"
                  >
                    Отправить еще одно
                  </button>
                </div>
              ) : (
                <form onSubmit={handleSubmit} className="flex flex-col space-y-6">
                  {error && (
                    <div className="p-4 rounded-xl bg-red-50 text-red-600 text-sm font-medium border border-red-100">
                      {error}
                    </div>
                  )}
                  
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <label className="text-sm font-bold text-slate-700 ml-2">Как к вам обращаться?</label>
                      <div className="relative">
                        <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400">
                          <User className="w-5 h-5" />
                        </div>
                        <input 
                          type="text" 
                          name="name"
                          value={formData.name}
                          onChange={handleChange}
                          required
                          placeholder="Иван Иванов" 
                          className="w-full pl-12 pr-4 py-4 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all font-medium text-slate-900 placeholder-slate-400"
                        />
                      </div>
                    </div>
                    
                    <div className="space-y-2">
                      <label className="text-sm font-bold text-slate-700 ml-2">Ваш E-mail</label>
                      <div className="relative">
                        <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400">
                          <Mail className="w-5 h-5" />
                        </div>
                        <input 
                          type="email" 
                          name="email"
                          value={formData.email}
                          onChange={handleChange}
                          required
                          placeholder="ivan@example.com" 
                          className="w-full pl-12 pr-4 py-4 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all font-medium text-slate-900 placeholder-slate-400"
                        />
                      </div>
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <label className="text-sm font-bold text-slate-700 ml-2">Тема сообщения</label>
                    <div className="relative">
                      <select 
                        name="topic"
                        value={formData.topic}
                        onChange={handleChange}
                        className="w-full px-5 py-4 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all font-medium text-slate-900 appearance-none cursor-pointer"
                      >
                        <option value="Вопрос">Общий вопрос по платформе</option>
                        <option value="Сотрудничество">Сотрудничество и партнерство</option>
                        <option value="Техническая проблема">Сообщить о технической проблеке / Баг</option>
                        <option value="Предложение по развитию">Идеи по развитию проекта</option>
                        <option value="Жалоба">Жалобы или нарушения</option>
                      </select>
                      <div className="absolute right-5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none">
                        <ChevronDown className="w-5 h-5" />
                      </div>
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <label className="text-sm font-bold text-slate-700 ml-2">Сообщение</label>
                    <div className="relative">
                      <div className="absolute left-4 top-5 text-slate-400">
                        <MessageSquare className="w-5 h-5" />
                      </div>
                      <textarea 
                        name="message"
                        value={formData.message}
                        onChange={handleChange}
                        required
                        placeholder="Опишите ваш вопрос или предложение максимально подробно..." 
                        rows={5}
                        className="w-full pl-12 pr-4 py-4 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all font-medium text-slate-900 placeholder-slate-400 resize-none"
                      ></textarea>
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <label className="text-sm font-bold text-slate-700 ml-2">Прикрепить фото или скриншот</label>
                    <div className="relative">
                      {attachment ? (
                        <div className="flex items-center justify-between p-4 bg-blue-50 border border-blue-100 rounded-2xl">
                          <div className="flex items-center space-x-3 text-blue-700 font-medium truncate">
                            <Paperclip className="w-5 h-5 shrink-0" />
                            <span className="truncate text-sm">{attachment.name}</span>
                          </div>
                          <button 
                            type="button" 
                            onClick={removeAttachment}
                            className="p-1 hover:bg-blue-100 rounded-full text-blue-500 hover:text-blue-700 transition"
                          >
                            <X className="w-4 h-4" />
                          </button>
                        </div>
                      ) : (
                        <div 
                          onClick={() => fileInputRef.current?.click()}
                          className="flex items-center justify-center p-4 border-2 border-dashed border-slate-200 rounded-2xl hover:bg-slate-50 hover:border-blue-400 cursor-pointer transition text-slate-500 hover:text-blue-600 font-medium group"
                        >
                          <Paperclip className="w-5 h-5 mr-2 group-hover:block" />
                          <span>Нажмите, чтобы выбрать файл (до 10 МБ)</span>
                          <input 
                            type="file" 
                            ref={fileInputRef}
                            className="hidden" 
                            accept="image/*, .pdf"
                            onChange={handleFileChange}
                          />
                        </div>
                      )}
                    </div>
                  </div>
                  
                  <button 
                    type="submit" 
                    disabled={isSubmitting}
                    className="w-full sm:w-auto px-8 py-4 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-2xl transition-all shadow-[0_10px_20px_-10px_rgba(37,99,235,0.5)] hover:shadow-[0_10px_20px_-5px_rgba(37,99,235,0.6)] hover:-translate-y-0.5 disabled:opacity-70 disabled:cursor-not-allowed flex justify-center items-center group self-end"
                  >
                    {isSubmitting ? (
                      <span className="flex items-center gap-2">
                        <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                        Отправка...
                      </span>
                    ) : (
                      <>
                        Отправить сообщение
                        <Send className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform" />
                      </>
                    )}
                  </button>
                  
                </form>
              )}
              
            </div>
          </div>
          
        </div>
      </main>
    </div>
  );
}
