import React, { useState } from "react";
import { Box, Button, Input, FormControl, FormLabel, useToast } from "@chakra-ui/react";
import api from "../../api";

const PublishResults = () => {
  const [form, setForm] = useState({ studentEmail: "", marks: "", remarks: "" });
  const toast = useToast();

  const handleSubmit = async () => {
    try {
      await api.post("/teacher/results", form);
      toast({ title: "Result published ✅", status: "success", duration: 3000 });
      setForm({ studentEmail: "", marks: "", remarks: "" });
    } catch (err) {
      toast({ title: "Failed to publish ❌", status: "error", duration: 3000 });
    }
  };

  return (
    <Box p={6}>
      <FormControl mb={4}>
        <FormLabel>Student Email</FormLabel>
        <Input value={form.studentEmail} onChange={e => setForm({ ...form, studentEmail: e.target.value })}/>
      </FormControl>
      <FormControl mb={4}>
        <FormLabel>Marks</FormLabel>
        <Input type="number" value={form.marks} onChange={e => setForm({ ...form, marks: e.target.value })}/>
      </FormControl>
      <FormControl mb={4}>
        <FormLabel>Remarks</FormLabel>
        <Input value={form.remarks} onChange={e => setForm({ ...form, remarks: e.target.value })}/>
      </FormControl>
      <Button colorScheme="green" onClick={handleSubmit}>Publish</Button>
    </Box>
  );
};

export default PublishResults;
