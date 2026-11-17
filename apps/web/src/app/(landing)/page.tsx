import type { Metadata } from "next";
import { LandingPage } from "@/components/landing/LandingPage";
import { instrumentSerif } from "@/lib/fonts";
import "./landing.css";

export const metadata: Metadata = {
	title: "Knowledge Inbox — ask anything you've ever saved",
	description:
		"Save notes, links and files, then ask questions. Answers stream in with numbered sources, and every claim is checked against them.",
};

export default function Home() {
	return <LandingPage fontClassName={instrumentSerif.variable} />;
}
