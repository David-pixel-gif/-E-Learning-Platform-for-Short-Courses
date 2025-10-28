// src/components/UserComponents/CourseComponent.jsx
import React, { useEffect, useState } from "react";
import {
  Box,
  Heading,
  Text,
  Button,
  VStack,
  SimpleGrid,
  Image,
  Spinner,
  useToast,
} from "@chakra-ui/react";
import { useParams, useNavigate } from "react-router-dom";
import { CourseAPI, VideoAPI } from "../../api";

const CourseComponent = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const toast = useToast();

  const [course, setCourse] = useState(null);
  const [videos, setVideos] = useState([]);
  const [loading, setLoading] = useState(true);

  // Load course and videos
  useEffect(() => {
    const loadData = async () => {
      try {
        const [courseRes, videosRes] = await Promise.all([
          CourseAPI.getById(id),
          VideoAPI.list({ courseId: id }),
        ]);

        setCourse(courseRes.data || {});
        setVideos(videosRes.data?.data || videosRes.data || []);
      } catch (err) {
        console.error("Error loading course:", err);
        toast({
          title: "Failed to load course details",
          status: "error",
          duration: 3000,
          isClosable: true,
        });
      } finally {
        setLoading(false);
      }
    };
    loadData();
  }, [id, toast]);

  if (loading) {
    return (
      <Box textAlign="center" mt={8}>
        <Spinner size="xl" />
        <Text mt={2}>Loading course details...</Text>
      </Box>
    );
  }

  if (!course) {
    return (
      <Box p={6}>
        <Text>Course not found.</Text>
        <Button mt={4} onClick={() => navigate("/student")} colorScheme="teal">
          ← Back to Dashboard
        </Button>
      </Box>
    );
  }

  return (
    <Box p={6} bg="white" borderRadius="lg" boxShadow="md" mt={2}>
      <Heading as="h2" size="lg" mb={2}>
        {course.title}
      </Heading>
      <Text color="gray.600" mb={4}>
        {course.description}
      </Text>

      {course.category && (
        <Text fontSize="sm" color="gray.500">
          Category: {course.category}
        </Text>
      )}
      {course.price > 0 && (
        <Text fontWeight="bold" color="green.600" mb={4}>
          Price: ${course.price}
        </Text>
      )}

      <Heading as="h3" size="md" mt={6} mb={3}>
        🎥 Course Videos
      </Heading>

      {videos.length === 0 ? (
        <Text color="gray.500">No videos available yet.</Text>
      ) : (
        <SimpleGrid columns={[1, 2, 3]} spacing={4}>
          {videos.map((video) => (
            <Box
              key={video.id}
              p={4}
              borderWidth="1px"
              borderRadius="md"
              bg="gray.50"
              _hover={{ bg: "gray.100", boxShadow: "lg" }}
              transition="0.2s"
            >
              {video.img && (
                <Image
                  src={video.img}
                  alt={video.title}
                  borderRadius="md"
                  mb={2}
                  objectFit="cover"
                  w="100%"
                  h="150px"
                />
              )}
              <Heading size="sm" mb={1}>
                {video.title}
              </Heading>
              <Text fontSize="sm" noOfLines={2}>
                {video.description || "No description"}
              </Text>
              <Button
                mt={3}
                size="sm"
                colorScheme="blue"
                onClick={() => window.open(video.link, "_blank")}
              >
                Watch
              </Button>
            </Box>
          ))}
        </SimpleGrid>
      )}

      {/* Navigation */}
      <VStack align="start" mt={8}>
        <Button colorScheme="teal" onClick={() => navigate("/student")}>
          ← Back to Dashboard
        </Button>
      </VStack>
    </Box>
  );
};

export default CourseComponent;
