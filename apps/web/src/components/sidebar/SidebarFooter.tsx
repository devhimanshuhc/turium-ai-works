import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuTrigger,
} from "@repo/ui/components/dropdown-menu";
import {
	SidebarFooter as CnSidebarFooter,
	SidebarMenu,
	SidebarMenuButton,
	SidebarMenuItem,
} from "@repo/ui/components/sidebar";
import { Compass, type LucideIcon, Monitor, Moon, Sun } from "lucide-react";
import { usePathname, useRouter } from "next/navigation";
import { useTheme } from "next-themes";
import { useSyncExternalStore } from "react";
import { TOUR_RESTART_EVENT } from "@/constants";
import { NEW_CHAT_PATH } from "@/hooks";
import { resetTours } from "@/utils";

const THEME_OPTIONS: { value: string; label: string; icon: LucideIcon }[] = [
	{ value: "light", label: "Light", icon: Sun },
	{ value: "dark", label: "Dark", icon: Moon },
	{ value: "system", label: "System", icon: Monitor },
];

const subscribeToNothing = () => () => {};

const useIsHydrated = () =>
	useSyncExternalStore(
		subscribeToNothing,
		() => true,
		() => false,
	);

const SidebarFooter = () => {
	const { theme, setTheme } = useTheme();
	// The theme lives in localStorage, so the server cannot know it; render the
	// neutral "System" option until hydration to avoid a mismatch.
	const isHydrated = useIsHydrated();
	const activeTheme =
		(isHydrated && THEME_OPTIONS.find((option) => option.value === theme)) ||
		THEME_OPTIONS[2];

	const router = useRouter();
	const pathname = usePathname();

	const restartTour = () => {
		resetTours();
		if (pathname === NEW_CHAT_PATH) {
			window.dispatchEvent(new Event(TOUR_RESTART_EVENT));
		} else {
			router.push(NEW_CHAT_PATH);
		}
	};

	return (
		<CnSidebarFooter>
			<SidebarMenu>
				<SidebarMenuItem>
					<SidebarMenuButton onClick={restartTour}>
						<Compass className="size-4" />
						<span>Take the tour</span>
					</SidebarMenuButton>
				</SidebarMenuItem>
				<SidebarMenuItem>
					<DropdownMenu>
						<DropdownMenuTrigger
							render={
								<SidebarMenuButton>
									<activeTheme.icon className="size-4" />
									<span>Theme: {activeTheme.label}</span>
								</SidebarMenuButton>
							}
						/>
						<DropdownMenuContent align="end" side="top">
							{THEME_OPTIONS.map((option) => (
								<DropdownMenuItem
									key={option.value}
									onClick={() => setTheme(option.value)}
									className="cursor-pointer"
								>
									<option.icon className="h-4 w-4" />
									<span>{option.label}</span>
									{theme === option.value && (
										<div className="bg-primary ml-auto h-2 w-2 rounded-full" />
									)}
								</DropdownMenuItem>
							))}
						</DropdownMenuContent>
					</DropdownMenu>
				</SidebarMenuItem>
			</SidebarMenu>
		</CnSidebarFooter>
	);
};

export default SidebarFooter;
