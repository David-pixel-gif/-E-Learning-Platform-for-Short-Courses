import React from "react";
import {
  Box,
  Flex,
  HStack,
  Avatar,
  Menu,
  MenuButton,
  MenuItem,
  MenuList,
  Text,
  Spacer,
  useToast,
} from "@chakra-ui/react";
import { useNavigate, useLocation } from "react-router-dom";
import { clearSession, UserAPI, readSession } from "../../api";
import { FiLogOut, FiHome, FiAward, FiBook, FiBarChart2 } from "react-icons/fi";

/**
 * UserNavbar
 * - Appears only on authenticated user pages (student dashboard, catalogue, etc.)
 * - Hidden automatically on public routes (/, /login, /signup, etc.)
 * - Provides quick navigation and logout for users.
 */
const UserNavbar = () => {
  const toast = useToast();
  const navigate = useNavigate();
  const location = useLocation();

  // Read user session from local storage or API
  const session = readSession();
  const user = session?.user || {};

  // Define routes where this navbar should appear
  const userRoutes = [
    "/student",
    "/catalogue",
    "/progress",
    "/certificates",
    "/profile",
  ];

  // Check if current path starts with any user route
  const isUserPage = userRoutes.some((path) =>
    location.pathname.startsWith(path)
  );

  // If not on a user page, hide the navbar entirely
  if (!isUserPage) return null;

  // Logout handler
  const handleLogout = async () => {
    try {
      await UserAPI.logout();
      toast({
        title: "Logged out",
        description: "You’ve been safely logged out.",
        status: "success",
        duration: 3000,
        isClosable: true,
      });
      clearSession();
      navigate("/login");
    } catch (err) {
      console.error("Logout failed:", err);
      toast({
        title: "Logout failed",
        description: "Something went wrong while logging out.",
        status: "error",
        duration: 3000,
        isClosable: true,
      });
    }
  };

  const navLinks = [
    { label: "Dashboard", path: "/student", icon: FiHome },
    { label: "Courses", path: "/catalogue", icon: FiBook },
    { label: "Progress", path: "/progress", icon: FiBarChart2 },
    { label: "Certificates", path: "/certificates", icon: FiAward },
  ];

  return (
    <Box
      bg="teal.500"
      px={6}
      py={3}
      boxShadow="md"
      position="fixed"
      top="0"
      left="0"
      width="100%"
      zIndex="1000"
    >
      <Flex align="center" color="white">
        {/* App Title */}
        <Text
          fontWeight="bold"
          fontSize="xl"
          cursor="pointer"
          onClick={() => navigate("/student")}
        >
          🎓 E-Learn Platform
        </Text>

        <Spacer />

        {/* Navigation Links (visible on md+ screens) */}
        <HStack
          spacing={6}
          display={{ base: "none", md: "flex" }}
          fontWeight="medium"
        >
          {navLinks.map((link) => (
            <Text
              key={link.path}
              cursor="pointer"
              onClick={() => navigate(link.path)}
              color={
                location.pathname === link.path
                  ? "yellow.200"
                  : "whiteAlpha.900"
              }
              _hover={{ color: "yellow.300" }}
            >
              {link.label}
            </Text>
          ))}
        </HStack>

        <Spacer />

        {/* User Menu */}
        <Menu>
          <MenuButton>
            <Avatar
              size="sm"
              name={user?.name || "User"}
              bg="whiteAlpha.800"
              color="teal.700"
            />
          </MenuButton>
          <MenuList color="gray.700">
            <Box px={3} py={2}>
              <Text fontWeight="bold">{user?.name || "User"}</Text>
              <Text fontSize="sm" color="gray.500">
                {user?.role || "STUDENT"}
              </Text>
            </Box>

            {/* Quick nav shortcuts */}
            <MenuItem icon={<FiHome />} onClick={() => navigate("/student")}>
              Dashboard
            </MenuItem>
            <MenuItem icon={<FiBook />} onClick={() => navigate("/catalogue")}>
              My Courses
            </MenuItem>
            <MenuItem
              icon={<FiBarChart2 />}
              onClick={() => navigate("/progress")}
            >
              Progress
            </MenuItem>
            <MenuItem
              icon={<FiAward />}
              onClick={() => navigate("/certificates")}
            >
              Certificates
            </MenuItem>

            <MenuItem
              icon={<FiLogOut />}
              color="red.500"
              onClick={handleLogout}
            >
              Logout
            </MenuItem>
          </MenuList>
        </Menu>
      </Flex>
    </Box>
  );
};

export default UserNavbar;
