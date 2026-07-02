import { NavLink } from "react-router-dom"
import { cn } from "../lib/utils"

import { NavigationMenu, NavigationMenuItem, NavigationMenuLink, NavigationMenuList } from "./ui/navigation-menu"

const pages = [
	{ label: "Home", to: "/" },
	{ label: "Gallery", to: "/gallery" },
	{ label: "Projects", to: "/projects" },
	{ label: "Blog", to: "/blog" },
]

export function Navbar() {
	return (
		<NavigationMenu className="backdrop-grayscale backdrop-brightness-75 backdrop-blur-[1px] h-min border-b max-w-none w-screen justify-center flex-grow-0">
			<NavigationMenuList>
				{pages.map(({ label, to }) => (
					<NavigationMenuItem key={to}>
						<NavigationMenuLink
							className={cn(
								"relative h-12 rounded-none focus:bg-[unset] animate-all",
								"after:absolute after:bottom-0 after:left-0 after:w-full after:h-[2px] after:bg-transparent after:transition-colors",
								"hover:after:bg-theme-fg-1",
							)}
							render={props => (
								<NavLink
									to={to}
									end={to === "/"}
									className={({ isActive }) =>
										cn(
											props.className,
											"text-theme-fg-1 hover:text-theme-fg-0 hover:bg-[unset]",
											isActive && "text-theme-fg-0 after:!bg-theme-fg-0",
										)}
								>
									{label}
								</NavLink>
							)}
						/>
					</NavigationMenuItem>
				))}
			</NavigationMenuList>
		</NavigationMenu>
	)
}
