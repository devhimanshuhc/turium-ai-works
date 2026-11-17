import { Button } from "@repo/ui/components/button";
import type { TooltipRenderProps } from "react-joyride";

export function TourTooltip({
	step,
	index,
	size,
	isLastStep,
	backProps,
	primaryProps,
	skipProps,
	tooltipProps,
}: TooltipRenderProps) {
	return (
		<div
			{...tooltipProps}
			className="w-[340px] max-w-[calc(100vw-2rem)] rounded-xl border bg-popover p-4 text-popover-foreground shadow-2xl"
		>
			<div className="flex items-center justify-between text-muted-foreground text-xs tabular-nums">
				<span>
					Step {index + 1} of {size}
				</span>
				{!isLastStep && (
					<button
						{...skipProps}
						type="button"
						className="rounded-sm hover:text-foreground"
					>
						Skip tour
					</button>
				)}
			</div>
			{step.title && (
				<h2 className="mt-2 font-semibold text-base">{step.title}</h2>
			)}
			<div className="mt-1 text-muted-foreground text-sm leading-relaxed">
				{step.content}
			</div>
			<div className="mt-4 flex items-center justify-between gap-4">
				<div className="flex gap-1" aria-hidden>
					{Array.from({ length: size }, (_, dot) => (
						<span
							key={dot}
							className={`h-1.5 rounded-full transition-all ${dot === index ? "w-4 bg-primary" : "w-1.5 bg-muted-foreground/30"}`}
						/>
					))}
				</div>
				<div className="flex gap-2">
					{index > 0 && (
						<Button {...backProps} variant="ghost" size="sm">
							Back
						</Button>
					)}
					<Button {...primaryProps} size="sm">
						{isLastStep ? "Done" : "Next"}
					</Button>
				</div>
			</div>
		</div>
	);
}
