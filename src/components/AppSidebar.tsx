import { NavLink, useLocation } from "react-router-dom";
import { Home, BookOpen, Layers, Sparkles, MessageSquare, Users, Target, Trophy, LogOut } from "lucide-react";
import {
  Sidebar, SidebarContent, SidebarGroup, SidebarGroupContent, SidebarGroupLabel,
  SidebarMenu, SidebarMenuButton, SidebarMenuItem, useSidebar, SidebarHeader, SidebarFooter,
} from "@/components/ui/sidebar";
import { Logo } from "./Logo";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "./ui/button";

const main = [
  { title: "Início", url: "/app", icon: Home, end: true },
  { title: "Matérias", url: "/app/subjects", icon: BookOpen },
  { title: "Flashcards", url: "/app/study", icon: Layers },
  { title: "Gerar com IA", url: "/app/create", icon: Sparkles },
  { title: "Chat com tutor", url: "/app/chat", icon: MessageSquare },
  { title: "Plano de estudos", url: "/app/plan", icon: Target },
];
const social = [
  { title: "Grupos", url: "/app/groups", icon: Users },
  { title: "Conquistas", url: "/app/achievements", icon: Trophy },
];

export function AppSidebar() {
  const { state } = useSidebar();
  const collapsed = state === "collapsed";
  const location = useLocation();
  const { signOut } = useAuth();

  const renderItem = (item: typeof main[number]) => (
    <SidebarMenuItem key={item.url}>
      <SidebarMenuButton asChild>
        <NavLink
          to={item.url}
          end={item.end}
          className={({ isActive }) =>
            `flex items-center gap-3 px-3 py-2 rounded-lg transition-smooth ${
              isActive ? "bg-primary-soft text-primary font-medium" : "hover:bg-muted"
            }`
          }
        >
          <item.icon className="h-4 w-4 shrink-0" />
          {!collapsed && <span className="text-sm">{item.title}</span>}
        </NavLink>
      </SidebarMenuButton>
    </SidebarMenuItem>
  );

  return (
    <Sidebar collapsible="icon">
      <SidebarHeader className="p-4 border-b">
        {!collapsed ? <Logo /> : <div className="flex justify-center"><Logo size="sm" /></div>}
      </SidebarHeader>
      <SidebarContent>
        <SidebarGroup>
          {!collapsed && <SidebarGroupLabel>Estudo</SidebarGroupLabel>}
          <SidebarGroupContent><SidebarMenu>{main.map(renderItem)}</SidebarMenu></SidebarGroupContent>
        </SidebarGroup>
        <SidebarGroup>
          {!collapsed && <SidebarGroupLabel>Comunidade</SidebarGroupLabel>}
          <SidebarGroupContent><SidebarMenu>{social.map(renderItem)}</SidebarMenu></SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
      <SidebarFooter className="p-3 border-t">
        <Button variant="ghost" size="sm" className="w-full justify-start" onClick={signOut}>
          <LogOut className="h-4 w-4" />
          {!collapsed && <span className="ml-2">Sair</span>}
        </Button>
      </SidebarFooter>
    </Sidebar>
  );
}