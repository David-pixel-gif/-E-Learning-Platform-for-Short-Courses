// ============================================================================
// File: frontend/src/components/Adminitems/AddCourse.jsx
// Purpose: Beautiful admin "Create Course" page wired to backend (no mock).
// Notes:
// - Uses CourseAPI.create (real endpoint).
// - Binds teacherId from logged-in user (ADMIN can paste another id).
// - Keeps optional Redux action (addProduct) for backward compatibility.
// ============================================================================

import React, { useMemo, useState } from "react";
import {
  Box,
  Button,
  FormControl,
  FormLabel,
  Grid,
  Input,
  Select,
  Textarea,
  VStack,
  Heading,
  HStack,
  useToast,
  useColorModeValue,
  Divider,
} from "@chakra-ui/react";
import { useNavigate } from "react-router-dom";
import { useDispatch } from "react-redux";

import AdminNavTop, { ADMIN_NAV_HEIGHT } from "../AdminNavTop";
import { CourseAPI } from "../../api";

// Optional legacy action (kept so you don't break current store)
import { addProduct as legacyAddCourse } from "../../Redux/AdminReducer/action";

const INITIAL = {
  title: "",
  description: "",
  category: "",
  price: "",
  img: "",
  teacherId: "",
};

export default function AddCourse() {
  const [form, setForm] = useState(INITIAL);
  const [submitting, setSubmitting] = useState(false);
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const toast = useToast();

  // Theme accents
  const surface = useColorModeValue("white", "gray.800");
  const border = useColorModeValue("gray.200", "gray.700");
  const accent = useColorModeValue("blue.600", "blue.300");
  const subtle = useColorModeValue("gray.600", "gray.300");

  // Prefill teacher from logged-in user
  const currentUser = useMemo(() => {
    try {
      return JSON.parse(localStorage.getItem("user") || "null");
    } catch {
      return null;
    }
  }, []);

  React.useEffect(() => {
    if (currentUser?.userId && !form.teacherId) {
      setForm((s) => ({ ...s, teacherId: currentUser.userId }));
    }
  }, [currentUser, form.teacherId]);

  const isValid = useMemo(() => {
    if (!form.title?.trim()) return false;
    if (!form.description?.trim()) return false;
    if (!form.category?.trim()) return false;
    const p = Number(form.price);
    if (!Number.isFinite(p) || p < 0) return false;
    if (!form.teacherId?.trim()) return false;
    return true;
  }, [form]);

  const onChange = (e) => {
    const { name, value } = e.target;
    setForm((s) => ({ ...s, [name]: value }));
  };

  const onSubmit = async () => {
    if (!isValid) {
      toast({
        description: "Fill all required fields with valid values.",
        status: "error",
        duration: 3500,
        isClosable: true,
      });
      return;
    }

    try {
      setSubmitting(true);

      // Backend payload (img is ignored by backend schema; kept for UI parity)
      const payload = {
        title: form.title.trim(),
        description: form.description.trim(),
        category: form.category.trim(),
        price: Number(form.price),
        teacherId: form.teacherId.trim(),
        img: form.img?.trim() || "",
      };

      // Prefer direct API → real data
      await CourseAPI.create(payload);

      // Optional legacy dispatch (no harm if action is no-op)
      try {
        dispatch(legacyAddCourse(payload));
      } catch {
        /* ignore if not wired */
      }

      toast({
        description: "Course created successfully.",
        status: "success",
        duration: 2200,
        isClosable: true,
      });
      navigate("/admin/courses", { replace: true });
    } catch (err) {
      const msg =
        err?.response?.data?.msg ||
        err?.response?.data?.message ||
        err?.message ||
        "Failed to create course.";
      toast({
        description: msg,
        status: "error",
        duration: 4500,
        isClosable: true,
      });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Grid className="Nav" minH="100vh" w="94%" mx="auto">
      <AdminNavTop />
      <Box h={`${ADMIN_NAV_HEIGHT}px`} /> {/* spacer under fixed nav */}
      <Box px={{ base: 3, md: 6 }} py={6}>
        <VStack
          align="stretch"
          spacing={6}
          maxW="960px"
          mx="auto"
          bg={surface}
          border="1px solid"
          borderColor={border}
          rounded="2xl"
          p={{ base: 5, md: 8 }}
          boxShadow="lg"
        >
          <Box>
            <Heading size="lg" color={accent}>
              Create a new course
            </Heading>
            <Box fontSize="sm" color={subtle} mt={1}>
              Provide core info. You can attach videos later.
            </Box>
          </Box>

          <Divider />

          <Grid
            templateColumns={{ base: "1fr", md: "1fr 1fr" }}
            gap={6}
            alignItems="start"
          >
            <FormControl isRequired>
              <FormLabel>Title</FormLabel>
              <Input
                name="title"
                value={form.title}
                onChange={onChange}
                placeholder="e.g., React Advanced Patterns"
                focusBorderColor={accent}
              />
            </FormControl>

            <FormControl isRequired>
              <FormLabel>Category</FormLabel>
              <Select
                name="category"
                value={form.category}
                onChange={onChange}
                placeholder="Select category"
                focusBorderColor={accent}
              >
                <option>Web Dev</option>
                <option>Frontend</option>
                <option>Backend</option>
                <option>Full Stack</option>
                <option>Data</option>
                <option>Mobile</option>
                <option>Other</option>
              </Select>
            </FormControl>

            <FormControl isRequired gridColumn={{ base: "1", md: "1 / -1" }}>
              <FormLabel>Description</FormLabel>
              <Textarea
                name="description"
                value={form.description}
                onChange={onChange}
                placeholder="What students will learn, prerequisites, course outline…"
                minH="110px"
                focusBorderColor={accent}
              />
            </FormControl>

            <FormControl isRequired>
              <FormLabel>Price (USD)</FormLabel>
              <Input
                name="price"
                type="number"
                value={form.price}
                onChange={onChange}
                placeholder="e.g., 99"
                min={0}
                focusBorderColor={accent}
              />
            </FormControl>

            <FormControl>
              <FormLabel>Thumbnail URL (optional)</FormLabel>
              <Input
                name="img"
                value={form.img}
                onChange={onChange}
                placeholder="https://…"
                focusBorderColor={accent}
              />
            </FormControl>

            <FormControl isRequired>
              <FormLabel>Teacher ID</FormLabel>
              <Input
                name="teacherId"
                value={form.teacherId}
                onChange={onChange}
                placeholder="teacher user id"
                focusBorderColor={accent}
              />
            </FormControl>
          </Grid>

          <HStack justify="flex-end" pt={2}>
            <Button
              variant="outline"
              onClick={() => navigate("/admin/courses")}
            >
              Cancel
            </Button>
            <Button
              colorScheme="blue"
              onClick={onSubmit}
              isLoading={submitting}
              isDisabled={!isValid || submitting}
            >
              Create course
            </Button>
          </HStack>
        </VStack>
      </Box>
    </Grid>
  );
}
