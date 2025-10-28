import React from "react";
import {
  Box,
  Container,
  Stack,
  Heading,
  Text,
  Button,
  Image,
  Flex,
  useColorModeValue,
  VisuallyHidden,
  Link as ChakraLink,
} from "@chakra-ui/react";
import { Link as RouterLink } from "react-router-dom";
import {
  AiOutlineFacebook,
  AiOutlineTwitter,
  AiOutlineInstagram,
  AiOutlineLinkedin,
} from "react-icons/ai";

// Simplified Brand and Legal Information
const BRAND_NAME = "SRM Learning";
const LEGAL_NAME = "SRM Learning (Pvt) Ltd";

// Social media icons
const SOCIALS = [
  {
    label: "Facebook",
    icon: <AiOutlineFacebook />,
    href: "https://facebook.com/",
  },
  {
    label: "Twitter",
    icon: <AiOutlineTwitter />,
    href: "https://twitter.com/",
  },
  {
    label: "Instagram",
    icon: <AiOutlineInstagram />,
    href: "https://instagram.com/",
  },
  {
    label: "LinkedIn",
    icon: <AiOutlineLinkedin />,
    href: "https://linkedin.com/",
  },
];

const Footer = () => {
  // Dynamic theme colors
  const bg = useColorModeValue(
    "linear-gradient(135deg, #f7f7fb 0%, #ffffff 40%, #eef2ff 100%)",
    "linear-gradient(135deg, #0b0f19 0%, #0e1422 40%, #111827 100%)"
  );
  const fg = useColorModeValue("gray.800", "gray.100");
  const muted = useColorModeValue("gray.600", "gray.400");
  const accent = useColorModeValue("#4f46e5", "#a78bfa");

  const year = new Date().getFullYear();

  return (
    <Box
      as="footer"
      bg={bg}
      color={fg}
      pt={{ base: 10, md: 16 }}
      pb={{ base: 6, md: 8 }}
      position="relative"
    >
      <Container maxW="7xl" px={{ base: 4, md: 6 }}>
        {/* Brand */}
        <Stack spacing={2} mb={8} align="center">
          <Heading
            as="h2"
            size="md"
            fontWeight="extrabold"
            bgClip="text"
            bgGradient={`linear(to-r, ${accent}, #7c3aed)`}
          >
            {BRAND_NAME}
          </Heading>
          <Text fontSize="sm" color={muted} textAlign="center">
            Your learning partner, advancing your career.
          </Text>
        </Stack>

        {/* Footer Links */}
        <Flex
          direction={{ base: "column", md: "row" }}
          justify="space-between"
          mb={8}
        >
          <Box>
            <Heading size="sm" mb={4} color={accent}>
              Quick Links
            </Heading>
            <Stack spacing={3}>
              <ChakraLink
                as={RouterLink}
                to="/about"
                color={muted}
                _hover={{ color: accent }}
              >
                About Us
              </ChakraLink>
              <ChakraLink
                as={RouterLink}
                to="/contact"
                color={muted}
                _hover={{ color: accent }}
              >
                Contact Us
              </ChakraLink>
              <ChakraLink
                as={RouterLink}
                to="/careers"
                color={muted}
                _hover={{ color: accent }}
              >
                Careers
              </ChakraLink>
            </Stack>
          </Box>

          <Box>
            <Heading size="sm" mb={4} color={accent}>
              Follow Us
            </Heading>
            <Flex gap={4}>
              {SOCIALS.map((social) => (
                <ChakraLink
                  key={social.label}
                  href={social.href}
                  isExternal
                  rel="noopener noreferrer"
                  aria-label={social.label}
                >
                  {social.icon}
                </ChakraLink>
              ))}
            </Flex>
          </Box>
        </Flex>

        {/* Copyright */}
        <Box textAlign="center">
          <Text fontSize="sm" color={muted}>
            © {year} {LEGAL_NAME}. All rights reserved.
          </Text>
        </Box>
      </Container>
    </Box>
  );
};

export default Footer;
