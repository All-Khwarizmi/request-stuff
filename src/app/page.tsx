
import LandingHero from "./components/LandingHero";

import LandingHeader from "./components/LandingHeader";
import LandingFeatures from "./components/LandingFeatures";
import LandingFooter from "./components/LandingFooter";

export default function Component() {
  return (
    <div className="flex flex-col min-h-[100dvh]">
      <main className="flex-1">
        <LandingHeader />
        <LandingHero />
        <LandingFeatures />
     
      </main>
      <LandingFooter />
    </div>
  );
}
