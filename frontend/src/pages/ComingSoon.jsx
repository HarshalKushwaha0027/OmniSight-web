import MainLayout from "../layouts/MainLayout";
import { Link } from "react-router-dom";

function ComingSoon({ title }) {
  return (
    <MainLayout>
      <div className="flex flex-col items-center justify-center min-h-screen bg-slate-950 px-6 text-center relative overflow-hidden">
        
        {/* Background Glow */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-[#00AB55]/10 blur-[120px] rounded-full pointer-events-none"></div>

        <div className="relative z-10 bg-slate-900/60 backdrop-blur-md border border-slate-800 p-12 rounded-3xl max-w-2xl w-full shadow-2xl">
          <div className="w-20 h-20 bg-slate-800 rounded-full flex items-center justify-center mx-auto mb-8 border border-slate-700">
            <svg className="w-10 h-10 text-[#00AB55]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z"></path>
            </svg>
          </div>
          
          <h1 className="text-4xl md:text-5xl font-bold text-white mb-4">
            {title}
          </h1>
          
          <p className="text-slate-400 text-lg mb-10 leading-relaxed">
            We are actively working on this section. Check back soon for updates as we continue to expand the OmniSight platform.
          </p>
          
          <Link 
            to="/" 
            className="inline-block px-8 py-3 bg-[#00AB55]/10 border border-[#00AB55]/30 text-[#00AB55] hover:bg-[#00AB55] hover:text-white rounded-full font-medium transition-all duration-300"
          >
            Return to Home
          </Link>
        </div>
      </div>
    </MainLayout>
  );
}

export default ComingSoon;