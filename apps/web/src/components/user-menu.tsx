import { Trans, useTranslation } from "react-i18next";
import { LogOut, Monitor, Moon, Sun } from "lucide-react";
import { useRouter } from "@tanstack/react-router";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useTheme } from "@/contexts/theme";
import { authClient } from "@/lib/auth";

type Theme = "light" | "dark" | "system";
type Locale = "en" | "fr";

const THEME_OPTIONS: { value: Theme; icon: React.ReactNode }[] = [
  { value: "light", icon: <Sun size={14} /> },
  { value: "system", icon: <Monitor size={14} /> },
  { value: "dark", icon: <Moon size={14} /> },
];

const LOCALE_OPTIONS: Locale[] = ["en", "fr"];

function getInitials(name: string) {
  return name
    .split(" ")
    .map((part) => part[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
}

export interface UserMenuProps {
  username: string;
  name: string;
  email: string;
  image?: string | null;
  onLogout: () => void;
}

export function UserMenu({ username, name, email, image, onLogout }: UserMenuProps) {
  const { t, i18n } = useTranslation("auth");
  const { theme, setTheme } = useTheme();
  const router = useRouter();

  const handleThemeChange = (newTheme: Theme) => {
    setTheme(newTheme);
    authClient.updateUser({ theme: newTheme });
    router.invalidate();
  };

  const handleLocaleChange = (locale: Locale) => {
    i18n.changeLanguage(locale);
    authClient.updateUser({ locale });
    router.invalidate();
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button className="flex items-center gap-2 rounded-md px-2 py-1 text-sm outline-none hover:bg-accent focus-visible:ring-2 focus-visible:ring-ring">
          <Avatar size="sm">
            {image && <AvatarImage src={image} alt={`${username}-profile-picture`} />}
            <AvatarFallback>{getInitials(name)}</AvatarFallback>
          </Avatar>
          <div className="flex flex-col items-start leading-tight">
            <span className="font-medium">{username}</span>
          </div>
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-52">
        <DropdownMenuLabel>
          <div className="flex flex-col">
            <span>{name}</span>
            <span className="text-xs font-normal text-muted-foreground">{email}</span>
          </div>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <div className="px-2 py-1.5 flex items-center justify-between gap-2">
          <span className="text-xs text-muted-foreground">
            <Trans t={t}>Theme</Trans>
          </span>
          <div className="flex items-center gap-0.5">
            {THEME_OPTIONS.map(({ value, icon }) => (
              <button
                key={value}
                onClick={() => handleThemeChange(value)}
                className={`p-1 rounded transition-colors ${theme === value ? "bg-accent text-accent-foreground" : "text-muted-foreground hover:text-foreground hover:bg-accent/50"}`}
              >
                {icon}
              </button>
            ))}
          </div>
        </div>
        <div className="px-2 py-1.5 flex items-center justify-between gap-2">
          <span className="text-xs text-muted-foreground">
            <Trans t={t}>Language</Trans>
          </span>
          <div className="flex items-center gap-0.5">
            {LOCALE_OPTIONS.map((locale) => (
              <button
                key={locale}
                onClick={() => handleLocaleChange(locale)}
                className={`px-1.5 py-0.5 rounded text-xs font-medium uppercase transition-colors ${i18n.language === locale ? "bg-accent text-accent-foreground" : "text-muted-foreground hover:text-foreground hover:bg-accent/50"}`}
              >
                {locale}
              </button>
            ))}
          </div>
        </div>
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={onLogout} className="text-red-400">
          <LogOut />
          <Trans t={t}>Log out</Trans>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
