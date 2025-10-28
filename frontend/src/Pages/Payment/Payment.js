// src/Pages/Payment/Payment.js
import React, { useEffect, useRef, useState } from "react";
import {
  Box,
  Flex,
  Heading,
  Text,
  Button,
  Modal,
  ModalBody,
  ModalCloseButton,
  ModalContent,
  ModalFooter,
  ModalHeader,
  ModalOverlay,
  Radio,
  Input,
  useToast,
} from "@chakra-ui/react";
import { keyframes } from "@emotion/react";
import { useParams } from "react-router";
import { SiFlutter } from "react-icons/si";

import DynamicSelect from "./DynamicSelect";
import { showToast } from "../../components/SignUp";
import { capitalizeFirstLetter } from "../../Redux/UserReducer/action";
// ✅ use the shared axios instance that attaches Authorization automatically
import api from "../../api";

export default function Payment({ isOpen, onOpen, onClose }) {
  const { id } = useParams();
  const courseId = id;

  const upiRef = useRef(null);
  const vpiRef = useRef(null);

  const [input, setInput] = useState("");
  const [course, setCourse] = useState({});
  const toast = useToast();

  // If you still need direct token (rare now, because api.js adds headers):
  const token = JSON.parse(localStorage.getItem("user") || "null")?.token || "";

  useEffect(() => {
    // Load course for the price + labels
    async function fetchCourse() {
      try {
        const { data } = await api.get(`/courses/${courseId}`, {
          // headers not needed if api.js interceptor attaches Bearer token
          headers: token ? { Authorization: `Bearer ${token}` } : undefined,
        });
        // Your backend returns { course: {...} } from GET /courses/:id
        setCourse(data?.course || data || {});
      } catch (err) {
        console.error("Fetch course failed:", err);
        showToast({
          toast,
          message:
            err?.response?.data?.msg ||
            err?.response?.data?.message ||
            err?.message ||
            "Failed to load course",
          color: "red",
        });
      }
    }
    if (isOpen && courseId) fetchCourse();
  }, [isOpen, courseId, token, toast]);

  // Show UPI box
  function showUPI() {
    if (upiRef.current) upiRef.current.style.display = "block";
  }

  // Hide UPI box
  function blockUPI() {
    if (upiRef.current) upiRef.current.style.display = "none";
  }

  // Handle VPA input
  function handleInput(e) {
    const val = e.target.value;
    setInput(val);
    // Simple visual enable state: green when it looks like a VPA (contains '@')
    if (vpiRef.current) {
      vpiRef.current.style.background = val.includes("@") ? "green" : "#90A4AE";
    }
  }

  // Handle "payment" -> enroll user into the course
  async function handlePayment() {
    try {
      const { data } = await api.post(`/users/addCourse/${courseId}`, {});
      showToast({
        toast,
        message: data?.message || data?.msg || "Course added successfully",
        color: "green",
      });
      onClose?.();
    } catch (err) {
      console.error("Add course failed:", err);
      showToast({
        toast,
        message:
          err?.response?.data?.error ||
          err?.response?.data?.msg ||
          err?.message ||
          "Payment failed",
        color: "red",
      });
      onClose?.();
    } finally {
      setInput("");
    }
  }

  const openAnimation = keyframes`
    0% { transform: scale(0); }
    100% { transform: scale(1); }
  `;

  return (
    <Modal isOpen={isOpen} onClose={onClose} isCentered>
      <ModalOverlay />
      <ModalContent>
        <ModalHeader>Checkout</ModalHeader>
        <ModalCloseButton />
        <ModalBody>
          <Box>
            {/* Header: Billing + Total */}
            <Flex justify="space-between" align="center">
              <Heading size="sm">Billing Address</Heading>
              <Box textAlign="right">
                <Heading size="sm">Total</Heading>
                <Heading size="xs">
                  ₹{typeof course?.price === "number" ? course.price : 0}
                </Heading>
              </Box>
            </Flex>

            {/* Info line */}
            <Flex mt={2} wrap="wrap" rowGap={1}>
              <Box mr="10px">
                <Text>
                  Module: {capitalizeFirstLetter(course?.title || "")}
                </Text>
              </Box>
              <Box>
                <Text>
                  Instructor:{" "}
                  {capitalizeFirstLetter(
                    // If your backend embeds teacher object (teacher.name), prefer that:
                    (
                      course?.teacher?.name ||
                      course?.teacher ||
                      "Unknown"
                    )?.toString()
                  )}
                </Text>
              </Box>
            </Flex>

            <Text fontSize="12px" mt={1}>
              {`Number of videos you are getting ${
                Array.isArray(course?.videos) ? course.videos.length : 1
              }`}
            </Text>

            {/* Address selectors */}
            <Box mt={3}>
              <DynamicSelect />
              <Text fontSize="12px" mt={2}>
                SRM is required by law to collect applicable transaction taxes
                for purchases made in certain tax jurisdictions.
              </Text>
            </Box>

            {/* Payment Method — UPI */}
            <Box mt={4}>
              <Flex
                bg="gray.100"
                justify="space-between"
                p="10px"
                align="center"
                onClick={showUPI}
                borderRadius="md"
              >
                <Flex align="center">
                  <Radio borderColor="black">
                    <Flex ml="5px" align="center">
                      <Box style={{ transform: "rotate(180deg)" }}>
                        <SiFlutter size="25px" color="#43A047" />
                      </Box>
                      <Heading size="xs" ml="7px">
                        UPI
                      </Heading>
                    </Flex>
                  </Radio>
                </Flex>
              </Flex>

              <Box
                ref={upiRef}
                display="none"
                animation={`${openAnimation} 0.2s ease`}
              >
                <Box p="8px">
                  <Box border="1px solid" p="8px" borderRadius="md">
                    {/* Title */}
                    <Text fontSize="12px" fontWeight="700">
                      Make a selection on how you would like to use UPI
                    </Text>

                    {/* VPA choice tag (static) */}
                    <Box
                      border="1px solid #0D47A1"
                      borderRadius="5px"
                      p="3px"
                      m="10px 0"
                      display="inline-block"
                      bg="#E1F5FE"
                    >
                      <Text fontSize="10px" color="#0D47A1">
                        Virtual Payment Address
                      </Text>
                    </Box>

                    {/* VPA input */}
                    <Box mt="10px" mb="16px">
                      <Text fontSize="12px" fontWeight="700" mb={2}>
                        Virtual Payment Address
                      </Text>
                      <Input
                        borderRadius="0"
                        border="1px solid black"
                        w="100%"
                        _focus={{ outline: "1px solid" }}
                        focusBorderColor="transparent"
                        onChange={handleInput}
                        value={input}
                        placeholder="yourname@upi"
                      />
                    </Box>
                  </Box>
                </Box>

                <Box textAlign="center" mt={1}>
                  <Text
                    fontWeight="500"
                    fontSize="10px"
                    onClick={blockUPI}
                    _hover={{ cursor: "pointer", textDecoration: "underline" }}
                  >
                    See Less
                  </Text>
                </Box>
              </Box>
            </Box>
          </Box>
        </ModalBody>

        <ModalFooter>
          <Button
            borderRadius="0px"
            background="#1565C0"
            color="white"
            _hover={{ background: "#1E88E5", color: "#CFD8DC" }}
            mr={3}
            onClick={onClose}
          >
            Close
          </Button>
          <Button
            onClick={handlePayment}
            isDisabled={!input.includes("@")}
            ref={vpiRef}
            borderRadius="0px"
            background="#90A4AE"
            color="white"
            _hover={{ color: "#004D40" }}
          >
            PayNow
          </Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
}
