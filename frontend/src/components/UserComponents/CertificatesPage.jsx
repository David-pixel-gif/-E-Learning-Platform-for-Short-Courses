// src/components/UserComponents/CertificatesPage.jsx
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
  Link,
} from "@chakra-ui/react";
import { useNavigate } from "react-router-dom";
import { UserAPI, CourseAPI } from "../../api";

const CertificatesPage = () => {
  const [certificates, setCertificates] = useState([]);
  const [courses, setCourses] = useState({});
  const [loading, setLoading] = useState(true);
  const toast = useToast();
  const navigate = useNavigate();

  useEffect(() => {
    const fetchCertificates = async () => {
      try {
        // Fetch certificates
        const certRes = await UserAPI.certificates();
        const certs = certRes.data || [];

        // Fetch course info for titles
        const coursePromises = certs.map((c) => CourseAPI.getById(c.courseId));
        const courseResponses = await Promise.allSettled(coursePromises);

        const courseMap = {};
        courseResponses.forEach((r, i) => {
          if (r.status === "fulfilled" && r.value?.data) {
            courseMap[certs[i].courseId] = r.value.data;
          }
        });

        setCertificates(certs);
        setCourses(courseMap);
      } catch (err) {
        console.error("Error loading certificates:", err);
        toast({
          title: "Failed to load certificates",
          status: "error",
          duration: 3000,
          isClosable: true,
        });
      } finally {
        setLoading(false);
      }
    };
    fetchCertificates();
  }, [toast]);

  if (loading) {
    return (
      <Box textAlign="center" mt={8}>
        <Spinner size="xl" />
        <Text mt={2}>Loading certificates...</Text>
      </Box>
    );
  }

  return (
    <Box p={6} bg="white" borderRadius="lg" boxShadow="md" mt={2}>
      <Heading as="h2" size="lg" mb={6}>
        🏅 My Certificates
      </Heading>

      {certificates.length === 0 ? (
        <Text color="gray.500">You have not earned any certificates yet.</Text>
      ) : (
        <SimpleGrid columns={[1, 2, 3]} spacing={5}>
          {certificates.map((cert) => {
            const course = courses[cert.courseId];
            return (
              <Box
                key={cert.id}
                p={4}
                borderWidth="1px"
                borderRadius="md"
                bg="gray.50"
                _hover={{ bg: "gray.100" }}
                transition="0.2s"
              >
                <Heading size="md" mb={2}>
                  {course?.title || "Unknown Course"}
                </Heading>
                <Text fontSize="sm" color="gray.600" mb={1}>
                  Issued: {new Date(cert.issuedAt).toLocaleDateString()}
                </Text>
                {cert.grade && (
                  <Text fontSize="sm" color="gray.600">
                    Grade: {cert.grade}
                  </Text>
                )}
                {cert.fileUrl || cert.certificateUrl ? (
                  <Link
                    href={cert.fileUrl || cert.certificateUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    <Button mt={3} colorScheme="teal" size="sm" width="full">
                      View / Download Certificate
                    </Button>
                  </Link>
                ) : (
                  <Button mt={3} size="sm" width="full" isDisabled>
                    No file available
                  </Button>
                )}
              </Box>
            );
          })}
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

export default CertificatesPage;
