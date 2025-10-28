// ============================================================================
// File: frontend/src/components/Adminitems/GetVideos.jsx
// Admin videos list (live): search, filter by course, paginate, delete (guarded)
// ============================================================================
import React, { useCallback, useEffect, useMemo, useState } from "react";
import {
  Box,
  Button,
  IconButton,
  Input,
  Select,
  SimpleGrid,
  Text,
  VStack,
  HStack,
  useToast,
  useColorModeValue,
  Table,
  Thead,
  Tbody,
  Tr,
  Th,
  Td,
  Badge,
  Skeleton,
  Flex,
  Spacer,
  Link as ChakraLink,
} from "@chakra-ui/react";
import { ExternalLinkIcon, DeleteIcon } from "@chakra-ui/icons";
import { useNavigate } from "react-router-dom";

import AdminNavTop, { ADMIN_NAV_HEIGHT } from "../AdminNavTop";
import { CourseAPI, VideoAPI } from "../../api";

const PAGE_SIZE = 10;

export default function GetVideos() {
  // data
  const [videos, setVideos] = useState([]);
  const [courses, setCourses] = useState([]);
  // meta
  const [meta, setMeta] = useState({ total: 0, page: 1, pages: 1 });
  const [loading, setLoading] = useState(true);
  const [loadingCourses, setLoadingCourses] = useState(true);
  const [deleting, setDeleting] = useState(null);

  // filters
  const [search, setSearch] = useState("");
  const [courseId, setCourseId] = useState("");
  const [limit, setLimit] = useState(PAGE_SIZE);
  const [page, setPage] = useState(1);

  const toast = useToast();
  const navigate = useNavigate();

  // theme
  const surface = useColorModeValue("white", "gray.800");
  const border = useColorModeValue("gray.200", "gray.700");
  const subtle = useColorModeValue("gray.600", "gray.300");
  const accent = useColorModeValue("blue.600", "blue.300");

  // current user
  const currentUser = useMemo(() => {
    try {
      return JSON.parse(localStorage.getItem("user") || "null");
    } catch {
      return null;
    }
  }, []);
  const myRole = String(currentUser?.role || "").toUpperCase();
  const myId = currentUser?.userId || "";

  // map courseId -> {title, teacherId}
  const courseMap = useMemo(() => {
    const m = new Map();
    for (const c of courses || []) {
      m.set(c.id, { title: c.title, teacherId: c.teacherId });
    }
    return m;
  }, [courses]);

  // topbar search
  const handleTopSearch = useCallback(
    (e) => {
      setSearch(e?.target?.value || "");
      setPage(1);
    },
    [setSearch]
  );

  // guards
  const canDelete = useCallback(
    (video) => {
      if (myRole === "ADMIN") return true;
      if (myRole === "TEACHER") {
        const course = courseMap.get(video.courseId);
        return course?.teacherId === myId;
      }
      return false;
    },
    [myRole, myId, courseMap]
  );

  // load courses (for filter + ownership checks)
  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        setLoadingCourses(true);
        const { data } = await CourseAPI.list({ page: 1, limit: 200 });
        if (alive) setCourses(data?.data || []);
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
  }, [toast]);

  // load videos
  const load = useCallback(async () => {
    try {
      setLoading(true);
      // backend supports search + courseId + pagination
      const { data } = await VideoAPI.list({
        search,
        courseId: courseId || undefined,
        page,
        limit,
      });
      const list = data?.data || data || [];
      const pagination = data?.pagination || {
        total: list.length,
        page: 1,
        pages: 1,
      };
      setVideos(list);
      setMeta(pagination);
    } catch (err) {
      const msg =
        err?.response?.data?.msg ||
        err?.response?.data?.message ||
        err?.message ||
        "Failed to load videos.";
      toast({
        description: msg,
        status: "error",
        duration: 4000,
        isClosable: true,
      });
    } finally {
      setLoading(false);
    }
  }, [page, limit, search, courseId, toast]);

  useEffect(() => {
    load();
  }, [load]);

  // delete
  const doDelete = async (row) => {
    if (!canDelete(row)) {
      toast({
        description: "Forbidden: you can only delete from your own courses.",
        status: "warning",
        duration: 3000,
      });
      return;
    }
    if (!window.confirm("Delete this video?")) return;

    try {
      setDeleting(row.id);
      await VideoAPI.remove(row.id);
      toast({
        description: "Video deleted.",
        status: "success",
        duration: 1800,
      });
      const nextCount = meta.total - 1;
      const lastPage = Math.max(1, Math.ceil(nextCount / limit));
      if (page > lastPage) setPage(lastPage);
      else load();
    } catch (err) {
      const msg =
        err?.response?.data?.msg ||
        err?.response?.data?.message ||
        err?.message ||
        "Delete failed.";
      toast({
        description: msg,
        status: "error",
        duration: 4000,
        isClosable: true,
      });
    } finally {
      setDeleting(null);
    }
  };

  // filters block
  const Filters = (
    <Flex align="center" gap={3} wrap="wrap">
      <Input
        value={search}
        onChange={(e) => {
          setSearch(e.target.value);
          setPage(1);
        }}
        placeholder="Search title…"
        maxW="360px"
      />
      <Select
        value={courseId}
        onChange={(e) => {
          setCourseId(e.target.value);
          setPage(1);
        }}
        placeholder={loadingCourses ? "Loading courses…" : "All courses"}
        maxW="260px"
        isDisabled={loadingCourses}
      >
        {courses.map((c) => (
          <option key={c.id} value={c.id}>
            {c.title}
          </option>
        ))}
      </Select>
      <Select
        value={limit}
        onChange={(e) => {
          setLimit(Number(e.target.value) || PAGE_SIZE);
          setPage(1);
        }}
        maxW="140px"
      >
        {[10, 15, 20, 30].map((n) => (
          <option key={n} value={n}>
            {n}/page
          </option>
        ))}
      </Select>
      <Spacer />
      <Button colorScheme="blue" onClick={() => navigate("/admin/addvideos")}>
        + Add video
      </Button>
    </Flex>
  );

  // paginator
  const Paginator = (
    <HStack justify="space-between" mt={4}>
      <Text fontSize="sm" color={subtle}>
        Showing page {meta.page} of {meta.pages} • {meta.total} total
      </Text>
      <HStack>
        <Button
          onClick={() => setPage((p) => Math.max(1, p - 1))}
          isDisabled={page <= 1 || loading}
          variant="outline"
          size="sm"
        >
          Prev
        </Button>
        <Button
          onClick={() => setPage((p) => Math.min(meta.pages || 1, p + 1))}
          isDisabled={page >= (meta.pages || 1) || loading}
          variant="outline"
          size="sm"
        >
          Next
        </Button>
      </HStack>
    </HStack>
  );

  return (
    <Box minH="100vh" w="94%" mx="auto">
      <AdminNavTop onSearchChange={handleTopSearch} />
      <Box h={`${ADMIN_NAV_HEIGHT}px`} />

      <VStack align="stretch" spacing={6} px={{ base: 3, md: 6 }} py={6}>
        {/* Header & Filters */}
        <SimpleGrid
          columns={{ base: 1, md: 1 }}
          spacing={4}
          bg={surface}
          border="1px solid"
          borderColor={border}
          rounded="2xl"
          p={{ base: 4, md: 6 }}
          boxShadow="md"
        >
          <HStack justify="space-between" align="center">
            <Text fontSize="xl" fontWeight="bold" color={accent}>
              Videos
            </Text>
          </HStack>
          {Filters}
        </SimpleGrid>

        {/* Table */}
        <Box
          bg={surface}
          border="1px solid"
          borderColor={border}
          rounded="2xl"
          p={{ base: 0, md: 0 }}
          overflow="hidden"
          boxShadow="md"
        >
          <Table size="md" variant="simple">
            <Thead bg={useColorModeValue("gray.50", "gray.700")}>
              <Tr>
                <Th>Title</Th>
                <Th>Course</Th>
                <Th isNumeric>Views</Th>
                <Th>Created</Th>
                <Th textAlign="right">Actions</Th>
              </Tr>
            </Thead>
            <Tbody>
              {loading ? (
                Array.from({ length: 8 }).map((_, i) => (
                  <Tr key={`sk-${i}`}>
                    <Td colSpan={5}>
                      <Skeleton h="20px" />
                    </Td>
                  </Tr>
                ))
              ) : videos.length === 0 ? (
                <Tr>
                  <Td colSpan={5}>
                    <Box py={8} textAlign="center" color={subtle}>
                      No videos found. Try adjusting filters or add a new one.
                    </Box>
                  </Td>
                </Tr>
              ) : (
                videos.map((v) => {
                  const course = courseMap.get(v.courseId);
                  return (
                    <Tr key={v.id}>
                      <Td>
                        <VStack align="start" spacing={0}>
                          <Text fontWeight="semibold">{v.title}</Text>
                          <ChakraLink
                            href={v.link}
                            isExternal
                            color="blue.500"
                            fontSize="sm"
                          >
                            open link <ExternalLinkIcon mx="2px" />
                          </ChakraLink>
                        </VStack>
                      </Td>
                      <Td>
                        {course ? (
                          <>
                            <Text noOfLines={1}>{course.title}</Text>
                            <Badge ml={1} colorScheme="purple">
                              {course.teacherId === myId ? "Mine" : "—"}
                            </Badge>
                          </>
                        ) : (
                          "—"
                        )}
                      </Td>
                      <Td isNumeric>{v.views ?? 0}</Td>
                      <Td>
                        {v.createdAt
                          ? new Date(v.createdAt).toLocaleDateString()
                          : "—"}
                      </Td>
                      <Td textAlign="right">
                        <HStack justify="flex-end">
                          <IconButton
                            size="sm"
                            aria-label="Delete"
                            colorScheme="red"
                            icon={<DeleteIcon />}
                            onClick={() => doDelete(v)}
                            isLoading={deleting === v.id}
                            isDisabled={!canDelete(v) || deleting === v.id}
                          />
                        </HStack>
                      </Td>
                    </Tr>
                  );
                })
              )}
            </Tbody>
          </Table>
        </Box>

        {Paginator}
      </VStack>
    </Box>
  );
}
