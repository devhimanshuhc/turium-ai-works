import Link from "next/link";

const FOOTER_LINKS = [
	{ label: "Documentation", href: "/docs" },
	{ label: "API reference", href: "/docs/reference/api" },
	{ label: "Design decisions", href: "/docs/reference/design-decisions" },
	{ label: "Evaluation", href: "/docs/reference/evaluation" },
];

export function LandingFooter() {
	return (
		<footer className="border-t border-(--landing-line)">
			<div className="mx-auto flex w-full max-w-[1440px] flex-col gap-6 px-6 py-10 text-sm text-(--landing-muted) md:flex-row md:items-center md:justify-between md:px-10">
				<p>Knowledge Inbox — built for the Turium AI full-stack assignment.</p>
				<nav aria-label="Footer" className="flex flex-wrap gap-x-6 gap-y-2">
					{FOOTER_LINKS.map((link) => (
						<Link
							key={link.href}
							href={link.href}
							className="inline-flex min-h-11 items-center transition-colors hover:text-(--landing-paper)"
						>
							{link.label}
						</Link>
					))}
				</nav>
			</div>
		</footer>
	);
}
