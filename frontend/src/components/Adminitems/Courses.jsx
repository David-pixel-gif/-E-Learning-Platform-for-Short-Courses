// ============================================================================
// File: frontend/src/components/Adminitems/Courses.jsx
// Admin courses list (live): search, filter, sort, paginate, delete (guarded).
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
} from "@chakra-ui/react";
import { useNavigate } from "react-router-dom";
import { DeleteIcon } from "@chakra-ui/icons";

import AdminNavTop, { ADMIN_NAV_HEIGHT } from "../AdminNavTop";
import { CourseAPI } from "../../api";

const PAGE_SIZE = 8;

export default function Courses() {
  const [items, setItems] = useState([]);
  const [meta, setMeta] = useState({ total: 0, page: 1, pages: 1 });
  const [loading, setLoading] = useState(true);
  const [deleting, setDeleting] = useState(null);

  // filters/state
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("");
  const [order, setOrder] = useState(""); // asc|desc
  const [limit, setLimit] = useState(PAGE_SIZE);
  const [page, setPage] = useState(1);

  const toast = useToast();
  const navigate = useNavigate();

  // theme
  const surface = useColorModeValue("white", "gray.800");
  const border = useColorModeValue("gray.200", "gray.700");
  const subtle = useColorModeValue("gray.600", "gray.300");
  const accent = useColorModeValue("blue.600", "blue.300");

  // current user (for action guards)
  const currentUser = useMemo(() => {
    try {
      return JSON.parse(localStorage.getItem("user") || "null");
    } catch {
      return null;
    }
  }, []);
  const myRole = String(currentUser?.role || "").toUpperCase();
  const myId = currentUser?.userId || "";

  // Search from top bar
  const handleTopSearch = useCallback(
    (e) => {
      setSearch(e?.target?.value || "");
      setPage(1);
    },
    [setSearch]
  );

  const canDelete = useCallback(
    (row) => {
      if (myRole === "ADMIN") return true;
      if (myRole === "TEACHER" && row?.teacherId === myId) return true;
      return false;
    },
    [myRole, myId]
  );

  const load = useCallback(async () => {
    try {
      setLoading(true);
      const { data } = await CourseAPI.list({
        page,
        limit,
        search,
        order,
        category,
      });
      const list = data?.data || [];
      const pagination = data?.pagination || { total: 0, page: 1, pages: 1 };
      setItems(list);
      setMeta(pagination);
    } catch (err) {
      const msg =
        err?.response?.data?.msg ||
        err?.response?.data?.message ||
        err?.message ||
        "Failed to load courses.";
      toast({
        description: msg,
        status: "error",
        duration: 4000,
        isClosable: true,
      });
    } finally {
      setLoading(false);
    }
  }, [page, limit, search, order, category, toast]);

  useEffect(() => {
    load();
  }, [load]);

  const doDelete = async (id, row) => {
    if (!canDelete(row)) {
      toast({
        description: "Forbidden: you can only delete your own course.",
        status: "warning",
        duration: 3000,
      });
      return;
    }
    if (!window.confirm("Delete this course and its videos?")) return;

    try {
      setDeleting(id);
      await CourseAPI.remove(id);
      toast({
        description: "Course deleted.",
        status: "success",
        duration: 1800,
      });
      // refetch current page (adjust if we deleted last item)
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

  // top filters bar (under fixed nav)
  const Filters = (
    <Flex align="center" gap={3} wrap="wrap">
      <Input
        value={search}
        onChange={(e) => {
          setSearch(e.target.value);
          setPage(1);
        }}
        placeholder="Search title, description, category…"
        maxW="360px"
      />
      <Select
        value={category}
        onChange={(e) => {
          setCategory(e.target.value);
          setPage(1);
        }}
        placeholder="All categories"
        maxW="220px"
      >
        <option>Web Dev</option>
        <option>Frontend</option>
        <option>Backend</option>
        <option>Full Stack</option>
        <option>Data</option>
        <option>Mobile</option>
        <option>Other</option>
      </Select>
      <Select
        value={order}
        onChange={(e) => {
          setOrder(e.target.value);
          setPage(1);
        }}
        placeholder="Sort by price"
        maxW="200px"
      >
        <option value="asc">Price: Low → High</option>
        <option value="desc">Price: High → Low</option>
      </Select>
      <Select
        value={limit}
        onChange={(e) => {
          setLimit(Number(e.target.value) || PAGE_SIZE);
          setPage(1);
        }}
        maxW="140px"
      >
        {[8, 12, 16, 24].map((n) => (
          <option key={n} value={n}>
            {n}/page
          </option>
        ))}
      </Select>
      <Spacer />
      <Button colorScheme="blue" onClick={() => navigate("/admin/addcourse")}>
        + Add course
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
              Courses
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
                <Th>Category</Th>
                <Th isNumeric>Price</Th>
                <Th>Teacher</Th>
                <Th isNumeric>Videos</Th>
                <Th>Created</Th>
                <Th textAlign="right">Actions</Th>
              </Tr>
            </Thead>
            <Tbody>
              {loading ? (
                Array.from({ length: 6 }).map((_, i) => (
                  <Tr key={`sk-${i}`}>
                    <Td colSpan={7}>
                      <Skeleton h="20px" />
                    </Td>
                  </Tr>
                ))
              ) : items.length === 0 ? (
                <Tr>
                  <Td colSpan={7}>
                    <Box py={8} textAlign="center" color={subtle}>
                      No courses found. Try adjusting filters or add a new one.
                    </Box>
                  </Td>
                </Tr>
              ) : (
                items.map((c) => (
                  <Tr key={c.id}>
                    <Td>
                      <VStack align="start" spacing={0}>
                        <Text fontWeight="semibold">{c.title}</Text>
                        <Text fontSize="sm" color={subtle} noOfLines={1}>
                          {c.description}
                        </Text>
                      </VStack>
                    </Td>
                    <Td>
                      <Badge colorScheme="purple">{c.category || "—"}</Badge>
                    </Td>
                    <Td isNumeric>${Number(c.price || 0).toFixed(2)}</Td>
                    <Td>
                      {c.teacher?.name ? (
                        <Text noOfLines={1}>
                          {c.teacher.name}{" "}
                          <Text as="span" color={subtle} fontSize="sm">
                            ({c.teacher.email})
                          </Text>
                        </Text>
                      ) : (
                        "—"
                      )}
                    </Td>
                    <Td isNumeric>{c?._count?.videos ?? 0}</Td>
                    <Td>
                      {c.createdAt
                        ? new Date(c.createdAt).toLocaleDateString()
                        : "—"}
                    </Td>
                    <Td textAlign="right">
                      <HStack justify="flex-end">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() =>
                            navigate(`/admin/courses/${c.id}/edit`)
                          }
                        >
                          Edit
                        </Button>
                        <IconButton
                          size="sm"
                          aria-label="Delete"
                          colorScheme="red"
                          icon={<DeleteIcon />}
                          onClick={() => doDelete(c.id, c)}
                          isLoading={deleting === c.id}
                          isDisabled={!canDelete(c) || deleting === c.id}
                        />
                      </HStack>
                    </Td>
                  </Tr>
                ))
              )}
            </Tbody>
          </Table>
        </Box>

        {Paginator}
      </VStack>
    </Box>
  );
}
