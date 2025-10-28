import React, { useState } from "react";
import {
  Box,
  Button,
  Input,
  Textarea,
  FormControl,
  FormLabel,
  useToast,
} from "@chakra-ui/react";
import api from "../../api";

const AddCoursework = () => {
  const [form, setForm] = useState({
    title: "",
    description: "",
    deadline: "",
  });
  const toast = useToast();

  const handleSubmit = async () => {
    try {
      await api.post("/teacher/coursework", form);
      toast({
        title: "Coursework added ✅",
        status: "success",
        duration: 3000,
      });
      setForm({ title: "", description: "", deadline: "" });
    } catch (err) {
      toast({
        title: "Failed to add coursework ❌",
        status: "error",
        duration: 3000,
      });
    }
  };

  return (
    <Box p={6}>
      <FormControl mb={4}>
        <FormLabel>Title</FormLabel>
        <Input
          value={form.title}
          onChange={(e) => setForm({ ...form, title: e.target.value })}
        />
      </FormControl>
      <FormControl mb={4}>
        <FormLabel>Description</FormLabel>
        <Textarea
          value={form.description}
          onChange={(e) => setForm({ ...form, description: e.target.value })}
        />
      </FormControl>
      <FormControl mb={4}>
        <FormLabel>Deadline</FormLabel>
        <Input
          type="date"
          value={form.deadline}
          onChange={(e) => setForm({ ...form, deadline: e.target.value })}
        />
      </FormControl>
      <Button colorScheme="blue" onClick={handleSubmit}>
        Add Coursework
      </Button>
    </Box>
  );
};

export default AddCoursework;
