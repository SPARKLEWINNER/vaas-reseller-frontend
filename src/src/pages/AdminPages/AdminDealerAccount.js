import React, { useState, useEffect } from 'react';
import axios from 'axios';
import SecureLS from 'secure-ls';
import {
  Menu,
  MenuItem,
  Card,
  Typography,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Select,
  FormControl,
  InputLabel,
  Box,
  Autocomplete,
  TextField,
  Chip,
  Button,
} from '@mui/material';
import VisibilityIcon from '@mui/icons-material/Visibility';
import { MoreVert as MoreVertIcon } from '@mui/icons-material';
import FileDownloadIcon from '@mui/icons-material/FileDownload';
import { ViewUserModal } from '../../components/admin/ViewUserModal';
import { DeleteUserModal } from '../../components/admin/DeleteUserModal';
import ResellersModal from '../../components/admin/ResellersModal';
import DeactivatedAccounts from '../../components/admin/DeactivatedAccounts';
import { ChangeDealerEmailModal } from '../../components/admin/ChangeDealerEmailModal';
import CircularLoading from '../../components/preLoader';

const ls = new SecureLS({ encodingType: 'aes' });

const AdminDealerAccount = () => {
  const [users, setUsers] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [anchorEl, setAnchorEl] = useState(null);
  const [userToEdit, setUserToEdit] = useState(null);
  const [changeEmailModalOpen, setChangeEmailModalOpen] = useState(false);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [userToDelete, setUserToDelete] = useState(null);
  const [viewModalOpen, setViewModalOpen] = useState(false);
  const [userToView, setUserToView] = useState(null);
  const [resellersModalOpen, setResellersModalOpen] = useState(false);
  const [emailChangeError, setEmailChangeError] = useState('');
  const [filteredUsers, setFilteredUsers] = useState(users);
  const [sortBy, setSortBy] = useState('latest');
  const [sortConfig, setSortConfig] = useState({ key: 'createdAt', direction: 'desc' });
  const [showDeactivated, setShowDeactivated] = useState(false);
  const toggleDeactivatedModal = () => setShowDeactivated(!showDeactivated);

  const downloadCSV = (arrayOfObjects) => {
    if (!arrayOfObjects.length) return;

    const headers = Object.keys(arrayOfObjects[0]).filter((header) => header !== 'password');

    const csvRows = [headers.join(',')];

    arrayOfObjects.forEach((row) => {
      const values = headers.map((header) => {
        const cell = row[header] === null || row[header] === undefined ? '' : row[header]; // Handle null or undefined
        const escaped = `${cell}`.replace(/"/g, '\\"');
        return `"${escaped}"`;
      });
      csvRows.push(values.join(','));
    });

    const blob = new Blob([csvRows.join('\n')], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'dealers.csv';
    link.click();
    window.URL.revokeObjectURL(url);
    link.remove();
  };

  const handleMenuClick = (event) => {
    setAnchorEl(event.currentTarget);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
  };

  const handleDelete = async (userId) => {
    handleMenuClose();
    setUserToDelete(userId);
    setDeleteModalOpen(true);
  };

  const confirmDelete = async () => {
    try {
      const token = ls.get('token');
      await axios.delete(`${process.env.REACT_APP_BACKEND_URL}/v1/api/admin/users/${userToDelete}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      await axios.delete(`${process.env.REACT_APP_BACKEND_URL}/v1/api/stores/${userToDelete}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const updatedUsers = users.filter((user) => user._id !== userToDelete);
      setUsers(updatedUsers);

      setDeleteModalOpen(false);
    } catch (error) {
      console.error('Failed to delete user and store:', error);
    }
  };

  const handleResellers = (userId) => {
    handleMenuClose();
    setUserToDelete(userId);
    setResellersModalOpen(true);
  };

  useEffect(() => {
    const fetchUsers = async () => {
      setIsLoading(true);
      const token = ls.get('token');
      try {
        const response = await axios.get(`${process.env.REACT_APP_BACKEND_URL}/v1/api/admin/users/stores`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        if (response.data) {
          const combinedUsers = [...response.data.withStoreDetails, ...response.data.withoutStoreDetails];
          console.log('Before sorting:', combinedUsers); // Debug log before sorting
          combinedUsers.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
          console.log('After sorting:', combinedUsers); // Debug log after sorting
          setUsers(combinedUsers);
          setFilteredUsers(combinedUsers);
        }
      } catch (error) {
        console.error('Could not fetch users:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchUsers();
  }, []);

  useEffect(() => {
    const activeUsers = users.filter((user) => user.accountStatus !== 'Deactivated');
    setFilteredUsers(activeUsers);
  }, [users]);

  // Handler for submitting the email change
  const handleSubmitEmailChange = async (currentEmail, newEmail) => {
    try {
      const token = ls.get('token');
      const response = await axios.post(
        `${process.env.REACT_APP_BACKEND_URL}/v1/api/admin/users/update-email`,
        { currentEmail, newEmail },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      if (response.status === 200) {
        alert('Email updated successfully. A confirmation email has been sent to the new address.');
        setChangeEmailModalOpen(false);
        window.location.reload();
      }
    } catch (error) {
      let errorMessage = 'Failed to update email.';
      if (error.response && error.response.status === 400) {
        errorMessage = 'Email is currently used.';
      }
      setEmailChangeError(errorMessage);
      console.error('Error updating email:', error);
    }
  };

  const handleSortChange = (event) => {
    const value = event.target.value;
    setSortBy(value);

    const activeUsers = users.filter((user) => user.accountStatus !== 'Deactivated');

    let sortedUsers;
    if (value === 'FreeTrial' || value === 'Active' || value === 'Suspended') {
      sortedUsers = [...activeUsers].sort((a, b) => {
        if (a.accountStatus === value && b.accountStatus !== value) {
          return -1;
        }
        if (a.accountStatus !== value && b.accountStatus === value) {
          return 1;
        }
        return 0;
      });
    } else if (value === 'latest') {
      sortedUsers = [...activeUsers].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    } else if (value === 'oldest') {
      sortedUsers = [...activeUsers].sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));
    }

    setFilteredUsers(sortedUsers);
  };

  const handleEmailEdit = () => {
    setEmailChangeError('');
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-screen">
        <CircularLoading />
      </div>
    );
  }

  const handleFilterChange = (event, newValue) => {
    const foundUsers = [];

    foundUsers.push(...users.filter((user) => newValue.some((email) => user.email.includes(email))));

    setFilteredUsers(newValue.length !== 0 ? foundUsers : users);
  };

  return (
    <Card className="mt-4 max-w-screen-lg mx-auto p-4" style={{ backgroundColor: '#ffffff' }}>
      <Box display="flex" justifyContent="space-between" alignItems="center">
        <Typography variant="h3" gutterBottom>
          Dealer Accounts
        </Typography>
        <Box>
          <Button
            variant="outlined"
            color="secondary"
            startIcon={<VisibilityIcon />}
            onClick={toggleDeactivatedModal}
            sx={{ mr: 1 }}
          >
            Deactivated Accounts
          </Button>
          <Button
            variant="outlined"
            color="primary"
            startIcon={<FileDownloadIcon />}
            onClick={() => downloadCSV(filteredUsers)}
          >
            Export CSV
          </Button>
        </Box>
      </Box>
      <div className="flex">
        <Autocomplete
          multiple
          className="w-4/5"
          id="tags-filled"
          options={users.map((user) => user.email)}
          freeSolo
          onChange={handleFilterChange}
          renderTags={(value, getTagProps) =>
            value.map((option, index) => <Chip variant="outlined" label={option} {...getTagProps({ index })} />)
          }
          renderInput={(params) => (
            <TextField {...params} variant="filled" label="Search dealers by email" placeholder="dealers" />
          )}
        />
        <FormControl className="w-1/5">
          <InputLabel id="demo-simple-select-label">Sort By</InputLabel>
          <Select
            labelId="demo-simple-select-label"
            id="demo-simple-select"
            label="Sort By"
            value={sortBy}
            onChange={handleSortChange}
          >
            <MenuItem value="latest">Latest</MenuItem>
            <MenuItem value="oldest">Oldest</MenuItem>
            <MenuItem value="FreeTrial">FreeTrial</MenuItem>
            <MenuItem value="Active">Active</MenuItem>
            <MenuItem value="Suspended">Suspended</MenuItem>
          </Select>
        </FormControl>
      </div>
      <TableContainer style={{ borderTopLeftRadius: '0', borderTopRightRadius: '0' }} component={Card}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell style={{ width: '70%' }}>User</TableCell>
              <TableCell>Status</TableCell>
              <TableCell align="right">Email</TableCell>
              <TableCell align="right">Mobile Number</TableCell>
              <TableCell align="right">Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {filteredUsers.map((user, index) => (
              <TableRow key={index}>
                <TableCell>
                  <Typography variant="h6">
                    {user.firstName || user.lastName
                      ? `${user.firstName || ''} ${user.lastName || ''}`
                      : user.username || user.email}
                  </Typography>
                </TableCell>
                <TableCell>{user.accountStatus}</TableCell>
                <TableCell align="right">
                  <div
                    style={{
                      display: 'inline-block',
                      backgroundColor: user.isActive ? 'green' : 'red',
                      width: '20px',
                      height: '20px',
                    }}
                  />
                </TableCell>
                <TableCell align="right">
                  <div
                    style={{
                      display: 'inline-block',
                      backgroundColor: user.mobileNumberVerified ? 'green' : 'red',
                      width: '20px',
                      height: '20px',
                    }}
                  />
                </TableCell>
                <TableCell align="right">
                  <MoreVertIcon
                    aria-controls="simple-menu"
                    aria-haspopup="true"
                    onClick={(event) => {
                      setAnchorEl(event.currentTarget);
                      setUserToDelete(user._id);
                    }}
                    style={{ cursor: 'pointer' }}
                  />
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>
      <Menu anchorEl={anchorEl} keepMounted open={Boolean(anchorEl)} onClose={handleMenuClose}>
        <MenuItem
          onClick={() => {
            setUserToView(users.find((u) => u._id === userToDelete));
            setViewModalOpen(true);
            handleMenuClose();
          }}
        >
          View Info
        </MenuItem>
        <MenuItem onClick={() => handleResellers(userToDelete)}>Resellers</MenuItem>
        <MenuItem
          onClick={() => {
            const user = users.find((u) => u._id === userToDelete);
            if (user) {
              setUserToEdit(user);
              setChangeEmailModalOpen(true);
            }
            setAnchorEl(null);
          }}
        >
          Change Email
        </MenuItem>
        <MenuItem onClick={() => handleDelete(userToDelete)}>Delete</MenuItem>
      </Menu>
      <ViewUserModal open={viewModalOpen} onClose={() => setViewModalOpen(false)} user={userToView} />
      <ChangeDealerEmailModal
        open={changeEmailModalOpen}
        onClose={() => {
          setChangeEmailModalOpen(false);
        }}
        user={userToEdit}
        onSubmit={handleSubmitEmailChange}
        errorMessage={emailChangeError}
        onEmailEdit={handleEmailEdit}
      />
      <ResellersModal open={resellersModalOpen} onClose={() => setResellersModalOpen(false)} userId={userToDelete} />
      <DeleteUserModal open={deleteModalOpen} onClose={() => setDeleteModalOpen(false)} onConfirm={confirmDelete} />
      <DeactivatedAccounts
        open={showDeactivated}
        onClose={toggleDeactivatedModal}
        deactivatedUsers={users.filter((user) => user.accountStatus === 'Deactivated')}
        onDelete={handleDelete}
      />
    </Card>
  );
};

export default AdminDealerAccount;
