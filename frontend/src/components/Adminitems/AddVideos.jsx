// ============================================================================
// File: frontend/src/components/Adminitems/AddVideos.jsx
// Purpose: Beautiful admin "Add Video" page wired to backend (no mock).
// Notes:
//  - Uses VideoAPI.create (real endpoint).
//  - Loads course list; if role=TEACHER, limits to their own courses (client-side).
// ============================================================================

import React, { useEffect, useMemo, useState } from "react";
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
  InputGroup,
  InputLeftAddon,
} from "@chakra-ui/react";
import { useNavigate } from "react-router-dom";

import AdminNavTop, { ADMIN_NAV_HEIGHT } from "../AdminNavTop";
import { CourseAPI, VideoAPI } from "../../api";

const INITIAL = {
  title: "",
  link: "",
  description: "",
  img: "",
  courseId: "",
  views: "0",
};

export default function AddVideos() {
  const [form, setForm] = useState(INITIAL);
  const [courses, setCourses] = useState([]);
  const [loadingCourses, setLoadingCourses] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  const navigate = useNavigate();
  const toast = useToast();

  // Theme
  const surface = useColorModeValue("white", "gray.800");
  const border = useColorModeValue("gray.200", "gray.700");
  const accent = useColorModeValue("blue.600", "blue.300");
  const subtle = useColorModeValue("gray.600", "gray.300");

  // Current user
  const currentUser = useMemo(() => {
    try {
      return JSON.parse(localStorage.getItem("user") || "null");
    } catch {
      return null;
    }
  }, []);
  const myRole = String(currentUser?.role || "").toUpperCase();
  const myId = currentUser?.userId || "";

  // Load courses (client-side filter for teacher ownership)
  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        setLoadingCourses(true);
        const { data } = await CourseAPI.list({ page: 1, limit: 100 }); // fetch a decent page
        let list = data?.data || [];
        if (myRole === "TEACHER" && myId) {
          list = list.filter((c) => c?.teacherId === myId);
        }
        if (alive) setCourses(list);
      } catch (err) {
        const msg =
          err?.response?.data?.msg ||
          err?.response?.data?.message ||
          "Failed to load courses.";
        toast({
          description: msg,
          status: "error",
          duration: 4000,
          isClosable: true,
        });
      } finally {
        if (alive) setLoadingCourses(false);
      }
    })();
    return () => {
      alive = false;
    };
  }, [myRole, myId, toast]);

  // Validation
  const isValid = useMemo(() => {
    if (!form.title.trim()) return false;
    if (!form.link.trim()) return false;
    if (!form.courseId.trim()) return false;
    const v = Number(form.views);
    if (!Number.isFinite(v) || v < 0) return false;
    // quick URL-ish check
    if (!/^https?:\/\//i.test(form.link.trim())) return false;
    return true;
  }, [form]);

  const onChange = (e) => {
    const { name, value } = e.target;
    setForm((s) => ({ ...s, [name]: value }));
  };

  const onSubmit = async () => {
    if (!isValid) {
      toast({
        description: "Fill required fields (valid URL, select a course).",
        status: "error",
        duration: 3500,
        isClosable: true,
      });
      return;
    }

    try {
      setSubmitting(true);
      const payload = {
        title: form.title.trim(),
        link: form.link.trim(),
        courseId: form.courseId.trim(),
        views: Number(form.views) || 0,
        img: form.img?.trim() || "",
        description: form.description?.trim() || "",
      };
      await VideoAPI.create(payload);

      toast({
        description: "Video added successfully.",
        status: "success",
        duration: 2200,
        isClosable: true,
      });
      navigate("/admin/videos", { replace: true });
    } catch (err) {
      const msg =
        err?.response?.data?.msg ||
        err?.response?.data?.message ||
        err?.message ||
        "Failed to add video.";
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
      <Box h={`${ADMIN_NAV_HEIGHT}px`} />

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
              Add a new video
            </Heading>
            <Box fontSize="sm" color={subtle} mt={1}>
              Attach a video to an existing course.
            </Box>
          </Box>

          <Divider />

          <Grid
            templateColumns={{ base: "1fr", md: "1fr 1fr" }}
            gap={6}
            alignItems="start"
          >
            <FormControl isRequired>
              <FormLabel>Course</FormLabel>
              <Select
                name="courseId"
                value={form.courseId}
                onChange={onChange}
                placeholder={
                  loadingCourses ? "Loading courses…" : "Select course"
                }
                isDisabled={loadingCourses || courses.length === 0}
                focusBorderColor={accent}
              >
                {courses.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.title}
                  </option>
                ))}
              </Select>
            </FormControl>

            <FormControl isRequired>
              <FormLabel>Title</FormLabel>
              <Input
                name="title"
                value={form.title}
                onChange={onChange}
                placeholder="e.g., React Hooks Deep Dive"
                focusBorderColor={accent}
              />
            </FormControl>

            <FormControl isRequired gridColumn={{ base: "1", md: "1 / -1" }}>
              <FormLabel>Video link (URL)</FormLabel>
              <InputGroup>
                <InputLeftAddon>https://</InputLeftAddon>
                <Input
                  name="link"
                  value={form.link.replace(/^https?:\/\//i, "")}
                  onChange={(e) => {
                    const val = e.target.value.trim();
                    setForm((s) => ({
                      ...s,
                      link: val
                        ? /^https?:\/\//i.test(val)
                          ? val
                          : "https://" + val
                        : "",
                    }));
                  }}
                  placeholder="youtube.com/watch?v=… or cdn.example.com/video.mp4"
                  focusBorderColor={accent}
                />
              </InputGroup>
            </FormControl>

            <FormControl gridColumn={{ base: "1", md: "1 / -1" }}>
              <FormLabel>Description (optional)</FormLabel>
              <Textarea
                name="description"
                value={form.description}
                onChange={onChange}
                placeholder="Short description of the video…"
                minH="100px"
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

            <FormControl>
              <FormLabel>Initial views</FormLabel>
              <Input
                name="views"
                type="number"
                min={0}
                value={form.views}
                onChange={onChange}
                placeholder="0"
                focusBorderColor={accent}
              />
            </FormControl>
          </Grid>

          <HStack justify="flex-end" pt={2}>
            <Button variant="outline" onClick={() => navigate("/admin/videos")}>
              Cancel
            </Button>
            <Button
              colorScheme="blue"
              onClick={onSubmit}
              isLoading={submitting}
              isDisabled={!isValid || submitting || loadingCourses}
            >
              Add video
            </Button>
          </HStack>
        </VStack>
      </Box>
    </Grid>
  );
}
