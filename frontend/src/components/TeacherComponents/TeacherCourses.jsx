import React, { useEffect, useState } from "react";
import {
  Box,
  Button,
  Flex,
  Grid,
  IconButton,
  Select,
  Text,
  useColorModeValue,
  SimpleGrid,
  Card,
  CardBody,
  CardFooter,
  Heading,
  VStack,
  Input,
  Tooltip,
  Divider,
  Badge,
  InputGroup,
  InputRightElement,
  useToast,
} from "@chakra-ui/react";
import { Link } from "react-router-dom";
import { AddIcon, EditIcon, SearchIcon } from "@chakra-ui/icons";
import { useDispatch, useSelector } from "react-redux";
import convertDateFormat, {
  deleteProduct,
  getProduct,
} from "../../Redux/AdminReducer/action";
import Pagination from "../Adminitems/Pagination";
import TeacherNavTop from "./TeacherNavTop";

const TeacherCourses = () => {
  const store = useSelector((store) => store.TeacherReducer.data);
  const dispatch = useDispatch();
  const toast = useToast();

  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [order, setOrder] = useState("");
  const limit = 6;

  const cardBg = useColorModeValue("white", "gray.700");
  const cardHover = useColorModeValue("gray.50", "gray.600");

  // Fetch courses
  useEffect(() => {
    dispatch(getProduct(page, limit, search, order));
  }, [dispatch, page, search, order]);

  const handleDelete = (id, title) => {
    if (window.confirm(`Delete course: ${title}?`)) {
      dispatch(deleteProduct(id));
      toast({
        title: "Deleted",
        description: `"${title}" has been removed.`,
        status: "info",
        duration: 3000,
        isClosable: true,
      });
      dispatch(getProduct(page, limit, search, order));
    }
  };

  const handlePageChange = (newPage) => setPage(newPage);
  const handlePageButton = (val) => setPage((prev) => prev + val);

  return (
    <Grid h="full" px={4} pb={10}>
      <Box mt="70px">
        <TeacherNavTop />

        {/* Top Header and Filters */}
        <Flex
          justifyContent="space-between"
          alignItems="center"
          mt={6}
          mb={4}
          wrap="wrap"
          gap={4}
        >
          <Text fontSize="2xl" fontWeight="bold">
            Welcome to Your Courses
          </Text>

          <Flex gap={4} wrap="wrap">
            {/* Search with Icon */}
            <InputGroup w="240px">
              <Input
                placeholder="Search by title..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
              <InputRightElement>
                <IconButton
                  icon={<SearchIcon />}
                  size="sm"
                  aria-label="Search"
                  onClick={() =>
                    dispatch(getProduct(page, limit, search, order))
                  }
                />
              </InputRightElement>
            </InputGroup>

            {/* Sorting */}
            <Select
              placeholder="Sort by Price"
              onChange={(e) => setOrder(e.target.value)}
              value={order}
              w="200px"
            >
              <option value="asc">Price: Low to High</option>
              <option value="desc">Price: High to Low</option>
            </Select>

            {/* Add Course Button */}
            <Button
              leftIcon={<AddIcon />}
              colorScheme="teal"
              as={Link}
              to="/Teacher/addCourse"
            >
              Create Course
            </Button>
          </Flex>
        </Flex>

        <Divider my={4} />

        {/* Course Cards */}
        <SimpleGrid columns={{ base: 1, sm: 2, md: 3 }} spacing={6}>
          {store?.length > 0 ? (
            store.map((el) => (
              <Card
                key={el._id}
                bg={cardBg}
                boxShadow="md"
                borderRadius="xl"
                transition="0.3s"
                _hover={{ transform: "scale(1.02)", bg: cardHover }}
              >
                <CardBody>
                  <VStack align="start" spacing={3}>
                    <Heading size="md" noOfLines={1}>
                      {el.title}
                    </Heading>
                    <Badge colorScheme="purple" fontSize="0.8em">
                      {convertDateFormat(el.createdAt)}
                    </Badge>
                    <Text fontSize="sm" noOfLines={2} color="gray.600">
                      {el.description}
                    </Text>
                    <Text fontWeight="bold" color="blue.500">
                      ${el.price}
                    </Text>
                    <Text fontSize="sm" color="gray.500">
                      Category: {el.category}
                    </Text>
                    <Text fontSize="sm" color="gray.500">
                      Teacher: {el.teacher}
                    </Text>
                  </VStack>
                </CardBody>
                <CardFooter justify="space-between">
                  <Button
                    size="sm"
                    colorScheme="red"
                    variant="outline"
                    onClick={() => handleDelete(el._id, el.title)}
                  >
                    Delete
                  </Button>
                  <Tooltip label="Edit Course" hasArrow>
                    <IconButton
                      as={Link}
                      to={`/Teacher/edit/${el._id}`}
                      icon={<EditIcon />}
                      aria-label="Edit"
                      size="sm"
                      colorScheme="blue"
                    />
                  </Tooltip>
                </CardFooter>
              </Card>
            ))
          ) : (
            <Text mt={10} textAlign="center" fontSize="lg" color="gray.500">
              No courses available.
            </Text>
          )}
        </SimpleGrid>

        {/* Pagination Controls */}
        <Flex justifyContent="center" mt={10} gap={4}>
          <Button
            isDisabled={page <= 1}
            onClick={() => handlePageButton(-1)}
            colorScheme="gray"
          >
            Prev
          </Button>
          <Pagination
            totalCount={6} // You can replace with dynamic count
            current_page={page}
            handlePageChange={handlePageChange}
          />
          <Button
            isDisabled={store?.length < limit}
            onClick={() => handlePageButton(1)}
            colorScheme="gray"
          >
            Next
          </Button>
        </Flex>
      </Box>
    </Grid>
  );
};

export default TeacherCourses;
