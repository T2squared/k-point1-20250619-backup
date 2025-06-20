import { useState } from "react";
import { Link, useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { queryClient } from "@/lib/queryClient";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Coins, Menu, X, Home, History, Settings, LogOut } from "lucide-react";
import type { User } from "@shared/schema";

interface NavigationProps {
  user: User;
}

export default function Navigation({ user }: NavigationProps) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [location] = useLocation();

  const navigationItems = [
    { href: "/", label: "ダッシュボード", icon: Home },
    ...(user.role === 'admin' || user.role === 'superadmin' ? [{ href: "/admin", label: "管理画面", icon: Settings }] : []),
  ];

  const isActive = (href: string) => {
    if (href === "/") return location === "/";
    return location.startsWith(href);
  };

  return (
    <>
      <nav className="bg-white shadow-sm border-b border-gray-200 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <Link href="/" className="flex items-center space-x-2">
                  <Coins className="h-8 w-8 text-primary" />
                  <h1 className="text-xl font-bold text-primary">K-point</h1>
                </Link>
              </div>
              
              <div className="hidden md:block ml-10">
                <div className="flex items-baseline space-x-4">
                  {navigationItems.map((item) => (
                    <Link key={item.href} href={item.href}>
                      <Button
                        variant={isActive(item.href) ? "default" : "ghost"}
                        size="sm"
                        className={isActive(item.href) ? "bg-primary text-white" : "text-gray-600 hover:text-gray-900"}
                      >
                        <item.icon className="h-4 w-4 mr-2" />
                        {item.label}
                      </Button>
                    </Link>
                  ))}
                </div>
              </div>
            </div>

            <div className="flex items-center space-x-4">
              {/* Point Balance */}
              <div className="flex items-center space-x-2 bg-gray-100 px-3 py-2 rounded-lg">
                <Coins className="h-4 w-4 text-secondary" />
                <span className="text-sm font-medium">残高: {user.pointBalance}</span>
              </div>

              {/* User Menu */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" className="flex items-center space-x-2 p-2">
                    <Avatar className="h-8 w-8">
                      <AvatarImage 
                        src={user.profileImageUrl || `https://ui-avatars.com/api/?name=${user.firstName}+${user.lastName}&background=1976D2&color=fff`} 
                        alt={`${user.firstName} ${user.lastName}`}
                      />
                      <AvatarFallback>
                        {user.firstName?.[0]}{user.lastName?.[0]}
                      </AvatarFallback>
                    </Avatar>
                    <div className="hidden sm:block text-left">
                      <p className="text-sm font-medium">{user.lastName} {user.firstName}</p>
                      <div className="flex items-center space-x-1">
                        <p className="text-xs text-gray-500">{user.department}</p>
                        {user.role === 'admin' && (
                          <Badge variant="secondary" className="text-xs">Admin</Badge>
                        )}
                      </div>
                    </div>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56">
                  <DropdownMenuItem onClick={async () => {
                    try {
                      await fetch('/api/logout', {
                        method: 'POST',
                        credentials: 'include'
                      });
                      queryClient.clear();
                      window.location.href = '/';
                    } catch (error) {
                      console.error('Logout error:', error);
                      window.location.href = '/';
                    }
                  }}>
                    <LogOut className="h-4 w-4 mr-2" />
                    ログアウト
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>

              {/* Mobile menu button */}
              <Button
                variant="ghost"
                size="sm"
                className="md:hidden"
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              >
                {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
              </Button>
            </div>
          </div>
        </div>
      </nav>

      {/* Mobile Menu */}
      {mobileMenuOpen && (
        <div className="fixed inset-0 z-40 md:hidden">
          <div className="fixed inset-0 bg-gray-600 bg-opacity-75" onClick={() => setMobileMenuOpen(false)} />
          <div className="relative flex-1 flex flex-col max-w-xs w-full bg-white">
            <div className="flex-1 h-0 pt-5 pb-4 overflow-y-auto">
              {/* Mobile Header */}
              <div className="flex items-center flex-shrink-0 px-4 mb-5">
                <Coins className="h-8 w-8 text-primary mr-2" />
                <h1 className="text-xl font-bold text-primary">K-point</h1>
              </div>

              {/* User Info in Mobile */}
              <div className="px-4 mb-5 pb-5 border-b border-gray-200">
                <div className="flex items-center space-x-3">
                  <Avatar className="h-10 w-10">
                    <AvatarImage 
                      src={user.profileImageUrl || `https://ui-avatars.com/api/?name=${user.firstName}+${user.lastName}&background=1976D2&color=fff`} 
                      alt={`${user.firstName} ${user.lastName}`}
                    />
                    <AvatarFallback>
                      {user.firstName?.[0]}{user.lastName?.[0]}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1">
                    <p className="text-sm font-medium text-gray-900">{user.lastName} {user.firstName}</p>
                    <div className="flex items-center space-x-2">
                      <p className="text-xs text-gray-500">{user.department}</p>
                      {user.role === 'admin' && (
                        <Badge variant="secondary" className="text-xs">Admin</Badge>
                      )}
                      {user.role === 'superadmin' && (
                        <Badge variant="destructive" className="text-xs">SuperAdmin</Badge>
                      )}
                      {user.role === 'superadmin' && (
                        <Badge variant="destructive" className="text-xs">SuperAdmin</Badge>
                      )}
                    </div>
                  </div>
                </div>
                
                {/* Point Balance in Mobile */}
                <div className="flex items-center space-x-2 bg-gray-100 px-3 py-2 rounded-lg mt-3">
                  <Coins className="h-4 w-4 text-secondary" />
                  <span className="text-sm font-medium">残高: {user.pointBalance}</span>
                </div>
              </div>

              {/* Navigation Items */}
              <nav className="px-2 space-y-1">
                {navigationItems.map((item) => (
                  <Link key={item.href} href={item.href}>
                    <Button
                      variant={isActive(item.href) ? "default" : "ghost"}
                      className={`w-full justify-start ${
                        isActive(item.href) ? "bg-primary text-white" : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
                      }`}
                      onClick={() => setMobileMenuOpen(false)}
                    >
                      <item.icon className="h-5 w-5 mr-3" />
                      {item.label}
                    </Button>
                  </Link>
                ))}
              </nav>
            </div>

            {/* Logout Button at Bottom */}
            <div className="border-t border-gray-200 p-4">
              <Button
                variant="outline"
                className="w-full justify-start text-red-600 border-red-200 hover:bg-red-50 hover:text-red-700"
                onClick={async () => {
                  try {
                    await fetch('/api/logout', {
                      method: 'POST',
                      credentials: 'include'
                    });
                    queryClient.clear();
                    window.location.href = '/';
                  } catch (error) {
                    console.error('Logout error:', error);
                    window.location.href = '/';
                  }
                }}
              >
                <LogOut className="h-5 w-5 mr-3" />
                ログアウト
              </Button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
