// ============================================================================
// File: frontend/src/components/Adminitems/AddUser.jsx
// Purpose: Beautiful admin "Add User" page wired to backend /users/register.
// Notes:
// - Uses UserAPI.signup (real endpoint). Falls back to legacy addUser action safely.
// - Fields map to backend: name, email, password, role, age (optional), place (city).
// - "image" kept in UI for parity but not sent (no column).
// ============================================================================
import React, { useMemo, useState } from "react";
import {
  Box,
  Button,
  FormControl,
  FormLabel,
  Grid,
  Input,
  Text,
  Textarea,
  Select,
  VStack,
  Heading,
  HStack,
  useToast,
  useColorModeValue,
  Divider,
  InputGroup,
  InputRightElement,
  IconButton,
} from "@chakra-ui/react";
import { ViewIcon, ViewOffIcon } from "@chakra-ui/icons";
import { useDispatch } from "react-redux";
import { useNavigate } from "react-router-dom";

import AdminNavTop, { ADMIN_NAV_HEIGHT } from "../AdminNavTop";
import { UserAPI } from "../../api";

// Optional legacy Redux action (kept for compatibility; not required)
import { addUser as legacyAddUser } from "../../Redux/AdminReducer/action";

const INITIAL = {
  name: "",
  email: "",
  password: "",
  role: "USER",
  age: "",
  place: "",
  image: "",
};

const ALLOWED_ROLES = ["USER", "TEACHER", "ADMIN"];

export default function AddUser() {
  const [form, setForm] = useState(INITIAL);
  const [showPwd, setShowPwd] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const dispatch = useDispatch();
  const navigate = useNavigate();
  const toast = useToast();

  // Theme
  const surface = useColorModeValue("white", "gray.800");
  const border = useColorModeValue("gray.200", "gray.700");
  const accent = useColorModeValue("blue.600", "blue.300");
  const subtle = useColorModeValue("gray.600", "gray.300");

  const onChange = (e) => {
    const { name, value } = e.target;
    setForm((s) => ({ ...s, [name]: value }));
  };

  const isValid = useMemo(() => {
    const emailOk = typeof form.email === "string" && form.email.includes("@");
    const pwdOk = (form.password || "").length >= 6;
    const nameOk = Boolean(form.name?.trim());
    const roleOk = ALLOWED_ROLES.includes(
      String(form.role || "").toUpperCase()
    );
    const ageOk =
      form.age === "" ||
      (Number.isFinite(Number(form.age)) && Number(form.age) >= 0);
    return emailOk && pwdOk && nameOk && roleOk && ageOk;
  }, [form]);

  const handleSubmit = async () => {
    if (!isValid) {
      toast({
        description:
          "Please fill Name, a valid Email, Password (min 6), Role, and a valid Age if provided.",
        status: "error",
        duration: 4000,
        isClosable: true,
      });
      return;
    }

    try {
      setSubmitting(true);

      // Map UI -> backend schema
      const payload = {
        name: form.name.trim(),
        email: form.email.trim(),
        password: form.password,
        role: String(form.role || "USER").toUpperCase(),
        age: form.age === "" ? undefined : Number(form.age),
        place: form.place?.trim() || undefined, // "city" field is "place" in backend
        // image not sent; backend schema has no such column
      };

      // Prefer calling the real API
      await UserAPI.signup(payload);

      // Optional legacy dispatch to keep existing admin store flows
      try {
        dispatch(
          legacyAddUser({
            ...form,
            role: payload.role,
          })
        );
      } catch {
        /* ignore if not wired */
      }

      toast({
        description: "User created successfully.",
        status: "success",
        duration: 2200,
        isClosable: true,
      });
      navigate("/admin/users", { replace: true });
    } catch (err) {
      const msg =
        err?.response?.data?.msg ||
        err?.response?.data?.message ||
        err?.message ||
        "Failed to create user.";
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
              Add a user
            </Heading>
            <Text fontSize="sm" color={subtle} mt={1}>
              Create student, teacher, or admin accounts. Password must be at
              least 6 characters.
            </Text>
          </Box>

          <Divider />

          <Grid templateColumns={{ base: "1fr", md: "1fr 1fr" }} gap={6}>
            <FormControl isRequired>
              <FormLabel>Name</FormLabel>
              <Input
                name="name"
                value={form.name}
                onChange={onChange}
                placeholder="Jane Doe"
                focusBorderColor={accent}
              />
            </FormControl>

            <FormControl isRequired>
              <FormLabel>Role</FormLabel>
              <Select
                name="role"
                value={form.role}
                onChange={onChange}
                focusBorderColor={accent}
              >
                {ALLOWED_ROLES.map((r) => (
                  <option key={r} value={r}>
                    {r}
                  </option>
                ))}
              </Select>
            </FormControl>

            <FormControl isRequired>
              <FormLabel>Email</FormLabel>
              <Input
                type="email"
                name="email"
                value={form.email}
                onChange={onChange}
                placeholder="user@example.com"
                focusBorderColor={accent}
              />
            </FormControl>

            <FormControl isRequired>
              <FormLabel>Password</FormLabel>
              <InputGroup>
                <Input
                  type={showPwd ? "text" : "password"}
                  name="password"
                  value={form.password}
                  onChange={onChange}
                  placeholder="minimum 6 characters"
                  focusBorderColor={accent}
                />
                <InputRightElement>
                  <IconButton
                    size="sm"
                    variant="ghost"
                    aria-label={showPwd ? "Hide password" : "Show password"}
                    icon={showPwd ? <ViewOffIcon /> : <ViewIcon />}
                    onClick={() => setShowPwd((v) => !v)}
                  />
                </InputRightElement>
              </InputGroup>
            </FormControl>

            <FormControl>
              <FormLabel>Age (optional)</FormLabel>
              <Input
                type="number"
                name="age"
                min={0}
                value={form.age}
                onChange={onChange}
                placeholder="e.g., 21"
                focusBorderColor={accent}
              />
            </FormControl>

            <FormControl>
              <FormLabel>City / Place (optional)</FormLabel>
              <Input
                name="place"
                value={form.place}
                onChange={onChange}
                placeholder="e.g., Harare"
                focusBorderColor={accent}
              />
            </FormControl>

            <FormControl gridColumn={{ base: "1 / -1", md: "1 / -1" }}>
              <FormLabel>Profile image URL (optional)</FormLabel>
              <Textarea
                name="image"
                value={form.image}
                onChange={onChange}
                placeholder="https://…"
                minH="80px"
                focusBorderColor={accent}
              />
            </FormControl>
          </Grid>

          <HStack justify="flex-end" pt={2}>
            <Button variant="outline" onClick={() => navigate("/admin/users")}>
              Cancel
            </Button>
            <Button
              colorScheme="blue"
              onClick={handleSubmit}
              isLoading={submitting}
              isDisabled={!isValid || submitting}
            >
              Create user
            </Button>
          </HStack>
        </VStack>
      </Box>
    </Grid>
  );
}
