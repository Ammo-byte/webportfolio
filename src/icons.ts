import {
  ArrowDown, ArrowRight, ArrowUp, BookOpen, Box, BriefcaseBusiness,
  ChartColumn, ChartLine, ChevronDown, ChevronLeft, ChevronRight,
  Contact, Database, Download, ExternalLink, Eye, FileText, GitBranch,
  Link, Mail, Moon, Repeat, Search, Send, Settings, Shield, Sun,
  Target, Terminal, TriangleAlert, Users, X, Zap, createElement,
  type IconNode,
} from "lucide";

const icons: Record<string, IconNode> = {
  "arrow-down": ArrowDown, "arrow-right": ArrowRight, "arrow-up": ArrowUp,
  "book-open": BookOpen, box: Box, briefcase: BriefcaseBusiness,
  chart: ChartLine, "chart-column-decreasing": ChartColumn,
  "chevron-down": ChevronDown, "chevron-left": ChevronLeft,
  "chevron-right": ChevronRight, close: X, contact: Contact,
  database: Database, download: Download, "external-link": ExternalLink,
  eye: Eye, "file-text": FileText, "git-branch": GitBranch,
  link: Link, mail: Mail, moon: Moon, repeat: Repeat, search: Search,
  send: Send, "settings-cog": Settings, shield: Shield,
  "cloud-sun": Sun, cloud: Sun, target: Target, terminal: Terminal,
  "warning-diamond": TriangleAlert, users: Users, zap: Zap,
};

const hydrateIcon = (icon: HTMLElement): void => {
  const name = icon.dataset.icon;
  if (!name || icon.dataset.renderedIcon === name) return;
  icon.replaceChildren(createElement(icons[name] ?? ArrowRight, {
    width: 20, height: 20, "stroke-width": 1.5, "aria-hidden": "true",
  }));
  icon.dataset.renderedIcon = name;
};

export const hydratePixelIcons = (scope: ParentNode = document): void => {
  scope.querySelectorAll<HTMLElement>("[data-icon]").forEach(hydrateIcon);
};

export const createPixelIcon = (name: string): HTMLSpanElement => {
  const icon = document.createElement("span");
  icon.className = "pixel-icon";
  icon.dataset.icon = name;
  icon.setAttribute("aria-hidden", "true");
  hydrateIcon(icon);
  return icon;
};
