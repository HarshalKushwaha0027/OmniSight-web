import { motion } from "framer-motion";
import MainLayout from "../layouts/MainLayout";
import { Link } from "react-router-dom";
import logo from "../assets/ABT_logo.png"; 

function About() {
  return (
    <MainLayout>
      <div className="bg-slate-950 text-white overflow-hidden">

        {/* --- SECTION 1: THE FULL HERO TEXT --- */}
        <section className="min-h-[90vh] flex flex-col justify-center items-center px-8 text-center relative pt-32 pb-10">

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="uppercase tracking-[0.3em] text-[#00AB55] mb-8 text-sm z-10 font-medium"
          >
            Predictive Risk Intelligence
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 1, delay: 0.2 }}
            className="z-10 w-full"
          >
            <h1 className="text-5xl md:text-7xl lg:text-8xl font-black leading-tight max-w-5xl mx-auto">
              Building the Future of
              <span className="block text-[#00AB55] mt-2">Financial Risk Analytics</span>
            </h1>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 1, delay: 0.4 }}
            className="z-10 w-full"
          >
            <p className="text-slate-400 text-lg md:text-xl mt-12 max-w-3xl mx-auto leading-9">
              OmniSight combines machine learning, quantitative finance,
              and interactive analytics to identify systematic risk,
              volatility clustering, and early warning signals in
              financial markets.
            </p>
          </motion.div>

          {/* Ambient Background Glow for Text */}
          <div className="absolute w-[600px] h-[600px] bg-slate-900/40 blur-[150px] rounded-full top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 pointer-events-none"></div>

        </section>

        {/* --- SECTION 2: THE DEDICATED LOGO REVEAL --- */}
        {/* min-h-screen ensures it is the ONLY thing on the screen when centered */}
        <section className="min-h-screen flex justify-center items-center relative py-20 z-20">
          
          <motion.div
            initial={{ opacity: 0, scale: 0.5 }}
            whileInView={{ opacity: 1, scale: 1 }}
            transition={{ duration: 1.2, ease: "easeOut" }}
            // margin: "-20%" means the animation won't trigger until the logo is perfectly in the middle of the screen
            viewport={{ once: true, margin: "-20%" }} 
            className="relative w-full flex justify-center"
          >
            {/* Continuous floating animation */}
            <motion.div
              animate={{ y: [0, -20, 0] }}
              transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }}
              className="relative flex justify-center items-center"
            >
              {/* Intense localized glow behind the logo */}
              <div className="absolute inset-0 bg-[#00AB55]/20 blur-[120px] rounded-full scale-[2] pointer-events-none"></div>

              {/* The actual logo - Scaled up massively for impact */}
              <img
                src={logo}
                alt="OmniSight Logo"
                className="relative w-72 md:w-[450px] lg:w-[550px] h-auto drop-shadow-[0_0_60px_rgba(0,171,85,0.5)]"
              />
            </motion.div>
          </motion.div>

        </section>

        {/* --- SECTION 3: ANALYTICAL FRAMEWORK --- */}
        <section className="py-40 px-8 bg-gradient-to-b from-slate-950 to-slate-900">

          <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-20 items-center">

            <motion.div
              initial={{ opacity: 0, x: -80 }}
              whileInView={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.9 }}
              viewport={{ once: true }}
            >

              <p className="text-[#00AB55] text-sm uppercase tracking-[0.3em] mb-5">
                Analytical Framework
              </p>

              <h2 className="text-5xl font-bold leading-tight mb-8">
                Quantitative Models Designed for
                Dynamic Market Conditions
              </h2>

              <p className="text-slate-400 text-lg leading-9">
                OmniSight integrates CAPM decomposition, rolling OLS regression,
                volatility clustering analysis, and machine learning classification
                to identify hidden market instability patterns.
              </p>

            </motion.div>

            <motion.div
              initial={{ opacity: 0, x: 80 }}
              whileInView={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.9 }}
              viewport={{ once: true }}
              className="bg-slate-900 border border-slate-800 rounded-3xl p-10 shadow-2xl"
            >

              <div className="space-y-8">

                <div>
                  <h3 className="text-2xl font-semibold mb-3 text-[#00AB55]">
                    CAPM Risk Decomposition
                  </h3>

                  <p className="text-slate-400 leading-8">
                    Separates systematic market exposure from company-specific risk behavior.
                  </p>
                </div>

                <div>
                  <h3 className="text-2xl font-semibold mb-3 text-yellow-400">
                    Volatility Clustering
                  </h3>

                  <p className="text-slate-400 leading-8">
                    Detects persistent periods of instability through rolling volatility analysis.
                  </p>
                </div>

                <div>
                  <h3 className="text-2xl font-semibold mb-3 text-cyan-400">
                    ML Early Warning System
                  </h3>

                  <p className="text-slate-400 leading-8">
                    Logistic regression models estimate future high-risk probability events.
                  </p>
                </div>

              </div>

            </motion.div>

          </div>

        </section>

        {/* --- SECTION 4: FEATURES --- */}
        <section className="py-40 px-8 bg-slate-900 relative overflow-hidden">

          <div className="absolute inset-0 bg-gradient-to-r from-[#00AB55]/5 to-transparent"></div>

          <div className="max-w-7xl mx-auto relative z-10">

            <motion.div
              initial={{ opacity: 0, y: 60 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8 }}
              viewport={{ once: true }}
              className="text-center mb-24"
            >

              <p className="text-[#00AB55] uppercase tracking-[0.3em] text-sm mb-5">
                Platform Capabilities
              </p>

              <h2 className="text-6xl font-black">
                Designed for Intelligent
                <span className="text-[#00AB55]"> Risk Monitoring</span>
              </h2>

            </motion.div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">

              {[
                {
                  title: "Predictive Analytics",
                  desc: "Forecast high-risk market events using statistical and ML-driven analysis.",
                },
                {
                  title: "Real-Time Risk Signals",
                  desc: "Monitor systematic exposure and volatility shifts across rolling windows.",
                },
                {
                  title: "Model Transparency",
                  desc: "Evaluate ROC, precision-recall, and classification reliability metrics.",
                },
              ].map((card, index) => (

                <motion.div
                  key={index}
                  initial={{ opacity: 0, y: 80 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.8, delay: index * 0.2 }}
                  viewport={{ once: true }}
                  whileHover={{ y: -10 }}
                  className="bg-slate-950 border border-slate-800 rounded-3xl p-10 shadow-2xl"
                >

                  <h3 className="text-3xl font-bold mb-6">
                    {card.title}
                  </h3>

                  <p className="text-slate-400 leading-8 text-lg">
                    {card.desc}
                  </p>

                </motion.div>

              ))}

            </div>

          </div>

        </section>

        {/* --- SECTION 5: FINAL CTA --- */}
        <section className="py-48 px-8 text-center relative bg-gradient-to-b from-slate-900 to-black overflow-hidden">

          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            whileInView={{ opacity: 1, scale: 1 }}
            transition={{ duration: 1 }}
            viewport={{ once: true }}
            className="relative z-10"
          >

            <p className="text-[#00AB55] uppercase tracking-[0.3em] mb-6 text-sm">
              The Vision
            </p>

            <h2 className="text-7xl font-black max-w-5xl mx-auto leading-tight">
              Turning Complex Market Data Into
              <span className="text-[#00AB55]"> Actionable Intelligence</span>
            </h2>

            <p className="text-slate-400 text-xl leading-9 mt-10 max-w-3xl mx-auto">
              OmniSight aims to bridge quantitative finance and modern frontend
              engineering to create an accessible, interactive, and scalable
              analytical risk intelligence platform.
            </p>

          </motion.div>

          {/* Glow Effects */}
          <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-[700px] h-[700px] bg-[#00AB55]/10 blur-[180px] rounded-full"></div>

        </section>

        {/* --- FOOTER --- */}
        <footer className="border-t border-slate-800 bg-black px-8 py-16">

          <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-center gap-8">

            <div>
              <h2 className="text-3xl font-bold text-[#00AB55]">
                OmniSight
              </h2>

              <p className="text-slate-500 mt-3">
                AI-Powered Financial Risk Intelligence Platform
              </p>
            </div>

            <div className="flex items-center gap-10 text-slate-400">
              <Link to="/dashboard" className="hover:text-white transition">
                Dashboard
              </Link>

              <Link  to="/dashboard#prediction" className="hover:text-white transition">
                Analytics
              </Link>

              <Link to="/docs" className="hover:text-white transition">Documentation</Link>
              <a 
                  href="https://github.com/HarshalKushwaha0027/OmniSight" 
                  target="_blank" 
                  rel="noopener noreferrer" 
                  className="hover:text-white transition"
                >
                  GitHub
              </a>
            </div>

          </div>

        </footer>

      </div>
    </MainLayout>
  );
}

export default About;