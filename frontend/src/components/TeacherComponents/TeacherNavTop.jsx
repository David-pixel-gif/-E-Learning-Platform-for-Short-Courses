import {
  Box,
  Flex,
  Input,
  Button,
  Text,
  IconButton,
  Menu,
  MenuButton,
  MenuList,
  MenuItem,
  useToast,
} from "@chakra-ui/react";
import React from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  IoSearchCircleOutline,
  IoLogOut, // fixed here
  IoHelpCircle, // fixed here
  IoNotificationsOutline,
} from "react-icons/io5";
import {
  FaHome,
  FaBookOpen,
  FaVideo,
  FaClipboardList,
  FaChartLine,
  FaCertificate,
  FaUsers,
} from "react-icons/fa";
import { useSelector, useDispatch } from "react-redux";

const TeacherNavTop = ({ handleSearch }) => {
  const userStore = useSelector((store) => store.UserReducer);
  const toast = useToast();
  const navigate = useNavigate();
  const dispatch = useDispatch();

  const handleLogout = () => {
    localStorage.clear();
    dispatch({ type: "USER_LOGOUT" });
    toast({
      title: "Logged out",
      description: "You have been successfully logged out.",
      status: "success",
      duration: 2500,
      isClosable: true,
    });
    navigate("/login");
  };

  return (
    <Flex
      h="10vh"
      px={6}
      justifyContent="space-between"
      alignItems="center"
      shadow="sm"
      bg="white"
      borderBottom="1px solid #eaeaea"
      position="sticky"
      top={0}
      zIndex={100}
    >
      {/* Left Section: Search */}
      <Flex align="center" w={{ base: "70%", md: "50%" }}>
        <IoSearchCircleOutline
          style={{ fontSize: "7vh", color: "gray", marginRight: "10px" }}
        />
        <Input
          placeholder="Search anything..."
          border="none"
          h="8vh"
          w="100%"
          onChange={handleSearch}
        />
      </Flex>

      {/* Right Section */}
      <Flex align="center" gap={6}>
        <Menu>
          <MenuButton as={Button} colorScheme="blue" size="sm">
            Navigate
          </MenuButton>
          <MenuList>
            <MenuItem icon={<FaHome />} as={Link} to="/teacher/dashboard">
              Dashboard
            </MenuItem>
            <MenuItem icon={<FaBookOpen />} as={Link} to="/teacher/courses">
              Courses
            </MenuItem>
            <MenuItem icon={<FaVideo />} as={Link} to="/teacher/videos">
              Videos
            </MenuItem>
            <MenuItem
              icon={<FaClipboardList />}
              as={Link}
              to="/teacher/coursework"
            >
              Coursework
            </MenuItem>
            <MenuItem icon={<FaChartLine />} as={Link} to="/teacher/exams">
              Exams & Mock Tests
            </MenuItem>
            <MenuItem icon={<FaChartLine />} as={Link} to="/teacher/results">
              Results
            </MenuItem>
            <MenuItem
              icon={<FaCertificate />}
              as={Link}
              to="/teacher/certificates"
            >
              Certificates
            </MenuItem>
            <MenuItem icon={<FaUsers />} as={Link} to="/teacher/students">
              Students
            </MenuItem>
          </MenuList>
        </Menu>

        <IconButton
          as={Link}
          to="/teacher/help"
          icon={<IoHelpCircle />} // fixed here
          aria-label="Help"
          fontSize="24px"
          variant="ghost"
        />

        <IconButton
          as={Link}
          to="/teacher/notifications"
          icon={<IoNotificationsOutline />}
          aria-label="Notifications"
          fontSize="24px"
          variant="ghost"
        />

        <Menu>
          <MenuButton
            as={Button}
            borderRadius="50%"
            border="1px solid"
            bg="#CFD8DC"
            cursor="pointer"
            textAlign="center"
            w="40px"
            h="40px"
          >
            <Text fontSize="18px" mt="-2px">
              {userStore?.name ? userStore.name[0] : "U"}
            </Text>
          </MenuButton>
          <MenuList>
            <MenuItem onClick={() => navigate("/profile")}>Profile</MenuItem>
            <MenuItem icon={<IoLogOut />} onClick={handleLogout}>
              Logout
            </MenuItem>
          </MenuList>
        </Menu>
      </Flex>
    </Flex>
  );
};

export default TeacherNavTop;
