import React, { useEffect, useState } from "react";
import {
  Box,
  Text,
  Flex,
  Image,
  Button,
  Spinner,
  useToast,
} from "@chakra-ui/react";
import { useNavigate } from "react-router-dom";
import { UserAPI } from "../../api";

/**
 * Displays student's enrolled courses as a horizontal scroll slider.
 * Fetches live data from backend: /users/enrolled
 */
const UserSlider = () => {
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const toast = useToast();
  const navigate = useNavigate();

  useEffect(() => {
    const loadCourses = async () => {
      try {
        const { data } = await UserAPI.enrolled();
        setCourses(data || []);
      } catch (err) {
        console.error("Error fetching enrolled courses:", err);
        toast({
          title: "Error",
          description: "Unable to load your enrolled courses.",
          status: "error",
          duration: 4000,
          isClosable: true,
        });
      } finally {
        setLoading(false);
      }
    };

    loadCourses();
  }, [toast]);

  if (loading) {
    return (
      <Flex justify="center" align="center" minH="150px">
        <Spinner size="lg" />
      </Flex>
    );
  }

  if (!courses.length) {
    return (
      <Box bg="white" p={6} rounded="md" shadow="md" textAlign="center">
        <Text fontSize="lg" color="gray.600">
          You haven’t enrolled in any courses yet.
        </Text>
        <Button
          mt={3}
          colorScheme="teal"
          onClick={() => navigate("/catalogue")}
        >
          Browse Courses
        </Button>
      </Box>
    );
  }

  return (
    <Box bg="white" p={5} rounded="md" shadow="md">
      <Text fontSize="xl" fontWeight="bold" mb={3}>
        Your Enrolled Courses
      </Text>

      <Flex
        overflowX="auto"
        gap={6}
        py={3}
        sx={{
          "&::-webkit-scrollbar": { height: "6px" },
          "&::-webkit-scrollbar-thumb": {
            background: "#ccc",
            borderRadius: "3px",
          },
        }}
      >
        {courses.map((course) => (
          <Box
            key={course.id}
            minW="250px"
            maxW="250px"
            bg="gray.50"
            border="1px solid"
            borderColor="gray.200"
            rounded="lg"
            overflow="hidden"
            flexShrink={0}
            _hover={{ shadow: "md", transform: "scale(1.02)" }}
            transition="all 0.2s"
          >
            <Image
              src={
                course.img ||
                "https://img.freepik.com/free-vector/online-learning-concept_23-2148533381.jpg"
              }
              alt={course.title}
              w="100%"
              h="140px"
              objectFit="cover"
            />
            <Box p={3}>
              <Text fontWeight="semibold" noOfLines={1}>
                {course.title}
              </Text>
              <Text fontSize="sm" color="gray.500" noOfLines={2}>
                {course.description}
              </Text>
              <Button
                mt={3}
                size="sm"
                colorScheme="teal"
                width="full"
                onClick={() => navigate(`/course/${course.id}`)}
              >
                Continue
              </Button>
            </Box>
          </Box>
        ))}
      </Flex>
    </Box>
  );
};

export default UserSlider;
