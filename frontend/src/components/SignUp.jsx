// frontend/src/components/SignUp.jsx
import React, { useState } from "react";
import Navbar from "../Pages/Navbar";
import {
  Box,
  Button,
  Heading,
  Input,
  InputGroup,
  InputRightElement,
  Spinner,
  Text,
  useToast,
  Select,
  VStack,
  FormControl,
  FormLabel,
} from "@chakra-ui/react";
import { AiOutlineEyeInvisible, AiFillEye } from "react-icons/ai";
import { useDispatch, useSelector } from "react-redux";
import { Link, useNavigate } from "react-router-dom";
import api from "../api";
import { actionsingUpError } from "../Redux/UserReducer/actionType";

// ✅ Centralized toast helper
export const showToast = ({ toast, message, color = "red" }) => {
  toast({
    position: "top-right",
    duration: 3000,
    render: () => (
      <Box color="white" p={3} bg={color} borderRadius="md" fontWeight="500">
        {message || "Something went wrong"}
      </Box>
    ),
  });
};

const SignUp = () => {
  const [form, setForm] = useState({
    email: "",
    password: "",
    confirmPassword: "",
    name: "",
    role: "USER", // Default role = Student
  });
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  const navigate = useNavigate();
  const userStore = useSelector((store) => store.UserReducer);
  const dispatch = useDispatch();
  const toast = useToast();

  // Handle input changes
  const handleInput = (e) => {
    const { name, value } = e.target;
    setForm({ ...form, [name]: value });
  };

  // Sign up request
  const handleSignUp = async () => {
    const { email, password, confirmPassword, name, role } = form;

    // Basic validations
    if (!email || !password || !confirmPassword || !name || !role) {
      dispatch(actionsingUpError("All fields are required"));
      showToast({ toast, message: "All fields are required", color: "red" });
      return;
    }

    if (password !== confirmPassword) {
      dispatch(actionsingUpError("Passwords do not match"));
      showToast({ toast, message: "Passwords do not match", color: "red" });
      return;
    }

    if (password.length < 8) {
      dispatch(actionsingUpError("Password must be at least 8 characters"));
      showToast({
        toast,
        message: "Password must be at least 8 characters",
        color: "red",
      });
      return;
    }

    try {
      dispatch({ type: "USER_SIGNUP_LOADING" });

      // API call
      const { data } = await api.post("/users/register", {
        email,
        password,
        name,
        role, // 👈 send role to backend
      });

      showToast({
        toast,
        message: data?.msg || "Signup successful ✅",
        color: "green",
      });

      // Reset form
      setForm({
        email: "",
        password: "",
        confirmPassword: "",
        name: "",
        role: "USER",
      });

      navigate("/login");
    } catch (err) {
      const msg =
        err?.response?.data?.msg ||
        err?.response?.data?.message ||
        "Signup failed ❌";

      dispatch(actionsingUpError(msg));
      showToast({ toast, message: msg, color: "red" });
    }
  };

  return (
    <Box pb="2rem">
      <Navbar />
      <Box display="flex" justifyContent="center" pt="80px">
        <Box
          w={{ base: "90%", sm: "80%", md: "40%", lg: "30%" }}
          bg="white"
          p={8}
          borderRadius="xl"
          boxShadow="2xl"
          border="1px solid"
          borderColor="green.100"
        >
          <Heading size="lg" textAlign="center" mb={2} color="blue.600">
            Create Your Account
          </Heading>
          <Text textAlign="center" color="gray.500" mb={6}>
            Join as a student or instructor and start learning 🚀
          </Text>

          <VStack spacing={4} align="stretch">
            {/* Name */}
            <FormControl>
              <FormLabel fontWeight="600">Full Name</FormLabel>
              <Input
                name="name"
                value={form.name}
                onChange={handleInput}
                placeholder="Enter your full name"
              />
            </FormControl>

            {/* Email */}
            <FormControl>
              <FormLabel fontWeight="600">Email</FormLabel>
              <Input
                type="email"
                name="email"
                value={form.email}
                onChange={handleInput}
                placeholder="Enter your email"
              />
            </FormControl>

            {/* Role Selection */}
            <FormControl>
              <FormLabel fontWeight="600">Sign Up As</FormLabel>
              <Select
                name="role"
                value={form.role}
                onChange={handleInput}
                borderColor="gray.300"
              >
                <option value="USER">Student</option>
                <option value="TEACHER">Instructor</option>
              </Select>
            </FormControl>

            {/* Password */}
            <FormControl>
              <FormLabel fontWeight="600">Password</FormLabel>
              <InputGroup>
                <Input
                  type={showPassword ? "text" : "password"}
                  name="password"
                  value={form.password}
                  onChange={handleInput}
                  placeholder="Enter your password"
                />
                <InputRightElement>
                  <Box
                    onClick={() => setShowPassword(!showPassword)}
                    cursor="pointer"
                  >
                    {showPassword ? <AiFillEye /> : <AiOutlineEyeInvisible />}
                  </Box>
                </InputRightElement>
              </InputGroup>
            </FormControl>

            {/* Confirm Password */}
            <FormControl>
              <FormLabel fontWeight="600">Confirm Password</FormLabel>
              <InputGroup>
                <Input
                  type={showConfirm ? "text" : "password"}
                  name="confirmPassword"
                  value={form.confirmPassword}
                  onChange={handleInput}
                  placeholder="Confirm your password"
                />
                <InputRightElement>
                  <Box
                    onClick={() => setShowConfirm(!showConfirm)}
                    cursor="pointer"
                  >
                    {showConfirm ? <AiFillEye /> : <AiOutlineEyeInvisible />}
                  </Box>
                </InputRightElement>
              </InputGroup>
            </FormControl>

            {/* Submit */}
            <Button
              w="100%"
              colorScheme="blue"
              mt={4}
              onClick={handleSignUp}
              isLoading={userStore.loading}
              loadingText="Signing up..."
              _hover={{ bg: "green.500" }}
              transition="all 0.2s"
            >
              Sign Up
            </Button>

            {/* Link */}
            <Box textAlign="center" fontSize="sm" mt={2}>
              <Text>
                Already have an account?{" "}
                <Link to="/login">
                  <Text as="span" fontWeight="bold" color="blue.600">
                    Log In
                  </Text>
                </Link>
              </Text>
            </Box>
          </VStack>
        </Box>
      </Box>
    </Box>
  );
};

export default SignUp;
