// src/components/UserComponents/ProgressPage.jsx
import React, { useEffect, useState } from "react";
import {
  Box,
  Heading,
  Text,
  VStack,
  Progress,
  SimpleGrid,
  Spinner,
  Button,
  useToast,
} from "@chakra-ui/react";
import { useNavigate } from "react-router-dom";
import { UserAPI } from "../../api";

const ProgressPage = () => {
  const navigate = useNavigate();
  const toast = useToast();
  const [progressData, setProgressData] = useState([]);
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadProgress = async () => {
      try {
        const [progressRes, enrolledRes] = await Promise.all([
          UserAPI.progress(),
          UserAPI.enrolled(),
        ]);

        setProgressData(progressRes.data || []);
        setCourses(enrolledRes.data || []);
      } catch (err) {
        console.error("Error loading progress:", err);
        toast({
          title: "Error loading progress",
          status: "error",
          duration: 3000,
          isClosable: true,
        });
      } finally {
        setLoading(false);
      }
    };
    loadProgress();
  }, [toast]);

  const calculateCourseProgress = (courseId) => {
    const courseVideos = progressData.filter(
      (p) => p.video?.courseId === courseId
    );
    if (courseVideos.length === 0) return 0;
    const watched = courseVideos.filter((p) => p.watched).length;
    return Math.round((watched / courseVideos.length) * 100);
  };

  if (loading) {
    return (
      <Box textAlign="center" mt={8}>
        <Spinner size="xl" />
        <Text mt={2}>Loading your progress...</Text>
      </Box>
    );
  }

  return (
    <Box p={6} bg="white" borderRadius="lg" boxShadow="md" mt={2}>
      <Heading as="h2" size="lg" mb={6}>
        📈 My Progress
      </Heading>

      {courses.length === 0 ? (
        <Text color="gray.500">You have no enrolled courses yet.</Text>
      ) : (
        <SimpleGrid columns={[1, 2, 3]} spacing={5}>
          {courses.map((course) => {
            const percent = calculateCourseProgress(course.id);
            return (
              <Box
                key={course.id}
                p={4}
                borderWidth="1px"
                borderRadius="md"
                bg="gray.50"
                _hover={{ bg: "gray.100" }}
                transition="0.2s"
              >
                <Heading size="md" mb={2}>
                  {course.title}
                </Heading>
                <Text fontSize="sm" noOfLines={2} color="gray.600">
                  {course.description}
                </Text>
                <Progress
                  mt={3}
                  value={percent}
                  colorScheme="teal"
                  borderRadius="md"
                  height="6px"
                />
                <Text mt={1} fontSize="sm" color="gray.500">
                  {percent}% completed
                </Text>
                <Button
                  mt={4}
                  colorScheme="blue"
                  size="sm"
                  onClick={() => navigate(`/course/${course.id}`)}
                >
                  View Course
                </Button>
              </Box>
            );
          })}
        </SimpleGrid>
      )}

      <VStack align="start" mt={8}>
        <Button colorScheme="teal" onClick={() => navigate("/student")}>
          ← Back to Dashboard
        </Button>
      </VStack>
    </Box>
  );
};

export default ProgressPage;
