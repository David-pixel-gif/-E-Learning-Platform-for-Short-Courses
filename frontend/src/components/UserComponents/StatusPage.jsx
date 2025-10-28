import React, { useEffect, useState } from "react";
import {
  Box,
  Heading,
  Text,
  VStack,
  HStack,
  Spinner,
  Progress,
  Button,
  Divider,
  useToast,
} from "@chakra-ui/react";
import { useNavigate } from "react-router-dom";
import { UserAPI, CourseAPI } from "../../api";

/**
 * Displays the student's course progress and enrolled courses.
 * Integrated with backend routes:
 * - GET /users/enrolled
 * - GET /users/progress
 */
const StatusPage = () => {
  const [enrolledCourses, setEnrolledCourses] = useState([]);
  const [progressMap, setProgressMap] = useState({});
  const [loading, setLoading] = useState(true);
  const toast = useToast();
  const navigate = useNavigate();

  useEffect(() => {
    const fetchStatus = async () => {
      try {
        const [enrolledRes, progressRes] = await Promise.all([
          UserAPI.enrolled(),
          UserAPI.progress(),
        ]);

        setEnrolledCourses(enrolledRes.data || []);

        // Map user progress by courseId
        const pMap = {};
        (progressRes.data || []).forEach((p) => {
          const courseId = p.video?.courseId;
          if (courseId)
            pMap[courseId] = (pMap[courseId] || 0) + (p.watched ? 1 : 0);
        });
        setProgressMap(pMap);
      } catch (err) {
        console.error("Status fetch error:", err);
        toast({
          title: "Error fetching progress",
          description: "Unable to load enrolled courses or progress data.",
          status: "error",
          duration: 4000,
          isClosable: true,
        });
      } finally {
        setLoading(false);
      }
    };

    fetchStatus();
  }, [toast]);

  if (loading) {
    return (
      <Box textAlign="center" mt={8}>
        <Spinner size="xl" />
        <Text mt={2}>Loading your course progress...</Text>
      </Box>
    );
  }

  return (
    <Box p={6} bg="white" borderRadius="lg" boxShadow="md" mt={2}>
      <Heading as="h2" size="lg" mb={4}>
        My Learning Progress
      </Heading>

      {enrolledCourses.length === 0 ? (
        <Text color="gray.500">You haven’t enrolled in any courses yet.</Text>
      ) : (
        <VStack spacing={6} align="stretch">
          {enrolledCourses.map((course) => {
            const courseProgress = progressMap[course.id] || 0;
            return (
              <Box
                key={course.id}
                borderWidth="1px"
                borderRadius="md"
                p={4}
                bg="gray.50"
                _hover={{ bg: "gray.100" }}
                transition="0.2s"
              >
                <HStack justify="space-between" mb={2}>
                  <Heading size="md">{course.title}</Heading>
                  <Button
                    size="sm"
                    colorScheme="teal"
                    onClick={() => navigate(`/coursework/${course.id}`)}
                  >
                    Continue →
                  </Button>
                </HStack>

                <Text color="gray.600" mb={2}>
                  {course.description || "No description available."}
                </Text>

                <Progress
                  value={courseProgress}
                  max={100}
                  colorScheme={courseProgress >= 100 ? "green" : "teal"}
                  borderRadius="md"
                  size="sm"
                />
                <Text mt={1} fontSize="sm" color="gray.500">
                  {courseProgress}% completed
                </Text>
              </Box>
            );
          })}
        </VStack>
      )}

      <Divider my={6} />
      <Button colorScheme="teal" onClick={() => navigate("/student")}>
        ← Back to Dashboard
      </Button>
    </Box>
  );
};

export default StatusPage;
