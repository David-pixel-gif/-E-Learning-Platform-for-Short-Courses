// src/components/UserComponents/ResultsPage.jsx
import React, { useEffect, useState } from "react";
import {
  Box,
  Heading,
  Text,
  SimpleGrid,
  VStack,
  Button,
  Spinner,
  useToast,
} from "@chakra-ui/react";
import { useNavigate } from "react-router-dom";
import { UserAPI } from "../../api";
import api from "../../api"; // in case direct call to /mockattempts is needed

const ResultsPage = () => {
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(true);
  const toast = useToast();
  const navigate = useNavigate();

  useEffect(() => {
    const fetchResults = async () => {
      try {
        // Prefer direct route if backend has it, else derive from tests
        const { data } = await api
          .get("/mockattempts")
          .catch(() => ({ data: [] }));

        setResults(data || []);
      } catch (err) {
        console.error("Error loading results:", err);
        toast({
          title: "Error loading results",
          description: "Could not fetch mock test results.",
          status: "error",
          duration: 3000,
          isClosable: true,
        });
      } finally {
        setLoading(false);
      }
    };
    fetchResults();
  }, [toast]);

  if (loading) {
    return (
      <Box textAlign="center" mt={8}>
        <Spinner size="xl" />
        <Text mt={2}>Loading results...</Text>
      </Box>
    );
  }

  return (
    <Box p={6} bg="white" borderRadius="lg" boxShadow="md" mt={2}>
      <Heading as="h2" size="lg" mb={6}>
        🧾 My Test Results
      </Heading>

      {results.length === 0 ? (
        <Text color="gray.500">You haven’t attempted any tests yet.</Text>
      ) : (
        <SimpleGrid columns={[1, 2, 3]} spacing={5}>
          {results.map((r) => (
            <Box
              key={r.id}
              p={4}
              borderWidth="1px"
              borderRadius="md"
              bg="gray.50"
              _hover={{ bg: "gray.100" }}
              transition="0.2s"
            >
              <Heading size="md" mb={1}>
                {r.test?.title || "Untitled Test"}
              </Heading>
              <Text fontSize="sm" color="gray.600">
                Course: {r.test?.course?.title || "Unknown Course"}
              </Text>
              <Text mt={2} fontWeight="bold">
                Score: {r.score}%
              </Text>
              <Text fontSize="sm" color="gray.500" mt={1}>
                Taken on: {new Date(r.createdAt).toLocaleDateString()}
              </Text>
            </Box>
          ))}
        </SimpleGrid>
      )}

      <VStack align="start" mt={8}>
        <Button colorScheme="teal" onClick={() => navigate("/student")}>
          ← Back to Dashboard
        </Button>
      </VStack>
    </Box>
  );
};

export default ResultsPage;
