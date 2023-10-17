import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Autocomplete,
  Box,
  Typography,
  Container,
  Grid,
  Card,
  CardContent,
  TextField,
  Button,
  InputAdornment,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
} from '@mui/material';
import UserDataFetch from '../components/user-account/UserDataFetch';
import StoreDataFetch from '../components/user-account/StoreDataFetch';
import { countries } from '../components/country/CountriesList';
import { countryCodes } from '../components/country/countryNumCodes';
import { mobileNumberLengths } from '../components/country/countryNumLength';
import ValidatedTextField from '../components/validation/ValidatedTextField';
import { validateName, validateEmail, validateMobileNumber } from '../components/validation/validationUtils';

const ProfilePage = () => {
  const navigate = useNavigate();
  const userId = JSON.parse(localStorage.getItem('user'))._id;
  const userData = UserDataFetch(userId);
  const { storeData, error } = StoreDataFetch(userId);
  const [validationErrors, setValidationErrors] = useState({});

  const kycStatuses = ['Unsubmitted Documents', 'Pending Approval', 'Approved', 'Rejected'];

  const accountStatusDisplay = {
    FreeTrial: 'Free Trial',
    Active: 'Active',
    Suspended: 'Suspended',
    Deactivated: 'Deactivated',
  };

  const [editMode, setEditMode] = useState(false);
  const [formState, setFormState] = useState({});

  const validateForm = () => {
    const errors = {};

    if (!formState.firstName) errors.firstName = 'First Name is required';
    if (!formState.lastName) errors.lastName = 'Last Name is required';
    if (!formState.designation) errors.designation = 'Designation is required';
    if (!formState.country) errors.country = 'Country is required';
    if (!formState.username) errors.username = 'Username is required';

    setValidationErrors(errors);

    return Object.keys(errors).length === 0;
  };

  // State for Change Password Dialog
  const [changePasswordDialogOpen, setChangePasswordDialogOpen] = useState(false);
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmNewPassword, setConfirmNewPassword] = useState('');

  const openChangePasswordDialog = () => {
    setChangePasswordDialogOpen(true);
  };

  const closeChangePasswordDialog = () => {
    setChangePasswordDialogOpen(false);
    setCurrentPassword('');
    setNewPassword('');
    setConfirmNewPassword('');
  };

  const handleChangePassword = async () => {
    // Check if new password and confirm password are the same
    if (newPassword !== confirmNewPassword) {
      alert('New password and confirm password do not match');
      return;
    }

    const baseUrl = process.env.REACT_APP_BACKEND_URL;
    try {
      const response = await fetch(`${baseUrl}/api/change-password`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          // 'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          userId, // Add this
          currentPassword,
          newPassword,
        }),
      });

      const data = await response.json();

      if (response.ok) {
        alert('Password changed successfully');
        closeChangePasswordDialog();
      } else {
        alert(`Failed to change password: ${data.message}`);
      }
    } catch (error) {
      console.error('Error changing password:', error);
      alert('Failed to change password. Please try again later.');
    }
  };

  const handleMobileNumberChange = (event) => {
    const { value } = event.target;
    const strippedNumber = value?.replace(countryCodes[formState.country] || '', '');

    const validationError = validateMobileNumber(formState.country, strippedNumber, countryCodes, mobileNumberLengths);
    setValidationErrors((prevErrors) => ({ ...prevErrors, mobileNumber: validationError }));

    handleInputChange(event);
  };

  const handleEditClick = () => {
    const countryCode = countryCodes[userData?.country];
    const strippedMobileNumber = userData?.mobileNumber?.replace(countryCode, '') || '';

    setFormState({
      firstName: userData?.firstName || '',
      lastName: userData?.lastName || '',
      middleName: userData?.middleName || '',
      designation: userData?.designation || '',
      country: userData?.country || '',
      mobileNumber: strippedMobileNumber,
      username: userData?.username || '',
    });
    setEditMode(true);
  };

  const handleSaveChanges = async () => {
    const baseUrl = process.env.REACT_APP_BACKEND_URL;
    const fullMobileNumber = countryCodes[formState.country] + formState.mobileNumber;

    if (!validateForm()) {
      return;
    }

    try {
      const response = await fetch(`${baseUrl}/api/users/${userId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          username: formState.username,
          firstName: formState.firstName,
          lastName: formState.lastName,
          middleName: formState.middleName,
          designation: formState.designation,
          country: formState.country,
          mobileNumber: fullMobileNumber,
        }),
      });

      const data = await response.json();

      if (response.ok) {
        setEditMode(false);
        window.location.reload();
      } else {
        console.error('Error updating user:', data.message);
      }
    } catch (error) {
      console.error('There was an error updating the user:', error);
    }
  };

  const handleInputChange = (event) => {
    const { name, value } = event.target;

    if (name === 'mobileNumber' || name === 'country') {
      const strippedNumber = value?.replace(countryCodes[formState.country] || '', '');
      const validationError = validateMobileNumber(
        formState.country,
        strippedNumber,
        countryCodes,
        mobileNumberLengths
      );
      setValidationErrors((prevErrors) => ({ ...prevErrors, mobileNumber: validationError }));
    }

    setFormState((prevState) => ({ ...prevState, [name]: value }));
  };

  const sendVerificationEmailAndNavigate = async () => {
    const baseUrl = process.env.REACT_APP_BACKEND_URL;

    try {
      const response = await fetch(`${baseUrl}/api/send-verification-email`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: userData.email,
          firstName: userData.firstName,
          lastName: userData.lastName,
        }),
      });

      const data = await response.json();

      if (response.ok) {
        navigate('/verify', { state: { email: userData.email } });
      } else {
        console.error('Error sending verification email:', data.message);
        alert('Failed to send verification email. Please try again later.');
      }
    } catch (error) {
      console.error('There was an error:', error);
      alert('Failed to send verification email. Please try again later.');
    }
  };

  if (!userData || !storeData) {
    return <Typography>Loading...</Typography>;
  }

  if (error) {
    return <Typography>Error: {error.message}</Typography>;
  }

  return (
    <Container>
      <Box mt={4} mb={4}>
        <Card variant="outlined" style={{ padding: '20px', marginBottom: '20px' }}>
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginBottom: '20px',
            }}
          >
            <Typography variant="h4">User Profile</Typography>
            <div>
              {editMode ? (
                <div className="flex">
                  <Button onClick={handleSaveChanges} variant="outlined" className="mr-2">
                    Save
                  </Button>
                  <Button variant="outlined" onClick={() => setEditMode(false)} className="mr-2">
                    Cancel
                  </Button>
                </div>
              ) : (
                <Button variant="outlined" onClick={handleEditClick} className="mr-2">
                  Edit Profile
                </Button>
              )}
            </div>
          </div>
          <Grid container spacing={4}>
            {/* Personal Information */}
            <Grid item xs={12}>
              <Card style={{ borderColor: 'purple', borderWidth: '2px' }}>
                <CardContent>
                  <Typography variant="h6">Personal Information</Typography>
                  <Card style={{ marginBottom: '20px', padding: '15px' }}>
                    {editMode ? (
                      <>
                        <ValidatedTextField
                          validationFunction={validateName}
                          label="First Name"
                          name="firstName"
                          value={formState.firstName}
                          onChange={handleInputChange}
                          fullWidth
                          sx={{ mb: 2, mt: 2 }}
                        />
                        <TextField
                          label="Middle Name (Optional)"
                          name="middleName"
                          value={formState.middleName}
                          onChange={handleInputChange}
                          fullWidth
                          sx={{ mb: 2 }}
                        />
                        <ValidatedTextField
                          validationFunction={validateName}
                          label="Last Name"
                          name="lastName"
                          value={formState.lastName}
                          onChange={handleInputChange}
                          fullWidth
                          sx={{ mb: 2 }}
                        />
                        <FormControl fullWidth variant="outlined" sx={{ mb: 2 }}>
                          <InputLabel id="designation-label">Designation</InputLabel>
                          <Select
                            labelId="designation-label"
                            label="Designation"
                            name="designation"
                            value={formState.designation}
                            onChange={handleInputChange}
                            error={!!validationErrors.designation}
                          >
                            <MenuItem value={'Mr.'}>Mr.</MenuItem>
                            <MenuItem value={'Ms.'}>Ms.</MenuItem>
                            <MenuItem value={'Mrs.'}>Mrs.</MenuItem>
                          </Select>
                          {validationErrors.designation && (
                            <Typography color="error" variant="caption">
                              {validationErrors.designation}
                            </Typography>
                          )}
                        </FormControl>
                        <Autocomplete
                          fullWidth
                          options={countries}
                          getOptionLabel={(option) => option}
                          value={formState.country}
                          onChange={(event, newValue) => {
                            handleInputChange({
                              target: { name: 'country', value: newValue },
                            });
                          }}
                          renderInput={(params) => (
                            <TextField
                              {...params}
                              label="Country"
                              variant="outlined"
                              sx={{ mb: 2 }}
                              error={!!validationErrors.country}
                              helperText={validationErrors.country}
                            />
                          )}
                        />
                      </>
                    ) : (
                      <>
                        <Typography>First Name: {userData.firstName}</Typography>
                        {userData.middleName && <Typography>Middle Name: {userData.middleName}</Typography>}
                        <Typography>Last Name: {userData.lastName}</Typography>
                        <Typography>Designation: {userData.designation}</Typography>
                        <Typography>Country: {userData.country}</Typography>
                      </>
                    )}
                  </Card>
                </CardContent>
              </Card>
            </Grid>

            {/* Credentials */}
            <Grid item xs={12}>
              <Card style={{ borderColor: 'purple', borderWidth: '2px' }}>
                <CardContent>
                  <Typography variant="h6">Credentials</Typography>
                  <Card style={{ marginBottom: '20px', padding: '15px' }}>
                    {editMode ? (
                      <>
                        <TextField
                          label="Username"
                          name="username"
                          value={formState.username}
                          onChange={handleInputChange}
                          fullWidth
                          error={!!validationErrors.username}
                          helperText={validationErrors.username}
                        />
                        <ValidatedTextField
                          validationFunction={validateEmail}
                          label="Email"
                          name="email"
                          value={formState.email || userData.email}
                          onChange={handleInputChange}
                          fullWidth
                          sx={{ mb: 2, mt: 2 }}
                        />
                        <TextField
                          error={!!validationErrors.mobileNumber}
                          fullWidth
                          label="Mobile Number"
                          variant="outlined"
                          name="mobileNumber"
                          value={formState.mobileNumber?.replace(countryCodes[formState.country] || '', '')}
                          onChange={handleInputChange}
                          sx={{ mb: 2 }}
                          disabled={!formState.country}
                          InputProps={{
                            startAdornment: (
                              <InputAdornment position="start">
                                {formState.country && countryCodes[formState.country]
                                  ? `${countryCodes[formState.country]} |`
                                  : ''}
                              </InputAdornment>
                            ),
                          }}
                          InputLabelProps={{
                            shrink: !!formState.mobileNumber || !!formState.country,
                          }}
                          helperText={validationErrors.mobileNumber}
                        />
                      </>
                    ) : (
                      <>
                        <Typography>Username: {userData.username}</Typography>
                        <Typography>
                          Email: {userData.email}{' '}
                          {userData.isActive ? (
                            <span style={{ color: 'green' }}>(Verified)</span>
                          ) : (
                            <span style={{ color: 'red' }}>(Unverified)</span>
                          )}
                        </Typography>
                        <Typography>
                          Mobile Number: {userData.mobileNumber}{' '}
                          {userData.mobileNumberVerified ? (
                            <span style={{ color: 'green' }}>(Verified)</span>
                          ) : (
                            <span style={{ color: 'red' }}>(Unverified)</span>
                          )}
                        </Typography>
                      </>
                    )}
                  </Card>
                  {!editMode && (
                    <Button variant="outlined" className="mt-2 mr-2" onClick={openChangePasswordDialog}>
                      Change Password
                    </Button>
                  )}
                  {!editMode && !userData.mobileNumberVerified && (
                    <Button variant="outlined" className="mt-2 mr-2">
                      Verify Mobile Number
                    </Button>
                  )}
                  {!editMode && !userData.isActive && (
                    <Button variant="outlined" className="mt-2" onClick={sendVerificationEmailAndNavigate}>
                      Verify Email
                    </Button>
                  )}
                </CardContent>
              </Card>
            </Grid>

            {/* Store Details */}
            <Grid item xs={12}>
              <Card style={{ borderColor: 'purple', borderWidth: '2px' }}>
                <CardContent>
                  <Typography variant="h6">Account Status and Balances</Typography>
                  <Card style={{ marginBottom: '20px', padding: '15px' }}>
                    <Box mt={2}>
                      <Typography>Balance: {userData.accountBalance}</Typography>
                      <Typography>KYC Status: {kycStatuses[storeData.kycApprove]}</Typography>
                      <Typography>Account Status: {accountStatusDisplay[userData.accountStatus]}</Typography>
                    </Box>
                  </Card>
                </CardContent>
              </Card>
            </Grid>

            {/* Change Password Dialog */}
            <Dialog open={changePasswordDialogOpen} onClose={closeChangePasswordDialog}>
              <DialogTitle>Change Password</DialogTitle>
              <DialogContent>
                <TextField
                  label="Current Password"
                  type="password"
                  fullWidth
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  sx={{ mb: 2 }}
                />
                <TextField
                  label="New Password"
                  type="password"
                  fullWidth
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  sx={{ mb: 2 }}
                />
                <TextField
                  label="Confirm New Password"
                  type="password"
                  fullWidth
                  value={confirmNewPassword}
                  onChange={(e) => setConfirmNewPassword(e.target.value)}
                  sx={{ mb: 2 }}
                />
              </DialogContent>
              <DialogActions>
                <Button onClick={closeChangePasswordDialog} color="primary">
                  Cancel
                </Button>
                <Button onClick={handleChangePassword} color="primary">
                  Change Password
                </Button>
              </DialogActions>
            </Dialog>
          </Grid>
        </Card>
      </Box>
    </Container>
  );
};

export default ProfilePage;