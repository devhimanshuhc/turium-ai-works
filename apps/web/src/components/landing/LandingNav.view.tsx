import Link from "next/link";
import { APP_ENTRY_PATH, LANDING_LINKS } from "@/constants";

export function LandingNav() {
	return (
		<header
			data-landing-nav
			className="fixed inset-x-0 top-0 z-50 mix-blend-difference"
		>
			<nav className="mx-auto flex max-w-[1440px] items-center justify-between px-6 py-5 text-white md:px-10">
				<Link href="/" className="text-sm font-semibold tracking-tight">
					Knowledge Inbox
				</Link>
				<div className="flex items-center gap-6 text-sm">
					{LANDING_LINKS.map((link) => (
						<Link
							key={link.href}
							href={link.href}
							className="hidden bg-[linear-gradient(currentColor,currentColor)] bg-[length:0%_1px] bg-left-bottom bg-no-repeat pb-0.5 transition-[background-size] duration-300 hover:bg-[length:100%_1px] sm:inline"
						>
							{link.label}
						</Link>
					))}
					<Link
						href={APP_ENTRY_PATH}
						className="inline-flex min-h-11 items-center rounded-full border border-white/40 px-4 transition-colors hover:bg-white hover:text-black"
					>
						Open the inbox
					</Link>
				</div>
			</nav>
		</header>
	);
}
