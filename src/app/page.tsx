import Link from "next/link";
import { ArrowRight } from "lucide-react";

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-white text-black flex flex-col justify-between items-center py-20 px-4 relative overflow-hidden">

      {/* Top Label */}
      <div className="absolute top-10 flex flex-col items-center">
        <div className="h-10 w-[1px] bg-zinc-300 mb-2"></div>
        <span className="text-[10px] tracking-[0.2em] font-medium text-zinc-400 uppercase">Cloud Canvas</span>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col items-center justify-center text-center max-w-4xl mx-auto z-10">
        <h1 className="text-5xl md:text-7xl font-bold tracking-tight mb-6 leading-[1.1]">
          Adaptable, Intelligent and Ever Evolving CRM
          <br />
          <span className="block mt-2">for your any Kind of Business</span>
        </h1>
        <p className="text-sm font-medium text-zinc-500 uppercase tracking-wide mb-12">
          Apple studio style intro
        </p>

        <Link
          href="/dashboard"
          className="group relative inline-flex items-center gap-2 px-8 py-4 bg-black text-white rounded-full font-medium text-lg transition-all hover:scale-105 hover:bg-zinc-900 shadow-xl"
        >
          <span>Lets Make your intelligent CRM</span>
          <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform" />
        </Link>
      </div>

      {/* Footer Illustration Placeholder */}
      <div className="w-full max-w-6xl mt-12 opacity-80 mix-blend-multiply pointer-events-none">
        {/* Placeholder for the crowd image. In real app, we'd use <Image /> */}
        <div className="w-full h-64 bg-zinc-100 rounded-t-[3rem] border-t border-zinc-200 flex items-end justify-center pb-8">
          <span className="text-zinc-300 font-bold text-6xl tracking-tighter opacity-20">COMMUNITY</span>
        </div>
      </div>

    </div>
  );
}
