// src/components/teacher/AddTeacherCourse.jsx
import React, { useMemo, useState } from "react";
import {
  Box,
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  Button,
  Card,
  CardBody,
  CardHeader,
  Divider,
  FormControl,
  FormErrorMessage,
  FormLabel,
  Grid,
  GridItem,
  HStack,
  Icon,
  Image,
  Input,
  Stack,
  Text,
  Textarea,
  useToast,
} from "@chakra-ui/react";
import { NavLink, useNavigate } from "react-router-dom";
import { CheckCircle, ArrowLeft, Image as ImageIcon } from "lucide-react";

import TeacherNavTop from "./TeacherNavTop";
// ⬇️ central axios client (you already have this in api.js)
import { CourseAPI } from "../../api";

/**
 * AddTeacherCourse
 * - Strongly typed form state
 * - Inline validation
 * - Async submit with real API call
 * - Two equal cards (form + preview) for visual balance
 * - Breadcrumb + "active" hint for better navigation context
 */
const AddTeacherCourse = () => {
  const navigate = useNavigate();
  const toast = useToast();

  // ---------- form model ----------
  const [detail, setDetail] = useState({
    title: "",
    description: "",
    category: "",
    price: "",
    img: "",
  });

  // Loading state for submit button UX
  const [submitting, setSubmitting] = useState(false);

  // ---------- simple validation (front-end gate) ----------
  const errors = useMemo(() => {
    const e = {};
    if (!detail.title.trim()) e.title = "Title is required.";
    if (!detail.description.trim()) e.description = "Description is required.";
    if (!detail.category.trim()) e.category = "Category is required.";
    const p = Number(detail.price);
    if (Number.isNaN(p) || p < 0) e.price = "Price must be a number ≥ 0.";
    if (detail.img && !/^https?:\/\//i.test(detail.img))
      e.img = "Thumbnail must be a valid http(s) URL.";
    return e;
  }, [detail]);

  const isValid = useMemo(() => Object.keys(errors).length === 0, [errors]);

  // ---------- handlers ----------
  const handleChange = (e) => {
    const { name, value } = e.target;
    setDetail((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async () => {
    // Front-end guard to avoid firing bad payloads
    if (!isValid) {
      toast({
        status: "warning",
        title: "Please fix the highlighted fields.",
        duration: 2500,
      });
      return;
    }

    setSubmitting(true);
    try {
      // Normalize payload for backend
      const payload = {
        title: detail.title.trim(),
        description: detail.description.trim(),
        category: detail.category.trim(),
        price: Number(detail.price) || 0,
        img: detail.img.trim() || null,
      };

      // ⬇️ Real API call — posts to /courses with Bearer auth (from your api.js)
      await CourseAPI.create(payload);

      toast({
        status: "success",
        title: "Course created",
        description: "Your course was added successfully.",
        duration: 2000,
        icon: <Icon as={CheckCircle} />,
      });

      // Prefer lowercase route; update if your router uses different casing
      navigate("/teacher/courses");
    } catch (err) {
      // Show helpful server message when available
      const msg =
        err?.response?.data?.msg ||
        err?.response?.data?.message ||
        err?.message ||
        "Failed to add course";
      toast({ status: "error", title: "Create failed", description: msg });
    } finally {
      setSubmitting(false);
    }
  };

  // ---------- visual helpers ----------
  const previewTitle =
    detail.title.trim() || "Course title preview (updates as you type)";
  const previewDesc =
    detail.description.trim() ||
    "Your course description will appear here. Keep it concise and outcome-focused.";
  const previewCategory = detail.category.trim() || "Uncategorized";
  const previewPrice =
    Number(detail.price) > 0 ? `$${Number(detail.price).toFixed(2)}` : "Free";

  return (
    <Grid
      className="Nav"
      templateRows="auto 1fr"
      h="100dvh"
      w="100%"
      gap={6}
      bg="gray.50"
    >
      {/* Top navigation with "active" hint.
         If TeacherNavTop accepts props, pass current="add-course" so it can highlight the tab. */}
      <Box position="sticky" top={0} zIndex={10} bg="white">
        <TeacherNavTop current="add-course" />
      </Box>

      <Box px={{ base: 4, md: 8 }} pb={10} w="100%">
        {/* Breadcrumb improves navigation clarity */}
        <HStack justify="space-between" mb={4}>
          <Breadcrumb fontSize="sm" color="gray.600">
            <BreadcrumbItem>
              <BreadcrumbLink as={NavLink} to="/teacher/dashboard">
                Teacher
              </BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbItem>
              <BreadcrumbLink as={NavLink} to="/teacher/courses">
                Courses
              </BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbItem isCurrentPage>
              <BreadcrumbLink>Add Course</BreadcrumbLink>
            </BreadcrumbItem>
          </Breadcrumb>

          <Button
            leftIcon={<ArrowLeft size={18} />}
            variant="ghost"
            onClick={() => navigate(-1)}
          >
            Back
          </Button>
        </HStack>

        {/* Two equal cards side–by–side on md+, stacked on mobile */}
        <Grid
          templateColumns={{ base: "1fr", md: "1fr 1fr" }}
          gap={6}
          alignItems="start"
        >
          {/* FORM CARD */}
          <GridItem>
            <Card
              bg="white"
              borderRadius="2xl"
              shadow="sm"
              borderWidth="1px"
              minH="520px"
            >
              <CardHeader pb={0}>
                <Text fontSize="lg" fontWeight="bold">
                  New Course
                </Text>
                <Text fontSize="sm" color="gray.500">
                  Provide the core details students will see on the course page.
                </Text>
              </CardHeader>
              <CardBody>
                <Stack spacing={4}>
                  <FormControl isInvalid={!!errors.title} isRequired>
                    <FormLabel>Title</FormLabel>
                    <Input
                      type="text"
                      placeholder="e.g. React for Beginners"
                      name="title"
                      value={detail.title}
                      onChange={handleChange}
                    />
                    <FormErrorMessage>{errors.title}</FormErrorMessage>
                  </FormControl>

                  <FormControl isInvalid={!!errors.description} isRequired>
                    <FormLabel>Description</FormLabel>
                    <Textarea
                      placeholder="What will students learn? Who is this for?"
                      name="description"
                      value={detail.description}
                      onChange={handleChange}
                      rows={5}
                    />
                    <FormErrorMessage>{errors.description}</FormErrorMessage>
                  </FormControl>

                  <FormControl isInvalid={!!errors.category} isRequired>
                    <FormLabel>Category</FormLabel>
                    <Input
                      type="text"
                      placeholder="e.g. Programming, Design, Business"
                      name="category"
                      value={detail.category}
                      onChange={handleChange}
                    />
                    <FormErrorMessage>{errors.category}</FormErrorMessage>
                  </FormControl>

                  <HStack spacing={4} align="start">
                    <FormControl isInvalid={!!errors.price}>
                      <FormLabel>Price</FormLabel>
                      <Input
                        type="number"
                        placeholder="0 for free"
                        name="price"
                        inputMode="decimal"
                        value={detail.price}
                        onChange={handleChange}
                      />
                      <FormErrorMessage>{errors.price}</FormErrorMessage>
                    </FormControl>

                    <FormControl isInvalid={!!errors.img}>
                      <FormLabel>Thumbnail URL</FormLabel>
                      <Input
                        type="url"
                        placeholder="https://…"
                        name="img"
                        value={detail.img}
                        onChange={handleChange}
                      />
                      <FormErrorMessage>{errors.img}</FormErrorMessage>
                    </FormControl>
                  </HStack>

                  <Divider />

                  <Button
                    colorScheme="blue"
                    size="md"
                    onClick={handleSubmit}
                    isLoading={submitting}
                    loadingText="Saving…"
                    isDisabled={!isValid || submitting}
                  >
                    Create Course
                  </Button>
                </Stack>
              </CardBody>
            </Card>
          </GridItem>

          {/* PREVIEW CARD (kept same height for equal look) */}
          <GridItem>
            <Card
              bg="white"
              borderRadius="2xl"
              shadow="sm"
              borderWidth="1px"
              minH="520px"
            >
              <CardHeader pb={0}>
                <Text fontSize="lg" fontWeight="bold">
                  Live Preview
                </Text>
                <Text fontSize="sm" color="gray.500">
                  This is roughly how your course card/details might appear in
                  listings.
                </Text>
              </CardHeader>
              <CardBody>
                <Stack spacing={4}>
                  <Box
                    borderRadius="xl"
                    overflow="hidden"
                    borderWidth="1px"
                    bg="gray.100"
                    aspectRatio="16 / 9"
                    display="flex"
                    alignItems="center"
                    justifyContent="center"
                  >
                    {detail.img ? (
                      <Image
                        src={detail.img}
                        alt="Course thumbnail preview"
                        objectFit="cover"
                        w="100%"
                        h="100%"
                        fallbackSrc=""
                      />
                    ) : (
                      <Stack align="center" spacing={1} color="gray.500">
                        <Icon as={ImageIcon} />
                        <Text fontSize="xs">Thumbnail preview</Text>
                      </Stack>
                    )}
                  </Box>

                  <Box>
                    <Text fontSize="xl" fontWeight="bold" noOfLines={2}>
                      {previewTitle}
                    </Text>
                    <Text fontSize="sm" color="gray.600" noOfLines={3} mt={1}>
                      {previewDesc}
                    </Text>

                    <HStack mt={3} spacing={4} color="gray.600">
                      <Text
                        px={2}
                        py={0.5}
                        fontSize="xs"
                        borderRadius="lg"
                        bg="gray.100"
                      >
                        {previewCategory}
                      </Text>
                      <Text fontWeight="semibold">{previewPrice}</Text>
                    </HStack>
                  </Box>
                </Stack>
              </CardBody>
            </Card>
          </GridItem>
        </Grid>
      </Box>
    </Grid>
  );
};

export default AddTeacherCourse;
