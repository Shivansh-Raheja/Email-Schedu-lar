import React, { useState, useEffect } from 'react'; 
import {
  TextField, Button, Typography, Container, Grid, Box,
  CircularProgress, Alert, IconButton,Dialog, DialogActions, 
  DialogContent, DialogTitle, Card, CardContent, CardActions
} from '@mui/material';
import { DateTimePicker, LocalizationProvider } from '@mui/x-date-pickers';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import dayjs from 'dayjs';
import axios from 'axios';
import ReactQuill from 'react-quill';
import 'react-quill/dist/quill.snow.css';
import { Edit, Delete } from '@mui/icons-material';

const EmailSchedulerForm = () => {
  const [sheetId, setSheetId] = useState('');
  const [sheetName, setSheetName] = useState('');
  const [scheduledDateTime, setScheduledDateTime] = useState(dayjs());
  const [emailSubject, setEmailSubject] = useState('');
  const [emailBody, setEmailBody] = useState('');
  const [attachment, setAttachment] = useState(null);
  const [loading, setLoading] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const [emailRanges, setEmailRanges] = useState([]);
  const [fetchedEmails, setFetchedEmails] = useState([]);
  const [newEmail, setNewEmail] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [addMoreCredentials, setAddMoreCredentials] = useState(false);
  const [editingIndex, setEditingIndex] = useState(null);
  const [scheduledTasks, setScheduledTasks] = useState([]);
  const [deletingTaskIndex, setDeletingTaskIndex] = useState(null);

  // Dialog states
  const [openDeleteCredentialsDialog, setOpenDeleteCredentialsDialog] = useState(false);
  const [openUpdateCredentialsDialog, setOpenUpdateCredentialsDialog] = useState(false);
  const [openDeleteTaskDialog, setOpenDeleteTaskDialog] = useState(false);
  const [openAddCredentialsDialog, setOpenAddCredentialsDialog] = useState(false); // New Dialog State

  useEffect(() => {
    const fetchEmails = async () => {
      try {
        const response = await axios.get('http://localhost:3001/get-emails');
        setFetchedEmails(response.data.emails);
      } catch (error) {
        console.error('Failed to fetch emails:', error);
      }
    };
    fetchEmails();
  }, []);

  useEffect(() => {
    const fetchScheduledTasks = async () => {
      try {
        const response = await axios.get('http://localhost:3001/scheduled-tasks');
        setScheduledTasks(response.data.tasks);
      } catch (error) {
        console.error('Failed to fetch scheduled tasks:', error);
      }
    };
    fetchScheduledTasks();
  }, []);

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setAttachment({
          filename: file.name,
          content: reader.result.split(',')[1],
          contentType: file.type,
        });
      };
      reader.readAsDataURL(file);
    }
  };

  const handleRangeChange = (index, field, value) => {
    const updatedRanges = [...emailRanges];
    if (!updatedRanges[index]) updatedRanges[index] = {};
    updatedRanges[index][field] = value;
    setEmailRanges(updatedRanges);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setSuccessMessage('');
    setErrorMessage('');

    const parsedRanges = emailRanges.map(range => {
      const from = parseInt(range.from, 10);
      const to = parseInt(range.to, 10);
      return { from, to };
    });

    const data = {
      sheetId,
      sheetName,
      emailSubject,
      emailBody,
      attachment,
      ranges: parsedRanges,
      scheduledDateTime: scheduledDateTime.toISOString(),
    };

    try {
      const response = await axios.post('http://localhost:3001/schedule-emails', data);
      setSuccessMessage(response.data.message);
      // Fetch updated scheduled tasks
      const scheduledResponse = await axios.get('http://localhost:3001/scheduled-tasks');
      setScheduledTasks(scheduledResponse.data.tasks);
    } catch (error) {
      setErrorMessage(error.response?.data?.message || 'An error occurred while scheduling emails.');
    }

    setLoading(false);
  };

  const handleAddEmailCredentials = async () => {
    try {
      await axios.post('http://localhost:3001/add-email-credentials', {
        user: newEmail,
        pass: newPassword
      });
      setNewEmail('');
      setNewPassword('');
      const response = await axios.get('http://localhost:3001/get-emails');
      setFetchedEmails(response.data.emails);
      setOpenAddCredentialsDialog(false); // Hide the add credentials form
    } catch (error) {
      console.error('Failed to add email credentials:', error);
      setErrorMessage('Failed to add email credentials.');
    }
  };

  const handleEditEmailCredentials = async () => {
    try {
      await axios.put(`http://localhost:3001/edit-email-credentials/${editingIndex}`, {
        user: newEmail,
        pass: newPassword
      });
      setEditingIndex(null);
      const response = await axios.get('http://localhost:3001/get-emails');
      setFetchedEmails(response.data.emails);
      setOpenUpdateCredentialsDialog(false);
    } catch (error) {
      console.error('Failed to edit email credentials:', error);
      setErrorMessage('Failed to edit email credentials.');
    }
  };

  const handleDeleteEmailCredentials = async () => {
    try {
      await axios.delete(`http://localhost:3001/delete-email-credentials/${editingIndex}`);
      const response = await axios.get('http://localhost:3001/get-emails');
      setFetchedEmails(response.data.emails);
      setOpenDeleteCredentialsDialog(false);
    } catch (error) {
      console.error('Failed to delete email credentials:', error);
      setErrorMessage('Failed to delete email credentials.');
    }
  };

  const handleDeleteScheduledTask = async () => {
    try {
      await axios.delete(`http://localhost:3001/delete-scheduled-task/${deletingTaskIndex}`);
      const response = await axios.get('http://localhost:3001/scheduled-tasks');
      setScheduledTasks(response.data.tasks);
      setOpenDeleteTaskDialog(false);
    } catch (error) {
      console.error('Failed to delete scheduled task:', error);
      setErrorMessage('Failed to delete scheduled task.');
    }
  };

  return (
    <LocalizationProvider dateAdapter={AdapterDayjs}>
      <Container maxWidth="md" sx={{ backgroundColor: 'white', padding: 3 }}>
        <Box>
          <Typography variant="h4" gutterBottom>
            Email Scheduler
          </Typography>
          <form onSubmit={handleSubmit}>
            <Grid container spacing={2}>
              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  label="Google Sheet ID"
                  value={sheetId}
                  onChange={(e) => setSheetId(e.target.value)}
                  required
                />
              </Grid>
              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  label="Sheet Name"
                  value={sheetName}
                  onChange={(e) => setSheetName(e.target.value)}
                  required
                />
              </Grid>
              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  label="Email Subject"
                  value={emailSubject}
                  onChange={(e) => setEmailSubject(e.target.value)}
                  required
                />
              </Grid>
              <Grid item xs={12}>
                <Typography variant="subtitle1">Email Body</Typography>
                <ReactQuill
                  theme="snow"
                  value={emailBody}
                  onChange={setEmailBody}
                  placeholder="Use {{Name}} as placeholder."
                />
              </Grid>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  type="file"
                  accept="application/pdf"
                  onChange={handleFileChange}
                  required
                />
              </Grid>
              <Grid item xs={12}>
                <DateTimePicker
                  label="Schedule Date & Time"
                  value={scheduledDateTime}
                  onChange={(newValue) => setScheduledDateTime(newValue)}
                  renderInput={(params) => <TextField {...params} fullWidth />}
                />
              </Grid>
              {fetchedEmails.map((email, index) => (
                <Grid item xs={12} key={index}>
                  <Grid container spacing={2} alignItems="center">
                    <Grid item xs={12} md={4}>
                      <Typography variant="h6">{email}</Typography>
                    </Grid>
                    <Grid item xs={12} md={2}>
                      <IconButton color="primary" onClick={() => {
                        setEditingIndex(index);
                        setOpenUpdateCredentialsDialog(true);
                      }}>
                        <Edit />
                      </IconButton>
                      <IconButton color="secondary" onClick={() => {
                        setEditingIndex(index);
                        setOpenDeleteCredentialsDialog(true);
                      }}>
                        <Delete />
                      </IconButton>
                    </Grid>
                    <Grid item xs={12} md={3}>
                      <TextField
                        label="From"
                        value={emailRanges[index]?.from || ''}
                        onChange={(e) => handleRangeChange(index, 'from', e.target.value)}
                        type="number"
                        fullWidth
                        required
                      />
                    </Grid>
                    <Grid item xs={12} md={3}>
                      <TextField
                        label="To"
                        value={emailRanges[index]?.to || ''}
                        onChange={(e) => handleRangeChange(index, 'to', e.target.value)}
                        type="number"
                        fullWidth
                        required
                      />
                    </Grid>
                  </Grid>
                </Grid>
              ))}
              {!addMoreCredentials ? (
                <Grid item xs={12}>
                  <Button
                    variant="contained"
                    color="secondary"
                    onClick={() => setOpenAddCredentialsDialog(true)} // Open the dialog
                    sx={{ mt: 2 }}
                  >
                    Add Email Credentials
                  </Button>
                </Grid>
              ) : (
                <Grid item xs={12}>
                  <Typography variant="h6">Add New Email Credentials</Typography>
                  <TextField
                    fullWidth
                    label="Email"
                    value={newEmail}
                    onChange={(e) => setNewEmail(e.target.value)}
                    required
                  />
                  <TextField
                    fullWidth
                    type="password"
                    label="Password"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    required
                  />
                  <Button
                    variant="contained"
                    color="secondary"
                    onClick={() => setOpenAddCredentialsDialog(true)} // Open the dialog
                    sx={{ mt: 2 }}
                  >
                    Add Email Credentials
                  </Button>
                  <Button
                    variant="outlined"
                    color="primary"
                    onClick={() => setAddMoreCredentials(false)}
                    sx={{ mt: 2, ml: 2 }}
                  >
                    Cancel
                  </Button>
                </Grid>
              )}
              <Grid item xs={12}>
                <Button
                  type="submit"
                  variant="contained"
                  color="primary"
                  fullWidth
                  disabled={loading}
                >
                  {loading ? <CircularProgress size={24} /> : 'Schedule Emails'}
                </Button>
              </Grid>
              {successMessage && (
                <Grid item xs={12}>
                  <Alert severity="success">{successMessage}</Alert>
                </Grid>
              )}
              {errorMessage && (
                <Grid item xs={12}>
                  <Alert severity="error">{errorMessage}</Alert>
                </Grid>
              )}
            </Grid>
          </form>

          {/* Display Scheduled Tasks */}
          <Box mt={4}>
            <Typography variant="h5" gutterBottom>
              Scheduled Tasks
            </Typography>
            {scheduledTasks.length > 0 ? (
              <Grid container spacing={2}>
                {scheduledTasks.map((task, index) => (
                  <Grid item xs={12} md={6} lg={4} key={index}>
                    <Card sx={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
                      <CardContent>
                        <Typography variant="h6">{task.emailSubject}</Typography>
                        <Typography variant="body2" color="textSecondary">
                          Scheduled for: {dayjs(task.scheduledDateTime).format('YYYY-MM-DD HH:mm:ss')}
                        </Typography>
                      </CardContent>
                      <CardActions>
                        <IconButton edge="end" aria-label="delete" onClick={() => {
                          setDeletingTaskIndex(index);
                          setOpenDeleteTaskDialog(true);
                        }}>
                          <Delete />
                        </IconButton>
                      </CardActions>
                    </Card>
                  </Grid>
                ))}
              </Grid>
            ) : (
              <Typography>No scheduled tasks available.</Typography>
            )}
          </Box>
        </Box>

        {/* Confirm Add Credentials Dialog */}
        <Dialog open={openAddCredentialsDialog} onClose={() => setOpenAddCredentialsDialog(false)}>
          <DialogTitle>Add Email Credentials</DialogTitle>
          <DialogContent>
            <TextField
              fullWidth
              label="Email"
              value={newEmail}
              onChange={(e) => setNewEmail(e.target.value)}
              required
            />
            <TextField
              fullWidth
              type="password"
              label="Password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              required
            />
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setOpenAddCredentialsDialog(false)}>Cancel</Button>
            <Button onClick={handleAddEmailCredentials} color="primary">Add</Button>
          </DialogActions>
        </Dialog>

        {/* Confirm Update Credentials Dialog */}
        <Dialog open={openUpdateCredentialsDialog} onClose={() => setOpenUpdateCredentialsDialog(false)}>
          <DialogTitle>Update Email Credentials</DialogTitle>
          <DialogContent>
            <TextField
              fullWidth
              label="New Email"
              value={newEmail}
              onChange={(e) => setNewEmail(e.target.value)}
              required
            />
            <TextField
              fullWidth
              type="password"
              label="New Password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              required
            />
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setOpenUpdateCredentialsDialog(false)}>Cancel</Button>
            <Button onClick={handleEditEmailCredentials} color="primary">Update</Button>
          </DialogActions>
        </Dialog>

        {/* Confirm Delete Credentials Dialog */}
        <Dialog open={openDeleteCredentialsDialog} onClose={() => setOpenDeleteCredentialsDialog(false)}>
          <DialogTitle>Delete Email Credentials</DialogTitle>
          <DialogContent>
            <Typography>Are you sure you want to delete these email credentials?</Typography>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setOpenDeleteCredentialsDialog(false)}>Cancel</Button>
            <Button onClick={handleDeleteEmailCredentials} color="secondary">Delete</Button>
          </DialogActions>
        </Dialog>

        {/* Confirm Delete Scheduled Task Dialog */}
        <Dialog open={openDeleteTaskDialog} onClose={() => setOpenDeleteTaskDialog(false)}>
          <DialogTitle>Delete Scheduled Task</DialogTitle>
          <DialogContent>
            <Typography>Are you sure you want to delete this scheduled task?</Typography>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setOpenDeleteTaskDialog(false)}>Cancel</Button>
            <Button onClick={handleDeleteScheduledTask} color="secondary">Delete</Button>
          </DialogActions>
        </Dialog>
      </Container>
    </LocalizationProvider>
  );
};

export default EmailSchedulerForm;
