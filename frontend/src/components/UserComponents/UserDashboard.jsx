// src/components/UserComponents/UserDashboard.jsx
import React, { useEffect, useMemo, useState } from "react";
import {
  Box,
  Flex,
  VStack,
  HStack,
  Stack,
  SimpleGrid,
  Grid,
  GridItem,
  Spinner,
  Text,
  Heading,
  Button,
  Icon,
  useToast,
  Badge,
  Divider,
  Image,
} from "@chakra-ui/react";
import { useNavigate } from "react-router-dom";
import {
  FiBookOpen,
  FiAward,
  FiPlayCircle,
  FiClock,
  FiGrid,
  FiTrendingUp,
} from "react-icons/fi";
import { UserAPI } from "../../api";
import UserNavbar from "./UserNavbar";
import UserSidebar from "./UserSidebar";
import InProgressCarousel from "./InProgressCarousel";
import StatusPage from "./StatusPage";

/**
 * UserDashboard — LEFT = Enrolled (50%), RIGHT = hero/stats/actions/progress (50%)
 * - Fetches profile + enrolled
 * - All buttons navigate to actual routes
 */
const UserDashboard = () => {
  const [user, setUser] = useState(null);
  const [enrolled, setEnrolled] = useState([]);
  const [loading, setLoading] = useState(true);
  const toast = useToast();
  const navigate = useNavigate();

  useEffect(() => {
    const controller = new AbortController();

    async function load() {
      try {
        const [{ data: me }, { data: myCourses }] = await Promise.all([
          UserAPI.profile({ signal: controller.signal }),
          UserAPI.enrolled({ signal: controller.signal }),
        ]);
        setUser(me?.user || me || null);
        setEnrolled(Array.isArray(myCourses) ? myCourses : []);
      } catch (err) {
        if (controller.signal.aborted) return;
        const status = err?.response?.status;
        if (status === 401 || status === 403) {
          toast({
            title: "Session expired",
            description: "Please log in again.",
            status: "error",
            duration: 3500,
            isClosable: true,
          });
          navigate("/login");
        } else {
          console.error("Dashboard load error:", err);
          toast({
            title: "Error",
            description: "Couldn’t load your dashboard right now.",
            status: "error",
            duration: 4500,
            isClosable: true,
          });
        }
      } finally {
        if (!controller.signal.aborted) setLoading(false);
      }
    }

    load();
    return () => controller.abort();
  }, [toast, navigate]);

  const firstName = useMemo(
    () => (user?.name || "Student").split(" ")[0],
    [user]
  );

  if (loading) {
    return (
      <Flex justify="center" align="center" minH="100vh" bg="gray.50">
        <Spinner size="xl" />
      </Flex>
    );
  }

  return (
    <Flex
      direction="column"
      minH="100vh"
      bgGradient="linear(to-br, teal.50, teal.100)"
    >
      <UserNavbar user={user} />

      <Flex flex="1" pt={{ base: "64px", md: "68px" }}>
        <UserSidebar user={user} />

        {/* MAIN */}
        <Box as="main" flex="1" p={{ base: 4, md: 6 }} overflowY="auto">
          {/* 50 / 50 on xl screens */}
          <Grid
            templateColumns={{ base: "1fr", xl: "1fr 1fr" }}
            gap={{ base: 4, md: 6 }}
            alignItems="start"
          >
            {/* LEFT: Enrolled (50%) */}
            <GridItem>
              <Box
                bg="white"
                borderRadius="2xl"
                boxShadow="sm"
                border="1px solid"
                borderColor="blackAlpha.100"
                p={4}
              >
                <Heading as="h2" size="md" mb={3}>
                  Your Enrolled Courses
                </Heading>

                {enrolled.length === 0 ? (
                  <EmptyMiniCard onBrowse={() => navigate("/catalogue")} />
                ) : (
                  <SimpleGrid columns={{ base: 1, md: 2 }} spacing={3}>
                    {enrolled.map((c) => (
                      <MiniCourseCard
                        key={c.id}
                        title={c.title}
                        description={c.description}
                        image={c.img}
                        onContinue={() => navigate(`/courses/${c.id}`)}
                      />
                    ))}
                  </SimpleGrid>
                )}
              </Box>
            </GridItem>

            {/* RIGHT: Hero + Stats + Actions + Progress (50%) */}
            <GridItem>
              <Hero
                greeting={`Welcome back, ${firstName} 👋`}
                subtext="Pick up where you left off, or discover new courses curated for you."
                ctaLabel="Browse Catalogue"
                onCta={() => navigate("/catalogue")}
              />

              <Stack spacing={6} mt={4}>
                {/* STATS */}
                <SimpleGrid columns={{ base: 1, md: 2, lg: 4 }} spacing={4}>
                  <StatCard
                    icon={FiBookOpen}
                    label="Enrolled"
                    value={enrolled.length}
                    hint="From your enrolled list."
                  />
                  <StatCard
                    icon={FiPlayCircle}
                    label="In Progress"
                    value="—"
                    hint="Started but not finished."
                  />
                  <StatCard
                    icon={FiAward}
                    label="Certificates"
                    value="—"
                    hint="Earned so far."
                  />
                  <StatCard
                    icon={FiClock}
                    label="Time Spent"
                    value="—"
                    hint="Watched minutes."
                  />
                </SimpleGrid>

                {/* QUICK ACTIONS */}
                <Section
                  title="Quick Actions"
                  rightEl={
                    <Button
                      size="sm"
                      variant="ghost"
                      leftIcon={<Icon as={FiGrid} />}
                      onClick={() => navigate("/dashboard")}
                    >
                      Dashboard
                    </Button>
                  }
                >
                  <SimpleGrid columns={{ base: 2, md: 4 }} spacing={3}>
                    <QuickAction
                      icon={FiBookOpen}
                      label="Catalogue"
                      onClick={() => navigate("/catalogue")}
                    />
                    <QuickAction
                      icon={FiTrendingUp}
                      label="My Progress"
                      onClick={() => navigate("/progress")}
                    />
                    <QuickAction
                      icon={FiAward}
                      label="Certificates"
                      onClick={() => navigate("/certificates")}
                    />
                    <QuickAction
                      icon={FiPlayCircle}
                      label="Exams & Mock Tests"
                      onClick={() => navigate("/exam")}
                    />
                  </SimpleGrid>
                </Section>

                {/* CONTINUE LEARNING */}
                <Section
                  title="Continue Learning"
                  subtitle="Your in-progress courses"
                  note={
                    <Badge ml="2" colorScheme="teal" variant="subtle">
                      Smart picks
                    </Badge>
                  }
                >
                  <InProgressCarousel />
                </Section>

                {/* PROGRESS OVERVIEW */}
                <Section
                  title="Progress Overview"
                  subtitle="Track completion by course"
                  pad
                >
                  <StatusPage />
                </Section>
              </Stack>
            </GridItem>
          </Grid>
        </Box>
      </Flex>
    </Flex>
  );
};

/* ========= Subcomponents ========= */

const Section = ({ title, subtitle, rightEl, note, pad = false, children }) => (
  <Box
    bg="white"
    borderRadius="2xl"
    boxShadow="sm"
    p={{ base: 4, md: pad ? 6 : 4 }}
    border="1px solid"
    borderColor="blackAlpha.100"
  >
    <HStack justify="space-between" align="flex-start" mb={subtitle ? 1 : 3}>
      <HStack>
        <Heading as="h2" size="md">
          {title}
        </Heading>
        {note}
      </HStack>
      {rightEl}
    </HStack>
    {subtitle && (
      <>
        <Text color="gray.600" mb={4}>
          {subtitle}
        </Text>
        <Divider />
      </>
    )}
    <Box mt={subtitle ? 4 : 0}>{children}</Box>
  </Box>
);

const StatCard = ({ icon, label, value, hint }) => (
  <HStack
    spacing={3}
    p={4}
    bg="white"
    borderRadius="2xl"
    boxShadow="sm"
    border="1px solid"
    borderColor="blackAlpha.100"
    _hover={{ boxShadow: "md" }}
    transition="box-shadow 0.15s ease"
    align="center"
  >
    <Flex
      w={10}
      h={10}
      align="center"
      justify="center"
      borderRadius="lg"
      bg="teal.50"
      border="1px solid"
      borderColor="teal.100"
    >
      <Icon as={icon} fontSize="lg" color="teal.600" />
    </Flex>
    <VStack align="start" spacing={0}>
      <Text fontSize="sm" color="gray.600">
        {label}
      </Text>
      <HStack spacing={2}>
        <Heading as="span" size="md">
          {value}
        </Heading>
      </HStack>
      {hint && (
        <Text fontSize="xs" color="gray.500">
          {hint}
        </Text>
      )}
    </VStack>
  </HStack>
);

const QuickAction = ({ icon, label, onClick }) => (
  <Button
    onClick={onClick}
    size="sm"
    variant="ghost"
    justifyContent="flex-start"
    leftIcon={<Icon as={icon} />}
    borderRadius="lg"
    _hover={{ bg: "teal.50" }}
  >
    {label}
  </Button>
);

const Hero = ({ greeting, subtext, ctaLabel, onCta }) => (
  <Box
    bgGradient="linear(to-r, teal.500, teal.400)"
    color="white"
    borderRadius="2xl"
    px={{ base: 5, md: 7 }}
    py={{ base: 6, md: 8 }}
    boxShadow="md"
    position="relative"
    overflow="hidden"
  >
    <Box
      position="absolute"
      w="220px"
      h="220px"
      borderRadius="full"
      bg="whiteAlpha.200"
      right="-60px"
      top="-60px"
    />
    <Box
      position="absolute"
      w="140px"
      h="140px"
      borderRadius="full"
      bg="whiteAlpha.200"
      right="30%"
      bottom="-40px"
    />
    <Stack direction={{ base: "column", md: "row" }} align="center" spacing={6}>
      <VStack align="start" spacing={2} flex="1">
        <Heading size="lg">{greeting}</Heading>
        <Text opacity={0.95}>{subtext}</Text>
      </VStack>
      <Button
        onClick={onCta}
        size="md"
        color="teal.600"
        bg="white"
        _hover={{ bg: "whiteAlpha.900" }}
        leftIcon={<Icon as={FiBookOpen} />}
      >
        {ctaLabel}
      </Button>
    </Stack>
  </Box>
);

/** Compact course cards for the left column */
const MiniCourseCard = ({ title, description, image, onContinue }) => (
  <Box
    border="1px solid"
    borderColor="blackAlpha.100"
    borderRadius="lg"
    p={3}
    bg="white"
    boxShadow="xs"
  >
    {image ? (
      <Image
        src={image}
        alt={title}
        borderRadius="md"
        h="110px"
        w="100%"
        objectFit="cover"
        mb={2}
      />
    ) : (
      <Box h="110px" w="100%" bg="gray.100" borderRadius="md" mb={2} />
    )}
    <Text fontWeight="semibold" noOfLines={1}>
      {title}
    </Text>
    {description && (
      <Text fontSize="sm" color="gray.600" noOfLines={2} mt={1}>
        {description}
      </Text>
    )}
    <Button mt={2} size="sm" colorScheme="teal" w="100%" onClick={onContinue}>
      Continue
    </Button>
  </Box>
);

const EmptyMiniCard = ({ onBrowse }) => (
  <Box
    border="1px dashed"
    borderColor="blackAlpha.300"
    borderRadius="lg"
    p={4}
    textAlign="center"
    bg="white"
  >
    <Text fontWeight="medium" mb={2}>
      You haven’t subscribed to any course
    </Text>
    <Button size="sm" variant="outline" onClick={onBrowse}>
      Browse Catalogue
    </Button>
  </Box>
);

export default UserDashboard;
