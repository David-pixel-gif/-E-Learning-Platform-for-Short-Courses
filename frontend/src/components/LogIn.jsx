// frontend/src/components/LogIn.jsx
import React, { useEffect, useMemo, useState } from "react";
import Navbar from "../Pages/Navbar";
import {
  Box,
  Button,
  Input,
  Heading,
  FormControl,
  FormLabel,
  useToast,
  useColorModeValue,
  Text,
  InputGroup,
  InputRightElement,
  VStack,
  Flex,
  Checkbox,
  HStack,
  Link as CkLink,
} from "@chakra-ui/react";
import { AiOutlineEyeInvisible, AiFillEye } from "react-icons/ai";
import { useDispatch, useSelector } from "react-redux";
import { Link as RouterLink, useNavigate } from "react-router-dom";
import api from "../api";

/* -------------------------------------------------------------------
   Debug toggles (CRA-safe). Set REACT_APP_DEBUG=1 to log extra info.
   ------------------------------------------------------------------- */
const DEBUG =
  process.env.REACT_APP_DEBUG &&
  String(process.env.REACT_APP_DEBUG).toLowerCase() === "1";

const dlog = (...a) => DEBUG && console.log("%c[DEBUG]", "color:#0ea5e9", ...a);
const derr = (...a) =>
  DEBUG && console.error("%c[DEBUG]", "color:#ef4444", ...a);

/* -------------------------------------------------------------------
   Helpers
   ------------------------------------------------------------------- */
const toRole = (v) => (v ? String(v).trim().toUpperCase() : null);

/** Build a uniform session shape from backend responses
 *  Supports both { user, token } and other legacy shapes used in your app.
 */
const buildSession = (data) => {
  const u = data?.user || data?.user_data || data?.userInfo || {};
  const token = data?.accessToken || data?.token || "";
  const refreshToken = data?.refreshToken || "";
  const role = toRole(u?.role);

  return {
    isAuth: Boolean(token),
    token,
    refreshToken,
    role, // "ADMIN" | "TEACHER" | "USER"
    name: u?.name || "",
    email: u?.email || "",
    userId: u?.id || u?._id || "",
    // convenience flags
    success: true,
    loading: false,
    isError: "",
    isUser: role === "USER",
    message: data?.msg || data?.message || "Login successful",
  };
};

/* -------------------------------------------------------------------
   Component
   ------------------------------------------------------------------- */
const Login = () => {
  const [form, setForm] = useState({
    email: "",
    password: "",
    remember: true,
  });
  const [showPassword, setShowPassword] = useState(false);

  const dispatch = useDispatch();
  const navigate = useNavigate();
  const toast = useToast();

  // Read only what we need from the store
  const userSlice = useSelector((s) => s?.UserReducer || {});
  const submitting = !!userSlice?.loading;

  // Theming tokens
  const cardBg = useColorModeValue(
    "rgba(255, 255, 255, 0.86)",
    "rgba(17, 25, 40, 0.85)"
  );
  const border = useColorModeValue("blackAlpha.200", "whiteAlpha.300");
  const accent = useColorModeValue("#1D4ED8", "#60A5FA"); // blue
  const gradientBg = useColorModeValue(
    "linear(to-br, #eef2ff, #e0f2fe)",
    "linear(to-br, #0b1020, #0a1425)"
  );

  /** Role we’ll use for redirect after login:
   *  - prefer store
   *  - else localStorage snapshot (user.role)
   */
  const effectiveRole = useMemo(() => {
    const storeRole = toRole(userSlice?.role || userSlice?.user?.role);
    if (storeRole) return storeRole;

    try {
      const snap = JSON.parse(localStorage.getItem("user") || "null");
      return toRole(snap?.role);
    } catch {
      return null;
    }
  }, [userSlice?.role, userSlice?.user?.role]);

  /* ---------------------------------------------------------------
     Validation (basic but strict)
     --------------------------------------------------------------- */
  const isValidEmail = (v) =>
    typeof v === "string" && /^\S+@\S+\.\S+$/.test(v.trim());
  const isValidPassword = (v) => typeof v === "string" && v.length >= 6;

  const formValid = isValidEmail(form.email) && isValidPassword(form.password);

  /* ---------------------------------------------------------------
     Redirect by role
     --------------------------------------------------------------- */
  const redirectByRole = (role) => {
    const r = toRole(role);
    if (!r) return;
    if (r === "ADMIN") navigate("/admin/dashboard", { replace: true });
    else if (r === "TEACHER") navigate("/teacher/dashboard", { replace: true });
    else navigate("/dashboard", { replace: true }); // USER default
  };

  /* ---------------------------------------------------------------
     Submit handler
     --------------------------------------------------------------- */
  const handleLogin = async () => {
    if (!formValid || submitting) return;

    dispatch({ type: "USER_LOGIN_LOADING" });

    try {
      const res = await api.post("/users/login", {
        email: form.email.trim(),
        password: form.password,
      });

      dlog("LOGIN response:", res?.data);

      // Persist tokens for the axios interceptor refresh flow
      if (res?.data?.token) localStorage.setItem("token", res.data.token);
      if (res?.data?.refreshToken)
        localStorage.setItem("refreshToken", res.data.refreshToken);

      // Session snapshot for the rest of the app
      const session = buildSession(res?.data);
      if (form.remember) {
        localStorage.setItem("user", JSON.stringify(session));
      } else {
        // If not remembering, we still set a minimal snapshot (optional)
        localStorage.setItem(
          "user",
          JSON.stringify({ ...session, token: session.token })
        );
      }

      dispatch({ type: "USER_LOGIN_SUCCESS", payload: session });

      toast.closeAll();
      toast({
        description: session.message,
        status: "success",
        duration: 1600,
        isClosable: true,
      });

      redirectByRole(session.role);
      // Optional: clear fields
      setForm((f) => ({ ...f, password: "" }));
    } catch (err) {
      const status = err?.response?.status;
      const data = err?.response?.data;
      const code = err?.code;

      let hint = "";
      if (code === "ERR_NETWORK" && !status) {
        hint =
          "Network/CORS issue: backend unreachable or CORS misconfigured on the server.";
      } else if (status === 404) {
        hint = "404: Wrong API path. Check /users/login vs /api/users/login.";
      } else if (status === 401) {
        hint = "Invalid email or password.";
      }

      const msg = data?.msg || data?.message || hint || "Login failed.";
      dispatch({ type: "USER_LOGIN_ERROR", error: msg });

      toast.closeAll();
      toast({
        description: msg,
        status: "error",
        duration: 4200,
        isClosable: true,
      });

      derr("Login error:", err);
    }
  };

  /* ---------------------------------------------------------------
     Auto-redirect if already logged in
     --------------------------------------------------------------- */
  useEffect(() => {
    if (userSlice?.isAuth && effectiveRole) redirectByRole(effectiveRole);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userSlice?.isAuth, effectiveRole]);

  /* ---------------------------------------------------------------
     Render
     --------------------------------------------------------------- */
  return (
    <Box minH="100vh" display="flex" flexDirection="column">
      <Navbar />

      <Flex
        flex="1"
        align="center"
        justify="center"
        bgGradient={gradientBg}
        px={4}
        position="relative"
        overflow="hidden"
      >
        {/* subtle blobs */}
        <Box
          position="absolute"
          top="-60px"
          right="-80px"
          w="260px"
          h="260px"
          rounded="full"
          bg="blue.200"
          opacity={0.25}
          filter="blur(18px)"
        />
        <Box
          position="absolute"
          bottom="-60px"
          left="-80px"
          w="220px"
          h="220px"
          rounded="full"
          bg="cyan.200"
          opacity={0.25}
          filter="blur(18px)"
        />

        <Box
          w={{ base: "100%", sm: "88%", md: "420px" }}
          bg={cardBg}
          p={{ base: 8, md: 10 }}
          rounded="2xl"
          border="1px solid"
          borderColor={border}
          boxShadow="0 18px 50px rgba(0,0,0,0.25)"
          backdropFilter="blur(20px) saturate(160%)"
          transition="transform .25s ease, box-shadow .25s ease"
          _hover={{ transform: "translateY(-4px)" }}
        >
          <Heading
            size="lg"
            textAlign="center"
            mb={2}
            color={accent}
            lineHeight="1.2"
          >
            Welcome back
          </Heading>

          <Text
            textAlign="center"
            mb={8}
            color="gray.600"
            _dark={{ color: "gray.300" }}
            fontSize="sm"
          >
            Sign in to access your courses and dashboard
          </Text>

          <VStack spacing={5} align="stretch">
            <FormControl isRequired>
              <FormLabel>Email</FormLabel>
              <Input
                type="email"
                value={form.email}
                onChange={(e) =>
                  setForm((f) => ({ ...f, email: e.target.value }))
                }
                placeholder="you@school.edu"
                focusBorderColor="blue.400"
                onKeyDown={(e) => e.key === "Enter" && handleLogin()}
              />
            </FormControl>

            <FormControl isRequired>
              <FormLabel>Password</FormLabel>
              <InputGroup>
                <Input
                  type={showPassword ? "text" : "password"}
                  value={form.password}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, password: e.target.value }))
                  }
                  placeholder="••••••••"
                  focusBorderColor="blue.400"
                  onKeyDown={(e) => e.key === "Enter" && handleLogin()}
                />
                <InputRightElement>
                  <Box
                    onClick={() => setShowPassword((s) => !s)}
                    cursor="pointer"
                    aria-label={
                      showPassword ? "Hide password" : "Show password"
                    }
                  >
                    {showPassword ? <AiFillEye /> : <AiOutlineEyeInvisible />}
                  </Box>
                </InputRightElement>
              </InputGroup>
            </FormControl>

            <HStack justify="space-between">
              <Checkbox
                isChecked={form.remember}
                onChange={(e) =>
                  setForm((f) => ({ ...f, remember: e.target.checked }))
                }
              >
                Remember me
              </Checkbox>

              <CkLink
                as={RouterLink}
                to="/forgot-password"
                fontSize="sm"
                color="blue.500"
              >
                Forgot password?
              </CkLink>
            </HStack>

            <Button
              colorScheme="blue"
              w="100%"
              size="lg"
              mt={2}
              onClick={handleLogin}
              isLoading={submitting}
              loadingText="Logging in..."
              rounded="lg"
              transition="transform .15s ease"
              _hover={{ transform: formValid ? "translateY(-1px)" : "none" }}
              _active={{ transform: "translateY(0)" }}
              isDisabled={!formValid}
            >
              Log In
            </Button>

            <Box textAlign="center" fontSize="sm">
              <Text>
                Don&apos;t have an account?{" "}
                <CkLink
                  as={RouterLink}
                  to="/signup"
                  color="blue.500"
                  fontWeight="semibold"
                >
                  Sign Up
                </CkLink>
              </Text>
            </Box>
          </VStack>
        </Box>
      </Flex>
    </Box>
  );
};

export default Login;
