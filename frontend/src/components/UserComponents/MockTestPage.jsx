// src/components/UserComponents/MockTestPage.jsx
import React from 'react';
import { Box, Button, Heading, Text, VStack } from '@chakra-ui/react';
import { useNavigate } from 'react-router-dom';

const MockTestPage = () => {
  const navigate = useNavigate();

  return (
    <Box p={4} bg="white" boxShadow="md" borderRadius="md">
      <Heading as="h2" size="lg" mb="4">
        Mock Test
      </Heading>
      <VStack spacing={4} align="stretch">
        <Text fontSize="md" color="gray.600">
          Ready to test your skills? Click below to start.
        </Text>
        <Button colorScheme="blue" size="lg" onClick={() => navigate('/exam')}>
          Start Mock Test
        </Button>
      </VStack>
    </Box>
  );
};

export default MockTestPage;
 
