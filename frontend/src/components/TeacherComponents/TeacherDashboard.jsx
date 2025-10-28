// frontend/src/components/TeacherComponents/TeacherDashboard.jsx
import React, { useEffect, useState } from "react";
import {
  Box,
  Heading,
  SimpleGrid,
  Stat,
  StatLabel,
  StatNumber,
  StatHelpText,
  Button,
  useToast,
  Text,
  VStack,
  Icon,
  Skeleton,
  useColorModeValue,
} from "@chakra-ui/react";
import { AddIcon, CheckCircleIcon } from "@chakra-ui/icons";
import { FaVideo, FaBookOpen, FaChartLine, FaCertificate } from "react-icons/fa";
import { useNavigate } from "react-router-dom";
import TeacherNavTop from "./TeacherNavTop";
import api from "../../api";

export default function TeacherDashboard() {
  const [stats, setStats] = useState({
    courses: 0,
    students: 0,
    tests: 0,
    coursework: 0,
  });
  const [loading, setLoading] = useState(true);
  const toast = useToast();
  const navigate = useNavigate();

  const cardBorder = useColorModeValue("gray.200", "gray.700");

  useEffect(() => {
    (async () => {
      try {
        const { data } = await api.get("/teacher/stats");
        setStats({
          courses: data?.courses || 0,
          students: data?.students || 0,
          tests: data?.tests || 0,
          coursework: data?.coursework || 0,
        });
      } catch (err) {
        toast({
          title: "Error",
          description:
            err?.response?.data?.msg || err?.message || "Failed to load stats",
          status: "error",
          duration: 3000,
          isClosable: true,
        });
      } finally {
        setLoading(false);
      }
    })();
  }, [toast]);

  const goTo = (path) => navigate(path);

  return (
    <Box>
      <TeacherNavTop />
      <Box p={6}>
        <Heading size="lg" mb={6}>
          Teacher Dashboard
        </Heading>

        {/* Stats Section */}
        <Skeleton isLoaded={!loading} borderRadius="lg">
          <SimpleGrid columns={{ base: 1, md: 4 }} spacing={6} mb={10}>
            <Stat p={5} shadow="sm" border="1px solid" borderColor={cardBorder} borderRadius="lg">
              <StatLabel>Total Courses</StatLabel>
              <StatNumber>{stats.courses}</StatNumber>
              <StatHelpText>Created by you</StatHelpText>
            </Stat>
            <Stat p={5} shadow="sm" border="1px solid" borderColor={cardBorder} borderRadius="lg">
              <StatLabel>Total Students</StatLabel>
              <StatNumber>{stats.students}</StatNumber>
              <StatHelpText>Enrolled in your courses</StatHelpText>
            </Stat>
            <Stat p={5} shadow="sm" border="1px solid" borderColor={cardBorder} borderRadius="lg">
              <StatLabel>Mock Tests</StatLabel>
              <StatNumber>{stats.tests}</StatNumber>
              <StatHelpText>Scheduled tests</StatHelpText>
            </Stat>
            <Stat p={5} shadow="sm" border="1px solid" borderColor={cardBorder} borderRadius="lg">
              <StatLabel>Coursework</StatLabel>
              <StatNumber>{stats.coursework}</StatNumber>
              <StatHelpText>Assigned to students</StatHelpText>
            </Stat>
          </SimpleGrid>
        </Skeleton>

        {/* Quick Actions */}
        <Heading size="md" mb={4}>
          Quick Actions
        </Heading>
        <SimpleGrid columns={{ base: 1, md: 3 }} spacing={6}>
          <ActionCard
            icon={AddIcon}
            title="Add Course"
            desc="Create and publish a new course"
            onClick={() => goTo("/teacher/addCourse")}
          />
          <ActionCard
            icon={FaVideo}
            title="Manage Videos"
            desc="Upload or update course videos"
            onClick={() => goTo("/teacher/videos")}
          />
          <ActionCard
            icon={FaBookOpen}
            title="Add Coursework"
            desc="Assignments and study material"
            onClick={() => goTo("/teacher/coursework")}
          />
          <ActionCard
            icon={FaChartLine}
            title="Manage Exams"
            desc="Schedule or edit mock tests"
            onClick={() => goTo("/teacher/exams")}
          />
          <ActionCard
            icon={CheckCircleIcon}
            title="Results"
            desc="Review and publish results"
            onClick={() => goTo("/teacher/results")}
          />
          <ActionCard
            icon={FaCertificate}
            title="Certificates"
            desc="Issue certificates to students"
            onClick={() => goTo("/teacher/certificates")}
          />
        </SimpleGrid>
      </Box>

      {/* Back to Top */}
      <Button
        position="fixed"
        bottom="30px"
        right="30px"
        colorScheme="blue"
        onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
      >
        Back to Top
      </Button>
    </Box>
  );
}

function ActionCard({ icon, title, desc, onClick }) {
  const border = useColorModeValue("gray.200", "gray.700");
  return (
    <Box
      p={6}
      shadow="sm"
      border="1px solid"
      borderColor={border}
      borderRadius="lg"
      cursor="pointer"
      _hover={{ shadow: "md", borderColor: "blue.400" }}
      onClick={onClick}
    >
      <VStack spacing={3} align="start">
        <Icon as={icon} boxSize={8} color="blue.500" />
        <Heading size="md">{title}</Heading>
        <Text fontSize="sm" color="gray.600">
          {desc}
        </Text>
      </VStack>
    </Box>
  );
}
