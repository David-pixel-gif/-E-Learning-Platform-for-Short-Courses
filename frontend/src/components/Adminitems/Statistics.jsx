// ============================================================================
// File: frontend/src/components/Adminitems/Statistics.jsx
// Admin Statistics (live data, no mock). Bright cards, responsive, no charts.
// Pulls: total courses (CourseAPI.list), total videos (VideoAPI.list).
// Users total is attempted via /users/count (if you add later) and falls back
// to "—" without breaking the page.
// ============================================================================
import React, { useEffect, useMemo, useState } from "react";
import {
  Box,
  SimpleGrid,
  HStack,
  VStack,
  Text,
  useToast,
  useColorModeValue,
  Stat,
  StatLabel,
  StatNumber,
  StatHelpText,
  Icon,
  Tooltip,
  Button,
} from "@chakra-ui/react";
import { useNavigate } from "react-router-dom";
import {
  FiUsers,
  FiBook,
  FiFilm,
  FiRefreshCcw,
  FiAlertCircle,
} from "react-icons/fi";

import AdminNavTop, { ADMIN_NAV_HEIGHT } from "../AdminNavTop";
import { CourseAPI, VideoAPI } from "../../api";
import api from "../../api";

export default function Statistics() {
  const [loading, setLoading] = useState(false);
  const [coursesTotal, setCoursesTotal] = useState(null);
  const [videosTotal, setVideosTotal] = useState(null);
  const [usersTotal, setUsersTotal] = useState(null);
  const [lastUpdated, setLastUpdated] = useState(null);

  const toast = useToast();
  const navigate = useNavigate();

  const surface = useColorModeValue("white", "gray.800");
  const border = useColorModeValue("gray.200", "gray.700");
  const accent = useColorModeValue("blue.600", "blue.300");
  const subtle = useColorModeValue("gray.600", "gray.300");

  const currentUser = useMemo(() => {
    try {
      return JSON.parse(localStorage.getItem("user") || "null");
    } catch {
      return null;
    }
  }, []);
  const myRole = String(currentUser?.role || "").toUpperCase();

  const load = async () => {
    try {
      setLoading(true);

      // Get totals without heavy payloads (limit=1 just to read pagination.total)
      const [coursesRes, videosRes] = await Promise.all([
        CourseAPI.list({ page: 1, limit: 1 }),
        VideoAPI.list({ page: 1, limit: 1 }),
      ]);

      setCoursesTotal(coursesRes?.data?.pagination?.total ?? null);
      setVideosTotal(videosRes?.data?.pagination?.total ?? null);

      // Try users total with a conventional endpoint; swallow if not present.
      // If you implement backend: GET /users/count -> { total: number }
      try {
        const countRes = await api.get("/users/count");
        setUsersTotal(countRes?.data?.total ?? null);
      } catch {
        setUsersTotal(null);
      }

      setLastUpdated(new Date());
    } catch (err) {
      const msg =
        err?.response?.data?.msg ||
        err?.response?.data?.message ||
        err?.message ||
        "Failed to load statistics.";
      toast({
        description: msg,
        status: "error",
        duration: 4500,
        isClosable: true,
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const Card = ({ label, value, icon, onClick, hint }) => (
    <Box
      bg={surface}
      border="1px solid"
      borderColor={border}
      rounded="2xl"
      p={{ base: 5, md: 6 }}
      boxShadow="lg"
      transition="transform 120ms ease, box-shadow 120ms ease"
      _hover={{ transform: "translateY(-2px)" }}
      cursor={onClick ? "pointer" : "default"}
      onClick={onClick}
    >
      <HStack justify="space-between" align="start">
        <VStack align="start" spacing={1}>
          <Stat>
            <StatLabel color={subtle}>{label}</StatLabel>
            <StatNumber fontSize={{ base: "2xl", md: "3xl" }}>
              {value ?? "—"}
            </StatNumber>
            <StatHelpText color={subtle} noOfLines={1}>
              {lastUpdated
                ? `Updated ${lastUpdated.toLocaleTimeString()}`
                : " "}
            </StatHelpText>
          </Stat>
        </VStack>
        <VStack spacing={1} align="end">
          <Box
            as={Icon}
            boxSize={{ base: 9, md: 10 }}
            color={accent}
            opacity={0.9}
            icon={icon}
          />
          {hint && (
            <Tooltip label={hint} hasArrow>
              <Box color={subtle}>
                <FiAlertCircle />
              </Box>
            </Tooltip>
          )}
        </VStack>
      </HStack>
    </Box>
  );

  return (
    <Box minH="100vh" w="94%" mx="auto">
      <AdminNavTop />
      <Box h={`${ADMIN_NAV_HEIGHT}px`} />

      <VStack align="stretch" spacing={6} px={{ base: 3, md: 6 }} py={6}>
        {/* Header */}
        <HStack justify="space-between">
          <VStack align="start" spacing={0}>
            <Text fontSize="xl" fontWeight="bold" color={accent}>
              Statistics
            </Text>
            <Text fontSize="sm" color={subtle}>
              Live counts. No mock data.
            </Text>
          </VStack>
          <Button
            leftIcon={<FiRefreshCcw />}
            variant="outline"
            isLoading={loading}
            onClick={load}
          >
            Refresh
          </Button>
        </HStack>

        {/* Cards */}
        <SimpleGrid columns={{ base: 1, md: 2, xl: 3 }} spacing={6}>
          <Card
            label="Total Users"
            value={usersTotal}
            icon={FiUsers}
            onClick={
              myRole === "ADMIN" ? () => navigate("/admin/users") : undefined
            }
            hint={
              usersTotal == null
                ? "Add GET /users/count to backend for this metric."
                : ""
            }
          />
          <Card
            label="Total Courses"
            value={coursesTotal}
            icon={FiBook}
            onClick={() => navigate("/admin/courses")}
          />
          <Card
            label="Total Videos"
            value={videosTotal}
            icon={FiFilm}
            onClick={() => navigate("/admin/videos")}
          />
        </SimpleGrid>
      </VStack>
    </Box>
  );
}
