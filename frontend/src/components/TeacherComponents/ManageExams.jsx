import React, { useState } from "react";
import { Box, Button, Input, FormControl, FormLabel, useToast, Select } from "@chakra-ui/react";
import api from "../../api";

const ManageExams = () => {
  const [form, setForm] = useState({ title: "", date: "", type: "exam" });
  const toast = useToast();

  const handleSubmit = async () => {
    try {
      await api.post("/teacher/exams", form);
      toast({ title: `${form.type} created ✅`, status: "success", duration: 3000 });
      setForm({ title: "", date: "", type: "exam" });
    } catch (err) {
      toast({ title: "Failed to create exam ❌", status: "error", duration: 3000 });
    }
  };

  return (
    <Box p={6}>
      <FormControl mb={4}>
        <FormLabel>Title</FormLabel>
        <Input value={form.title} onChange={e => setForm({ ...form, title: e.target.value })}/>
      </FormControl>
      <FormControl mb={4}>
        <FormLabel>Date</FormLabel>
        <Input type="date" value={form.date} onChange={e => setForm({ ...form, date: e.target.value })}/>
      </FormControl>
      <FormControl mb={4}>
        <FormLabel>Type</FormLabel>
        <Select value={form.type} onChange={e => setForm({ ...form, type: e.target.value })}>
          <option value="exam">Exam</option>
          <option value="mock">Mock Test</option>
        </Select>
      </FormControl>
      <Button colorScheme="purple" onClick={handleSubmit}>Create</Button>
    </Box>
  );
};

export default ManageExams;
