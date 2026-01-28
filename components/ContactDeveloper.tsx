import React, { useState } from 'react';
import { ArrowLeft, Send } from 'lucide-react';
import { Toast } from './ui/Toast';

interface ContactDeveloperProps {
  language: 'en' | 'bn';
  onBack: () => void;
}

export const ContactDeveloper: React.FC<ContactDeveloperProps> = ({ language, onBack }) => {
  const [formData, setFormData] = useState({
    email: '',
    subject: '',
    message: ''
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [toast, setToast] = useState<{ msg: string; type: 'success' | 'error' } | null>(null);

  const showToast = (msg: string, type: 'success' | 'error' = 'success') => {
    setToast({ msg, type });
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const validateEmail = (email: string): boolean => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validation
    if (!formData.email.trim()) {
      showToast(language === 'en' ? 'Please enter your email' : 'আপনার ইমেইল দিন', 'error');
      return;
    }

    if (!validateEmail(formData.email)) {
      showToast(language === 'en' ? 'Please enter a valid email' : 'বৈধ ইমেইল দিন', 'error');
      return;
    }

    if (!formData.subject.trim()) {
      showToast(language === 'en' ? 'Please enter a subject' : 'বিষয় দিন', 'error');
      return;
    }

    if (!formData.message.trim()) {
      showToast(language === 'en' ? 'Please enter your message' : 'বার্তা দিন', 'error');
      return;
    }

    if (formData.message.length < 10) {
      showToast(language === 'en' ? 'Message must be at least 10 characters' : 'বার্তা কমপক্ষে ১০ অক্ষর হতে হবে', 'error');
      return;
    }

    setIsSubmitting(true);

    try {
      // Send email via FormSubmit.co (no signup required)
      // This service forwards form submissions directly to your email
      const formEndpoint = 'https://formsubmit.co/shoaibu.ramim@gmail.com';
      
      const formDataToSend = new FormData();
      formDataToSend.append('email', formData.email);
      formDataToSend.append('subject', formData.subject);
      formDataToSend.append('message', formData.message);
      formDataToSend.append('_subject', `Voter Slip Generator Contact: ${formData.subject}`);
      formDataToSend.append('_captcha', 'false'); // Disable captcha for better UX
      formDataToSend.append('_template', 'table'); // Use table template for email
      
      const response = await fetch(formEndpoint, {
        method: 'POST',
        body: formDataToSend,
        headers: {
          'Accept': 'application/json'
        }
      });

      if (response.ok) {
        showToast(language === 'en' ? 'Message sent successfully! I\'ll get back to you soon.' : 'বার্তা সফলভাবে পাঠানো হয়েছে! আমি শীঘ্রই আপনার সাথে যোগাযোগ করবো।', 'success');
        setFormData({ email: '', subject: '', message: '' });
        setTimeout(() => onBack(), 2000);
      } else {
        showToast(language === 'en' ? 'Failed to send message. Please try again.' : 'বার্তা পাঠাতে ব্যর্থ। আবার চেষ্টা করুন।', 'error');
      }
    } catch (error) {
      console.error('Error sending message:', error);
      showToast(language === 'en' ? 'Error sending message. Please check your connection.' : 'বার্তা পাঠাতে ত্রুটি। আপনার সংযোগ পরীক্ষা করুন।', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-slate-950 flex flex-col">
      {/* Header */}
      <header className="sticky top-0 z-30 w-full border-b border-gray-200 dark:border-slate-800 bg-white/80 dark:bg-slate-900/80 backdrop-blur-md">
        <div className="max-w-[1800px] mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center gap-4">
          <button
            onClick={onBack}
            className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-slate-800 transition-colors"
          >
            <ArrowLeft size={20} className="text-blue-600 dark:text-blue-400" />
          </button>
          <h1 className="text-xl font-bold bg-gradient-to-r from-blue-600 to-cyan-500 bg-clip-text text-transparent">
            {language === 'en' ? 'Contact Developer' : 'ডেভেলপারের সাথে যোগাযোগ করুন'}
          </h1>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 w-full max-w-2xl mx-auto p-4 sm:p-6 lg:p-8">
        <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-sm border border-gray-200 dark:border-slate-800 p-6 sm:p-8">
          <p className="text-gray-600 dark:text-gray-400 mb-8">
            {language === 'en'
              ? 'Have a question, suggestion, or found a bug? Let me know!'
              : 'কোনো প্রশ্ন, পরামর্শ বা বাগ পেয়েছেন? আমাকে জানান!'}
          </p>

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Email Field */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                {language === 'en' ? 'Your Email' : 'আপনার ইমেইল'}
              </label>
              <input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleInputChange}
                placeholder="you@example.com"
                className="w-full px-4 py-2 border border-gray-300 dark:border-slate-700 rounded-lg focus:ring-2 focus:ring-blue-500 bg-transparent text-gray-900 dark:text-gray-100 placeholder-gray-500"
              />
            </div>

            {/* Subject Field */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                {language === 'en' ? 'Subject' : 'বিষয়'}
              </label>
              <input
                type="text"
                name="subject"
                value={formData.subject}
                onChange={handleInputChange}
                placeholder={language === 'en' ? 'What is this about?' : 'এটি কিসের জন্য?'}
                className="w-full px-4 py-2 border border-gray-300 dark:border-slate-700 rounded-lg focus:ring-2 focus:ring-blue-500 bg-transparent text-gray-900 dark:text-gray-100 placeholder-gray-500"
              />
            </div>

            {/* Message Field */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                {language === 'en' ? 'Message' : 'বার্তা'}
              </label>
              <textarea
                name="message"
                value={formData.message}
                onChange={handleInputChange}
                placeholder={language === 'en' ? 'Your message here...' : 'আপনার বার্তা এখানে...'}
                rows={6}
                className="w-full px-4 py-2 border border-gray-300 dark:border-slate-700 rounded-lg focus:ring-2 focus:ring-blue-500 bg-transparent text-gray-900 dark:text-gray-100 placeholder-gray-500 resize-none"
              />
              <p className="text-xs text-gray-500 mt-1">
                {language === 'en' ? 'Minimum 10 characters' : 'ন্যূনতম ১০ অক্ষর'}
              </p>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={isSubmitting}
              className={`w-full py-3 px-4 rounded-lg font-bold text-white flex items-center justify-center gap-2 transition-all transform active:scale-95 ${
                isSubmitting
                  ? 'bg-gray-300 dark:bg-slate-800 cursor-not-allowed'
                  : 'bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700 shadow-lg shadow-blue-500/20'
              }`}
            >
              {isSubmitting ? (
                <>
                  <div className="animate-spin rounded-full h-5 w-5 border-2 border-white border-t-transparent"></div>
                  {language === 'en' ? 'Sending...' : 'পাঠাচ্ছে...'}
                </>
              ) : (
                <>
                  <Send size={20} />
                  {language === 'en' ? 'Send Query' : 'প্রশ্ন পাঠান'}
                </>
              )}
            </button>
          </form>

          {/* Developer Info */}
          <div className="mt-12 pt-8 border-t border-gray-200 dark:border-slate-800">
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
              {language === 'en' ? 'Direct Email:' : 'সরাসরি ইমেইল:'}
            </p>
            <a
              href="mailto:shoaibu.ramim@gmail.com"
              className="text-blue-600 dark:text-blue-400 hover:underline font-medium"
            >
              shoaibu.ramim@gmail.com
            </a>
          </div>
        </div>
      </main>

      {toast && (
        <Toast
          message={toast.msg}
          type={toast.type}
          onClose={() => setToast(null)}
        />
      )}
    </div>
  );
};
