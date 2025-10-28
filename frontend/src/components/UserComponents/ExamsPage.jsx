// src/components/UserComponents/ExamsPage.jsx
import React, { useEffect, useState } from "react";
import {
  Box,
  Button,
  Heading,
  VStack,
  Spinner,
  Text,
  HStack,
  useToast,
} from "@chakra-ui/react";
import { useNavigate } from "react-router-dom";
import { CourseAPI } from "../../api";

const ExamsPage = () => {
  const navigate = useNavigate();
  const toast = useToast();

  const [loading, setLoading] = useState(true);
  const [tests, setTests] = useState([]);

  useEffect(() => {
    const loadTests = async () => {
      try {
        const { data } = await CourseAPI.list();

        // Make this safe for all possible response shapes
        const courses = data?.data || data || [];

        const mockTests = courses.flatMap((course) => {
          if (!course || !Array.isArray(course.tests)) return [];
          return course.tests.map((t) => ({
            id: t.id,
            title: t.title || "Untitled Test",
            scheduledAt: t.scheduledAt || null,
            courseTitle: course.title || "Unknown Course",
          }));
        });

        setTests(mockTests);
      } catch (err) {
        console.error("Failed to fetch exams:", err);
        toast({
          title: "Error loading exams.",
          status: "error",
          duration: 3000,
          isClosable: true,
        });
      } finally {
        setLoading(false);
      }
    };

    loadTests();
  }, [toast]);

  if (loading) {
    return (
      <Box textAlign="center" mt={8}>
        <Spinner size="xl" />
        <Text mt={2}>Loading exams...</Text>
      </Box>
    );
  }

  return (
    <Box p={6} bg="white" boxShadow="lg" borderRadius="xl">
      <Heading as="h2" size="lg" mb={6}>
        🧠 Your Exams
      </Heading>

      {tests.length === 0 ? (
        <Text>No exams or mock tests available yet.</Text>
      ) : (
        <VStack align="stretch" spacing={4}>
          {tests.map((test) => (
            <Box
              key={test.id}
              p={4}
              borderWidth="1px"
              borderRadius="md"
              _hover={{ bg: "gray.50" }}
            >
              <Heading size="md">{test.title}</Heading>
              <Text fontSize="sm" color="gray.600">
                {test.courseTitle ? `Course: ${test.courseTitle}` : ""}
              </Text>
              {test.scheduledAt && (
                <Text fontSize="sm" color="gray.500">
                  Scheduled: {new Date(test.scheduledAt).toLocaleString()}
                </Text>
              )}
              <HStack mt={3} spacing={3}>
                <Button
                  colorScheme="blue"
                  onClick={() => navigate(`/mock-test/${test.id}`)}
                >
                  Start Test
                </Button>
                <Button
                  variant="outline"
                  colorScheme="gray"
                  onClick={() => navigate(`/results/${test.id}`)}
                >
                  View Results
                </Button>
              </HStack>
            </Box>
          ))}
        </VStack>
      )}

      {/* Back navigation */}
      <Button mt={8} colorScheme="teal" onClick={() => navigate("/student")}>
        ← Back to Dashboard
      </Button>
    </Box>
  );
};

export default ExamsPage;
