import React, { useEffect, useState } from "react";
import {
  Box,
  SimpleGrid,
  Flex,
  Icon,
  Text,
  Skeleton,
  useToast,
  Stat,
  StatLabel,
  StatNumber,
  StatHelpText,
  Button,
  HStack,
  Badge,
  useColorModeValue,
} from "@chakra-ui/react";
import { useNavigate } from "react-router-dom";
import { BiMale } from "react-icons/bi";
import { FaVideo } from "react-icons/fa";
import { FiBook, FiFilm, FiPlus } from "react-icons/fi";
import AdminNavTop, { ADMIN_NAV_HEIGHT as NAV_FROM_BAR } from "../AdminNavTop";
import api from "../../api";

const NAV_HEIGHT = typeof NAV_FROM_BAR === "number" ? NAV_FROM_BAR : 84;
const fmt = (n) => new Intl.NumberFormat().format(n || 0);

function StatCard({ label, value, help, icon, onClick, isLoading, accent }) {
  const border = useColorModeValue("gray.200", "gray.700");
  const chipBg = useColorModeValue(`${accent}.100`, `${accent}.700`);
  const numberColor = useColorModeValue(`${accent}.700`, `${accent}.200`);

  return (
    <Skeleton isLoaded={!isLoading} borderRadius="2xl">
      <Flex
        role={onClick ? "button" : "group"}
        onClick={onClick}
        borderWidth="1px"
        borderColor={border}
        borderRadius="2xl"
        p={6}
        align="center"
        justify="space-between"
        bgGradient={useColorModeValue(
          "linear(to-br, white, gray.50)",
          "linear(to-br, gray.800, gray.900)"
        )}
        _hover={{
          transform: "translateY(-3px)",
          boxShadow: "lg",
        }}
        transition="transform 140ms ease, box-shadow 140ms ease"
        cursor={onClick ? "pointer" : "default"}
        minH="160px" // bigger
      >
        <Stat>
          <StatLabel fontWeight="bold">{label}</StatLabel>
          <StatNumber fontSize="3xl" color={numberColor}>
            {fmt(value)}
          </StatNumber>
          {help ? <StatHelpText>{help}</StatHelpText> : null}
        </Stat>
        <Flex
          align="center"
          justify="center"
          w="64px"
          h="64px"
          borderRadius="full"
          bg={chipBg}
        >
          <Icon as={icon} boxSize={8} />
        </Flex>
      </Flex>
    </Skeleton>
  );
}

export default function AdminDashboard() {
  const toast = useToast();
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);
  const [totals, setTotals] = useState({
    totalUsers: 0,
    totalCourses: 0,
    totalVideos: 0,
    totalEnrollments: 0,
  });

  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        setLoading(true);
        const { data } = await api.get("/admin/stats");
        if (!alive) return;
        setTotals(data?.totals ?? {});
      } catch (err) {
        toast({
          title: "Failed to load dashboard",
          description:
            err?.response?.data?.msg ||
            err?.response?.data?.message ||
            err?.message ||
            "Unknown error",
          status: "error",
          isClosable: true,
          duration: 4500,
        });
      } finally {
        if (alive) setLoading(false);
      }
    })();
    return () => {
      alive = false;
    };
  }, [toast]);

  const subtle = useColorModeValue("gray.600", "gray.300");
  const border = useColorModeValue("gray.200", "gray.700");

  return (
    <Box>
      <AdminNavTop />
      <Box h={`${NAV_HEIGHT}px`} />

      <Box maxW="1280px" mx="auto" px={{ base: 4, md: 8 }} py={6}>
        <Flex align="center" justify="space-between" mb={6} wrap="wrap" gap={3}>
          <Box>
            <Text fontSize="3xl" fontWeight="extrabold">
              Overview
            </Text>
            <Text fontSize="sm" color={subtle}>
              Key metrics across courses, videos, and enrollments
            </Text>
          </Box>
          <HStack spacing={3}>
            <Button
              leftIcon={<FiPlus />}
              colorScheme="blue"
              size="md"
              onClick={() => navigate("/admin/courses/new")}
            >
              Add Course
            </Button>
            <Button
              variant="outline"
              size="md"
              onClick={() => navigate("/admin/courses")}
            >
              Manage Courses
            </Button>
            <Button
              variant="outline"
              size="md"
              onClick={() => navigate("/admin/videos")}
            >
              Manage Videos
            </Button>
            <Button
              variant="outline"
              size="md"
              onClick={() => navigate("/admin/users")}
            >
              Manage Users
            </Button>
          </HStack>
        </Flex>

        <SimpleGrid columns={{ base: 1, md: 2, xl: 4 }} spacing={6} mb={10}>
          <StatCard
            label="Total Subscribers"
            value={totals.totalEnrollments}
            help="Enrollments across all courses"
            icon={BiMale}
            onClick={() => navigate("/admin/users")}
            isLoading={loading}
            accent="teal"
          />
          <StatCard
            label="Total Videos"
            value={totals.totalVideos}
            help="All uploaded videos"
            icon={FaVideo}
            onClick={() => navigate("/admin/videos")}
            isLoading={loading}
            accent="purple"
          />
          <StatCard
            label="Total Courses"
            value={totals.totalCourses}
            help="Active courses"
            icon={FiBook}
            onClick={() => navigate("/admin/courses")}
            isLoading={loading}
            accent="blue"
          />
          <StatCard
            label="Total Watch Time"
            value={0}
            help="Add metric later (views × avg length)"
            icon={FiFilm}
            isLoading={loading}
            accent="pink"
          />
        </SimpleGrid>

        <Box
          borderWidth="1px"
          borderColor={border}
          borderRadius="2xl"
          p={5}
          bg="white"
          _dark={{ bg: "gray.800", borderColor: "gray.700" }}
        >
          <Text fontWeight="bold" mb={1}>
            Heads up
          </Text>
          <Text fontSize="sm" color={subtle}>
            Charts are hidden until the backend provides time-series data (e.g.,{" "}
            <Badge variant="subtle">/admin/stats</Badge> with{" "}
            <code>series</code> fields). Cards above are live.
          </Text>
        </Box>
      </Box>
    </Box>
  );
}
