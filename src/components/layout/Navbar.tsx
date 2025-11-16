
import React, { useState } from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/AuthContext";
import {
  MenuIcon,
  X,
  Map,
  ClipboardList,
  LogIn,
  UserPlus,
  LogOut,
  User,
  Settings
} from "lucide-react";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";

const Navbar = () => {
  const { user, logout, isAdmin } = useAuth();
  const [isSheetOpen, setIsSheetOpen] = useState(false);

  const handleLogout = () => {
    logout();
    setIsSheetOpen(false);
  };

  const navLinks = [
    { name: "Map", path: "/map", icon: <Map className="mr-2 h-4 w-4" /> },
    { name: "My Reports", path: "/my-reports", icon: <ClipboardList className="mr-2 h-4 w-4" />, requiresAuth: true },
    { name: "Profile", path: "/profile", icon: <Settings className="mr-2 h-4 w-4" />, requiresAuth: true },
  ];

  // Add admin dashboard link for admin users
  if (user && isAdmin()) {
    navLinks.push({
      name: "Admin Dashboard",
      path: "/admin",
      icon: <User className="mr-2 h-4 w-4" />,
      requiresAuth: true,
    });
  }

  return (
    <nav className="bg-white dark:bg-gray-950 shadow-sm border-b">
      <div className="max-w-7xl mx-auto px-4">
        <div className="flex justify-between h-16">
          <div className="flex items-center">
            <Link to="/" className="flex items-center">
              <div className="relative h-8 w-8 mr-2">
                <div className="absolute inset-0 bg-primary rounded-full opacity-20 animate-pulse"></div>
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="h-4 w-4 bg-primary rounded-full"></div>
                </div>
              </div>
              <span className="text-xl font-bold text-gray-900 dark:text-white">CivicSpot</span>
            </Link>

            {/* Desktop Navigation */}
            <div className="hidden md:ml-6 md:flex md:items-center md:space-x-4">
              {navLinks.map((link) => 
                (!link.requiresAuth || user) ? (
                  <Link 
                    key={link.name}
                    to={link.path}
                    className="px-3 py-2 rounded-md text-sm font-medium text-gray-700 hover:text-primary hover:bg-gray-50 dark:text-gray-300 dark:hover:text-white dark:hover:bg-gray-800 flex items-center"
                  >
                    {link.icon}
                    {link.name}
                  </Link>
                ) : null
              )}
            </div>
          </div>

          {/* Desktop Auth buttons */}
          <div className="hidden md:flex md:items-center md:space-x-2">
            {user ? (
              <div className="flex items-center space-x-2">
                <span className="text-sm text-gray-700 dark:text-gray-300">
                  Hello, {user.name}
                </span>
                <Button variant="outline" onClick={logout}>
                  <LogOut className="mr-2 h-4 w-4" />
                  Logout
                </Button>
              </div>
            ) : (
              <>
                <Link to="/login">
                  <Button variant="outline">
                    <LogIn className="mr-2 h-4 w-4" />
                    Login
                  </Button>
                </Link>
                <Link to="/signup">
                  <Button>
                    <UserPlus className="mr-2 h-4 w-4" />
                    Sign Up
                  </Button>
                </Link>
              </>
            )}
          </div>

          {/* Mobile menu button */}
          <div className="flex md:hidden">
            <Sheet open={isSheetOpen} onOpenChange={setIsSheetOpen}>
              <SheetTrigger asChild>
                <Button variant="ghost" size="icon" className="md:hidden">
                  <MenuIcon />
                  <span className="sr-only">Open menu</span>
                </Button>
              </SheetTrigger>
              <SheetContent side="right">
                <SheetHeader className="mb-4">
                  <SheetTitle>Menu</SheetTitle>
                </SheetHeader>
                <div className="flex flex-col space-y-3 mt-4">
                  {navLinks.map((link) => 
                    (!link.requiresAuth || user) ? (
                      <Link
                        key={link.name}
                        to={link.path}
                        onClick={() => setIsSheetOpen(false)}
                        className="flex items-center px-3 py-2 rounded-md text-sm font-medium text-gray-700 hover:text-primary hover:bg-gray-50 dark:text-gray-300 dark:hover:text-white dark:hover:bg-gray-800"
                      >
                        {link.icon}
                        {link.name}
                      </Link>
                    ) : null
                  )}

                  {user ? (
                    <>
                      <div className="border-t my-2 pt-2 text-sm text-gray-700 dark:text-gray-300">
                        Signed in as: {user.name}
                      </div>
                      <Button variant="outline" onClick={handleLogout} className="w-full">
                        <LogOut className="mr-2 h-4 w-4" />
                        Logout
                      </Button>
                    </>
                  ) : (
                    <>
                      <Link to="/login" onClick={() => setIsSheetOpen(false)} className="w-full">
                        <Button variant="outline" className="w-full">
                          <LogIn className="mr-2 h-4 w-4" />
                          Login
                        </Button>
                      </Link>
                      <Link to="/signup" onClick={() => setIsSheetOpen(false)} className="w-full">
                        <Button className="w-full">
                          <UserPlus className="mr-2 h-4 w-4" />
                          Sign Up
                        </Button>
                      </Link>
                    </>
                  )}
                </div>
              </SheetContent>
            </Sheet>
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
