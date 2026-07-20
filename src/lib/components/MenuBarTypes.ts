export type MenuItem = 
	{
		label: string
		action: () => void
	}

export type MenuBarProps = {
	menu: MenuItem[]
}
