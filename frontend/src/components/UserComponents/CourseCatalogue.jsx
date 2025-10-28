// src/components/UserComponents/CourseCatalogue.jsx
import React, { useEffect, useState } from "react";
import {
  Box,
  Heading,
  Text,
  SimpleGrid,
  Spinner,
  Button,
  VStack,
  useToast,
} from "@chakra-ui/react";
import { useNavigate } from "react-router-dom";
import { CourseAPI } from "../../api";

const CourseCatalogue = () => {
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [enrolling, setEnrolling] = useState({});
  const toast = useToast();
  const navigate = useNavigate();

  // Fetch all courses
  useEffect(() => {
    const fetchCourses = async () => {
      try {
        const { data } = await CourseAPI.list({ limit: 12 });
        setCourses(data || []);
      } catch (err) {
        console.error("Error fetching courses:", err);
        toast({
          title: "Error loading courses",
          status: "error",
          duration: 3000,
          isClosable: true,
        });
      } finally {
        setLoading(false);
      }
    };
    fetchCourses();
  }, [toast]);

  // Handle enrollment
  const handleEnroll = async (id) => {
    try {
      setEnrolling((prev) => ({ ...prev, [id]: true }));
      const res = await CourseAPI.enroll(id);
      toast({
        title: res?.data?.msg || "Enrolled successfully!",
        status: "success",
        duration: 2500,
        isClosable: true,
      });
    } catch (err) {
      console.error("Enrollment error:", err);
      toast({
        title: "Failed to enroll",
        description: err?.response?.data?.msg || "Try again later",
        status: "error",
        duration: 3000,
        isClosable: true,
      });
    } finally {
      setEnrolling((prev) => ({ ...prev, [id]: false }));
    }
  };

  if (loading) {
    return (
      <Box textAlign="center" mt={8}>
        <Spinner size="xl" />
        <Text mt={2}>Loading courses...</Text>
      </Box>
    );
  }

  return (
    <Box p={6} bg="white" borderRadius="lg" boxShadow="md" mt={2}>
      <Heading as="h2" size="lg" mb={6}>
        🎓 Course Catalogue
      </Heading>

      {courses.length === 0 ? (
        <Text color="gray.500">No courses available yet.</Text>
      ) : (
        <SimpleGrid columns={[1, 2, 3]} spacing={6}>
          {courses.map((course) => (
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
              <Text fontSize="sm" color="gray.600" noOfLines={3}>
                {course.description || "No description available."}
              </Text>
              <Text fontSize="sm" mt={2}>
                Category:{" "}
                <Text as="span" fontWeight="semibold">
                  {course.category || "General"}
                </Text>
              </Text>
              <Text fontSize="sm" mt={1}>
                Price:{" "}
                <Text as="span" fontWeight="semibold" color="teal.600">
                  {course.price === 0 ? "Free" : `$${course.price}`}
                </Text>
              </Text>

              <VStack mt={4} spacing={2}>
                <Button
                  colorScheme="teal"
                  width="full"
                  onClick={() => navigate(`/course/${course.id}`)}
                >
                  View Course
                </Button>
                <Button
                  width="full"
                  isLoading={enrolling[course.id]}
                  colorScheme="blue"
                  onClick={() => handleEnroll(course.id)}
                >
                  Enroll Now
                </Button>
              </VStack>
            </Box>
          ))}
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

export default CourseCatalogue;
