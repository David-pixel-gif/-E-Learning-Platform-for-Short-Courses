import React, { useState } from "react";
import { Box, Button, Input, FormControl, FormLabel, useToast } from "@chakra-ui/react";
import api from "../../api";

const IssueCertificates = () => {
  const [form, setForm] = useState({ studentEmail: "", course: "", certificateUrl: "" });
  const toast = useToast();

  const handleSubmit = async () => {
    try {
      await api.post("/teacher/certificates", form);
      toast({ title: "Certificate issued ✅", status: "success", duration: 3000 });
      setForm({ studentEmail: "", course: "", certificateUrl: "" });
    } catch (err) {
      toast({ title: "Failed to issue certificate ❌", status: "error", duration: 3000 });
    }
  };

  return (
    <Box p={6}>
      <FormControl mb={4}>
        <FormLabel>Student Email</FormLabel>
        <Input value={form.studentEmail} onChange={e => setForm({ ...form, studentEmail: e.target.value })}/>
      </FormControl>
      <FormControl mb={4}>
        <FormLabel>Course</FormLabel>
        <Input value={form.course} onChange={e => setForm({ ...form, course: e.target.value })}/>
      </FormControl>
      <FormControl mb={4}>
        <FormLabel>Certificate URL</FormLabel>
        <Input value={form.certificateUrl} onChange={e => setForm({ ...form, certificateUrl: e.target.value })}/>
      </FormControl>
      <Button colorScheme="teal" onClick={handleSubmit}>Issue</Button>
    </Box>
  );
};

export default IssueCertificates;
