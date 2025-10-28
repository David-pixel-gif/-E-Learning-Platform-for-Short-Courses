// ============================================================================
// File: frontend/src/components/AdminNavTop.jsx
// Fixed, bright, bold admin top bar. Exports ADMIN_NAV_HEIGHT for page spacer.
// Null-safe, lint-safe, production-ready.
// ============================================================================
import React, { useMemo } from "react";
import {
  Box,
  Flex,
  Input,
  IconButton,
  Text,
  Badge,
  Avatar,
  HStack,
  Tooltip,
  InputGroup,
  InputLeftElement,
  useColorModeValue,
  Menu,
  MenuButton,
  MenuList,
  MenuItem,
  Divider,
  Link as ChakraLink,
  VStack,
} from "@chakra-ui/react";
import { Link, useNavigate } from "react-router-dom";
import { IoSearch } from "react-icons/io5";
import { AiOutlineQuestionCircle, AiOutlineBell } from "react-icons/ai";
import { useSelector, useDispatch } from "react-redux";

// ---------------------------------------------------------------------------
// Export constants (keep both for backward + future compatibility)
// ---------------------------------------------------------------------------
export const ADMIN_NAV_HEIGHT = 84;
export const NAVBAR_HEIGHT = ADMIN_NAV_HEIGHT;

export default function AdminNavTop({ onSearchChange }) {
  // -------------------------------------------------------------------------
  // Redux + hooks setup (ALWAYS at the top)
  // -------------------------------------------------------------------------
  const userStore = useSelector((s) => s?.UserReducer ?? {});
  const navigate = useNavigate();
  const dispatch = useDispatch();

  // -------------------------------------------------------------------------
  // Color mode hooks (always at top level)
  // -------------------------------------------------------------------------
  const bg = useColorModeValue("rgba(255,255,255,0.95)", "rgba(17,25,40,0.95)");
  const border = useColorModeValue("gray.200", "gray.700");
  const subtle = useColorModeValue("gray.600", "gray.300");
  const brand = useColorModeValue("blue.800", "blue.300");
  const focusBg = useColorModeValue("white", "gray.800");

  // -------------------------------------------------------------------------
  // Safe user data extraction
  // -------------------------------------------------------------------------
  const user = userStore?.user || userStore || {};
  const name = user?.name || "";
  const email = user?.email || "";
  const roleRaw = user?.role || "";
  const role = String(roleRaw || "ADMIN").toUpperCase();

  const initials = useMemo(() => {
    const n = (name || email || "U").trim();
    const p = n.split(" ");
    return ((p[0]?.[0] || "U") + (p[1]?.[0] || "")).toUpperCase();
  }, [name, email]);

  // -------------------------------------------------------------------------
  // Logout handler
  // -------------------------------------------------------------------------
  const onLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("refreshToken");
    localStorage.removeItem("user");
    dispatch({ type: "USER_LOGOUT" });
    navigate("/login", { replace: true });
  };

  // -------------------------------------------------------------------------
  // Render
  // -------------------------------------------------------------------------
  return (
    <Box
      as="header"
      position="fixed"
      top="0"
      left="0"
      right="0"
      zIndex="1000"
      w="100%"
    >
      {/* Top accent bar */}
      <Box
        h="4px"
        bgGradient="linear(to-r, #06b6d4, #3b82f6, #8b5cf6, #ec4899)"
      />

      {/* Main nav bar */}
      <Flex
        h={`${ADMIN_NAV_HEIGHT - 8}px`}
        px={{ base: 4, md: 8 }}
        align="center"
        justify="space-between"
        bg={bg}
        borderBottom="1px solid"
        borderColor={border}
        backdropFilter="saturate(180%) blur(12px)"
      >
        {/* ----------------------------------------------------------------- */}
        {/* Brand + Search */}
        {/* ----------------------------------------------------------------- */}
        <HStack spacing={8} minW={0}>
          <ChakraLink
            as={Link}
            to="/admin/dashboard"
            _hover={{ textDecoration: "none" }}
            lineHeight="1"
          >
            <VStack align="start" spacing={1} lineHeight="1.2">
              <Text
                fontSize={{ base: "xl", md: "2xl" }}
                fontWeight="extrabold"
                color={brand}
                letterSpacing="0.3px"
              >
                Admin Console
              </Text>
              <Text fontSize="sm" color={subtle}>
                E-course management
              </Text>
            </VStack>
          </ChakraLink>

          {/* Search bar (desktop only) */}
          <Box
            display={{ base: "none", md: "block" }}
            minW={{ md: "420px", lg: "560px" }}
          >
            <InputGroup size="lg">
              <InputLeftElement pointerEvents="none" mt="2px">
                <IoSearch />
              </InputLeftElement>
              <Input
                placeholder="Search courses, videos, users…"
                variant="filled"
                borderRadius="full"
                onChange={onSearchChange}
                _focus={{
                  bg: focusBg,
                  boxShadow: "0 0 0 3px rgba(59,130,246,0.35)",
                  borderColor: "blue.400",
                }}
              />
            </InputGroup>
          </Box>
        </HStack>

        {/* ----------------------------------------------------------------- */}
        {/* User Actions */}
        {/* ----------------------------------------------------------------- */}
        <HStack spacing={2}>
          <Tooltip label="Help" hasArrow>
            <IconButton
              aria-label="Help"
              icon={<AiOutlineQuestionCircle />}
              variant="ghost"
              size="lg"
            />
          </Tooltip>

          <Tooltip label="Notifications" hasArrow>
            <IconButton
              aria-label="Notifications"
              icon={<AiOutlineBell />}
              variant="ghost"
              size="lg"
            />
          </Tooltip>

          {/* User Menu */}
          <Menu placement="bottom-end" autoSelect={false}>
            <MenuButton
              as={Avatar}
              name={name || email || "User"}
              size="md"
              bg="blue.500"
              color="white"
            >
              {initials}
            </MenuButton>

            <MenuList>
              <Box px={3} py={2}>
                <Text fontWeight="semibold" noOfLines={1}>
                  {name || email || "User"}
                </Text>
                <HStack spacing={2}>
                  <Text fontSize="xs" color={subtle} noOfLines={1}>
                    {email || "—"}
                  </Text>
                  <Badge size="xs" colorScheme="purple">
                    {role}
                  </Badge>
                </HStack>
              </Box>

              <Divider />
              <MenuItem onClick={() => navigate("/admin/courses")}>
                Manage Courses
              </MenuItem>
              <MenuItem onClick={() => navigate("/admin/videos")}>
                Manage Videos
              </MenuItem>
              <MenuItem onClick={() => navigate("/admin/users")}>
                Manage Users
              </MenuItem>
              <Divider />
              <MenuItem onClick={() => navigate("/setting")}>Setting</MenuItem>
              <MenuItem color="red.500" onClick={onLogout}>
                Logout
              </MenuItem>
            </MenuList>
          </Menu>
        </HStack>
      </Flex>

      {/* Bottom accent bar */}
      <Box
        h="4px"
        bgGradient="linear(to-r, #ec4899, #8b5cf6, #3b82f6, #06b6d4)"
      />
    </Box>
  );
}
