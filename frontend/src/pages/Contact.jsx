import { useState } from "react";
import MainLayout from "../layouts/MainLayout";

function Contact() {
  const [isSubmitted, setIsSubmitted] = useState(false);

  const handleSubmit = (e) => {
    e.preventDefault();
    setIsSubmitted(true);
    // You can wire this up to EmailJS or your Node backend later!
  };

  return (
    <MainLayout>
      <div className="min-h-screen bg-slate-950 pt-32 pb-20 px-6 flex flex-col items-center relative overflow-hidden">
        
        {/* Background Glow */}
        <div className="absolute top-1/4 left-0 w-[400px] h-[400px] bg-cyan-900/10 blur-[120px] rounded-full pointer-events-none"></div>

        <div className="relative z-10 w-full max-w-3xl">
          <div className="text-center mb-12">
            <h1 className="text-5xl font-bold text-white mb-4">Get in Touch</h1>
            <p className="text-slate-400 text-lg">Have questions about OmniSight's risk models? Send us a message.</p>
          </div>

          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-8 md:p-12 shadow-2xl">
            {isSubmitted ? (
              <div className="text-center py-16 animate-fade-in">
                <div className="w-20 h-20 bg-[#00AB55]/10 rounded-full flex items-center justify-center mx-auto mb-6">
                  <svg className="w-10 h-10 text-[#00AB55]" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path></svg>
                </div>
                <h2 className="text-3xl font-bold text-white mb-4">Message Sent!</h2>
                <p className="text-slate-400 text-lg">We will get back to you as soon as possible.</p>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-slate-400 text-sm font-medium mb-2">First Name</label>
                    <input required type="text" className="w-full bg-slate-950 border border-slate-800 focus:border-[#00AB55] rounded-xl px-4 py-3 outline-none text-white transition-colors" placeholder="John" />
                  </div>
                  <div>
                    <label className="block text-slate-400 text-sm font-medium mb-2">Last Name</label>
                    <input required type="text" className="w-full bg-slate-950 border border-slate-800 focus:border-[#00AB55] rounded-xl px-4 py-3 outline-none text-white transition-colors" placeholder="Doe" />
                  </div>
                </div>

                <div>
                  <label className="block text-slate-400 text-sm font-medium mb-2">Email Address</label>
                  <input required type="email" className="w-full bg-slate-950 border border-slate-800 focus:border-[#00AB55] rounded-xl px-4 py-3 outline-none text-white transition-colors" placeholder="john@example.com" />
                </div>

                <div>
                  <label className="block text-slate-400 text-sm font-medium mb-2">Message</label>
                  <textarea required rows="5" className="w-full bg-slate-950 border border-slate-800 focus:border-[#00AB55] rounded-xl px-4 py-3 outline-none text-white transition-colors resize-none" placeholder="How can we help you?"></textarea>
                </div>

                <button type="submit" className="w-full py-4 bg-[#00AB55] hover:bg-[#008a45] text-white rounded-xl font-bold text-lg transition-colors">
                  Send Message
                </button>
              </form>
            )}
          </div>
        </div>
      </div>
    </MainLayout>
  );
}

export default Contact;