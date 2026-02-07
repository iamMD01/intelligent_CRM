import Link from "next/link";
import Image from "next/image";

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-white text-black flex flex-col">
      {/* Main Content */}
      <main className="flex-1 flex flex-col items-center justify-center text-center px-4 sm:px-6 lg:px-8 pt-20">

        {/* HERO SECTION */}
        <section className="relative w-full overflow-hidden">

          {/* BACKGROUND BAND */}
          <div className="absolute inset-x-0 top-1/2 -translate-y-1/2 
                h-[1200px] w-full 
                rounded-[100px] overflow-hidden">
            <img
              src="/images/hero.gif"
              alt=""
              className="w-full h-full object-contain rotate-90"
            />
          </div>

          {/* HERO CONTENT */}
          <div className="relative z-10 flex flex-col items-center justify-center text-center px-6 py-40">
            <Image
              src="/images/hero-text.svg"
              alt="Generative CRM"
              width={1200}
              height={260}
              className="w-full max-w-6xl h-auto"
              priority
            />
          </div>

        </section>

        {/* CTA BUTTON */}
        <Link
          href="/dashboard"
          className="
            mt-24
            inline-flex
            items-center
            justify-center
            px-8
            py-4
            bg-black
            text-white
            rounded-full
            font-bold
            text-base
            transition
            hover:scale-105
            hover:bg-zinc-800
            shadow-lg
          "
        >
          Lets Make your intelligent CRM
        </Link>
      </main>

      {/* FOOTER */}
      <footer className="w-full mt-auto">
        <div className="relative w-full overflow-hidden">
          <Image
            src="/images/crowd.png"
            alt="Diverse community of SaaS founders"
            width={1920}
            height={420}
            className="w-full h-auto object-cover object-top"
            priority
          />
        </div>
      </footer>
    </div>
  );
}
