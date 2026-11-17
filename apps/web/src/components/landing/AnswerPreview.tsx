"use client";

import { animate } from "animejs";
import { Library, ShieldCheck } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { PREVIEW_CHAT } from "@/constants";
import { splitCitationMarkers } from "@/utils";

const TYPE_SPEED_MS_PER_CHAR = 22;

function RenderedAnswer() {
	return (
		<>
			{splitCitationMarkers(PREVIEW_CHAT.answer).map((part, index) =>
				part.kind === "text" ? (
					<span key={index}>{part.text}</span>
				) : (
					<sup
						key={index}
						className="mx-0.5 rounded bg-(--landing-accent) px-1 text-[10px] font-semibold text-(--landing-accent-ink)"
					>
						{part.number}
					</sup>
				),
			)}
		</>
	);
}

/** The real product UI: a question, an answer typed out (anime.js), its source and verdict. */
export function AnswerPreview({ play }: { play: boolean }) {
	const typedRef = useRef<HTMLParagraphElement>(null);
	const [isTyped, setIsTyped] = useState(false);

	useEffect(() => {
		const reduceMotion = window.matchMedia(
			"(prefers-reduced-motion: reduce)",
		).matches;
		if (reduceMotion) return setIsTyped(true);
		if (!play) return;
		const text = PREVIEW_CHAT.answer;
		const progress = { characters: 0 };
		const typing = animate(progress, {
			characters: text.length,
			duration: text.length * TYPE_SPEED_MS_PER_CHAR,
			delay: 900,
			ease: "linear",
			modifier: Math.round,
			onUpdate: () => {
				if (typedRef.current)
					typedRef.current.textContent = text.slice(0, progress.characters);
			},
			onComplete: () => setIsTyped(true),
		});
		return () => {
			typing.revert();
		};
	}, [play]);

	return (
		<div
			data-hero-preview
			className="w-full overflow-hidden rounded-2xl border border-(--landing-line) bg-(--landing-panel) shadow-[0_40px_120px_-40px_rgb(0_0_0/0.9)]"
		>
			<div className="flex items-center gap-2 border-b border-(--landing-line) px-4 py-3">
				<span className="size-2.5 rounded-full bg-(--landing-paper)/15" />
				<span className="size-2.5 rounded-full bg-(--landing-paper)/15" />
				<span className="size-2.5 rounded-full bg-(--landing-paper)/15" />
				<span className="ml-3 flex items-center gap-1.5 rounded-full bg-(--landing-paper)/8 px-2.5 py-1 text-xs text-(--landing-muted)">
					<Library className="size-3" />
					{PREVIEW_CHAT.knowledgeBase}
				</span>
			</div>
			<div className="flex flex-col gap-4 p-5 text-sm md:p-6">
				<p className="ml-auto max-w-[80%] rounded-2xl bg-(--landing-paper)/8 px-4 py-2.5">
					{PREVIEW_CHAT.question}
				</p>
				<div className="min-h-[4.5rem] leading-relaxed">
					{isTyped ? <RenderedAnswer /> : <p ref={typedRef} />}
				</div>
				<div
					className={`flex flex-col gap-3 transition-[opacity,translate] duration-700 ${isTyped ? "translate-y-0 opacity-100" : "translate-y-2 opacity-0"}`}
				>
					<span className="flex w-fit items-center gap-1.5 rounded-full border border-(--landing-accent)/30 bg-(--landing-accent)/10 px-2.5 py-1 text-xs text-(--landing-accent)">
						<ShieldCheck className="size-3.5" />
						Verified against sources
					</span>
					<div className="rounded-xl border border-(--landing-line) p-3">
						<p className="text-xs font-medium">
							<span className="mr-2 text-(--landing-muted)">1</span>
							{PREVIEW_CHAT.source.title}
						</p>
						<p className="mt-1 line-clamp-2 text-xs text-(--landing-muted)">
							{PREVIEW_CHAT.source.snippet}
						</p>
					</div>
				</div>
			</div>
		</div>
	);
}
