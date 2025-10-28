// ============================================================================
// File: frontend/src/components/Adminitems/Discount.jsx
// Admin promo manager: live list, create, enable/disable, delete, filters + paging
// No external date lib (uses native Date).
// Backend (optional):
//   GET    /promos?search=&status=&page=&limit=         -> { data, pagination }
//   POST   /promos  (body: { code, title, description, percent, image, startsAt?, endsAt?, active })
//   PATCH  /promos/:id  (partial updates; used here for toggle active)
//   DELETE /promos/:id
// ============================================================================
import React, { useCallback, useEffect, useMemo, useState } from "react";
import {
  Box,
  Button,
  Flex,
  Grid,
  Image,
  Text,
  Badge,
  HStack,
  VStack,
  Input,
  Textarea,
  Select,
  useToast,
  useColorModeValue,
  IconButton,
  Divider,
  SimpleGrid,
  Skeleton,
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalCloseButton,
  ModalBody,
  ModalFooter,
  FormControl,
  FormLabel,
} from "@chakra-ui/react";
import { DeleteIcon, RepeatIcon, AddIcon } from "@chakra-ui/icons";

import AdminNavTop, { ADMIN_NAV_HEIGHT } from "../AdminNavTop";
import api from "../../api";

const PAGE_SIZE = 9;

// Small date formatter (YYYY-MM-DD)
function formatDate(v) {
  if (!v) return "—";
  const d = new Date(v);
  if (Number.isNaN(d.getTime())) return "—";
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

export default function Discount() {
  // data
  const [items, setItems] = useState([]);
  const [meta, setMeta] = useState({ total: 0, page: 1, pages: 1 });

  // ui
  const [loading, setLoading] = useState(true);
  const [deleting, setDeleting] = useState(null);
  const [toggling, setToggling] = useState(null);
  const [creating, setCreating] = useState(false);
  const [showCreate, setShowCreate] = useState(false);
  const [backendMissing, setBackendMissing] = useState(false);

  // filters
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("ALL"); // ALL | ACTIVE | INACTIVE
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(PAGE_SIZE);

  // new promo form
  const [form, setForm] = useState({
    code: "",
    title: "",
    description: "",
    percent: "",
    image: "",
    startsAt: "",
    endsAt: "",
    active: true,
  });

  const toast = useToast();

  // theme
  const surface = useColorModeValue("white", "gray.800");
  const border = useColorModeValue("gray.200", "gray.700");
  const subtle = useColorModeValue("gray.600", "gray.300");
  const accent = useColorModeValue("blue.600", "blue.300");
  const badgeActive = "green";
  const badgeInactive = "gray";

  const params = useMemo(
    () => ({
      page,
      limit,
      search: search || undefined,
      status: status === "ALL" ? undefined : status,
    }),
    [page, limit, search, status]
  );

  const load = useCallback(async () => {
    try {
      setLoading(true);
      setBackendMissing(false);
      const { data } = await api.get("/promos", { params });
      const list = data?.data || data || [];
      const pagination = data?.pagination || {
        total: list.length,
        page: 1,
        pages: 1,
      };
      setItems(list);
      setMeta(pagination);
    } catch (err) {
      const code = err?.response?.status;
      if (code === 404) {
        setBackendMissing(true);
        setItems([]);
        setMeta({ total: 0, page: 1, pages: 1 });
      } else {
        const msg =
          err?.response?.data?.msg ||
          err?.response?.data?.message ||
          err?.message ||
          "Failed to load promos.";
        toast({
          description: msg,
          status: "error",
          duration: 4500,
          isClosable: true,
        });
      }
    } finally {
      setLoading(false);
    }
  }, [params, toast]);

  useEffect(() => {
    load();
  }, [load]);

  const onCreate = async () => {
    const pct = Number(form.percent);
    if (!form.code.trim() || !form.title.trim() || !Number.isFinite(pct)) {
      toast({
        description: "Code, Title, and numeric Percent are required.",
        status: "error",
        duration: 3500,
      });
      return;
    }
    try {
      setCreating(true);
      const payload = {
        code: form.code.trim().toUpperCase(),
        title: form.title.trim(),
        description: form.description.trim(),
        percent: pct,
        image: form.image.trim() || undefined,
        active: !!form.active,
        startsAt: form.startsAt
          ? new Date(form.startsAt).toISOString()
          : undefined,
        endsAt: form.endsAt ? new Date(form.endsAt).toISOString() : undefined,
      };
      await api.post("/promos", payload);
      toast({
        description: "Promo created.",
        status: "success",
        duration: 1800,
      });
      setShowCreate(false);
      setForm({
        code: "",
        title: "",
        description: "",
        percent: "",
        image: "",
        startsAt: "",
        endsAt: "",
        active: true,
      });
      if (meta.page !== 1) setPage(1);
      else load();
    } catch (err) {
      const msg =
        err?.response?.data?.msg ||
        err?.response?.data?.message ||
        err?.message ||
        "Failed to create promo.";
      toast({
        description: msg,
        status: "error",
        duration: 4500,
        isClosable: true,
      });
    } finally {
      setCreating(false);
    }
  };

  const onDelete = async (id) => {
    if (!window.confirm("Delete this promo?")) return;
    try {
      setDeleting(id);
      await api.delete(`/promos/${id}`);
      toast({
        description: "Promo deleted.",
        status: "success",
        duration: 1600,
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
        duration: 4500,
        isClosable: true,
      });
    } finally {
      setDeleting(null);
    }
  };

  const onToggle = async (row) => {
    try {
      setToggling(row.id);
      await api.patch(`/promos/${row.id}`, { active: !row.active });
      toast({
        description: "Status updated.",
        status: "success",
        duration: 1400,
      });
      load();
    } catch (err) {
      const msg =
        err?.response?.data?.msg ||
        err?.response?.data?.message ||
        err?.message ||
        "Update failed.";
      toast({
        description: msg,
        status: "error",
        duration: 4500,
        isClosable: true,
      });
    } finally {
      setToggling(null);
    }
  };

  const Card = ({ row }) => {
    const active = !!row.active;

    return (
      <Box
        key={row.id}
        bg={surface}
        border="1px solid"
        borderColor={border}
        rounded="2xl"
        p={4}
        boxShadow="md"
        transition="transform 120ms ease"
        _hover={{ transform: "translateY(-2px)" }}
      >
        <Box
          rounded="xl"
          overflow="hidden"
          border="1px solid"
          borderColor={border}
          mb={3}
          h="180px"
          bg={useColorModeValue("gray.50", "gray.700")}
        >
          <Image
            src={
              row.image ||
              "https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?q=80&w=1200&auto=format"
            }
            alt={row.title}
            objectFit="cover"
            w="100%"
            h="100%"
          />
        </Box>

        <VStack align="start" spacing={1}>
          <HStack justify="space-between" w="100%">
            <Text fontWeight="bold">{row.title}</Text>
            <Badge colorScheme={active ? badgeActive : badgeInactive}>
              {active ? "ACTIVE" : "INACTIVE"}
            </Badge>
          </HStack>
          <Text fontSize="sm" color={subtle} noOfLines={2}>
            {row.description || "—"}
          </Text>
          <HStack spacing={3} mt={2}>
            <Badge colorScheme="purple">CODE: {row.code}</Badge>
            <Badge colorScheme="pink">{row.percent}% OFF</Badge>
          </HStack>
          <Text fontSize="xs" color={subtle} mt={1}>
            Starts: {formatDate(row.startsAt)} • Ends: {formatDate(row.endsAt)}
          </Text>
        </VStack>

        <Divider my={3} />

        <HStack justify="space-between">
          <Button
            size="sm"
            variant="outline"
            leftIcon={<RepeatIcon />}
            onClick={() => onToggle(row)}
            isLoading={toggling === row.id}
          >
            {row.active ? "Disable" : "Enable"}
          </Button>
          <IconButton
            size="sm"
            aria-label="Delete"
            colorScheme="red"
            icon={<DeleteIcon />}
            onClick={() => onDelete(row.id)}
            isLoading={deleting === row.id}
          />
        </HStack>
      </Box>
    );
  };

  return (
    <Grid className="Nav" minH="100vh" w="94%" mx="auto">
      <AdminNavTop />
      <Box h={`${ADMIN_NAV_HEIGHT}px`} />

      <Box px={{ base: 3, md: 6 }} py={6}>
        {/* Header + filters */}
        <VStack
          align="stretch"
          spacing={4}
          bg={surface}
          border="1px solid"
          borderColor={border}
          rounded="2xl"
          p={{ base: 4, md: 6 }}
          boxShadow="md"
        >
          <HStack justify="space-between">
            <VStack align="start" spacing={0}>
              <Text fontSize="xl" fontWeight="bold" color={accent}>
                Discounts & Promos
              </Text>
              <Text fontSize="sm" color={subtle}>
                Create, enable/disable, and delete promotional codes.
              </Text>
            </VStack>
            <HStack>
              <Button
                leftIcon={<AddIcon />}
                colorScheme="blue"
                onClick={() => setShowCreate(true)}
              >
                New promo
              </Button>
              <IconButton
                aria-label="Refresh"
                icon={<RepeatIcon />}
                onClick={load}
                variant="outline"
              />
            </HStack>
          </HStack>

          <HStack gap={3} flexWrap="wrap">
            <Input
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setPage(1);
              }}
              placeholder="Search by code/title/description"
              maxW="360px"
            />
            <Select
              value={status}
              onChange={(e) => {
                setStatus(e.target.value);
                setPage(1);
              }}
              maxW="200px"
            >
              <option value="ALL">All statuses</option>
              <option value="ACTIVE">Active</option>
              <option value="INACTIVE">Inactive</option>
            </Select>
            <Select
              value={limit}
              onChange={(e) => {
                setLimit(Number(e.target.value) || PAGE_SIZE);
                setPage(1);
              }}
              maxW="140px"
            >
              {[9, 12, 18, 24].map((n) => (
                <option key={n} value={n}>
                  {n}/page
                </option>
              ))}
            </Select>
          </HStack>
        </VStack>

        {/* Empty-backend hint */}
        {backendMissing && (
          <Box
            mt={4}
            bg={surface}
            border="1px dashed"
            borderColor={border}
            rounded="xl"
            p={4}
            color={subtle}
          >
            Backend endpoint <code>/promos</code> not found (404). Add it to
            enable this page.
          </Box>
        )}

        {/* List */}
        <Box mt={6}>
          {loading ? (
            <SimpleGrid columns={{ base: 1, md: 2, xl: 3 }} spacing={6}>
              {Array.from({ length: 6 }).map((_, i) => (
                <Skeleton key={i} h="320px" rounded="2xl" />
              ))}
            </SimpleGrid>
          ) : items.length === 0 ? (
            <Box
              bg={surface}
              border="1px solid"
              borderColor={border}
              rounded="2xl"
              p={10}
              textAlign="center"
              color={subtle}
            >
              No promos found. Create one to get started.
            </Box>
          ) : (
            <SimpleGrid columns={{ base: 1, md: 2, xl: 3 }} spacing={6}>
              {items.map((row) => (
                <Card key={row.id} row={row} />
              ))}
            </SimpleGrid>
          )}
        </Box>

        {/* Paginator */}
        <HStack justify="space-between" mt={6}>
          <Text fontSize="sm" color={subtle}>
            Page {meta.page} of {meta.pages} • {meta.total} total
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
      </Box>

      {/* Create modal */}
      <Modal isOpen={showCreate} onClose={() => setShowCreate(false)} size="lg">
        <ModalOverlay />
        <ModalContent>
          <ModalHeader>Create promo</ModalHeader>
          <ModalCloseButton />
          <ModalBody>
            <Grid templateColumns={{ base: "1fr", md: "1fr 1fr" }} gap={4}>
              <FormControl isRequired>
                <FormLabel>Code</FormLabel>
                <Input
                  value={form.code}
                  onChange={(e) =>
                    setForm((s) => ({ ...s, code: e.target.value }))
                  }
                  placeholder="e.g. SPRING50"
                />
              </FormControl>
              <FormControl isRequired>
                <FormLabel>Percent off</FormLabel>
                <Input
                  type="number"
                  min={1}
                  max={100}
                  value={form.percent}
                  onChange={(e) =>
                    setForm((s) => ({ ...s, percent: e.target.value }))
                  }
                  placeholder="e.g. 50"
                />
              </FormControl>
              <FormControl isRequired gridColumn="1 / -1">
                <FormLabel>Title</FormLabel>
                <Input
                  value={form.title}
                  onChange={(e) =>
                    setForm((s) => ({ ...s, title: e.target.value }))
                  }
                  placeholder="Promo title"
                />
              </FormControl>
              <FormControl gridColumn="1 / -1">
                <FormLabel>Description</FormLabel>
                <Textarea
                  value={form.description}
                  onChange={(e) =>
                    setForm((s) => ({ ...s, description: e.target.value }))
                  }
                  placeholder="Short description"
                />
              </FormControl>
              <FormControl gridColumn="1 / -1">
                <FormLabel>Image URL</FormLabel>
                <Input
                  value={form.image}
                  onChange={(e) =>
                    setForm((s) => ({ ...s, image: e.target.value }))
                  }
                  placeholder="https://…"
                />
              </FormControl>
              <FormControl>
                <FormLabel>Starts at</FormLabel>
                <Input
                  type="date"
                  value={form.startsAt}
                  onChange={(e) =>
                    setForm((s) => ({ ...s, startsAt: e.target.value }))
                  }
                />
              </FormControl>
              <FormControl>
                <FormLabel>Ends at</FormLabel>
                <Input
                  type="date"
                  value={form.endsAt}
                  onChange={(e) =>
                    setForm((s) => ({ ...s, endsAt: e.target.value }))
                  }
                />
              </FormControl>
            </Grid>
          </ModalBody>
          <ModalFooter>
            <Button variant="ghost" mr={3} onClick={() => setShowCreate(false)}>
              Cancel
            </Button>
            <Button colorScheme="blue" onClick={onCreate} isLoading={creating}>
              Create
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </Grid>
  );
}
