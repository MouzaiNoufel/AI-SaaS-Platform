import { Navbar } from '@/components/layout/navbar';
import { Footer } from '@/components/layout/footer';
import { AnimatedHomePage } from '@/components/home/animated-home';

export default function HomePage() {
  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      <AnimatedHomePage />
      <Footer />
    </div>
  );
}

