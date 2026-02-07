import Link from "next/link";
import Image from "next/image";

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-white text-black flex flex-col">
      {/* Main Content - Centered */}
      <main className="flex-1 flex flex-col items-center justify-center text-center px-4 sm:px-6 lg:px-8 pt-16 sm:pt-20 md:pt-24">
        {/* Hero Text Image */}
        <Image
          src="/images/hero-text.svg"
          alt="Generative CRM - A prompt-driven, AI-generated CRM for SaaS founders."
          width={1500}
          height={120}
          className="w-full max-w-3xl h-auto mb-10"
          priority
        />


        {/* CTA Button */}
        <Link
          href="/dashboard"
          className="inline-flex items-center justify-center px-6 sm:px-8 py-3 sm:py-4 bg-black text-white rounded-full font-medium text-sm sm:text-base md:text-lg transition-all hover:scale-105 hover:bg-zinc-800 shadow-lg"
        >
          Lets Make your intelligent CRM
        </Link>
      </main>

      {/* Footer with Crowd Illustration */}
      <footer className="w-full mt-auto">
        <div className="relative w-full overflow-hidden">
          <Image
            src="/images/crowd.png"
            alt="Diverse community of SaaS founders"
            width={1920}
            height={400}
            className="w-full h-auto object-cover object-top"
            priority
          />
        </div>
      </footer>
    </div>
  );
}
