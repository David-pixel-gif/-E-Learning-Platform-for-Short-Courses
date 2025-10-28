import {
  Box,
  Button,
  FormControl,
  FormLabel,
  Grid,
  Input,
  Textarea,
  Heading,
  useColorModeValue,
  useToast,
  VStack,
} from "@chakra-ui/react";
import React, { useState } from "react";
import { useDispatch } from "react-redux";
import { useNavigate, useLocation } from "react-router-dom";
import { addVideo } from "../../Redux/TeacherReducer/action";
import TeacherNavTop from "./TeacherNavTop";

const AddTeacherVideos = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const toast = useToast();
  const location = useLocation();
  const { id, title } = location?.state || {};

  const initialState = {
    title: title || "",
    description: "",
    link: "",
    views: "",
    img: "",
    courseId: id || "",
  };

  const [detail, setDetail] = useState(initialState);

  // 🎯 Input Change Handler
  const handleChange = (e) => {
    const { name, value } = e.target;
    setDetail((prev) => ({ ...prev, [name]: value }));
  };

  // ✅ Submit Handler
  const handleSubmit = () => {
    const { title, description, link, courseId } = detail;

    if (!title || !description || !link || !courseId) {
      toast({
        title: "Missing Fields",
        description: "Please fill in all required fields.",
        status: "warning",
        duration: 4000,
        isClosable: true,
        position: "top",
      });
      return;
    }

    dispatch(addVideo(detail, courseId));

    toast({
      title: "Video Added",
      description: "The video has been added successfully.",
      status: "success",
      duration: 3000,
      isClosable: true,
      position: "top",
    });

    setDetail(initialState);
    navigate("/Teacher/add");
  };

  // 🌗 Theming
  const bgColor = useColorModeValue("gray.100", "gray.900");
  const cardBg = useColorModeValue("white", "gray.800");
  const inputBg = useColorModeValue("gray.50", "gray.700");
  const labelColor = useColorModeValue("gray.700", "gray.300");

  return (
    <Grid minH="100vh" bg={bgColor} px={{ base: 4, md: 10 }} pb={10}>
      <Box mt="80px">
        <TeacherNavTop />

        <Box
          maxW="700px"
          mx="auto"
          mt={10}
          p={8}
          bg={cardBg}
          borderRadius="xl"
          boxShadow="lg"
        >
          <Heading
            size="lg"
            textAlign="center"
            mb={6}
            color={useColorModeValue("blue.600", "blue.300")}
          >
            🎬 Add New Course Video
          </Heading>

          <VStack spacing={5}>
            <FormControl isRequired>
              <FormLabel color={labelColor}>Video Title</FormLabel>
              <Input
                name="title"
                value={detail.title}
                onChange={handleChange}
                placeholder="Enter video title"
                bg={inputBg}
              />
            </FormControl>

            <FormControl isRequired>
              <FormLabel color={labelColor}>Course ID</FormLabel>
              <Input
                name="courseId"
                value={detail.courseId}
                onChange={handleChange}
                placeholder="e.g., c001, t123"
                bg={inputBg}
              />
            </FormControl>

            <FormControl isRequired>
              <FormLabel color={labelColor}>Description</FormLabel>
              <Textarea
                name="description"
                value={detail.description}
                onChange={handleChange}
                placeholder="Brief description of the video"
                bg={inputBg}
              />
            </FormControl>

            <FormControl isRequired>
              <FormLabel color={labelColor}>Video Link</FormLabel>
              <Input
                name="link"
                value={detail.link}
                onChange={handleChange}
                placeholder="https://example.com/video"
                bg={inputBg}
              />
            </FormControl>

            <FormControl>
              <FormLabel color={labelColor}>View Count</FormLabel>
              <Input
                name="views"
                type="number"
                value={detail.views}
                onChange={handleChange}
                placeholder="Optional: e.g. 1000"
                bg={inputBg}
              />
            </FormControl>

            <FormControl>
              <FormLabel color={labelColor}>Thumbnail URL</FormLabel>
              <Input
                name="img"
                value={detail.img}
                onChange={handleChange}
                placeholder="https://image-link.jpg"
                bg={inputBg}
              />
            </FormControl>

            <Button
              width="100%"
              colorScheme="blue"
              size="lg"
              mt={4}
              onClick={handleSubmit}
              _hover={{ bg: "blue.500" }}
              _active={{ bg: "blue.600" }}
            >
              Submit Video
            </Button>
          </VStack>
        </Box>
      </Box>
    </Grid>
  );
};

export default AddTeacherVideos;
