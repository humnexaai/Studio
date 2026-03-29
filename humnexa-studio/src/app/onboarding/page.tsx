import type { Metadata } from "next";
import OnboardingClient from "./OnboardingClient";

export const metadata: Metadata = {
  title: "Get Started",
};

export default function OnboardingPage(): React.ReactElement {
  return <OnboardingClient />;
}
