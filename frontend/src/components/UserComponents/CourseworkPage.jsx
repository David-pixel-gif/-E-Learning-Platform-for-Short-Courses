// src/components/UserComponents/CourseworkPage.jsx
import React, { useEffect, useState } from "react";
import {
  Box,
  Heading,
  Text,
  Spinner,
  VStack,
  Button,
  useToast,
  AspectRatio,
  Progress,
} from "@chakra-ui/react";
import { useNavigate, useParams } from "react-router-dom";
import { VideoAPI, CourseAPI } from "../../api";

const CourseworkPage = () => {
  const { courseId } = useParams();
  const [course, setCourse] = useState(null);
  const [videos, setVideos] = useState([]);
  const [watched, setWatched] = useState({});
  const [loading, setLoading] = useState(true);
  const toast = useToast();
  const navigate = useNavigate();

  // Fetch course details + videos
  useEffect(() => {
    const fetchCourseData = async () => {
      try {
        const [courseRes, videoRes] = await Promise.all([
          CourseAPI.getById(courseId),
          VideoAPI.list({ courseId }),
        ]);

        setCourse(courseRes.data);
        setVideos(videoRes.data || []);

        // Fetch progress for each video
        const progressPromises = (videoRes.data || []).map((v) =>
          VideoAPI.progress(v.id).catch(() => ({ data: {} }))
        );
        const progressData = await Promise.all(progressPromises);

        const progressMap = {};
        progressData.forEach((p, i) => {
          if (p.data?.watched !== undefined) {
            progressMap[videoRes.data[i].id] = p.data.watched;
          }
        });
        setWatched(progressMap);
      } catch (err) {
        console.error("Error loading course content:", err);
        toast({
          title: "Failed to load course content",
          status: "error",
          duration: 3000,
          isClosable: true,
        });
      } finally {
        setLoading(false);
      }
    };
    fetchCourseData();
  }, [courseId, toast]);

  const handleMarkWatched = async (id) => {
    try {
      await VideoAPI.markWatched(id);
      setWatched((prev) => ({ ...prev, [id]: true }));
      toast({
        title: "Marked as watched",
        status: "success",
        duration: 2000,
        isClosable: true,
      });
    } catch (err) {
      console.error("Error marking watched:", err);
      toast({
        title: "Failed to update progress",
        status: "error",
        duration: 3000,
        isClosable: true,
      });
    }
  };

  if (loading) {
    return (
      <Box textAlign="center" mt={8}>
        <Spinner size="xl" />
        <Text mt={2}>Loading course content...</Text>
      </Box>
    );
  }

  return (
    <Box p={6} bg="white" borderRadius="lg" boxShadow="md" mt={2}>
      <Heading as="h2" size="lg" mb={4}>
        {course?.title || "Course"}
      </Heading>
      <Text color="gray.600" mb={6}>
        {course?.description || "No description available."}
      </Text>

      {videos.length === 0 ? (
        <Text color="gray.500">No videos available for this course.</Text>
      ) : (
        <VStack spacing={8} align="stretch">
          {videos.map((video) => (
            <Box
              key={video.id}
              p={4}
              borderWidth="1px"
              borderRadius="md"
              bg="gray.50"
              _hover={{ bg: "gray.100" }}
              transition="0.2s"
            >
              <Heading size="md" mb={2}>
                {video.title}
              </Heading>
              <Text fontSize="sm" color="gray.600" mb={3}>
                {video.description || "No description."}
              </Text>

              <AspectRatio ratio={16 / 9}>
                <iframe src={video.link} title={video.title} allowFullScreen />
              </AspectRatio>

              <Box mt={3}>
                <Progress
                  colorScheme="teal"
                  size="sm"
                  value={watched[video.id] ? 100 : 0}
                  borderRadius="md"
                />
                <Button
                  mt={3}
                  colorScheme={watched[video.id] ? "green" : "teal"}
                  size="sm"
                  onClick={() => handleMarkWatched(video.id)}
                  isDisabled={watched[video.id]}
                >
                  {watched[video.id] ? "Watched ✅" : "Mark as Watched"}
                </Button>
              </Box>
            </Box>
          ))}
        </VStack>
      )}

      <VStack align="start" mt={8}>
        <Button colorScheme="teal" onClick={() => navigate("/student")}>
          ← Back to Dashboard
        </Button>
      </VStack>
    </Box>
  );
};

export default CourseworkPage;
